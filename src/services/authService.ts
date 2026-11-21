import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserAccount, SupplierCategory } from '../types';

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

type AuthVerificationUser = {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
} | null;

/**
 * Maps a Supabase Profile row to the application account.
 * Email verification comes from Supabase Auth, not profiles.email_verified.
 */
export function mapProfileToUserAccount(
  profile: any,
  authUser: AuthVerificationUser
): UserAccount {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name,
    role: profile.role,
    companyName: profile.company_name || undefined,
    supplierId: profile.supplier_id || undefined,
    staffTitle: profile.staff_title || undefined,
    emailVerified: Boolean(
      authUser?.email_confirmed_at || authUser?.confirmed_at
    ),
    lastLoginAt: profile.last_login_at || undefined,
    passwordUpdatedAt: profile.password_updated_at || undefined,
  };
}

/**
 * Fetches the current authenticated user from Supabase Auth and their profile.
 */
export async function getCurrentUserAccount(): Promise<UserAccount | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // Ask Supabase Auth for the current user instead of relying only on a
    // possibly stale browser session.
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      // A missing trusted profile must never create an implicit role.
      console.error('Authenticated account has no authorized profile.');
      await supabase.auth.signOut();
      return null;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      return null;
    }

    return mapProfileToUserAccount(profile, authUser);
  } catch (err) {
    console.error('Error fetching current user account:', err);
    return null;
  }
}

/**
 * Supplier sign-up with real credentials.
 */
export async function signUpSupplier(params: {
  email: string;
  password: string;
  businessName: string;
  proprietorName: string;
  contactNumber: string;
  principalAddress: string;
  categories: SupplierCategory[];
}): Promise<AuthResponse<{ user: UserAccount | null }>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured. Please check your project settings.',
    };
  }

  try {
    const {
      email,
      password,
      businessName,
      proprietorName,
      contactNumber,
      principalAddress,
      categories,
    } = params;

    // Create the user in Supabase Auth.
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: proprietorName.trim(),
            company_name: businessName.trim(),
            role: 'SUPPLIER',
            principal_address: principalAddress.trim(),
            contact_number: contactNumber.trim(),
            categories,
          },
        },
      });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Registration failed to create a user account.',
      };
    }

    const userId = authData.user.id;
    const isConfirmed = Boolean(
      authData.user.email_confirmed_at || authData.session
    );

    // If confirmation is required, supplier application creation is deferred
    // until the supplier signs in after confirming their email.
    let supplierId: string | undefined;

    if (authData.session) {
      const {
        data: createdId,
        error: createError,
      } = await supabase.rpc('ensure_supplier_registration');

      if (createError || !createdId) {
        return {
          success: false,
          error:
            `Account created, but supplier application setup is incomplete: ` +
            `${createError?.message || 'Unknown database error'}. ` +
            'Sign in again after confirming email to retry.',
        };
      }

      supplierId = createdId;
    }

    const userAccount: UserAccount = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: proprietorName.trim(),
      role: 'SUPPLIER',
      companyName: businessName.trim(),
      supplierId,
      emailVerified: isConfirmed,
    };

    return {
      success: true,
      data: { user: isConfirmed ? userAccount : null },
      requiresEmailConfirmation: !isConfirmed,
    };
  } catch (err: any) {
    console.error('Sign up error:', err);
    return {
      success: false,
      error:
        err.message || 'An unexpected error occurred during registration.',
    };
  }
}

/**
 * Authenticates a supplier.
 * Internal staff must use the protected staff login flow.
 */
export async function signIn(
  email: string,
  password: string,
  expectedPortal: 'SUPPLIER' | 'STAFF'
): Promise<AuthResponse<{ user: UserAccount }>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        'Supabase is not configured. Please provide your Supabase credentials in .env.',
    };
  }

  try {
    if (expectedPortal === 'STAFF') {
      return {
        success: false,
        error:
          'Use the protected internal personnel login with the access code.',
      };
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Sign in failed. No user found.' };
    }

    // Fetch the user's profile after successful authentication.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'User profile record not found. Please contact administrator.',
      };
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          'This account has been deactivated. Please contact CPMD MIS office.',
      };
    }

    // Complete supplier registration if it was deferred until email confirmation.
    if (profile.role === 'SUPPLIER' && !profile.supplier_id) {
      const { error: registrationError } = await supabase.rpc(
        'ensure_supplier_registration'
      );

      if (registrationError) {
        await supabase.auth.signOut();
        return {
          success: false,
          error:
            `Supplier registration is incomplete: ` +
            registrationError.message,
        };
      }

      const {
        data: refreshed,
        error: refreshError,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (refreshError || !refreshed?.supplier_id) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Supplier application could not be linked to this account.',
        };
      }

      Object.assign(profile, refreshed);
    }

    // Confirm that the account is using the correct portal.
    if (expectedPortal === 'SUPPLIER' && profile.role !== 'SUPPLIER') {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Please use the internal personnel portal.',
      };
    }

    // Update the last login timestamp.
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    return {
      success: true,
      data: {
        user: mapProfileToUserAccount(profile, authData.user),
      },
    };
  } catch (err: any) {
    console.error('Sign in error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected sign in error occurred.',
    };
  }
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
}

/**
 * Sends a password recovery email.
 */
export async function sendPasswordRecoveryEmail(
  email: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: new URL('/reset-password', window.location.origin).href,
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to send recovery email.',
    };
  }
}

/**
 * Updates the authenticated user's password after verifying the current password.
 */
export async function updateAuthenticatedPassword(
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: 'No active authenticated session.' };
    }

    // Verify the current password by signing in again.
    const { error: verifyError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

    if (verifyError) {
      return {
        success: false,
        error:
          'Current password verification failed. Please ensure your current password is correct.',
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Record the password update time in the profile.
    await supabase
      .from('profiles')
      .update({ password_updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update password.',
    };
  }
}

/**
 * Resends the email confirmation message.
 */
export async function resendVerificationEmail(
  email: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to resend confirmation email.',
    };
  }
}

/**
 * Performs server-validated internal staff login.
 * Never place the staff access code in source code or a public environment variable.
 */
export async function signInInternalPersonnel(
  email: string,
  password: string,
  accessCode: string
): Promise<AuthResponse<{ user: UserAccount }>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('staff-login', {
      body: {
        email: email.trim().toLowerCase(),
        password,
        accessCode,
      },
    });

    if (error) {
      let message = error.message || 'Staff login failed.';
      const context = (error as unknown as { context?: unknown }).context;

      if (context instanceof Response) {
        try {
          const body = await context.clone().json();
          if (typeof body?.error === 'string') {
            message = body.error;
          }
        } catch {
          // Keep the original message if the response has no JSON body.
        }
      }

      return { success: false, error: message };
    }

    if (!data?.access_token || !data?.refresh_token) {
      return {
        success: false,
        error: data?.error || 'Login response did not include a session.',
      };
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (sessionError) {
      return { success: false, error: sessionError.message };
    }

    const user = await getCurrentUserAccount();
    const staffRoles = [
      'TSAD_STAFF',
      'CPMD_VERIFIER',
      'CPMD_HEAD',
      'ADMIN_STAFF',
      'MIS_OFFICER',
    ];

    if (!user || !staffRoles.includes(user.role)) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Internal personnel authorization failed.',
      };
    }

    return { success: true, data: { user } };
  } catch {
    return {
      success: false,
      error:
        'Secure personnel login is unavailable. Check Edge Function deployment.',
    };
  }
}