import AuthBrand from "@/components/AuthBrand";
import "./AuthPages.css";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '@/hooks/useUserAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import InstallAppModal from '@/components/InstallAppModal';
import { canShowInstallPrompt, isStandalone, isIOS } from '@/lib/installPrompt';

export default function UserLogin() {
  const navigate = useNavigate();
  const { signIn } = useUserAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(username, password);
      if (error) throw error;
      setSuccess(true);

      // Offer to install the app once per device, only if it isn't
      // already installed and the browser can realistically support it.
      const alreadyOffered = localStorage.getItem('install_prompt_shown');
      const eligible = !isStandalone() && !alreadyOffered && (canShowInstallPrompt() || isIOS());

      setTimeout(() => {
        if (eligible) {
          localStorage.setItem('install_prompt_shown', '1');
          setShowInstallPrompt(true);
        } else {
          navigate('/feed');
        }
      }, 900);
    } catch (error) {
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
      <AuthBrand description="Welcome back. Stay connected with the people and life of your church." />
      {/* Card */}
      <div
        className="w-full max-w-md relative z-10"
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
                  : 'gsc-auth-icon border gsc-auth-border '
              }`}>
                {success
                  ? <CheckCircle className="w-8 h-8 gsc-auth-success" />
                  : <LogIn className="w-8 h-8 gsc-auth-link" />
                }
              </div>
              <h1 className="text-3xl font-bold gsc-auth-ink">
                {success ? 'Welcome back!' : 'Member login'}
              </h1>
              <p className="gsc-auth-muted text-sm mt-1">
                {success ? 'Opening your community feed…' : 'Use your member username and password.'}
              </p>
            </div>

            {/* Form */}
            {!success && (
              <form onSubmit={handleSignIn} className="space-y-5" aria-busy={loading}>
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
                      placeholder="your_username"
                      autoComplete="username"
                      className="gsc-auth-field gsc-auth-border gsc-auth-ink placeholder:text-[var(--auth-muted)]
                        focus:border-[var(--auth-gold)] focus:bg-[var(--auth-surface)] focus:ring-2 focus:ring-[var(--auth-gold)]/20
                        transition-all duration-200 rounded-md h-11"
                    />

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
                      focus:border-[var(--auth-gold)] focus:bg-[var(--auth-surface)] focus:ring-2 focus:ring-[var(--auth-gold)]/20
                      transition-all duration-200 rounded-md h-11"
                  />
                  <label className="flex items-center gap-2 cursor-pointer w-fit mt-1 select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={e => setShowPassword(e.target.checked)}
                      className="w-4 h-4 rounded gsc-auth-border gsc-auth-field accent-[var(--auth-button)] cursor-pointer"
                    />
                    <span className="text-xs gsc-auth-muted">Show password</span>
                  </label>
                </div>

                {/* Forgot password */}
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/user/forgot-password')}
                    className="text-xs gsc-auth-muted hover:text-[var(--auth-ink)] underline underline-offset-2 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-md font-semibold text-sm
                    gsc-auth-button hover:bg-[var(--auth-button-hover)] active:bg-[var(--auth-button-hover)]
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
                      <LogIn className="w-4 h-4" />
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

            {/* Divider */}
            {!success && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px gsc-auth-divider" />
                  <span className="text-xs gsc-auth-muted">or</span>
                  <div className="flex-1 h-px gsc-auth-divider" />
                </div>

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

                <p className="text-center text-xs gsc-auth-muted">
                  No account yet?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="gsc-auth-link hover:text-blue-300 underline underline-offset-2 font-medium transition-colors"
                  >
                    Register here
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <InstallAppModal
        open={showInstallPrompt}
        onClose={() => { setShowInstallPrompt(false); navigate('/feed'); }}
      />
    </div>
  );
}
