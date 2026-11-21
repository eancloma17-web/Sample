-- ============================================================================
-- BUTUAN CITY CPMD TSAD SUPPLIER INFORMATION SYSTEM
-- Migration: 20261018000002_seed_reference_data.sql
-- Description: Standard reference classifications, mandatory document items, and settings
-- ============================================================================

-- Ensure unique index exists for reference_standards
CREATE UNIQUE INDEX IF NOT EXISTS idx_reference_standards_type_code ON public.reference_standards(type, code);

-- 1. Standard Supplier Classifications (Form CPMD.TSAD.F.003)
INSERT INTO public.reference_standards (type, code, title, description, metadata, is_active)
VALUES
  (
    'CLASSIFICATION',
    'GOODS_AND_SERVICES',
    'Goods and Services',
    'General procurement, medical supplies, diagnostics, fuels, ICT hardware, and office commodities.',
    '{"code": "GS", "sort_order": 1}'::jsonb,
    true
  ),
  (
    'CLASSIFICATION',
    'INFRASTRUCTURE_PROJECTS',
    'Infrastructure Projects',
    'Civil engineering, vertical/horizontal construction, road rehabilitation, flood mitigation, PCAB registered contractors.',
    '{"code": "INFRA", "requires_pcab": true, "sort_order": 2}'::jsonb,
    true
  ),
  (
    'CLASSIFICATION',
    'CONSULTING_SERVICES',
    'Consulting Services',
    'Engineering architectural consulting, feasibility studies, environmental impact analyses, project management.',
    '{"code": "CS", "sort_order": 3}'::jsonb,
    true
  )
ON CONFLICT (type, code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  is_active = true;

-- 2. Standard Mandatory Documentary Requirements Checklist (Form CPMD.TSAD.F.003. REV00)
INSERT INTO public.reference_standards (type, code, title, description, metadata, is_active)
VALUES
  (
    'MANDATORY_DOCUMENT',
    'MAYORS_PERMIT',
    'Mayor’s / Business Permit',
    'Current CY 2026 Mayor’s or Business Permit issued by the LGU where principal place of business is located.',
    '{"required": true, "category": "ALL", "source": "BOTH", "order": 1}'::jsonb,
    true
  ),
  (
    'MANDATORY_DOCUMENT',
    'DTI_SEC_CERT',
    'DTI / SEC Registration Certificate',
    'DTI Certificate for Sole Proprietorship or SEC Certificate of Incorporation with Articles and By-Laws for Corporation/Partnership.',
    '{"required": true, "category": "ALL", "source": "BOTH", "order": 2}'::jsonb,
    true
  ),
  (
    'MANDATORY_DOCUMENT',
    'PHILGEPS_CERT',
    'PhilGEPS Certificate of Registration',
    'Valid PhilGEPS Certificate of Registration and Membership (Platinum or Red Membership Tier).',
    '{"required": true, "category": "ALL", "source": "BOTH", "order": 3}'::jsonb,
    true
  ),
  (
    'MANDATORY_DOCUMENT',
    'TAX_CLEARANCE',
    'Tax Clearance Certificate',
    'Tax Clearance per Executive Order No. 398 s. 2005 (BIR Form 17.14B) issued by the Collection Enforcement Division.',
    '{"required": true, "category": "ALL", "source": "BOTH", "order": 4}'::jsonb,
    true
  ),
  (
    'MANDATORY_DOCUMENT',
    'PCAB_LICENSE',
    'PCAB License & Contractor Registration',
    'Philippine Contractors Accreditation Board (PCAB) License and valid Principal Classification for infrastructure works.',
    '{"required": true, "category": "INFRASTRUCTURE", "source": "BOTH", "order": 5}'::jsonb,
    true
  ),
  (
    'MANDATORY_DOCUMENT',
    'DBP_ACCOUNT',
    'DBP Account Proof / Bank Certificate',
    'Proof of active account with Development Bank of the Philippines (Mandatory per Executive Order No. 27 s. 2023).',
    '{"required": true, "category": "ALL", "source": "LETTER", "order": 6}'::jsonb,
    true
  ),
  (
    'MANDATORY_DOCUMENT',
    'COMPANY_PROFILE',
    'Company Profile & Track Record',
    'Comprehensive corporate overview, track record of ongoing and completed contracts, technical personnel roster.',
    '{"required": true, "category": "ALL", "source": "SI_SHEET", "order": 7}'::jsonb,
    true
  ),
  (
    'MANDATORY_DOCUMENT',
    'EXCLUSIVE_DISTRIBUTOR',
    'Certificate of Exclusive Distributorship',
    'Certificate of Exclusive Distributorship or Dealership from manufacturer/principal distributor (if applicable).',
    '{"required": false, "category": "OPTIONAL", "source": "BOTH", "order": 8}'::jsonb,
    true
  ),
  (
    'MANDATORY_DOCUMENT',
    'FOREIGN_RECIPROCITY',
    'Foreign Reciprocity Certification',
    'Reciprocity certification issued by the foreign supplier’s home government (for foreign applicants).',
    '{"required": false, "category": "FOREIGN", "source": "SI_SHEET", "order": 9}'::jsonb,
    true
  )
ON CONFLICT (type, code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  is_active = true;

-- 3. Default Non-Security Operational Settings
INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES
  (
    'announcement_banner',
    'CPMD Notice: Supplier Accreditation applications for CY 2026 are actively verified in accordance with Form CPMD.TSAD.F.003 and Executive Order No. 27.',
    'Public announcement text shown in portal workspaces.',
    now()
  ),
  (
    'office_hours',
    'Monday - Friday, 8:00 AM - 5:00 PM PST (Excluding Official Philippine Public Holidays)',
    'Official office hours of the Technical Support and Accreditation Division.',
    now()
  ),
  (
    'support_hotline',
    '(085) 817-5000 / (085) 341-2244',
    'CPMD / TSAD Helpdesk telephone contact numbers.',
    now()
  ),
  (
    'support_email',
    'cgb.cpmso@gmail.com / tsad.cgb@gmail.com',
    'Official email addresses for supplier assistance and inquiries.',
    now()
  ),
  (
    'maintenance_window',
    'Every Sunday 02:00 AM - 04:00 AM PST (Scheduled Database Maintenance)',
    'Notice of regular technical maintenance period.',
    now()
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
