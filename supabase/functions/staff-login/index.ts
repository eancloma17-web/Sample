import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

function readDefaultKey(name: string): string | undefined {
  const raw = Deno.env.get(name);
  if (!raw) return undefined;

  try {
    const keys = JSON.parse(raw) as Record<string, unknown>;
    return typeof keys.default === 'string' ? keys.default : undefined;
  } catch {
    return undefined;
  }
}

async function hashEmail(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const staffRoles = [
  'TSAD_STAFF',
  'CPMD_VERIFIER',
  'CPMD_HEAD',
  'ADMIN_STAFF',
  'MIS_OFFICER',
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const payload: unknown = await req.json();

    if (!payload || typeof payload !== 'object') {
      return json({ error: 'Invalid request' }, 400);
    }

    const body = payload as Record<string, unknown>;
    const { email, password, accessCode } = body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof accessCode !== 'string' ||
      email.length > 320 ||
      password.length > 1024 ||
      accessCode.length > 128
    ) {
      return json({ error: 'Invalid request' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes('@')) {
      return json({ error: 'Invalid request' }, 400);
    }

    const url = Deno.env.get('SUPABASE_URL');

    const anon =
      Deno.env.get('SUPABASE_ANON_KEY') ||
      readDefaultKey('SUPABASE_PUBLISHABLE_KEYS');

    const service =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      readDefaultKey('SUPABASE_SECRET_KEYS');

    const secret = Deno.env.get('STAFF_ACCESS_CODE');

    if (!url || !anon || !service || !secret) {
      const missingConfig = [
        !url ? 'SUPABASE_URL' : null,
        !anon
          ? 'SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEYS'
          : null,
        !service
          ? 'SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEYS'
          : null,
        !secret ? 'STAFF_ACCESS_CODE' : null,
      ].filter((name): name is string => name !== null);

      console.error('Missing staff-login configuration:', missingConfig);

      return json(
        {
          error: `Server configuration incomplete: ${missingConfig.join(', ')}`,
        },
        503
      );
    }

    const admin = createClient(url, service, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: allowed, error: rateError } = await admin.rpc(
      'consume_staff_login_attempt',
      {
        p_email_hash: await hashEmail(normalizedEmail),
      }
    );

    if (rateError) {
      console.error('Staff login rate-limit check failed:', rateError.code);
      return json(
        { error: 'Authentication temporarily unavailable' },
        503
      );
    }

    if (allowed !== true) {
      return json(
        { error: 'Too many attempts. Try again in 15 minutes.' },
        429
      );
    }

    // Compare the access code without returning it or logging it.
    const providedCode = new TextEncoder().encode(accessCode);
    const expectedCode = new TextEncoder().encode(secret);

    let difference = providedCode.length ^ expectedCode.length;
    const length = Math.max(providedCode.length, expectedCode.length);

    for (let index = 0; index < length; index += 1) {
      difference |=
        (providedCode[index] || 0) ^ (expectedCode[index] || 0);
    }

    if (difference !== 0) {
      return json({ error: 'Invalid credentials or access code' }, 401);
    }

    const client = createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error: signInError } =
      await client.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (signInError || !data.session || !data.user) {
      return json({ error: 'Invalid credentials or access code' }, 401);
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role, is_active')
      .eq('id', data.user.id)
      .maybeSingle();

    if (
      profileError ||
      !profile?.is_active ||
      !staffRoles.includes(profile.role)
    ) {
      return json({ error: 'Access denied' }, 403);
    }

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch {
    return json({ error: 'Unable to process login' }, 400);
  }
});