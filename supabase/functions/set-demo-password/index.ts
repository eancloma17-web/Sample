import { createClient } from 'npm:@supabase/supabase-js@2';

const USER_ID = 'd8334599-b920-4625-8894-bd3a58e19a7e';
const EXPECTED_EMAIL = 'eancloma17@gmail.com';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  const expectedKey = Deno.env.get('DEMO_PASSWORD_SETUP_KEY');
  if (!expectedKey || req.headers.get('x-demo-setup-key') !== expectedKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.password !== 'string' || body.password.length < 12) {
    return Response.json({ error: 'Use a password of at least 12 characters.' }, { status: 400 });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    return Response.json({ error: 'Server configuration incomplete.' }, { status: 500 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error: lookupError } = await admin.auth.admin.getUserById(USER_ID);
  if (lookupError || data.user?.email?.toLowerCase() !== EXPECTED_EMAIL) {
    return Response.json({ error: 'Target account did not match.' }, { status: 404 });
  }

  const { error } = await admin.auth.admin.updateUserById(USER_ID, {
    password: body.password,
  });

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
});
