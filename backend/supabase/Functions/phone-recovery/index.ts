// ============================================================
// DISABLED for security reasons.
//
// This endpoint used to hand the password-reset verification code
// directly back in its own API response instead of actually sending
// it anywhere ("no SMS — shown to user directly"), which meant anyone
// who knew or guessed a member's phone number could take over their
// account instantly, with no proof they owned that phone.
//
// It also wasn't called anywhere in the current app — the real
// password recovery flow is email-based (send-verification-code +
// verify-and-update). This function is kept only so the URL doesn't
// 404 unexpectedly; it now safely refuses every request.
//
// If real phone/SMS-based recovery is wanted later, it needs to
// actually send the code via an SMS provider (e.g. Twilio) rather
// than returning it in the response — ask your developer to wire
// that up properly rather than re-enabling this file as-is.
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: 'Phone-based account recovery is currently unavailable. Please use email-based password recovery instead.',
    }),
    { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
