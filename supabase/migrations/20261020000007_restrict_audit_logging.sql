-- Migration 7: Restrict privileged audit logging.
-- Preserve the function for trusted server-side use.

REVOKE ALL ON FUNCTION public.log_audit_event(
  text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.log_audit_event(
  text, text, text, jsonb
) TO service_role;
