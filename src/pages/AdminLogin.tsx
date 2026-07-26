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
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/c91049a2-add2-40.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Floating decorative orbs */}
      <div className="absolute top-[10%] left-[8%] w-40 h-40 rounded-full bg-indigo-500/20 blur-3xl auth-float-1 pointer-events-none" />
      <div className="absolute bottom-[15%] right-[6%] w-56 h-56 rounded-full bg-purple-500/20 blur-3xl auth-float-2 pointer-events-none" />
      <div className="absolute top-[55%] left-[15%] w-32 h-32 rounded-full bg-blue-400/20 blur-2xl auth-float-3 pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-24 h-24 rounded-full bg-sky-400/15 blur-2xl auth-float-1 pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Card */}
      <div
        ref={cardRef}
        className={`w-full max-w-md relative z-10 auth-card-enter ${shake ? 'auth-shake' : ''}`}
      >
        <div className={`bg-gray-900/95 backdrop-blur-md border border-gray-700 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${success ? 'scale-[1.02] border-green-500/60' : ''}`}>

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400" />

          <div className="p-8">
            {/* Icon + Title */}
            <div className="text-center mb-8">
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
                success
                  ? 'bg-green-500/20 border border-green-500/50 auth-success-bounce'
                  : 'bg-indigo-500/20 border border-indigo-500/40 auth-pulse-ring'
              }`}>
                {success
                  ? <CheckCircle className="w-8 h-8 text-green-400" />
                  : <ShieldCheck className="w-8 h-8 text-indigo-400" />
                }
              </div>
              <h1 className="text-3xl font-bold text-white">
                {success ? 'Welcome back!' : 'Admin Sign In'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {success ? 'Redirecting to dashboard…' : 'Restricted access — authorized personnel only'}
              </p>
            </div>

            {/* Form */}
            {!success && (
              <form onSubmit={handleSignIn} className="space-y-5">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-200 text-sm font-medium">Username</Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="admin_username"
                      autoComplete="username"
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500
                        focus:border-indigo-500 focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30
                        transition-all duration-200 rounded-xl h-11"
                    />
                    {username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 auth-check-pop">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200 text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500
                      focus:border-indigo-500 focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30
                      transition-all duration-200 rounded-xl h-11"
                  />
                  <label className="flex items-center gap-2 cursor-pointer w-fit mt-1 select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={e => setShowPassword(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs text-gray-400">Show password</span>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-semibold text-sm
                    bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                    text-white border-0
                    transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                    text-gray-400 hover:text-white text-sm
                    border border-gray-700 hover:border-gray-500 hover:bg-gray-800
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
