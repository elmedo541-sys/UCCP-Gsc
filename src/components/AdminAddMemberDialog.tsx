import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

interface AdminAddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const ORG_LABELS: Record<string, string> = {
  CYAF: 'CYAF - Christian Young Adult Fellowship',
  CYF:  'CYF - Christian Youth Fellowship',
  CWA:  'CWA - Christian Women Association',
  UCM:  'UCM - United Church Men',
  C:    'C - Children',
};

const EMPTY_FORM = {
  first_name: '', middle_name: '', last_name: '', suffix: '',
  email: '', phone: '', address: '',
  date_of_birth: '', gender: '', organization: '', marital_status: '',
  username: '', password: '',
};

// Lets an admin with permission (super admins always, or an admin granted
// "can_register_members") manually add a member on their behalf — for
// walk-ins, people without their own device, etc. Unlike the public
// self-registration form, phone and email are optional here since the
// admin may not have that info on hand yet.
export default function AdminAddMemberDialog({ open, onOpenChange, onCreated }: AdminAddMemberDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const reset = () => setForm(EMPTY_FORM);

  const handleSubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: 'Missing fields', description: 'First and last name are required.', variant: 'destructive' });
      return;
    }
    if (!form.organization) {
      toast({ title: 'Missing field', description: 'Please select an organization.', variant: 'destructive' });
      return;
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      toast({ title: 'Invalid username', description: 'Username must be at least 3 characters.', variant: 'destructive' });
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast({ title: 'Invalid password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const fullName = [form.last_name, form.first_name, form.middle_name].filter(Boolean).join(', ');

      const { data: personData, error: personError } = await supabase
        .from('people')
        .insert([{
          first_name: form.first_name,
          middle_name: form.middle_name || null,
          last_name: form.last_name,
          suffix: form.suffix || null,
          full_name: fullName,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          organization: form.organization,
          marital_status: form.marital_status || null,
        }])
        .select()
        .single();

      if (personError) throw personError;

      const { error: authError } = await supabase.rpc('create_user_auth', {
        p_person_id: personData.uuid,
        p_email: form.email || null,
        p_username: form.username.trim(),
        p_password: form.password,
      });
      if (authError) throw authError;

      toast({ title: 'Member added', description: `${fullName} has been registered.` });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      const e = error as { message?: string; details?: string; hint?: string };
      const msg = [e?.message, e?.details, e?.hint].filter(Boolean).join(' — ');
      toast({ title: 'Failed to add member', description: msg || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add Member</DialogTitle>
          <DialogDescription>Register a new member on their behalf. Phone and email are optional.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Last Name <span className="text-destructive">*</span></Label>
              <Input value={form.last_name} onChange={set('last_name')} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">First Name <span className="text-destructive">*</span></Label>
              <Input value={form.first_name} onChange={set('first_name')} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Middle Name</Label>
              <Input value={form.middle_name} onChange={set('middle_name')} className="h-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Organization <span className="text-destructive">*</span></Label>
            <Select value={form.organization} onValueChange={v => setForm(p => ({ ...p, organization: v }))}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select organization" /></SelectTrigger>
              <SelectContent>{Object.entries(ORG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="email" value={form.email} onChange={set('email')} className="h-9" placeholder="juan@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 11) setForm(p => ({ ...p, phone: v })); }}
                className="h-9"
                placeholder="09123456789"
                maxLength={11}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input value={form.address} onChange={set('address')} className="h-9" placeholder="123 Main St, Barangay, City" />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Login Credentials</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Username <span className="text-destructive">*</span></Label>
                <Input value={form.username} onChange={set('username')} className="h-9" placeholder="At least 3 characters" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password <span className="text-destructive">*</span></Label>
                <Input type="text" value={form.password} onChange={set('password')} className="h-9" placeholder="At least 6 characters" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? 'Adding…' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
