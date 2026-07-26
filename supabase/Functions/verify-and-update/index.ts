Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, code, type, newEmail, newPassword } = await req.json();

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify code
    const { data: verificationData, error: verifyError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('type', type)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (verifyError || !verificationData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationData.id);

    // Update based on type
    if (type === 'email_change' && newEmail) {
      // Update email in user_auth table
      const { error: updateError } = await supabase
        .from('user_auth')
        .update({ email: newEmail })
        .eq('email', email);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also update in people table
      const { data: authData } = await supabase
        .from('user_auth')
        .select('person_id')
        .eq('email', newEmail)
        .single();

      if (authData) {
        await supabase
          .from('people')
          .update({ email: newEmail })
          .eq('id', authData.person_id);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Email updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'password_reset' && newPassword) {
      // Get username for this email
      const { data: userData } = await supabase
        .from('user_auth')
        .select('username, person_id')
        .eq('email', email)
        .single();

      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update password using the database function
      const { error: updateError } = await supabase.rpc('update_user_password', {
        p_email: email,
        p_password: newPassword
      });

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});