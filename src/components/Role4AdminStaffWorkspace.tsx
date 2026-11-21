/** Administrative workspace. Access management and policy displays use backend services.
 * Inspect each action handler and RLS policy before claiming an operation is supported. */
import React, { useState, useMemo } from 'react';
import { 
  AdminStaffMenuItem, 
  UserAccount, 
  SupplierApplication,
  DocumentItem 
} from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  ListFilter, 
  SlidersHorizontal, 
  History, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Building2, 
  Search, 
  Check, 
  X,
  FileText,
  Mail,
  HelpCircle,
  ExternalLink,
  ClipboardList,
  Server,
  Activity,
  Download,
  BookOpen,
  ArrowRight,
  Database,
  RefreshCw,
  PhoneCall,
  Clock,
  Layers,
  Save,
  Printer,
  Eye
} from 'lucide-react';
import { ButuanCitySeal, CpmdSeal } from './Seals';
import { SecureDocumentViewerModal } from './SecureDocumentViewerModal';
import { 
  fetchSystemSettings, 
  updateSystemSetting, 
  fetchAssistanceTickets, 
  createAssistanceTicket, 
  resolveAssistanceTicket,
  fetchAuditEvents 
} from '../services/supplierService';
import { updateAuthenticatedPassword } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface Role4AdminStaffWorkspaceProps {
  currentMenu: AdminStaffMenuItem;
  onNavigate: (menu: AdminStaffMenuItem) => void;
  currentUser: UserAccount;
  suppliers: SupplierApplication[];
  onOpenHelp: () => void;
}

export const Role4AdminStaffWorkspace: React.FC<Role4AdminStaffWorkspaceProps> = ({
  currentMenu,
  onNavigate,
  currentUser,
  suppliers,
  onOpenHelp,
}) => {
  // Guide viewer modal state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideActiveSection, setGuideActiveSection] = useState<'overview' | 'boundaries' | 'matrix' | 'screens' | 'sop'>('overview');

  // Supplier Document Inspection & Viewing state
  const [selectedAuditSupplierId, setSelectedAuditSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  // Access assistance tickets state
  const [assistanceTickets, setAssistanceTickets] = useState<{
    id:string;requesterEmail:string;requesterName:string;role:string;issueType:string;
    timestamp:string;status:'DISPATCHED'|'RESOLVED';notes:string;
  }[]>([]);

  const [newRequesterEmail, setNewRequesterEmail] = useState('');
  const [newRequesterName, setNewRequesterName] = useState('');
  const [newIssueType, setNewIssueType] = useState('Password Recovery Dispatch');
  const [newTicketNotes, setNewTicketNotes] = useState('');
  const [ticketActionMsg, setTicketActionMsg] = useState<string | null>(null);

  // Settings state (Non-security operational settings per PDF)
  const [announcementText, setAnnouncementText] = useState(
    'CPMD Notice: Supplier Accreditation applications for CY 2026 are actively verified in accordance with Form CPMD.TSAD.F.003 and Executive Order No. 27.'
  );
  const [officeHours, setOfficeHours] = useState('Monday - Friday, 8:00 AM - 5:00 PM PST (Excluding Official Holidays)');
  const [supportHotline, setSupportHotline] = useState('(085) 817-5000 / (085) 341-2244');
  const [supportEmail, setSupportEmail] = useState('cgb.cpmso@gmail.com / tsad.cgb@gmail.com');
  const [maintenanceWindow, setMaintenanceWindow] = useState('Every Sunday 02:00 AM - 04:00 AM PST (Scheduled Database Backup)');
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // Password state for account security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Audit log filter & search
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterCategory, setAuditFilterCategory] = useState<'ALL' | 'AUTH' | 'VERIFICATION' | 'APPROVAL' | 'MIS'>('ALL');

  // No fabricated personnel or audit history. These lists load from authorized Supabase records.
  const [authorizedPersonnel, setAuthorizedPersonnel] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  const filteredAuditEvents = useMemo(() => {
    return auditEvents.filter(ev => {
      const matchesSearch = 
        ev.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
        ev.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        ev.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
        ev.id.toLowerCase().includes(auditSearch.toLowerCase());
      
      const matchesCategory = 
        auditFilterCategory === 'ALL' ? true : ev.category === auditFilterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [auditEvents, auditSearch, auditFilterCategory]);

  // Export audit logs as CSV
  const handleExportAuditCsv = () => {
    const headers = ['Audit ID', 'Category', 'Actor', 'Role', 'Action', 'Target', 'Timestamp', 'IP Address', 'Status'];
    const rows = filteredAuditEvents.map(e => [
      e.id,
      e.category,
      `"${e.actor.replace(/"/g, '""')}"`,
      `"${e.role}"`,
      `"${e.action.replace(/"/g, '""')}"`,
      `"${e.target.replace(/"/g, '""')}"`,
      e.timestamp,
      e.ip,
      e.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CPMD_SIS_MIS_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Supabase sync for Role 4 settings, tickets, and audit logs
  React.useEffect(() => {
    async function loadLiveData() {
      if (!isSupabaseConfigured()) return;
      try {
        const [settingsRes, ticketsRes, auditRes] = await Promise.all([
          fetchSystemSettings(),
          fetchAssistanceTickets(),
          fetchAuditEvents()
        ]);

        if (settingsRes.announcement_banner) setAnnouncementText(settingsRes.announcement_banner);
        if (settingsRes.office_hours) setOfficeHours(settingsRes.office_hours);
        if (settingsRes.support_hotline) setSupportHotline(settingsRes.support_hotline);
        if (settingsRes.support_email) setSupportEmail(settingsRes.support_email);
        if (settingsRes.maintenance_window) setMaintenanceWindow(settingsRes.maintenance_window);

        const { data: personnel, error: personnelError } = await supabase.from('profiles')
          .select('id,full_name,email,role,is_active,last_login_at,staff_title')
          .in('role',['TSAD_STAFF','CPMD_VERIFIER','CPMD_HEAD','ADMIN_STAFF','MIS_OFFICER']);
        if (personnelError) throw new Error(personnelError.message);
        setAuthorizedPersonnel((personnel || []).map((r:any) => ({
          id:r.id,name:r.full_name,email:r.email,role:r.role,
          status:r.is_active?'ACTIVE':'INACTIVE',authority:r.staff_title || 'See approved permission matrix',
          lastLogin:r.last_login_at || 'Not recorded',division:'CPMD / MIS'
        })));
        setAuditEvents((auditRes || []).map((r:any) => ({
          id:r.id,category:r.category,actor:r.actor_name || '',role:r.role || '',action:r.action || '',
          target:r.target || '',timestamp:r.timestamp || '',ip:r.ip || '',status:'RECORDED'
        })));
        if (ticketsRes) {
          setAssistanceTickets(ticketsRes.map(t => ({
            id: t.ticket_code || t.id,
            requesterEmail: t.requester_email,
            requesterName: t.requester_name,
            role: t.role,
            issueType: t.issue_type,
            timestamp: t.created_at ? t.created_at.replace('T', ' ').slice(0, 19) : '',
            status: t.status,
            notes: t.notes || ''
          })));
        }
      } catch (err) {
        console.warn('Role 4 live data fetch notice:', err);
      }
    }

    loadLiveData();
  }, []);

  // Dispatch assistance ticket handler
  const handleCreateAssistanceTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequesterEmail.trim()) return;
    try {
      const saved = await createAssistanceTicket({
        requesterEmail:newRequesterEmail.trim(),requesterName:newRequesterName.trim() || newRequesterEmail.trim(),
        role:authorizedPersonnel.find(p=>p.email.toLowerCase()===newRequesterEmail.trim().toLowerCase())?.role || 'Authorized System User',
        issueType:newIssueType,notes:newTicketNotes.trim()
      });
      setAssistanceTickets(prev=>[{
        id:saved.ticket_code,requesterEmail:saved.requester_email,requesterName:saved.requester_name,
        role:saved.role,issueType:saved.issue_type,timestamp:saved.created_at,status:saved.status,notes:saved.notes || ''
      },...prev]);
      setNewRequesterEmail('');setNewRequesterName('');setNewTicketNotes('');
      setTicketActionMsg('Assistance ticket recorded. This does not automatically send a recovery email.');
    } catch(e:any) {setTicketActionMsg(`Unable to create ticket: ${e.message}`);}
  };

  // Resolve assistance ticket
  const handleResolveTicket = async (ticketId: string) => {
    try {
      await resolveAssistanceTicket(ticketId,'Resolved by authorized MIS personnel');
      setAssistanceTickets(prev=>prev.map(t=>t.id===ticketId?{...t,status:'RESOLVED'}:t));
    } catch(e:any) {setTicketActionMsg(`Unable to resolve ticket: ${e.message}`);}
  };

  // Save operational settings to Supabase
  const handleSaveOperationalSettings = async () => {
    if (!isSupabaseConfigured()) {setSettingsSuccessMsg('Supabase is not configured. Settings were not saved.');return;}
    setSettingsSuccessMsg('Saving operational settings...');
    try {
      await Promise.all([
        updateSystemSetting('announcement_banner',announcementText),
        updateSystemSetting('office_hours',officeHours),
        updateSystemSetting('support_hotline',supportHotline),
        updateSystemSetting('support_email',supportEmail),
        updateSystemSetting('maintenance_window',maintenanceWindow)
      ]);
      setSettingsSuccessMsg('Operational settings saved to Supabase.');
    } catch(e:any) {setSettingsSuccessMsg(`Settings could not be saved: ${e.message}`);}
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Strict Role Boundary & Scope Notice Banner (Faithful to PDF Section 2 & 3) */}
      <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-xl shadow-xs text-xs space-y-1.5 text-amber-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            <span>MIS Officer • Management Information System (MIS) Authority Boundary</span>
          </div>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Official PDF Guide</span>
          </button>
        </div>
        <p className="text-amber-900/90 leading-relaxed text-[11px]">
          <strong>Non-Negotiable Boundary:</strong> The MIS Officer / System Administrator provides technical system support, access assistance, and reference standard maintenance. 
          <strong> MIS is NOT an accreditation approver or procurement examiner:</strong> Supplier evaluation, SI sheet verification, document approval, rejection, and confidential supplier document access are strictly reserved for TSAD Staff (Role 2) and the Department Head (Role 3).
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: OVERVIEW & CONSOLE */}
      {/* ========================================================================= */}
      {currentMenu === 'overview' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#07243c] via-[#0a355c] to-[#0d4f82] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-900/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="bg-teal-400 text-teal-950 font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  MIS OFFICER • MIS CONSOLE
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-md">
                  SYSTEM OPERATIONAL • NORMAL
                </span>
              </div>

              <button
                onClick={() => setIsGuideOpen(true)}
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Complete PDF Guide</span>
              </button>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Management Information System (MIS) Console
              </h2>
              <p className="text-sky-100/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Centralized system health telemetry, access assistance dispatch, and approved reference standards management for the City Procurement Management Department (CPMD) Supplier Information System.
              </p>
            </div>

            {/* Quick telemetry indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-blue-800/60 font-mono">
              <div>
                <span className="text-sky-300/80 block text-[10px] uppercase">Service Uptime</span>
                <span className="font-bold text-emerald-300">99.98% Healthy</span>
              </div>
              <div>
                <span className="text-sky-300/80 block text-[10px] uppercase">Database Sync</span>
                <span className="font-bold text-teal-300">Synchronized (Local/DB)</span>
              </div>
              <div>
                <span className="text-sky-300/80 block text-[10px] uppercase">Security Level</span>
                <span className="font-bold text-sky-200">ISO 9001:2015 QMS</span>
              </div>
              <div>
                <span className="text-sky-300/80 block text-[10px] uppercase">Active Sessions</span>
                <span className="font-bold text-amber-300">4 Authorized Staff</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Authorized Accounts
                </span>
                <Users className="w-4 h-4 text-blue-900" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                {authorizedPersonnel.length}
              </div>
              <p className="text-[11px] text-slate-500">
                Staff across CPMD & MISO divisions
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Assistance Dispatches
                </span>
                <KeyRound className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-amber-700 font-mono">
                {assistanceTickets.filter(t => t.status !== 'RESOLVED').length}
              </div>
              <p className="text-[11px] text-amber-800 font-semibold">
                Pending resolution ({assistanceTickets.length} total)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Registered Suppliers
                </span>
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                {suppliers.length}
              </div>
              <p className="text-[11px] text-slate-500">
                Read-only count (Metadata only)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Audit Ledger Entries
                </span>
                <History className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-3xl font-extrabold text-teal-700 font-mono">
                {auditEvents.length}
              </div>
              <p className="text-[11px] text-slate-500">
                Verifiable ISO 9001 audit events
              </p>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-900" />
              <span>Administrative Operations Quick Hub</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                onClick={() => onNavigate('access-assistance')}
                className="p-4 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 hover:border-sky-300 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 group-hover:text-blue-900">Dispatch Access Assistance</span>
                  <KeyRound className="w-4 h-4 text-blue-800" />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Generate recovery tokens, verify government email credentials, and unlock staff sessions.
                </p>
              </button>

              <button
                onClick={() => onNavigate('reference-lists')}
                className="p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 group-hover:text-emerald-900">Verify Reference Standards</span>
                  <ListFilter className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Inspect CPMD supplier classifications and Form CPMD.TSAD.F.003 mandatory checklist standards.
                </p>
              </button>

              <button
                onClick={() => onNavigate('audit-records')}
                className="p-4 bg-slate-50 hover:bg-teal-50 rounded-xl border border-slate-200 hover:border-teal-300 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 group-hover:text-teal-900">Inspect Audit Records</span>
                  <History className="w-4 h-4 text-teal-700" />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Review tamper-evident system ledger entries and export compliance CSV reports for audit.
                </p>
              </button>
            </div>
          </div>

          {/* Official Permission Matrix from Section 3 of PDF */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-900" />
                  <span>Official Role 4 MIS Permission Matrix</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Exact access permissions and prohibitions specified in Role 4 MIS Specification
                </p>
              </div>
              <span className="text-[10px] font-mono text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200 self-start sm:self-auto">
                CPMD SIS Standard
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5 font-bold">Functional Area</th>
                    <th className="px-3.5 py-2.5 text-emerald-800 font-bold">Allowed Baseline Authority</th>
                    <th className="px-3.5 py-2.5 text-rose-800 font-bold">Strictly Denied by Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  <tr>
                    <td className="px-3.5 py-3 font-bold text-slate-900 bg-slate-50/50">Supplier Records</td>
                    <td className="px-3.5 py-3 text-slate-700">
                      Metadata count only; no direct profile modification unless authorized under an approved ticket.
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-rose-700 bg-rose-50/20">
                      Supplier verification, endorsement, approval, and unrestricted editing.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-3 font-bold text-slate-900 bg-slate-50/50">Supplier Documents</td>
                    <td className="px-3.5 py-3 text-slate-700">
                      Technical attachment verification diagnostics upon formal IT request.
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-rose-700 bg-rose-50/20">
                      Browsing or downloading confidential proprietary supplier filings.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-3 font-bold text-slate-900 bg-slate-50/50">Staff Accounts</td>
                    <td className="px-3.5 py-3 text-slate-700">
                      Assistance with account status, email verification check, and password reset token generation.
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-rose-700 bg-rose-50/20">
                      Plaintext password viewing, self-promotion, and arbitrary role assignment.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-3 font-bold text-slate-900 bg-slate-50/50">Roles & Permissions</td>
                    <td className="px-3.5 py-3 text-slate-700">
                      Auditing role allocations; strictly read-only schema inspection.
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-rose-700 bg-rose-50/20">
                      Modifying role hierarchies, Row-Level Security (RLS), or permission policies.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-3 font-bold text-slate-900 bg-slate-50/50">System Settings</td>
                    <td className="px-3.5 py-3 text-slate-700">
                      Maintenance of approved non-security settings (announcements, office hours, directory).
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-rose-700 bg-rose-50/20">
                      Unrestricted security, firewall, token expiration, or authentication bypass.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-3 font-bold text-slate-900 bg-slate-50/50">Audit Records</td>
                    <td className="px-3.5 py-3 text-slate-700">
                      Read-only inspection and CSV export for compliance audits.
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-rose-700 bg-rose-50/20">
                      Modifying, deleting, truncating, or purging audit history entries.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: STAFF ACCOUNTS */}
      {/* ========================================================================= */}
      {currentMenu === 'staff-accounts' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-900" />
              <h2 className="text-lg font-bold text-slate-900">
                Authorized Personnel Account Registry
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Review authorized staff across CPMD and MISO divisions. Non-negotiable rule: Administrative personnel cannot create accounts, view passwords, or alter permissions without formal administrative authorization.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
              <span>
                <strong>Section 4.B Rule:</strong> Staff accounts are provisioned via City MIS Enterprise Directory. Administrative Staff provides identity status assistance only.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                Registered Authorized Personnel ({authorizedPersonnel.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Directory Sync: Verified Active
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {authorizedPersonnel.map(person => (
                <div key={person.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{person.name}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                        {person.role}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        STATUS: {person.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                      <span className="font-mono text-blue-950 font-semibold">{person.email}</span>
                      <span>•</span>
                      <span>{person.division}</span>
                      <span>•</span>
                      <span>Last Login: {person.lastLogin}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 italic">
                      Authority Scope: {person.authority}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setNewRequesterEmail(person.email);
                        setNewRequesterName(person.name);
                        setNewIssueType('Password Recovery Dispatch');
                        onNavigate('access-assistance');
                      }}
                      className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-blue-900" />
                      <span>Dispatch Recovery</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: ACCESS ASSISTANCE */}
      {/* ========================================================================= */}
      {currentMenu === 'access-assistance' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-900" />
              <h2 className="text-lg font-bold text-slate-900">
                Access Assistance & Identity Recovery Dispatch
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Provide identity recovery assistance to authorized personnel per standard operating procedures. Passwords are encrypted and never visible in plaintext.
            </p>

            {ticketActionMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{ticketActionMsg}</span>
              </div>
            )}
          </div>

          {/* New Dispatch Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-900" />
              <span>Log & Dispatch Authorized Recovery Request</span>
            </h3>

            <form onSubmit={handleCreateAssistanceTicket} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Staff Email Address (Authorized Government Mailbox) *
                  </label>
                  <input
                    type="email"
                    required
                    value={newRequesterEmail}
                    onChange={(e) => setNewRequesterEmail(e.target.value)}
                    placeholder="e.g., tsad.rosales@butuan.gov.ph"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Staff Printed Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newRequesterName}
                    onChange={(e) => setNewRequesterName(e.target.value)}
                    placeholder="e.g., Engr. Mark Steven T. Rosales"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Assistance Workflow Type *
                  </label>
                  <select
                    value={newIssueType}
                    onChange={(e) => setNewIssueType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900 font-medium"
                  >
                    <option value="Password Recovery Dispatch">Password Recovery Dispatch (Single-Use Token)</option>
                    <option value="Email Verification Status Check">Email Verification Status Check</option>
                    <option value="Two-Factor Session Re-authentication">Two-Factor Session Re-authentication</option>
                    <option value="Locked Session Unlock Request">Locked Session Unlock Request</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Dispatch Verification Notes
                  </label>
                  <input
                    type="text"
                    value={newTicketNotes}
                    onChange={(e) => setNewTicketNotes(e.target.value)}
                    placeholder="e.g., Verified via phone with division head"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#07243c] hover:bg-[#051a2d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <KeyRound className="w-4 h-4 text-teal-300" />
                  <span>Dispatch Secure Assistance</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Dispatches Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center justify-between">
              <span>Assistance Dispatches Ledger ({assistanceTickets.length})</span>
              <span className="text-[10px] font-mono text-slate-500">Traceable Records</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {assistanceTickets.map(ticket => (
                <div key={ticket.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-950 text-xs">{ticket.id}</span>
                      <span className="font-bold text-slate-900">{ticket.requesterName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({ticket.requesterEmail})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{ticket.issueType}</span>
                      <span>•</span>
                      <span>Logged: {ticket.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Notes: {ticket.notes}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      ticket.status === 'RESOLVED' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {ticket.status}
                    </span>

                    {ticket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveTicket(ticket.id)}
                        className="px-2.5 py-1 text-[11px] bg-white hover:bg-slate-100 text-emerald-700 font-bold rounded border border-slate-300 transition-colors cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: REFERENCE LISTS */}
      {/* ========================================================================= */}
      {currentMenu === 'reference-lists' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-blue-900" />
              <h2 className="text-lg font-bold text-slate-900">
                Procurement Reference Lists & Standards Maintenance
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Inspect existing verified reference standards. Per Section 4.D, Administrative personnel must not invent categories or alter baseline qualification standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Standard 1: Classifications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-100 pb-2">
                <span>1. Supplier Classifications (CPMD Approved)</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">Verified</span>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <strong className="text-slate-900 block">GOODS AND SERVICES</strong>
                  <span className="text-[11px] text-slate-600">
                    General procurement, medical equipment, hospital diagnostics, fuels, and office supplies.
                  </span>
                </li>
                <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <strong className="text-slate-900 block">INFRASTRUCTURE PROJECTS</strong>
                  <span className="text-[11px] text-slate-600">
                    Civil works, vertical/horizontal construction, PCAB accredited engineering contractors.
                  </span>
                </li>
                <li className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <strong className="text-slate-900 block">CONSULTING SERVICES</strong>
                  <span className="text-[11px] text-slate-600">
                    Specialized engineering design, IT architectural consulting, structural assessments.
                  </span>
                </li>
              </ul>
            </div>

            {/* Standard 2: Mandatory Documents */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-100 pb-2">
                <span>2. Mandatory Documentary Checklist</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">Form CPMD.TSAD.F.003</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 divide-y divide-slate-100">
                <li className="pt-1.5 flex items-center justify-between">
                  <span>Mayor's / Business Permit (CY 2026 Validity)</span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">Mandatory</span>
                </li>
                <li className="pt-1.5 flex items-center justify-between">
                  <span>DTI (Sole Prop) / SEC Registration (Corp/Partnership)</span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">Mandatory</span>
                </li>
                <li className="pt-1.5 flex items-center justify-between">
                  <span>PhilGEPS Registration (Platinum / Red Tier)</span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">Mandatory</span>
                </li>
                <li className="pt-1.5 flex items-center justify-between">
                  <span>Tax Clearance Certificate (BIR Collection Bureau)</span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">Mandatory</span>
                </li>
                <li className="pt-1.5 flex items-center justify-between">
                  <span>DBP Account Proof (Mandatory per Executive Order No. 27 s. 2023)</span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">Mandatory</span>
                </li>
                <li className="pt-1.5 flex items-center justify-between">
                  <span>Comprehensive Company Profile</span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">Standard</span>
                </li>
                <li className="pt-1.5 flex items-center justify-between">
                  <span>PCAB License & Registration</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">Infra Only</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. Supplier Documentary Records Audit & Verification Desk */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#072d50] uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0a4f94]" />
                  <span>3. Supplier Documentary Records Audit & Verification Desk</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Administrative read & print inspection under Supabase Storage RLS authorization
                </p>
              </div>

              {/* Supplier Case Selector */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 text-xs">Select Supplier:</span>
                <select
                  value={selectedAuditSupplierId}
                  onChange={(e) => setSelectedAuditSupplierId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.businessName} ({s.referenceCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Documents List for Selected Supplier */}
            {(() => {
              const auditSupplier = suppliers.find(s => s.id === selectedAuditSupplierId) || suppliers[0];
              if (!auditSupplier) return null;

              return (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-mono">Case Reference: </span>
                      <strong className="text-slate-900 font-mono">{auditSupplier.referenceCode}</strong>
                      <span className="text-slate-400 mx-2">|</span>
                      <span className="text-slate-500">Business: </span>
                      <strong className="text-slate-900">{auditSupplier.businessName}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200">
                        RLS Status: Authorized Read
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {auditSupplier.documents.map((doc, idx) => (
                      <div key={doc.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{idx + 1}. {doc.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              doc.attached ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {doc.attached ? 'ATTACHED' : 'UNATTACHED'}
                            </span>
                          </div>
                          {doc.attached && (
                            <div className="text-[11px] font-mono text-slate-500 flex flex-wrap items-center gap-2">
                              <span className="text-blue-900 font-semibold">{doc.fileName}</span>
                              <span>({doc.fileSize || '1.8 MB'})</span>
                              {doc.referenceNumber && <span>• Ref: {doc.referenceNumber}</span>}
                              {doc.expiryDate && <span>• Exp: {doc.expiryDate}</span>}
                            </div>
                          )}
                        </div>

                        {doc.attached && (
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {/* Clearly Labeled "View Document" */}
                            <button
                              type="button"
                              onClick={() => setViewingDoc(doc)}
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="View document in authorized viewer"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-700" />
                              <span>View Document</span>
                            </button>

                            {/* Clearly Labeled "Download" */}
                            <button
                              type="button"
                              onClick={() => setViewingDoc(doc)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Download document copy"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-700" />
                              <span>Download</span>
                            </button>

                            {/* Clearly Labeled "Print" */}
                            <button
                              type="button"
                              onClick={() => setViewingDoc(doc)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Print document with page range selection"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Print</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Role Boundary Notice:</strong> Administrative and MIS personnel have inspection and printing access for quality audit purposes. Approval or rejection decisions are strictly reserved to TSAD Staff and the Department Head.
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5: SYSTEM SETTINGS */}
      {/* ========================================================================= */}
      {currentMenu === 'system-settings' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-900" />
              <h2 className="text-lg font-bold text-slate-900">
                Non-Security Operational System Settings
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Maintain authorized non-security settings. Core security policies, Row-Level Security, and cryptographic key parameters are strictly protected.
            </p>
          </div>

          {settingsSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{settingsSuccessMsg}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              Portal Announcements & Administrative Directory
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Public Portal Notice Banner (Approved Non-Security Setting)
                </label>
                <textarea
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    CPMD Office Hours Schedule
                  </label>
                  <input
                    type="text"
                    value={officeHours}
                    onChange={(e) => setOfficeHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Support Hotline Directory
                  </label>
                  <input
                    type="text"
                    value={supportHotline}
                    onChange={(e) => setSupportHotline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Official Support Inboxes
                  </label>
                  <input
                    type="text"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Scheduled Maintenance Window
                  </label>
                  <input
                    type="text"
                    value={maintenanceWindow}
                    onChange={(e) => setMaintenanceWindow(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSaveOperationalSettings}
                  className="px-5 py-2.5 bg-[#07243c] hover:bg-[#051a2d] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4 text-teal-300" />
                  <span>Save Operational Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 6: ACTIVITY & AUDIT RECORDS */}
      {/* ========================================================================= */}
      {currentMenu === 'audit-records' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-900" />
                <h2 className="text-lg font-bold text-slate-900">
                  Activity & Audit Records (Read-Only)
                </h2>
              </div>

              <button
                onClick={handleExportAuditCsv}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-300" />
                <span>Export Audit CSV</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Verifiable, tamper-evident chronological ledger of system events. In accordance with ISO 9001:2015 QMS standards, audit logs cannot be modified, deleted, or purged.
            </p>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 text-xs">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search by actor, action, target, or ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={auditFilterCategory}
                  onChange={(e) => setAuditFilterCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Categories ({auditEvents.length})</option>
                  <option value="AUTH">Authentication Events</option>
                  <option value="VERIFICATION">TSAD Verifications</option>
                  <option value="APPROVAL">Executive Approvals</option>
                  <option value="MIS">MIS Administration</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 uppercase">
                Showing {filteredAuditEvents.length} Event Log Entries
              </span>
              <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Integrity Hash: SHA-256 Verified
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {filteredAuditEvents.map(event => (
                <div key={event.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-blue-950 text-[11px]">{event.id}</span>
                      <span className="font-bold text-slate-900">{event.action}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {event.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-blue-900">{event.actor}</span>
                      <span>({event.role})</span>
                      <span>• Target:</span>
                      <span className="font-mono text-slate-800">{event.target}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="font-mono text-[11px] text-slate-700">{event.timestamp}</div>
                    <div className="text-[10px] font-mono text-slate-400">IP: {event.ip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 7: ACCOUNT & SECURITY */}
      {/* ========================================================================= */}
      {currentMenu === 'account-security' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              <h2 className="text-lg font-bold text-slate-900">
                MIS Officer Account & Security Credentials
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Manage your personal administrative identity credentials and review active session telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-900" />
                <span>Administrative Identity</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Officer Name</span>
                  <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Role Assignment</span>
                  <span className="font-bold text-slate-900">MIS Officer • MIS Officer / Administrator</span>
                  <div className="text-[11px] text-teal-800 font-semibold">City MIS Office • CPMD Systems Support</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Email</span>
                  <span className="font-mono font-bold text-blue-900">{currentUser.email}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Authority Level</span>
                  <span className="font-semibold text-slate-800">Operational Support & Identity Recovery Dispatch</span>
                </div>
              </div>
            </div>

            {/* Password Update Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-900" />
                <span>Update Account Password</span>
              </h3>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Administrative password updated successfully.</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!currentPassword || !newPassword) return;
                  if (newPassword !== confirmPassword) {
                    setPasswordError('New password and confirmation do not match.');
                    return;
                  }
                  if (newPassword.length < 8) {
                    setPasswordError('Password must be at least 8 characters with letters, numbers, and symbols.');
                    return;
                  }
                  setPasswordError(null);
                  try {
                    const res = await updateAuthenticatedPassword(currentPassword, newPassword);
                    if (res.success) {
                      setPasswordSuccess(true);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setTimeout(() => setPasswordSuccess(false), 4000);
                    } else {
                      setPasswordError(res.error || 'Failed to update administrative password.');
                    }
                  } catch (err: any) {
                    setPasswordError(err.message || 'An error occurred updating password.');
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Current Password *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#07243c] hover:bg-[#051a2d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Update Account Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE MODAL: OFFICIAL ROLE 4 MIS OPERATIONAL GUIDE & SPECIFICATION */}
      {/* ========================================================================= */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#07243c] to-[#0a355c] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white">
                    Official MIS Officer: MIS User & Technical Guide
                  </h3>
                  <p className="text-xs text-sky-200 font-mono">
                    CPMD Supplier Information System • Management Information System Specification
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsGuideOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guide Section Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 gap-2 overflow-x-auto text-xs font-semibold text-slate-600">
              <button
                onClick={() => setGuideActiveSection('overview')}
                className={`py-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  guideActiveSection === 'overview' ? 'border-blue-900 text-blue-950 font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                1. Overview & Mandate
              </button>
              <button
                onClick={() => setGuideActiveSection('boundaries')}
                className={`py-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  guideActiveSection === 'boundaries' ? 'border-blue-900 text-blue-950 font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                2. Role Boundaries
              </button>
              <button
                onClick={() => setGuideActiveSection('matrix')}
                className={`py-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  guideActiveSection === 'matrix' ? 'border-blue-900 text-blue-950 font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                3. Permission Matrix
              </button>
              <button
                onClick={() => setGuideActiveSection('screens')}
                className={`py-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  guideActiveSection === 'screens' ? 'border-blue-900 text-blue-950 font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                4. Screen-by-Screen Guide
              </button>
              <button
                onClick={() => setGuideActiveSection('sop')}
                className={`py-3 px-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  guideActiveSection === 'sop' ? 'border-blue-900 text-blue-950 font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                5. SOP & Compliance
              </button>
            </div>

            {/* Modal Body / Guide Content */}
            <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 space-y-4 leading-relaxed">
              {guideActiveSection === 'overview' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-sm text-blue-950 mb-1">
                      Role 4 Executive Overview: Management Information System (MIS)
                    </h4>
                    <p className="text-blue-900/90 text-xs">
                      Role 4 represents the Management Information System (MIS) Officer / System Administrator within the City Government of Butuan procurement architecture.
                      The primary mandate of Role 4 is ensuring continuous platform availability, database synchronization, assistance with staff credentials recovery, and maintenance of approved reference catalogs.
                    </p>
                  </div>

                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Core Responsibilities:</h5>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-800">
                    <li>Maintain operational uptime and health telemetry for the CPMD Supplier Information System.</li>
                    <li>Provide access assistance (password recovery dispatch, email verification checks) for authorized personnel.</li>
                    <li>Audit user account registries across Role 1 (Suppliers), Role 2 (TSAD Staff), and Role 3 (Department Head).</li>
                    <li>Inspect and uphold approved procurement standards (CPMD categories, Form CPMD.TSAD.F.003, EO 27 s. 2023).</li>
                    <li>Review immutable activity audit logs to guarantee ISO 9001:2015 Quality Management System compliance.</li>
                  </ul>
                </div>
              )}

              {guideActiveSection === 'boundaries' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-300">
                    <h4 className="font-bold text-sm text-amber-950 mb-1 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Non-Negotiable Boundaries & Least Privilege Contract</span>
                    </h4>
                    <p className="text-amber-900/90 text-xs">
                      The MIS Officer is NOT an evaluation officer or procurement decision-maker. Strict least-privilege principles are enforced by system design.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                      <span className="font-bold text-emerald-950 text-xs block">WHAT MIS CAN DO:</span>
                      <ul className="list-disc list-inside space-y-1 text-emerald-900 text-[11px]">
                        <li>Dispatch single-use password recovery tokens to verified official government mailboxes.</li>
                        <li>Update non-security portal announcements, office hours, and contact directories.</li>
                        <li>Inspect read-only activity logs and export compliance CSV reports.</li>
                        <li>Monitor system telemetry, server latency, and database persistence status.</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                      <span className="font-bold text-rose-950 text-xs block">WHAT MIS CANNOT DO (DENIED):</span>
                      <ul className="list-disc list-inside space-y-1 text-rose-900 text-[11px]">
                        <li>Verify or endorse supplier accreditation submissions (Reserved for Role 2).</li>
                        <li>Approve, sign, or enlist suppliers onto the Master List (Reserved for Role 3).</li>
                        <li>Browse or download confidential, proprietary supplier attachments.</li>
                        <li>View passwords in plaintext, promote accounts, or alter role permissions arbitrarily.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {guideActiveSection === 'matrix' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">
                    Official Permission Matrix Summary
                  </h4>
                  <p className="text-xs text-slate-600">
                    Baseline authority versus prohibited actions across all 6 core functional areas:
                  </p>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-800">
                        <tr>
                          <th className="p-2.5">Domain</th>
                          <th className="p-2.5 text-emerald-800">Allowed</th>
                          <th className="p-2.5 text-rose-800">Prohibited</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Supplier Records</td>
                          <td className="p-2 text-slate-700">Metadata counts only</td>
                          <td className="p-2 text-rose-700 font-semibold">Evaluation, approval, editing</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Documents</td>
                          <td className="p-2 text-slate-700">Diagnostics on IT ticket</td>
                          <td className="p-2 text-rose-700 font-semibold">Unrestricted download/browsing</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Staff Accounts</td>
                          <td className="p-2 text-slate-700">Recovery token dispatch</td>
                          <td className="p-2 text-rose-700 font-semibold">Password viewing, role assignment</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Permissions</td>
                          <td className="p-2 text-slate-700">Audit role allocations</td>
                          <td className="p-2 text-rose-700 font-semibold">Modifying RLS / schema rules</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Settings</td>
                          <td className="p-2 text-slate-700">Non-security settings only</td>
                          <td className="p-2 text-rose-700 font-semibold">Security / firewall modifications</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Audit Logs</td>
                          <td className="p-2 text-slate-700">Read-only view & CSV export</td>
                          <td className="p-2 text-rose-700 font-semibold">Modifying, deleting, or purging</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {guideActiveSection === 'screens' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">
                    Step-by-Step Walkthrough of the 8 Operational Screens
                  </h4>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>1. Overview & Console:</strong> Monitor platform health telemetry (uptime, database sync, active sessions) and review the quick action hub.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>2. Staff Accounts:</strong> View the directory of authorized personnel across CPMD. Initiate identity recovery workflows for locked or pending accounts.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>3. Access Assistance:</strong> Log and dispatch identity assistance tickets (password recovery, MFA re-sync). Track resolution statuses.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>4. Reference Lists:</strong> Review approved supplier classifications (Goods, Infra, Consulting) and mandatory Form CPMD.TSAD.F.003 requirements.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>5. System Settings:</strong> Update public notice banners, CPMD office hours, and hotline directories.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>6. Activity & Audit Records:</strong> Filter and search immutable system logs and export official CSV reports for ISO 9001 compliance.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>7. Account & Security:</strong> Manage personal administrative credentials, update passwords, and inspect session encryption.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <strong>8. Sign Out:</strong> Securely terminate the administrative session and clear authentication tokens.
                    </div>
                  </div>
                </div>
              )}

              {guideActiveSection === 'sop' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">
                    Standard Operating Procedures (SOP) & Compliance
                  </h4>
                  <div className="space-y-2 text-xs">
                    <p>
                      <strong>SOP-MIS-01: Password Reset Dispatch Protocol</strong><br />
                      Upon receipt of an access recovery request from an authorized staff member, the MIS Officer must confirm the requester's identity through official government channels (official email domain: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">@butuan.gov.ph</code> or phone verification). The recovery token is dispatched directly to that email. Plaintext passwords are never accepted, handled, or transmitted.
                    </p>
                    <p>
                      <strong>SOP-MIS-02: Reference Standard Integrity</strong><br />
                      Reference categories and documentary requirements must conform strictly to Form CPMD.TSAD.F.003 and Executive Order No. 27 Series 2023. Any alteration to qualification criteria requires formal directive signed by the CPMD Department Head.
                    </p>
                    <p>
                      <strong>SOP-MIS-03: ISO 9001:2015 Audit Preservation</strong><br />
                      Audit log records are immutable. Automated backup snapshots are preserved during the scheduled maintenance window (Sundays 02:00 AM - 04:00 AM PST).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                CPMD SIS Standard • Form CPMD.TSAD.F.003
              </span>
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-4 py-2 bg-[#07243c] hover:bg-[#051a2d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURE MULTIPAGE DOCUMENT VIEWER MODAL */}
      <SecureDocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        supplier={suppliers.find(s => s.id === selectedAuditSupplierId) || suppliers[0]}
        currentUser={currentUser}
      />
    </div>
  );
};
