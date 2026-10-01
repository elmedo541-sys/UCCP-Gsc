import "./AuthPages.css";
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  KeyRound, ArrowLeft, Mail, Phone, Eye, EyeOff,
  CheckCircle, Loader2, ShieldCheck,
} from 'lucide-react';

type Method = 'email' | 'phone';
type Step = 'input' | 'code' | 'password' | 'success';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: 'Weak',        color: 'bg-red-500' };
  if (s <= 2) return { score: s, label: 'Fair',        color: 'bg-orange-400' };
  if (s <= 3) return { score: s, label: 'Good',        color: 'bg-yellow-400' };
  if (s <= 4) return { score: s, label: 'Strong',      color: 'bg-green-400' };
  return            { score: s, label: 'Very Strong',  color: 'bg-emerald-400' };
}

// ── 6-box OTP Input ──────────────────────────────────────────────────────────
function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, char: string) => {
    const digits = char.replace(/\D/g, '').slice(0, 1);
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = digits || ' ';
    const next = arr.join('').trimEnd();
    onChange(next);
    if (digits && i < 5) {
      setTimeout(() => inputs.current[i + 1]?.focus(), 10);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    setTimeout(() => inputs.current[focusIdx]?.focus(), 10);
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => {
        const char = value[i] ?? '';
        const filled = char.trim() !== '';
        return (
          <input
            key={i}
            ref={el => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={char.trim()}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
            className={`w-11 h-14 text-center text-xl font-bold rounded-md border-2 outline-none
              gsc-auth-field gsc-auth-ink
              transition-all duration-150 caret-transparent
              ${filled
                ? 'border-blue-500 gsc-auth-divider shadow-md shadow-blue-500/20'
                : 'gsc-auth-border focus:border-blue-400'
              }`}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [method, setMethod] = useState<Method>('phone');
  const [step, setStep] = useState<Step>('input');
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');

  // Step 2
  const [otpCode, setOtpCode] = useState('');

  // Step 3
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const pwStrength = getPasswordStrength(newPassword);

  // ── Send code ──────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let targetEmail = email;

      // Phone method: look up the user's email from the people table
      if (method === 'phone') {
        if (phone.length !== 11) {
          toast({ title: 'Invalid', description: 'Phone number must be 11 digits.', variant: 'destructive' });
          return;
        }
        const { data: person, error: personErr } = await supabase
          .from('people')
          .select('email')
          .eq('phone', phone.trim())
          .maybeSingle();

        if (personErr || !person?.email) {
          toast({
            title: 'Not Found',
            description: 'No account found with that phone number.',
            variant: 'destructive',
          });
          return;
        }
        targetEmail = person.email;
      }

      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email: targetEmail, type: 'password_reset' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error as string);

      // Store email so verify step can use it
      setEmail(targetEmail);

      setStep('code');
      toast({
        title: 'Code Sent',
        description: `Check ${targetEmail} for your 6-digit verification code.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send code.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Verify code ────────────────────────────────────────────────────────────
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast({ title: 'Incomplete', description: 'Enter the full 6-digit code.', variant: 'destructive' });
      return;
    }
    setStep('password');
  };

  // ── Reset password ─────────────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' }); return;
    }
    if (newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72) {
      toast({ title: 'Too Short', description: 'Use at least 8 characters and at most 72 bytes.', variant: 'destructive' }); return;
    }
    setLoading(true);
    try {
      // Always use email (resolved from phone in handleSend if phone method)
      const { data, error } = await supabase.functions.invoke('verify-and-update', {
        body: { email, code: otpCode, type: 'password_reset', newPassword },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error as string);

      setStep('success');
      setTimeout(() => navigate('/user/login'), 3000);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reset password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "gsc-auth-field gsc-auth-border gsc-auth-ink placeholder:text-[var(--auth-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 rounded-md h-11";

  return (
    <div className="gsc-auth min-h-screen p-4 py-10">
      <header className="gsc-auth-brand">
        <a href="/" aria-label="Good Samaritan Church home">
          <img src="/uccp-logo-transparent.png" alt="UCCP logo" width="52" height="52" />
          <span><small>UNITED CHURCH OF CHRIST IN THE PHILIPPINES</small><strong>Good Samaritan Church</strong></span>
        </a>
        <p>Recover access to your church account.</p>
      </header>
      <div className="w-full max-w-md relative z-10 ">
        <div className="gsc-auth-card  border gsc-auth-border shadow-sm rounded-lg overflow-hidden">

          {/* Accent bar */}
          <div className="h-1 gsc-auth-accent" />

          <div className="p-8">

            {/* ── SUCCESS ── */}
            {step === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center ">
                  <CheckCircle className="w-10 h-10 gsc-auth-success" />
                </div>
                <h2 className="text-2xl font-bold gsc-auth-ink">Password Reset!</h2>
                <p className="gsc-auth-muted text-sm">Your password has been updated. Redirecting to login…</p>
                <div className="flex justify-center gap-2 pt-2">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* ── INPUT (email or phone) ── */}
            {step === 'input' && (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="mx-auto w-14 h-14 rounded-lg gsc-auth-icon border border-blue-500/40 flex items-center justify-center mb-4 ">
                    <KeyRound className="w-7 h-7 gsc-auth-link" />
                  </div>
                  <h1 className="text-2xl font-bold gsc-auth-ink">Recover Account</h1>
                  <p className="gsc-auth-muted text-sm mt-1">Choose how to verify your identity</p>
                </div>

                {/* Method toggle */}
                <div className="flex rounded-md overflow-hidden border gsc-auth-border mb-6">
                  {(['phone', 'email'] as Method[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200
                        ${method === m
                          ? 'gsc-auth-button gsc-auth-ink'
                          : 'gsc-auth-field gsc-auth-muted hover:text-[var(--auth-ink)] hover:bg-gray-700'
                        }`}
                    >
                      {m === 'phone' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      {m === 'phone' ? 'Phone Number' : 'Email'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSend} className="space-y-4">
                  {method === 'phone' ? (
                    <div className="space-y-1.5">
                      <Label className="gsc-auth-label text-sm font-medium">
                        Registered Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 gsc-auth-muted" />
                        <Input
                          type="tel"
                          required
                          value={phone}
                          onChange={e => { const v = e.target.value.replace(/\D/g,''); if (v.length <= 11) setPhone(v); }}
                          placeholder="09123456789"
                          maxLength={11}
                          className={`pl-10 ${inputCls} ${phone.length === 11 ? 'border-green-500' : ''}`}
                        />
                        {phone.length === 11 && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 gsc-auth-success " />
                        )}
                      </div>
                      <p className={`text-xs ${phone.length === 11 ? 'gsc-auth-success' : phone.length > 0 ? 'text-orange-400' : 'gsc-auth-muted'}`}>
                        {phone.length}/11 digits{phone.length === 11 ? ' ✓' : ''}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="gsc-auth-label text-sm font-medium">
                        Registered Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 gsc-auth-muted" />
                        <Input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={`pl-10 ${inputCls}`}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gsc-auth-button hover:bg-[var(--auth-button-hover)] gsc-auth-ink border-0 h-11 rounded-md font-semibold gap-2 transition-all duration-200"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Verification Code'}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => navigate('/user/login')}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-md
                    gsc-auth-muted hover:text-[var(--auth-ink)] text-sm border gsc-auth-border hover:border-gray-500 hover:bg-[var(--auth-inset)] transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </>
            )}

            {/* ── CODE ENTRY ── */}
            {step === 'code' && (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-14 h-14 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 gsc-auth-link" />
                  </div>
                  <h1 className="text-2xl font-bold gsc-auth-ink">Enter Code</h1>
                  <p className="gsc-auth-muted text-sm mt-1">
                    Enter the 6-digit code
                    {method === 'phone' ? ` for +63${phone.slice(1)}` : ` sent to ${email}`}
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                  <OTPInput value={otpCode} onChange={setOtpCode} />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => { setStep('input'); setOtpCode(''); }}
                      className="border gsc-auth-border bg-transparent gsc-auth-label hover:bg-[var(--auth-inset)] hover:text-[var(--auth-ink)] rounded-md"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={otpCode.length < 6}
                      className="flex-1 gsc-auth-button hover:bg-[var(--auth-button-hover)] gsc-auth-ink border-0 rounded-md font-semibold gap-2 disabled:opacity-50"
                    >
                      Verify Code
                    </Button>
                  </div>

                  <p className="text-center text-xs gsc-auth-muted">
                    Didn't get a code?{' '}
                    <button
                      type="button"
                      onClick={() => { setStep('input'); setOtpCode(''); }}
                      className="gsc-auth-link hover:text-blue-300 underline transition-colors"
                    >
                      Try again
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* ── NEW PASSWORD ── */}
            {step === 'password' && (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-14 h-14 rounded-lg bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
                    <KeyRound className="w-7 h-7 gsc-auth-success" />
                  </div>
                  <h1 className="text-2xl font-bold gsc-auth-ink">New Password</h1>
                  <p className="gsc-auth-muted text-sm mt-1">Code verified. Set your new password.</p>
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="gsc-auth-label text-sm font-medium">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showPw ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`pr-10 ${inputCls}`}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 gsc-auth-muted hover:text-[var(--auth-ink)] transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword.length > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full gsc-auth-divider overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${pwStrength.color}`}
                            style={{ width: `${(pwStrength.score / 5) * 100}%` }} />
                        </div>
                        <p className={`text-xs font-medium ${
                          pwStrength.score <= 1 ? 'text-red-400' :
                          pwStrength.score <= 2 ? 'text-orange-400' :
                          pwStrength.score <= 3 ? 'text-yellow-400' : 'gsc-auth-success'
                        }`}>{pwStrength.label}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="gsc-auth-label text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showCpw ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`pr-10 ${inputCls} ${confirmPassword && newPassword === confirmPassword ? 'border-green-500' : ''}`}
                      />
                      <button type="button" onClick={() => setShowCpw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 gsc-auth-muted hover:text-[var(--auth-ink)] transition-colors">
                        {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <p className={`text-xs font-medium ${newPassword === confirmPassword ? 'gsc-auth-success' : 'text-red-400'}`}>
                        {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      onClick={() => setStep('code')}
                      className="border gsc-auth-border bg-transparent gsc-auth-label hover:bg-[var(--auth-inset)] hover:text-[var(--auth-ink)] rounded-md"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 gsc-auth-button hover:bg-[var(--auth-button-hover)] gsc-auth-ink border-0 rounded-md font-semibold gap-2"
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
                        : <><CheckCircle className="w-4 h-4" /> Reset Password</>
                      }
                    </Button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>

        {step !== 'success' && (
          <p className="text-center text-xs gsc-auth-muted mt-4">
            Remember your password?{' '}
            <button onClick={() => navigate('/user/login')} className="gsc-auth-link hover:text-blue-300 underline font-medium transition-colors">
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
