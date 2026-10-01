import AuthBrand from "@/components/AuthBrand";
import "./AuthPages.css";
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(username, password);
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/admin/dashboard'), 900);
    } catch (error) {
      triggerShake();
      let errorMessage = 'Invalid username or password.';
      if (error instanceof Error) errorMessage = error.message;
      else if (typeof error === 'object' && error !== null) {
        const e = error as { message?: string };
        if (e.message) errorMessage = e.message;
      }
      toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gsc-auth gsc-auth-refresh gsc-auth-login min-h-screen p-4 py-10">
      <AuthBrand description="Manage church records and activities with care." admin />
      {/* Card */}
      <div
        ref={cardRef}
        className={`w-full max-w-md relative z-10  ${shake ? 'auth-shake' : ''}`}
      >
        <div className={`gsc-auth-card  border gsc-auth-border shadow-sm rounded-lg overflow-hidden transition-all duration-300 ${success ? 'scale-[1.02] border-green-500/60' : ''}`}>

          {/* Top accent bar */}
          <div className="h-1 w-full gsc-auth-accent" />

          <div className="p-8">
            {/* Icon + Title */}
            <div className="text-center mb-8">
              <div className={`mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-all duration-500 ${
                success
                  ? 'bg-green-500/20 border border-green-500/50 '
                  : 'gsc-auth-icon border border-indigo-500/40 '
              }`}>
                {success
                  ? <CheckCircle className="w-8 h-8 gsc-auth-success" />
                  : <ShieldCheck className="w-8 h-8 gsc-auth-link" />
                }
              </div>
              <h1 className="text-3xl font-bold gsc-auth-ink">
                {success ? 'Welcome back!' : 'Admin Sign In'}
              </h1>
              <p className="gsc-auth-muted text-sm mt-1">
                {success ? 'Redirecting to dashboard…' : 'Restricted access — authorized personnel only'}
              </p>
            </div>

            {/* Form */}
            {!success && (
              <form onSubmit={handleSignIn} className="space-y-5">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="gsc-auth-label text-sm font-medium">Username</Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="admin_username"
                      autoComplete="username"
                      className="gsc-auth-field gsc-auth-border gsc-auth-ink placeholder:text-[var(--auth-muted)]
                        focus:border-indigo-500 focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30
                        transition-all duration-200 rounded-md h-11"
                    />
                    {username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 ">
                        <CheckCircle className="w-4 h-4 gsc-auth-success" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="gsc-auth-label text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="gsc-auth-field gsc-auth-border gsc-auth-ink placeholder:text-[var(--auth-muted)]
                      focus:border-indigo-500 focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30
                      transition-all duration-200 rounded-md h-11"
                  />
                  <label className="flex items-center gap-2 cursor-pointer w-fit mt-1 select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={e => setShowPassword(e.target.checked)}
                      className="w-4 h-4 rounded gsc-auth-border gsc-auth-field accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs gsc-auth-muted">Show password</span>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-md font-semibold text-sm
                    gsc-auth-button hover:bg-[var(--auth-button-hover)] active:bg-indigo-700
                    gsc-auth-ink border-0
                    transition-all duration-200 
                    disabled:opacity-60 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Loading dots for success state */}
            {success && (
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}

            {/* Back to home */}
            {!success && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md
                    gsc-auth-muted hover:text-[var(--auth-ink)] text-sm
                    border gsc-auth-border hover:border-gray-500 hover:bg-[var(--auth-inset)]
                    transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
