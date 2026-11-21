-- Security hardening: apply after 20261020000003. Review on staging first.
-- Browser users must not update profile role, active flag, or identity bindings.
DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin staff can manage profiles" ON public.profiles;
REVOKE UPDATE ON public.profiles FROM authenticated;
-- Only safe self-service profile attributes; RLS additionally enforces own-row access.
CREATE POLICY "Users can update own display name" ON public.profiles
 FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
GRANT UPDATE (full_name) ON public.profiles TO authenticated;
-- Remove overly broad staff direct updates. Status transitions must use vetted RPCs.
DROP POLICY IF EXISTS "Authorized staff can update application status" ON public.supplier_applications;
-- No direct final-approval status is permitted until authority is approved.
CREATE OR REPLACE FUNCTION public.prevent_unapproved_supplier_approval()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.status = 'APPROVED_MASTERLIST' AND
    (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'APPROVED_MASTERLIST') THEN
   RAISE EXCEPTION 'Final supplier approval authority has not been designated';
 END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_unapproved_supplier_approval ON public.supplier_applications;
CREATE TRIGGER trg_prevent_unapproved_supplier_approval
 BEFORE INSERT OR UPDATE ON public.supplier_applications
 FOR EACH ROW EXECUTE FUNCTION public.prevent_unapproved_supplier_approval();
-- Prevent staff from forging another actor's recommendation record.
DROP POLICY IF EXISTS "Staff can insert decision records" ON public.decision_records;
CREATE POLICY "Staff may record own non-final review" ON public.decision_records
 FOR INSERT TO authenticated WITH CHECK (
   performed_by_id = auth.uid() AND
   public.current_user_role() IN ('TSAD_STAFF','CPMD_VERIFIER','CPMD_HEAD') AND
   role = public.current_user_role() AND
   action NOT ILIKE '%approv%' AND action NOT ILIKE '%accredit%'
 );
