# Secure internal personnel login

1. Apply migration `20261020000005_staff_gate_and_recommendations.sql` **after** 00004.
2. Set Supabase Edge Function secret `STAFF_ACCESS_CODE` to the separately communicated internal code (do not commit the value).
3. Deploy `staff-login` with JWT verification **disabled for this function only**, since it must authenticate users who do not yet have a JWT.
4. Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are available to the function through Supabase runtime configuration.
5. Test five unsuccessful attempts, lockout, correct code + wrong password, supplier account rejection, correct internal credentials, and browser role routing.
6. Enable CAPTCHA/WAF or an external IP-based throttle before production if targeted abuse is a concern. The DB rate limit is per email and can itself be abused to lock out a user; monitor and provide administrative unlock.

The function is not a substitute for Supabase Auth, RLS, or separate role policies. Never expose the access code in VITE_ variables.
