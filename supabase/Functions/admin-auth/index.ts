import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginRequest {
  username: string;
  password: string;
  action: 'login' | 'signup' | 'create_admin' | 'delete_admin' | 'list_admins';
  token?: string;
  new_username?: string;
  new_password?: string;
  new_role?: 'viewer' | 'editor';
  target_admin_id?: string;
}

async function verifySuperAdmin(supabase: ReturnType<typeof createClient>, token: string): Promise<{ valid: boolean; adminId?: string }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('admin_id, expires_at')
    .eq('token', token)
    .gt('expires_at', now)
    .maybeSingle();

  if (error || !data) return { valid: false };

  const { data: cred } = await supabase
    .from('admin_credentials')
    .select('role')
    .eq('id', data.admin_id)
    .maybeSingle();

  if (cred?.role !== 'super_admin') return { valid: false };

  return { valid: true, adminId: data.admin_id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: LoginRequest = await req.json();
    const { action } = body;

    // ── LIST ADMINS ──────────────────────────────────────────────────────────
    if (action === 'list_admins') {
      const { valid } = await verifySuperAdmin(supabase, body.token ?? '');
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('admin_credentials')
        .select('id, username, role, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, admins: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── CREATE ADMIN ─────────────────────────────────────────────────────────
    if (action === 'create_admin') {
      const { valid } = await verifySuperAdmin(supabase, body.token ?? '');
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { new_username, new_password, new_role } = body;
      if (!new_username || !new_password || !new_role) {
        return new Response(
          JSON.stringify({ error: 'Username, password, and role are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!['viewer', 'editor'].includes(new_role)) {
        return new Response(
          JSON.stringify({ error: 'Role must be viewer or editor' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use RPC — bcrypt via pgcrypto, same as verify_admin_credentials
      const { error: rpcError } = await supabase.rpc('create_sub_admin', {
        p_username: new_username,
        p_password: new_password,
        p_role: new_role,
      });

      if (rpcError) {
        const msg = rpcError.message || 'Failed to create admin';
        const status = msg.includes('already exists') ? 409 : 400;
        return new Response(
          JSON.stringify({ error: msg }),
          { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Admin created successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── DELETE ADMIN ─────────────────────────────────────────────────────────
    if (action === 'delete_admin') {
      const { valid, adminId: callerId } = await verifySuperAdmin(supabase, body.token ?? '');
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { target_admin_id } = body;
      if (!target_admin_id) {
        return new Response(
          JSON.stringify({ error: 'target_admin_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (target_admin_id === callerId) {
        return new Response(
          JSON.stringify({ error: 'You cannot delete your own account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: target } = await supabase
        .from('admin_credentials')
        .select('role')
        .eq('id', target_admin_id)
        .maybeSingle();

      if (target?.role === 'super_admin') {
        return new Response(
          JSON.stringify({ error: 'Cannot delete a super admin account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('admin_sessions').delete().eq('admin_id', target_admin_id);

      const { error: deleteError } = await supabase
        .from('admin_credentials')
        .delete()
        .eq('id', target_admin_id);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true, message: 'Admin deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── LOGIN / SIGNUP ────────────────────────────────────────────────────────
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'signup') {
      const { data: existingAdmins, error: checkError } = await supabase
        .from('admin_credentials')
        .select('id')
        .limit(1);

      if (checkError) {
        return new Response(
          JSON.stringify({ error: 'Failed to check admin status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingAdmins && existingAdmins.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Admin account already exists. Only one admin is allowed.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase.rpc('create_admin_user', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to create admin user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Admin user created successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Login
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data?.[0];
      if (!result?.is_valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid username or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          token: sessionToken,
          admin_id: result.admin_id,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          session_token: sessionToken,
          admin_id: result.admin_id,
          role: result.role,
          expires_at: expiresAt.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
