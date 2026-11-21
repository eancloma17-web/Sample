/** Navigation entry point: restores the session and selects one of four workspaces.
 * Services persist changes; database RLS, not this role routing, enforces access. */
import React, { useState, useEffect } from 'react';
import { 
  UserAccount, 
  SupplierApplication, 
  SupplierCategory,
  Role1MenuItem,
  Role2MenuItem,
  DeptHeadMenuItem,
  AdminStaffMenuItem 
} from './types';
import { AuthView } from './components/AuthView';
import { StaffAuthView } from './components/StaffAuthView';
import { ResetPasswordView } from './components/ResetPasswordView';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Role1Sidebar } from './components/Role1Sidebar';
import { Role1DashboardView } from './components/Role1DashboardView';
import { Role1SiSheetView } from './components/Role1SiSheetView';
import { Role1DocSubmissionView } from './components/Role1DocSubmissionView';
import { Role1SubmissionStatusView } from './components/Role1SubmissionStatusView';
import { Role1AccountSecurityView } from './components/Role1AccountSecurityView';
import { Role1MyAccountView } from './components/Role1MyAccountView';
import { Role2StaffSidebar } from './components/Role2StaffSidebar';
import { Role2StaffWorkspace } from './components/Role2StaffWorkspace';
import { Role3DeptHeadSidebar } from './components/Role3DeptHeadSidebar';
import { Role3DeptHeadWorkspace } from './components/Role3DeptHeadWorkspace';
import { Role4AdminStaffSidebar } from './components/Role4AdminStaffSidebar';
import { Role4AdminStaffWorkspace } from './components/Role4AdminStaffWorkspace';
import { OfficialDocumentView } from './components/OfficialDocumentView';
import { HelpModal } from './components/HelpModal';
import { getCurrentUserAccount, signOut } from './services/authService';
import { 
  fetchSupplierApplicationForOwner, 
  fetchAllSuppliers,
  updateSupplierSiSheet,
  submitSupplierApplication,
  markUnderVerification,
  verifySupplierApplication,
  requestApplicationRevision,
  addSubmissionComment 
} from './services/supplierService';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const isResetPasswordRoute =
    typeof window !== 'undefined' &&
    window.location.pathname === '/reset-password';

  // Authentication and supplier records are restored only from Supabase.
  // Never treat browser localStorage or sample data as trusted session state.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierApplication[]>([]);

  // Separate login interfaces: 'SUPPLIER' vs 'STAFF'
  const [authPortalMode, setAuthPortalMode] = useState<'SUPPLIER' | 'STAFF'>('SUPPLIER');

  // Menus for Role 1, Role 2, Role 3, and Role 4
  const [role1Menu, setRole1Menu] = useState<Role1MenuItem>('dashboard');
  const [role2Menu, setRole2Menu] = useState<Role2MenuItem>('dashboard');
  const [role3Menu, setRole3Menu] = useState<DeptHeadMenuItem>('overview');
  const [role4Menu, setRole4Menu] = useState<AdminStaffMenuItem>('overview');

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Document printable view
  const [activeDocView, setActiveDocView] = useState<'NONE' | 'FORM' | 'LETTER' | 'BOTH'>('NONE');
  const [selectedSupplierForDoc, setSelectedSupplierForDoc] = useState<SupplierApplication | null>(null);

  // Help modal
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Restore authenticated session from Supabase on load
  useEffect(() => {
    if (isResetPasswordRoute) return;

    async function restoreSession() {
      if (isSupabaseConfigured()) {
        try {
          const authUser = await getCurrentUserAccount();
          if (authUser) {
            setCurrentUser(authUser);

          }
        } catch (err) {
          console.error('Session restore error:', err);
        }
      }
    }

    restoreSession();

    if (isSupabaseConfigured()) {
      let pendingRefresh: ReturnType<typeof setTimeout> | undefined;
      let disposed = false;
      // Keep this callback synchronous: Supabase requests run after the auth event
      // releases its lock. A generation counter rejects stale sign-in responses.
      let generation = 0;
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const currentGeneration = ++generation;
        clearTimeout(pendingRefresh);
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setSuppliers([]);
        } else if (event === 'SIGNED_IN' && session?.user) {
          pendingRefresh = setTimeout(() => {
            void getCurrentUserAccount().then(authUser => {
              if (!disposed && currentGeneration === generation) setCurrentUser(authUser);
            }).catch(err => console.error('Session refresh failed:', err));
          }, 0);
        }
      });

      return () => {
        disposed = true;
        clearTimeout(pendingRefresh);
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Fetch records whenever login changes the account, not only at page startup.
  // This lets a supplier enter the dashboard immediately without refreshing.
  useEffect(() => {
    let cancelled = false;
    setSuppliers([]);
    if (!currentUser) return;

    const loadRecords = async () => {
      try {
        const records = currentUser.role === 'SUPPLIER'
          ? await fetchSupplierApplicationForOwner(currentUser.id).then(record => record ? [record] : [])
          : await fetchAllSuppliers();
        if (!cancelled) setSuppliers(records);
      } catch (err) {
        console.error('Unable to load workspace records:', err);
      }
    };
    void loadRecords();
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.role, currentUser?.supplierId]);

  // Handle supplier update with live Supabase persistence
  const handleUpdateSupplier = async (updated: SupplierApplication): Promise<boolean> => {
    const prev = suppliers.find(s => s.id === updated.id);
    if (updated.status === 'APPROVED_MASTERLIST' && prev?.status !== 'APPROVED_MASTERLIST') {
      console.error('Final approval is not authorized in this system.');
      return false;
    }
    if (!isSupabaseConfigured() || !currentUser) {
      console.error('A valid Supabase session is required to save supplier records.');
      return false;
    }

    // Persist to Supabase if authenticated and application exists
    if (isSupabaseConfigured() && currentUser) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updated.id);
        if (!isUuid) throw new Error("Invalid supplier application identifier");
        if (isUuid) {
          // If a status transition was performed
          if (prev && prev.status !== updated.status) {
            if (updated.status === 'SUBMITTED') {
              const saveResult = await submitSupplierApplication(updated.id, updated.signatoryPrintedName || currentUser.name, prev.version || 1);
              if (!saveResult.success) throw new Error(saveResult.error || 'Database operation failed');
            } else if (updated.status === 'UNDER_VERIFICATION') {
              const saveResult = await markUnderVerification(updated.id, updated.receivedDate || new Date().toISOString().slice(0, 10), prev.version || 1);
              if (!saveResult.success) throw new Error(saveResult.error || 'Database operation failed');
            } else if (updated.status === 'VERIFIED') {
              const saveResult = await verifySupplierApplication(updated.id, updated.verificationNotes || 'Verified compliant', prev.version || 1);
              if (!saveResult.success) throw new Error(saveResult.error || 'Database operation failed');
            } else if (updated.status === 'REVISION_REQUESTED') {
              const saveResult = await requestApplicationRevision(updated.id, updated.approvalRemarks || 'Documentary revision requested', prev.version || 1);
              if (!saveResult.success) throw new Error(saveResult.error || 'Database operation failed');

            }
          } else {
            // General form / field updates
            const saveResult = await updateSupplierSiSheet(updated.id, updated);
            if (!saveResult.success) throw new Error(saveResult.error || 'Database operation failed');
          }

          // Check if a new message was posted to the communications thread
          if (updated.comments && (!prev?.comments || updated.comments.length > prev.comments.length)) {
            const newComment = updated.comments[updated.comments.length - 1];
            if (newComment && !newComment.id.startsWith('db-')) {
              await addSubmissionComment(
                updated.id,
                newComment.message,
                newComment.relatedDocumentName
              );
            }
          }
          setSuppliers(prevList => prevList.map(s => s.id === updated.id ? updated : s));
          if (selectedSupplierForDoc?.id === updated.id) setSelectedSupplierForDoc(updated);
          return true;
        }
      } catch (err) {
        console.error('Supplier update failed; reloading persisted data:', err);
        try {
          if (currentUser.role === 'SUPPLIER') {
            const app = await fetchSupplierApplicationForOwner(currentUser.id);
            setSuppliers(app ? [app] : []);
          } else {
            setSuppliers(await fetchAllSuppliers());
          }
        } catch (reloadError) {
          console.error('Failed to reload supplier data:', reloadError);
        }
        return false;
      }
    }
    return false;
  };

  const refreshSupplierRecords = async () => {
    if (!currentUser) return;
    if (currentUser.role === 'SUPPLIER') {
      const app = await fetchSupplierApplicationForOwner(currentUser.id);
      setSuppliers(app ? [app] : []);
    } else {
      setSuppliers(await fetchAllSuppliers());
    }
  };

  // Handle user update
  const handleUpdateUser = (updatedUser: UserAccount) => {
    setCurrentUser(updatedUser);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setActiveDocView('NONE');
    setSelectedSupplierForDoc(null);
    setSuppliers([]);
  };

  // Resolve current supplier record for supplier role
  const currentSupplier = currentUser?.role === 'SUPPLIER'
    ? suppliers.find(s => s.id === currentUser.supplierId)
    : undefined;

  const docTargetSupplier = selectedSupplierForDoc || currentSupplier;

  // Role distinctions
  const isSupplierUser = currentUser?.role === 'SUPPLIER';
  const isDeptHeadUser = currentUser?.role === 'CPMD_HEAD';
  const isAdminStaffUser = currentUser?.role === 'ADMIN_STAFF' || currentUser?.role === 'MIS_OFFICER';
  const isTsadStaffUser = currentUser && (
    currentUser.role === 'TSAD_STAFF' || 
    currentUser.role === 'CPMD_VERIFIER'
  );

  if (isResetPasswordRoute) {
    return <ResetPasswordView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Login portals */}
      {!currentUser ? (
        authPortalMode === 'STAFF' ? (
          /* SEPARATE TSAD STAFF, DEPT HEAD & ADMIN STAFF LOGIN PAGE */
          <StaffAuthView
            onStaffLogin={(staffUser) => {
              setCurrentUser(staffUser);
              if (staffUser.role === 'CPMD_HEAD') {
                setRole3Menu('overview');
              } else if (staffUser.role === 'ADMIN_STAFF' || staffUser.role === 'MIS_OFFICER') {
                setRole4Menu('overview');
              } else {
                setRole2Menu('dashboard');
              }
              setActiveDocView('NONE');
            }}
            onSwitchToSupplierLogin={() => setAuthPortalMode('SUPPLIER')}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        ) : (
          /* Supplier login and registration */
          <AuthView
            onLogin={(user) => {
              setCurrentUser(user);
              if (user.role === 'SUPPLIER') {
                setRole1Menu('dashboard');
              } else if (user.role === 'CPMD_HEAD') {
                setRole3Menu('overview');
              } else if (user.role === 'ADMIN_STAFF' || user.role === 'MIS_OFFICER') {
                setRole4Menu('overview');
              } else {
                setRole2Menu('dashboard');
              }
              setActiveDocView('NONE');
            }}
            onOpenHelp={() => setIsHelpOpen(true)}
            onSwitchToStaffLogin={() => setAuthPortalMode('STAFF')}
          />
        )
      ) : (
        /* Role workspaces */
        <div className="min-h-screen flex flex-col">
          {/* Top Bar with Side Menu Toggle & Government Seals */}
          <Navbar
            currentUser={currentUser}
            onSignOut={handleSignOut}
            onOpenHelp={() => setIsHelpOpen(true)}
            activeView={
              isAdminStaffUser 
                ? role4Menu 
                : isDeptHeadUser 
                ? role3Menu 
                : isTsadStaffUser 
                ? role2Menu 
                : role1Menu
            }
            onNavigate={(view) => {
              if (isAdminStaffUser) {
                setRole4Menu(view as AdminStaffMenuItem);
              } else if (isDeptHeadUser) {
                setRole3Menu(view as DeptHeadMenuItem);
              } else if (isTsadStaffUser) {
                setRole2Menu(view as Role2MenuItem);
              } else {
                setRole1Menu(view as Role1MenuItem);
              }
              setActiveDocView('NONE');
            }}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          <div className="flex-1 flex relative">
            {/* ROLE 1 SUPPLIER SIDEBAR */}
            {isSupplierUser && currentSupplier && (
  <Role1Sidebar
                currentMenu={role1Menu}
                onSelectMenu={(menu) => {
                  setRole1Menu(menu);
                  setActiveDocView('NONE');
                }}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                supplier={currentSupplier}
                currentUser={currentUser}
                onSignOut={handleSignOut}
                onOpenHelp={() => setIsHelpOpen(true)}
              />
            )}
            {/* TSAD staff navigation */}
            {isTsadStaffUser && (
              <Role2StaffSidebar
                currentMenu={role2Menu}
                onSelectMenu={(menu) => {
                  setRole2Menu(menu);
                  setActiveDocView('NONE');
                }}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                currentUser={currentUser}
                submissionsAwaitingReviewCount={
                  suppliers.filter(s => s.status === 'SUBMITTED' || s.status === 'UNDER_VERIFICATION').length
                }
                expiredDocsCount={
                  suppliers.reduce((acc, s) => {
                    const expired = s.documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length;
                    return acc + expired;
                  }, 0)
                }
                commentsCount={
                  suppliers.reduce((acc, s) => acc + (s.comments?.length || 0), 0)
                }
                onSignOut={handleSignOut}
              />
            )}
            {/* ROLE 3 DEPARTMENT HEAD SIDEBAR (EXACT 10 MENU ITEMS) */}
            {isDeptHeadUser && (
              <Role3DeptHeadSidebar
                currentMenu={role3Menu}
                onSelectMenu={(menu) => {
                  setRole3Menu(menu);
                  setActiveDocView('NONE');
                }}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                currentUser={currentUser}
                pendingFinalApprovalCount={
                  suppliers.filter(s => s.status === 'VERIFIED').length
                }
                totalUnderReviewCount={
                  suppliers.filter(s => s.status === 'UNDER_VERIFICATION' || s.status === 'SUBMITTED').length
                }
                commentsCount={
                  suppliers.reduce((acc, s) => acc + (s.comments?.length || 0), 0)
                }
                onSignOut={handleSignOut}
              />
            )}
            {/* ROLE 4 ADMINISTRATIVE STAFF SIDEBAR (EXACT 8 PROPOSED MENU ITEMS) */}
            {isAdminStaffUser && (
              <Role4AdminStaffSidebar
                currentMenu={role4Menu}
                onSelectMenu={(menu) => {
                  setRole4Menu(menu);
                  setActiveDocView('NONE');
                }}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                currentUser={currentUser}
                onSignOut={handleSignOut}
              />
            )}
            {/* MAIN WORKSPACE VIEWPORT */}
            <main 
              className={`flex-1 transition-all duration-300 ease-in-out px-4 sm:px-6 md:px-8 py-6 print:m-0 print:p-0 print:w-full print:max-w-none ${
                isSidebarOpen ? 'lg:ml-72' : 'lg:ml-16'
              }`}
            >
              {/* If inspecting printable official form or letter */}
              {activeDocView !== 'NONE' && !docTargetSupplier ? (
                <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                  <h2 className="font-semibold text-amber-900">Document Unavailable</h2>
                  <p className="mt-2 text-sm text-amber-800">
                    The supplier record needed to display this document could not be loaded.
                  </p>
                  <button
                    type="button"
                    className="mt-4 rounded bg-slate-800 px-4 py-2 text-white"
                    onClick={() => setActiveDocView('NONE')}
                  >
                    Return to workspace
                  </button>
                </div>
              ) : activeDocView !== 'NONE' && docTargetSupplier ? (
                <div className="py-2 print:py-0 print:m-0">
                  <OfficialDocumentView
                    supplier={docTargetSupplier}
                    activeTab={activeDocView}
                    onBack={() => setActiveDocView('NONE')}
                  />
                </div>
              ) : isSupplierUser && !currentSupplier ? (
                <div role="status" className="rounded-lg border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-semibold">Supplier Record Unavailable</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Your supplier information could not be loaded. Please refresh the page
                    or contact TSAD staff if the problem continues.
                  </p>
                </div>
              ) : isSupplierUser && currentSupplier ? (
                /* ROLE 1: SUPPLIER PORTAL (EXACT 7 SCREENS) */
                <>
                  {role1Menu === 'dashboard' && (
                    <Role1DashboardView
                      supplier={currentSupplier}
                      currentUser={currentUser}
                      onNavigate={(m) => setRole1Menu(m)}
                      onOpenHelp={() => setIsHelpOpen(true)}
                    />
                  )}

                  {role1Menu === 'si-sheet' && (
                    <Role1SiSheetView
                      supplier={currentSupplier}
                      onUpdateSupplier={handleUpdateSupplier}
                      onViewPrintableForm={() => {
                        setSelectedSupplierForDoc(currentSupplier);
                        setActiveDocView('BOTH');
                      }}
                      onViewLetter={() => {
                        setSelectedSupplierForDoc(currentSupplier);
                        setActiveDocView('LETTER');
                      }}
                      onOpenHelp={() => setIsHelpOpen(true)}
                    />
                  )}

                  {role1Menu === 'document-submission' && (
                    <Role1DocSubmissionView onRefreshSuppliers={refreshSupplierRecords}
                      supplier={currentSupplier}
                      onUpdateSupplier={handleUpdateSupplier}
                      onOpenHelp={() => setIsHelpOpen(true)}
                      currentUser={currentUser}
                    />
                  )}

                  {role1Menu === 'submission-status' && (
                    <Role1SubmissionStatusView
                      supplier={currentSupplier}
                      onUpdateSupplier={handleUpdateSupplier}
                      onNavigate={(m) => setRole1Menu(m)}
                      onViewPrintableForm={() => {
                        setSelectedSupplierForDoc(currentSupplier);
                        setActiveDocView('BOTH');
                      }}
                      currentUser={currentUser}
                    />
                  )}

                  {role1Menu === 'account-security' && (
                    <Role1AccountSecurityView
                      currentUser={currentUser}
                      supplier={currentSupplier}
                      onUpdateUser={handleUpdateUser}
                      onSignOut={handleSignOut}
                    />
                  )}

                  {role1Menu === 'my-account' && (
                    <Role1MyAccountView
                      currentUser={currentUser}
                      supplier={currentSupplier}
                      onUpdateSupplier={handleUpdateSupplier}
                      onUpdateUser={handleUpdateUser}
                    />
                  )}
                </>
              ) : isDeptHeadUser ? (
                /* ROLE 3: DEPARTMENT HEAD WORKSPACE (EXACT 10 SCREENS) */
                <Role3DeptHeadWorkspace
                  onRefreshSuppliers={refreshSupplierRecords}
                  currentMenu={role3Menu}
                  onNavigate={(menu) => setRole3Menu(menu)}
                  currentUser={currentUser}
                  suppliers={suppliers}
                  onUpdateSupplier={handleUpdateSupplier}
                  onOpenPrintableDoc={(s, tab) => {
                    setSelectedSupplierForDoc(s);
                    setActiveDocView(tab);
                  }}
                  onOpenHelp={() => setIsHelpOpen(true)}
                />
              ) : isAdminStaffUser ? (
                /* ROLE 4: ADMINISTRATIVE STAFF WORKSPACE (EXACT 8 PROPOSED SCREENS) */
                <Role4AdminStaffWorkspace
                  currentMenu={role4Menu}
                  onNavigate={(menu) => setRole4Menu(menu)}
                  currentUser={currentUser}
                  suppliers={suppliers}
                  onOpenHelp={() => setIsHelpOpen(true)}
                />
              ) : (
                /* ROLE 2: TSAD STAFF WORKSPACE (EXACT 11 SCREENS) */
                <Role2StaffWorkspace
                  currentMenu={role2Menu}
                  onNavigate={(menu) => setRole2Menu(menu)}
                  currentUser={currentUser}
                  suppliers={suppliers}
                  onUpdateSupplier={handleUpdateSupplier}
                  onOpenPrintableDoc={(s, tab) => {
                    setSelectedSupplierForDoc(s);
                    setActiveDocView(tab);
                  }}
                  onOpenHelp={() => setIsHelpOpen(true)}
                />
              )}
            </main>
          </div>

          <Footer onOpenHelp={() => setIsHelpOpen(true)} />
        </div>
      )}

      {/* Official Help & Support Directory Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
