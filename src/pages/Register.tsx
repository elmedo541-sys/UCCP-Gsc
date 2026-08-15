import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus, Plus, X, ArrowRight, ArrowLeft, CheckCircle,
  User, Shield, MapPin, Users, Heart, BookOpen, Briefcase,
  Phone, Mail, Loader2,
} from 'lucide-react';

interface Child { name: string; birthday: string; }

const STEPS = [
  { num: 1, label: 'Personal Info', icon: User },
  { num: 2, label: 'Account Setup', icon: Shield },
];

const ORG_LABELS: Record<string, string> = {
  CYAF: 'CYAF - Christian Young Adult Fellowship',
  CYF:  'CYF - Christian Youth Fellowship',
  CWA:  'CWA - Christian Women Association',
  UCM:  'UCM - United Church Men',
  C:    'C - Children',
};

// ── Password strength ──────────────────────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',        color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair',        color: 'bg-orange-400' };
  if (score <= 3) return { score, label: 'Good',        color: 'bg-yellow-400' };
  if (score <= 4) return { score, label: 'Strong',      color: 'bg-green-400' };
  return            { score, label: 'Very Strong',  color: 'bg-emerald-400' };
}

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [stepDir, setStepDir] = useState<'right' | 'left'>('right');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '', middle_name: '', last_name: '', suffix: '',
    email: '', phone: '', address: '',
    date_of_birth: '', gender: '', organization: '', marital_status: '',
    spouse_name: '', date_of_marriage: '',
    occupation: '', educational_background: '',
    mother_name: '', mother_birthday: '', father_name: '', father_birthday: '',
  });
  const [children, setChildren] = useState<Child[]>([{ name: '', birthday: '' }]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const set = useCallback(
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value })),
    []
  );

  const addChild    = () => setChildren(prev => [...prev, { name: '', birthday: '' }]);
  const removeChild = (i: number) => setChildren(prev => prev.filter((_, idx) => idx !== i));
  const updateChild = (i: number, field: keyof Child, value: string) =>
    setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const validateStep1 = () => {
    if (!formData.last_name.trim() || !formData.first_name.trim()) {
      toast({ title: 'Required', description: 'First and last name are required.', variant: 'destructive' }); return false;
    }
    if (!formData.organization) {
      toast({ title: 'Required', description: 'Please select your organization.', variant: 'destructive' }); return false;
    }
    if (!formData.date_of_birth) {
      toast({ title: 'Required', description: 'Date of birth is required.', variant: 'destructive' }); return false;
    }
    if (!formData.marital_status) {
      toast({ title: 'Required', description: 'Please select your marital status.', variant: 'destructive' }); return false;
    }
    if (!formData.email.trim()) {
      toast({ title: 'Required', description: 'Email address is required.', variant: 'destructive' }); return false;
    }
    if (!formData.phone.trim() || formData.phone.length !== 11) {
      toast({ title: 'Invalid', description: 'Phone number must be exactly 11 digits.', variant: 'destructive' }); return false;
    }
    return true;
  };

  const handleNext = () => { if (validateStep1()) { setStepDir('right'); setStep(2); } };
  const handleBack = () => { setStepDir('left'); setStep(1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' }); return;
    }
    if (password.length < 6) {
      toast({ title: 'Too Short', description: 'Password must be at least 6 characters.', variant: 'destructive' }); return;
    }
    if (username.length < 3) {
      toast({ title: 'Too Short', description: 'Username must be at least 3 characters.', variant: 'destructive' }); return;
    }
    if (!agreedToTerms) {
      toast({ title: 'Agreement Required', description: 'Please agree to the terms and data privacy consent before submitting.', variant: 'destructive' }); return;
    }
    setLoading(true);
    try {
      const fullName = [formData.last_name, formData.first_name, formData.middle_name].filter(Boolean).join(', ');
      const sanitized = {
        ...formData, full_name: fullName,
        date_of_birth: formData.date_of_birth || null,
        date_of_marriage: formData.date_of_marriage || null,
        mother_birthday: formData.mother_birthday || null,
        father_birthday: formData.father_birthday || null,
      };
      const { data: personData, error: personError } = await supabase
        .from('people').insert([sanitized]).select().single();
      if (personError) throw personError;

      const personId = personData.uuid;
      const { error: authError } = await supabase.rpc('create_user_auth', {
        p_person_id: personId, p_email: formData.email,
        p_username: username, p_password: password,
      });
      if (authError) throw authError;

      const childrenToInsert = children.filter(c => c.name.trim() !== '');
      if (childrenToInsert.length > 0) {
        const { error: childrenError } = await supabase.from('children').insert(
          childrenToInsert.map(c => ({ person_id: personId, child_name: c.name, child_birthday: c.birthday || null }))
        );
        if (childrenError) throw childrenError;
      }
      toast({ title: 'Registration Successful!', description: 'Your account has been created. You can now login.' });
      setTimeout(() => navigate('/user/login'), 2000);
    } catch (error) {
      const e = error as { message?: string; details?: string; hint?: string };
      const msg = [e?.message, e?.details, e?.hint].filter(Boolean).join(' — ');
      toast({ title: 'Registration Failed', description: msg || 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const summary = [
    { label: 'Full Name',      value: [formData.first_name, formData.middle_name, formData.last_name, formData.suffix].filter(Boolean).join(' ') || '—' },
    { label: 'Organization',   value: formData.organization ? ORG_LABELS[formData.organization] : '—' },
    { label: 'Date of Birth',  value: formData.date_of_birth || '—' },
    { label: 'Gender',         value: formData.gender || '—' },
    { label: 'Marital Status', value: formData.marital_status || '—' },
    { label: 'Email',          value: formData.email || '—' },
    { label: 'Phone',          value: formData.phone || '—' },
    { label: 'Address',        value: formData.address || '—' },
    ...(formData.marital_status === 'Married'
      ? [{ label: 'Spouse Name', value: formData.spouse_name || '—' },
         { label: 'Date of Marriage', value: formData.date_of_marriage || '—' }] : []),
    { label: 'Occupation',  value: formData.occupation || '—' },
    { label: 'Education',   value: formData.educational_background || '—' },
    { label: "Mother's Name", value: formData.mother_name || '—' },
    { label: "Father's Name", value: formData.father_name || '—' },
  ];
  const filledChildren = children.filter(c => c.name.trim());
  const pwStrength = getPasswordStrength(password);

  const inputCls = "bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 rounded-xl";
  const sectionHeadCls = "flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-10 relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/c91049a2-add2-40.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Floating orbs */}
      <div className="absolute top-[5%]  left-[5%]  w-52 h-52 rounded-full bg-blue-500/15   blur-3xl auth-float-1 pointer-events-none" />
      <div className="absolute bottom-[8%] right-[4%] w-64 h-64 rounded-full bg-purple-500/15 blur-3xl auth-float-2 pointer-events-none" />
      <div className="absolute top-[45%] left-[3%] w-36 h-36  rounded-full bg-indigo-400/15  blur-2xl auth-float-3 pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 auth-card-enter">

        {/* ── Progress ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-center">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone   = step > s.num;
            return (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-400
                    ${isDone
                      ? 'bg-green-400/80 border-green-300 text-white shadow-lg shadow-green-400/30'
                      : isActive
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 auth-pulse-ring'
                        : 'bg-gray-800 border-gray-600 text-gray-500'
                    }`}>
                    {isDone
                      ? <CheckCircle className="w-5 h-5 auth-check-pop" />
                      : <Icon className="w-5 h-5" />
                    }
                  </div>
                  <span className={`text-xs font-medium transition-colors ${isActive ? 'text-white' : isDone ? 'text-green-400' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-24 mx-2 mb-5 rounded-full transition-all duration-500 ${isDone ? 'bg-green-400' : 'bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Card ─────────────────────────────────────────────────────────── */}
        <Card className="shadow-2xl bg-gray-900/95 backdrop-blur-md border border-gray-700 text-white overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400" />

          <CardHeader className="pb-4 border-b border-gray-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">
                  {step === 1 ? 'Personal Information' : 'Account Setup'}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {step === 1 ? 'Tell us about yourself — Step 1 of 2' : 'Create your login credentials — Step 2 of 2'}
                </CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto text-xs border-gray-600 text-gray-400 bg-gray-800">
                Step {step} / 2
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">

            {/* ════════════════════ STEP 1 ════════════════════════════════ */}
            {step === 1 && (
              <div className={`space-y-6 ${stepDir === 'right' ? 'auth-step-right' : 'auth-step-left'}`}>

                {/* Name */}
                <section>
                  <p className={sectionHeadCls}><User className="w-3.5 h-3.5" /> Name</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {[
                      { field: 'last_name' as const,  label: 'Last Name',   required: true,  placeholder: 'Dela Cruz' },
                      { field: 'first_name' as const, label: 'First Name',  required: true,  placeholder: 'Juan' },
                      { field: 'middle_name' as const,label: 'Middle Name', required: false, placeholder: 'Santos' },
                    ].map(({ field, label, required, placeholder }) => (
                      <div key={field} className="space-y-1.5">
                        <Label className="text-gray-200 text-xs">{label} {required && <span className="text-red-400">*</span>}</Label>
                        <div className="relative">
                          <Input value={formData[field]} onChange={set(field)} placeholder={placeholder} required={required} className={inputCls} />
                          {formData[field].trim() && (
                            <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-400 auth-check-pop" />
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label className="text-gray-200 text-xs">Suffix</Label>
                      <Select value={formData.suffix} onValueChange={v => setFormData(p => ({ ...p, suffix: v }))}>
                        <SelectTrigger className={inputCls}><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>{['Jr.','Sr.','II','III','IV'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Organization & Details */}
                <section>
                  <p className={sectionHeadCls}><Users className="w-3.5 h-3.5" /> Organization & Details</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-gray-200 text-xs">Organization <span className="text-red-400">*</span></Label>
                      <Select required value={formData.organization} onValueChange={v => setFormData(p => ({ ...p, organization: v }))}>
                        <SelectTrigger className={inputCls}><SelectValue placeholder="Select organization" /></SelectTrigger>
                        <SelectContent>{Object.entries(ORG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-gray-200 text-xs">Date of Birth <span className="text-red-400">*</span></Label>
                        <Input type="date" value={formData.date_of_birth} onChange={set('date_of_birth')} required className={`${inputCls} [color-scheme:dark]`} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-200 text-xs">Gender</Label>
                        <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v }))}>
                          <SelectTrigger className={inputCls}><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-200 text-xs">Marital Status <span className="text-red-400">*</span></Label>
                        <Select required value={formData.marital_status} onValueChange={v => setFormData(p => ({ ...p, marital_status: v }))}>
                          <SelectTrigger className={inputCls}><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>{['Single','Married','Widowed','Separated','Divorced'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Work & Education */}
                <section>
                  <p className={sectionHeadCls}><Briefcase className="w-3.5 h-3.5" /> Work & Education</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-gray-200 text-xs">Occupation</Label>
                      <Input value={formData.occupation} onChange={set('occupation')} placeholder="Engineer, Teacher, Student…" className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-200 text-xs">Educational Background</Label>
                      <Input value={formData.educational_background} onChange={set('educational_background')} placeholder="Bachelor's Degree…" className={inputCls} />
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section>
                  <p className={sectionHeadCls}><Phone className="w-3.5 h-3.5" /> Contact Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-gray-200 text-xs">Email <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input type="email" required value={formData.email} onChange={set('email')} placeholder="juan@example.com" className={`pl-9 ${inputCls}`} />
                        {formData.email.includes('@') && <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-400 auth-check-pop" />}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-200 text-xs">Phone <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input type="tel" required value={formData.phone}
                          onChange={e => { const v = e.target.value.replace(/\D/g,''); if (v.length <= 11) setFormData(p => ({ ...p, phone: v })); }}
                          placeholder="09123456789" maxLength={11} className={`pl-9 ${inputCls} ${formData.phone.length === 11 ? 'border-green-400/60' : ''}`} />
                      </div>
                      <p className={`text-xs transition-colors ${formData.phone.length === 11 ? 'text-green-400' : formData.phone.length > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                        {formData.phone.length}/11 digits{formData.phone.length === 11 ? ' ✓' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-gray-200 text-xs">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                      <Textarea value={formData.address} onChange={set('address')} placeholder="123 Main St, Barangay, City, Province" rows={2} className={`pl-9 ${inputCls}`} />
                    </div>
                  </div>
                </section>

                {/* Spouse (conditional) */}
                {formData.marital_status === 'Married' && (
                  <section className="p-4 rounded-xl bg-gray-800/60 border border-gray-700 auth-step-right">
                    <p className={sectionHeadCls}><Heart className="w-3.5 h-3.5" /> Spouse Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-gray-200 text-xs">Spouse Name</Label>
                        <Input value={formData.spouse_name} onChange={set('spouse_name')} placeholder="Spouse full name" className={inputCls} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-200 text-xs">Date of Marriage</Label>
                        <Input type="date" value={formData.date_of_marriage} onChange={set('date_of_marriage')} className={`${inputCls} [color-scheme:dark]`} />
                      </div>
                    </div>
                  </section>
                )}

                {/* Parents */}
                <section>
                  <p className={sectionHeadCls}><Users className="w-3.5 h-3.5" /> Parents</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-gray-200 text-xs">Mother's Name</Label><Input value={formData.mother_name} onChange={set('mother_name')} placeholder="Maria Dela Cruz" className={inputCls} /></div>
                    <div className="space-y-1.5"><Label className="text-gray-200 text-xs">Mother's Birthday</Label><Input type="date" value={formData.mother_birthday} onChange={set('mother_birthday')} className={`${inputCls} [color-scheme:dark]`} /></div>
                    <div className="space-y-1.5"><Label className="text-gray-200 text-xs">Father's Name</Label><Input value={formData.father_name} onChange={set('father_name')} placeholder="Jose Dela Cruz" className={inputCls} /></div>
                    <div className="space-y-1.5"><Label className="text-gray-200 text-xs">Father's Birthday</Label><Input type="date" value={formData.father_birthday} onChange={set('father_birthday')} className={`${inputCls} [color-scheme:dark]`} /></div>
                  </div>
                </section>

                {/* Children */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`${sectionHeadCls} mb-0`}><BookOpen className="w-3.5 h-3.5" /> Children</p>
                    <Button type="button" variant="outline" size="sm" onClick={addChild} className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {children.map((child, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-700 rounded-xl bg-gray-800/60 relative">
                        {children.length > 1 && (
                          <button type="button" onClick={() => removeChild(i)}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500/30 text-red-200 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <div className="space-y-1.5"><Label className="text-gray-200 text-xs">Child {i + 1} Name</Label><Input value={child.name} onChange={e => updateChild(i,'name',e.target.value)} placeholder="Child's full name" className={inputCls} /></div>
                        <div className="space-y-1.5"><Label className="text-gray-200 text-xs">Birthday</Label><Input type="date" value={child.birthday} onChange={e => updateChild(i,'birthday',e.target.value)} className={`${inputCls} [color-scheme:dark]`} /></div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex gap-3 pt-2 border-t border-gray-700">
                  <Button type="button" variant="outline" onClick={() => navigate('/')} className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0 transition-all duration-200 group">
                    Next: Account Setup
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            )}

            {/* ════════════════════ STEP 2 ════════════════════════════════ */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className={`space-y-6 ${stepDir === 'right' ? 'auth-step-right' : 'auth-step-left'}`}>

                <section>
                  <p className={sectionHeadCls}><Shield className="w-3.5 h-3.5" /> Create Your Account</p>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-gray-200 text-xs">Username <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <Input id="username" type="text" required value={username}
                          onChange={e => setUsername(e.target.value)}
                          placeholder="choose_a_username" autoComplete="username" minLength={3}
                          className={`${inputCls} ${username.length >= 3 ? 'border-green-400/60 focus:border-green-400' : ''}`} />
                        {username.length >= 3 && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 auth-check-pop" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">At least 3 characters — used for login</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-gray-200 text-xs">Password <span className="text-red-400">*</span></Label>
                        <Input id="password" type={showPassword ? 'text' : 'password'} required
                          value={password} onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••" minLength={6} autoComplete="new-password"
                          className={inputCls} />
                        {password.length > 0 && (
                          <div className="space-y-1 mt-1">
                            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${pwStrength.color}`}
                                style={{ width: `${(pwStrength.score / 5) * 100}%` }}
                              />
                            </div>
                            <p className={`text-xs font-medium ${
                              pwStrength.score <= 1 ? 'text-red-400' :
                              pwStrength.score <= 2 ? 'text-orange-400' :
                              pwStrength.score <= 3 ? 'text-yellow-400' : 'text-green-400'
                            }`}>{pwStrength.label}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="confirm_password" className="text-gray-200 text-xs">Confirm Password <span className="text-red-400">*</span></Label>
                        <Input id="confirm_password" type={showPassword ? 'text' : 'password'} required
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="••••••••" minLength={6} autoComplete="new-password"
                          className={`${inputCls} ${confirmPassword && password === confirmPassword ? 'border-green-400/60' : ''}`} />
                        {confirmPassword && (
                          <p className={`text-xs font-medium ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                            {password === confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Show passwords checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer w-fit select-none mt-1">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={e => setShowPassword(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-gray-400">Show passwords</span>
                    </label>
                  </div>
                </section>

                <section>
                  <p className={sectionHeadCls}><CheckCircle className="w-3.5 h-3.5" /> Review Your Information</p>
                  <div className="rounded-xl border border-gray-700 bg-gray-800/60 divide-y divide-gray-700 max-h-60 overflow-y-auto">
                    {summary.map(({ label, value }) => (
                      <div key={label} className="grid grid-cols-2 px-4 py-2 text-xs">
                        <span className="text-gray-400 font-medium">{label}</span>
                        <span className="text-white truncate">{value}</span>
                      </div>
                    ))}
                    {filledChildren.length > 0 && (
                      <div className="grid grid-cols-2 px-4 py-2 text-xs">
                        <span className="text-gray-400 font-medium">Children</span>
                        <span className="text-white">{filledChildren.map(c => c.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Verify your info above before submitting.</p>
                </section>

                <section>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-xl border border-gray-700 bg-gray-800/60 p-3.5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-gray-800 accent-blue-500 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-xs text-gray-300 leading-relaxed">
                      I agree to the collection and use of my personal information for
                      church membership records, and confirm that the details I've provided
                      are accurate to the best of my knowledge.
                    </span>
                  </label>
                </section>

                <div className="flex gap-3 pt-2 border-t border-gray-700">
                  <Button type="button" variant="outline" onClick={handleBack} className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" disabled={loading || !agreedToTerms} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0 transition-all duration-200 gap-2">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                      : <><CheckCircle className="w-4 h-4" /> Submit Registration</>
                    }
                  </Button>
                </div>
              </form>
            )}

          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-4">
          Already have an account?{' '}
          <button onClick={() => navigate('/user/login')} className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors">
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
