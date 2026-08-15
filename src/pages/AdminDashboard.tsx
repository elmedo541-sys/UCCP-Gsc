import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AdminSupportPanel from '@/components/AdminSupportPanel';
import AdminAddMemberDialog from '@/components/AdminAddMemberDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LogOut, Loader2, Eye, X, Edit, Save, FileDown, Key, UserPlus,
  Users, Image, Search, Calendar, UserCheck, TrendingUp,
  ShieldCheck, Cake, ChevronRight, LayoutDashboard, Heart, Film, Clock, Activity,
  Settings, Sun, Moon,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Person {
  full_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  organization: string | null;
  marital_status: string | null;
  spouse_name: string | null;
  date_of_marriage: string | null;
  occupation: string | null;
  educational_background: string | null;
  mother_name: string | null;
  mother_birthday: string | null;
  father_name: string | null;
  father_birthday: string | null;
  created_at: string;
  uuid?: string;
}

interface Child {
  id: string;
  person_id: string;
  child_name: string;
  child_birthday: string | null;
}

// ─── Color palettes ───────────────────────────────────────────────────────────
const ORG_COLORS: Record<string, string> = {
  CYAF: '#3B82F6', CYF: '#22C55E', CWA: '#A855F7', UCM: '#F97316', C: '#EC4899',
};
const GENDER_COLORS = ['#3B82F6', '#EC4899', '#94A3B8'];
const MARITAL_COLORS: Record<string, string> = {
  Single: '#6366F1', Married: '#22C55E', Widowed: '#94A3B8',
  Separated: '#F59E0B', Divorced: '#EF4444',
};
const MONTH_COLORS = [
  '#F43F5E','#F97316','#EAB308','#22C55E','#14B8A6',
  '#3B82F6','#6366F1','#A855F7','#EC4899','#0EA5E9','#10B981','#F59E0B',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const ORG_BADGE: Record<string, string> = {
  CYAF: 'bg-blue-100 text-blue-700 border-blue-200',
  CYF:  'bg-green-100 text-green-700 border-green-200',
  CWA:  'bg-purple-100 text-purple-700 border-purple-200',
  UCM:  'bg-orange-100 text-orange-700 border-orange-200',
  C:    'bg-pink-100 text-pink-700 border-pink-200',
};

const AVATAR_BG: Record<string, string> = {
  CYAF: 'bg-blue-500', CYF: 'bg-green-500',
  CWA:  'bg-purple-500', UCM: 'bg-orange-500', C: 'bg-pink-500',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color, active, onClick,
}: {
  label: string; value: number; icon: React.ReactNode;
  color: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 group focus:outline-none
        ${active
          ? `${color} shadow-lg scale-[1.02] border-transparent`
          : 'bg-card border-border hover:shadow-md hover:scale-[1.01]'
        }`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : color}`}>
          <span className={active ? 'text-white' : 'text-white'}>{icon}</span>
        </div>
        <ChevronRight className={`w-4 h-4 transition-opacity ${active ? 'opacity-60 text-white' : 'opacity-0 group-hover:opacity-40'}`} />
      </div>
      <div className={`mt-3 text-3xl font-bold tabular-nums ${active ? 'text-white' : 'text-foreground'}`}>{value}</div>
      <div className={`text-xs font-medium mt-0.5 ${active ? 'text-white/75' : 'text-muted-foreground'}`}>{label}</div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, isEditor, canRegisterMembers, role, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [showAddMember, setShowAddMember] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [allUpcomingBirthdays, setAllUpcomingBirthdays] = useState<{ person_name: string; days_until: number; birthday_date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedPersonAuth, setSelectedPersonAuth] = useState<{username: string; password: string} | null>(null);
  const [selectedPersonChildren, setSelectedPersonChildren] = useState<Child[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Person>>({});
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEventsTab, setActiveEventsTab] = useState<'birthdays' | 'anniversaries'>('birthdays');
  const [eventsRange, setEventsRange] = useState<7 | 14 | 30>(7);
  const [activityLogs, setActivityLogs] = useState<{ id: string; full_name: string | null; username: string | null; action: string; created_at: string }[]>([]);

  // Password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const maleCount     = people.filter(p => p.gender?.toLowerCase() === 'male').length;
  const femaleCount   = people.filter(p => p.gender?.toLowerCase() === 'female').length;
  const singleCount   = people.filter(p => p.marital_status === 'Single').length;
  const marriedCount  = people.filter(p => p.marital_status === 'Married').length;
  const widowedCount  = people.filter(p => p.marital_status === 'Widowed').length;
  const separatedCount= people.filter(p => p.marital_status === 'Separated').length;
  const divorcedCount = people.filter(p => p.marital_status === 'Divorced').length;
  const cyafCount = people.filter(p => p.organization === 'CYAF').length;
  const cyfCount  = people.filter(p => p.organization === 'CYF').length;
  const cwaCount  = people.filter(p => p.organization === 'CWA').length;
  const ucmCount  = people.filter(p => p.organization === 'UCM').length;
  const cCount    = people.filter(p => p.organization === 'C').length;

  const filteredPeople = (organizationFilter ? people.filter(p => p.organization === organizationFilter) : people)
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  const upcomingAnniversaries = people
    .filter(p => p.date_of_marriage)
    .map(p => {
      const dom = p.date_of_marriage!;
      const d = new Date(dom);
      const today = new Date();
      const yearsMarried = today.getFullYear() - d.getFullYear();
      return {
        person_name: p.full_name,
        spouse_name: p.spouse_name,
        days_until: daysUntil(dom),
        anniversary_date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        years: yearsMarried,
      };
    })
    .filter(a => a.days_until <= 30)
    .sort((a, b) => a.days_until - b.days_until);

  // Filtered by selected range
  const upcomingBirthdays = allUpcomingBirthdays.filter(b => b.days_until <= eventsRange);
  const filteredAnniversaries = upcomingAnniversaries.filter(a => a.days_until <= eventsRange);

  // ── Chart data ────────────────────────────────────────────────────────────
  const organizationData = [
    { name: 'CYAF', value: cyafCount }, { name: 'CYF', value: cyfCount },
    { name: 'CWA', value: cwaCount },  { name: 'UCM', value: ucmCount },
    { name: 'Children', value: cCount },
  ].filter(i => i.value > 0);

  const maritalStatusData = [
    { name: 'Single', value: singleCount }, { name: 'Married', value: marriedCount },
    { name: 'Widowed', value: widowedCount }, { name: 'Separated', value: separatedCount },
    { name: 'Divorced', value: divorcedCount },
  ].filter(i => i.value > 0);

  const genderData = [{ name: 'Male', value: maleCount }, { name: 'Female', value: femaleCount }];

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyCounts = Array(12).fill(0);
  people.forEach(p => { if (p.date_of_birth) monthlyCounts[new Date(p.date_of_birth).getMonth()]++; });
  const birthdayByMonthData = months.map((m, i) => ({ month: m, count: monthlyCounts[i] }));

  // Registration trend — last 12 months
  const registrationTrendData = (() => {
    const result = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const count = people.filter(p => {
        if (!p.created_at) return false;
        const r = new Date(p.created_at);
        return r.getFullYear() === d.getFullYear() && r.getMonth() === d.getMonth();
      }).length;
      result.push({ month: label, count });
    }
    return result;
  })();

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin/login');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) { fetchPeople(); fetchUpcomingBirthdays(); fetchActivityLogs(); }
  }, [isAdmin]);

  const fetchPeople = async () => {
    const { data } = await supabase.from('people').select('*');
    setPeople((data || []) as Person[]);
    setLoading(false);
  };

  const fetchActivityLogs = async () => {
    const { data } = await supabase
      .from('user_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setActivityLogs(data || []);
  };

  // Helper: get admin session token from localStorage
  const getAdminToken = (): string => {
    try {
      const s = localStorage.getItem('admin_session');
      return s ? JSON.parse(s).token : '';
    } catch { return ''; }
  };

  const fetchUpcomingBirthdays = async () => {
    const { data } = await supabase.rpc('get_upcoming_birthdays');
    const next30 = (data || [])
      .filter((b: { days_until: number }) => b.days_until <= 30)
      .sort((a: { days_until: number }, b: { days_until: number }) => a.days_until - b.days_until);
    setAllUpcomingBirthdays(next30);
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Send password reset to ${email}?`)) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Reset email sent" });
  };

  const handleDeleteUser = async (uuid: string | undefined) => {
    if (!uuid || !confirm("Delete this member? This cannot be undone.")) return;
    const token = getAdminToken();
    const { error } = await supabase.rpc('admin_delete_member', {
      p_member_uuid: uuid,
      p_admin_token: token,
    });
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    fetchPeople(); fetchUpcomingBirthdays();
    if (selectedPerson?.uuid === uuid) closePersonDialog();
    toast({ title: "Member deleted" });
  };

  const handleViewPerson = async (person: Person) => {
    setSelectedPerson(person); setEditFormData(person); setIsEditing(false);
    const { data: childrenData } = await supabase.from('children').select('*').eq('person_id', person.uuid);
    setSelectedPersonChildren((childrenData || []) as Child[]);
    // Only super_admin can view login credentials
    if (isSuperAdmin) {
      try {
        const token = getAdminToken();
        const { data, error } = await supabase.rpc('get_member_credentials', {
          p_person_id: person.uuid,
          p_admin_token: token,
        });
        if (!error && data && data.length > 0) {
          setSelectedPersonAuth({ username: data[0].username || 'N/A', password: data[0].password_display || 'N/A' });
        } else {
          setSelectedPersonAuth(null);
        }
      } catch { setSelectedPersonAuth(null); }
    } else {
      setSelectedPersonAuth(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPerson) return;
    try {
      const token = getAdminToken();
      const { error } = await supabase.rpc('admin_update_member', {
        p_member_uuid: selectedPerson.uuid,
        p_updates: editFormData,
        p_admin_token: token,
      });
      if (error) throw error;
      toast({ title: 'Updated successfully' });
      setIsEditing(false);
      fetchPeople();
      setSelectedPerson({ ...selectedPerson, ...editFormData } as Person);
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const closePersonDialog = () => {
    setSelectedPerson(null); setSelectedPersonAuth(null);
    setSelectedPersonChildren([]); setIsEditing(false); setEditFormData({});
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match', variant: 'destructive' }); return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Too Short', description: 'Min 6 characters', variant: 'destructive' }); return;
    }
    setChangingPassword(true);
    try {
      const session = localStorage.getItem('admin_session');
      const adminId = session ? JSON.parse(session).admin_id : null;
      const { data, error } = await supabase.rpc('change_admin_password', { p_admin_id: adminId, p_old_password: oldPassword, p_new_password: newPassword });
      if (error) throw error;
      const result = data?.[0];
      if (result?.success) {
        toast({ title: 'Password Changed' });
        setShowPasswordDialog(false); setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        toast({ title: 'Failed', description: result?.message || 'Failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally { setChangingPassword(false); }
  };

  const handleExportToExcel = () => {
    try {
      const headers = ['Last Name','First Name','Middle Name','Suffix','Email','Phone','Address','Date of Birth','Age','Gender','Marital Status','Organization','Occupation','Educational Background','Spouse Name','Date of Marriage','Mother Name','Mother Birthday','Father Name','Father Birthday','Registered Date'];
      const rows = filteredPeople.map(p => [
        p.last_name||'', p.first_name||'', p.middle_name||'', p.suffix||'',
        p.email||'', p.phone||'', p.address||'', p.date_of_birth||'',
        calculateAge(p.date_of_birth)?.toString()||'', p.gender||'',
        p.marital_status||'', p.organization||'', p.occupation||'',
        p.educational_background||'', p.spouse_name||'', p.date_of_marriage||'',
        p.mother_name||'', p.mother_birthday||'', p.father_name||'', p.father_birthday||'',
        p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
      ]);
      const esc = (f: string) => (f.includes(',') || f.includes('"') || f.includes('\n')) ? `"${f.replace(/"/g,'""')}"` : f;
      const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `members-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast({ title: 'Export successful', description: `${filteredPeople.length} records exported` });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'editor' ? 'Editor' : 'Viewer';

  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── Top Navigation Bar ── */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm">UCCP-GSC</span>
              <span className="hidden sm:inline text-muted-foreground text-sm ml-1">Admin Portal</span>
            </div>
          </div>

          {/* Role badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{roleLabel}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuItem onClick={toggleTheme} className="gap-2 cursor-pointer">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Admin</DropdownMenuLabel>
                {isSuperAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin/manage-admins')} className="gap-2 cursor-pointer">
                    <Users className="w-4 h-4" /> Manage Admins
                  </DropdownMenuItem>
                )}
                {isSuperAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin/homepage-images')} className="gap-2 cursor-pointer">
                    <Image className="w-4 h-4" /> Homepage Images
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/gallery')} className="gap-2 cursor-pointer">
                  <Film className="w-4 h-4" /> Gallery
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/events')} className="gap-2 cursor-pointer">
                  <Calendar className="w-4 h-4" /> Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowPasswordDialog(true)} className="gap-2 cursor-pointer">
                  <Key className="w-4 h-4" /> Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

        {/* ── Page title ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs px-3 py-1 hidden sm:flex">
            {people.length} total members
          </Badge>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="All Members" value={people.length}
            icon={<Users className="w-5 h-5" />} color="bg-primary"
            active={organizationFilter === null}
            onClick={() => setOrganizationFilter(null)}
          />
          <StatCard
            label="CYAF" value={cyafCount}
            icon={<UserCheck className="w-5 h-5" />} color="bg-blue-500"
            active={organizationFilter === 'CYAF'}
            onClick={() => setOrganizationFilter('CYAF')}
          />
          <StatCard
            label="CYF" value={cyfCount}
            icon={<UserCheck className="w-5 h-5" />} color="bg-green-500"
            active={organizationFilter === 'CYF'}
            onClick={() => setOrganizationFilter('CYF')}
          />
          <StatCard
            label="CWA" value={cwaCount}
            icon={<UserCheck className="w-5 h-5" />} color="bg-purple-500"
            active={organizationFilter === 'CWA'}
            onClick={() => setOrganizationFilter('CWA')}
          />
          <StatCard
            label="UCM" value={ucmCount}
            icon={<UserCheck className="w-5 h-5" />} color="bg-orange-500"
            active={organizationFilter === 'UCM'}
            onClick={() => setOrganizationFilter('UCM')}
          />
          <StatCard
            label="Children" value={cCount}
            icon={<UserCheck className="w-5 h-5" />} color="bg-pink-500"
            active={organizationFilter === 'C'}
            onClick={() => setOrganizationFilter('C')}
          />
        </div>

        {/* ── Charts + Upcoming Birthdays ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Charts 2×2 */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {/* Org chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={organizationData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {organizationData.map(e => <Cell key={e.name} fill={ORG_COLORS[e.name] ?? '#6366F1'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gender pie */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4" /> Gender
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="45%"
                      outerRadius={65} innerRadius={30} paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Marital status */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> Marital Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={maritalStatusData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={50} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {maritalStatusData.map(e => <Cell key={e.name} fill={MARITAL_COLORS[e.name] ?? '#6366F1'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Birthdays by month */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Birthdays / Month
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={birthdayByMonthData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {birthdayByMonthData.map((_, i) => <Cell key={i} fill={MONTH_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Registration Trend */}
            <Card className="shadow-sm sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Member Registration Trend (Last 12 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={registrationTrendData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" name="New Members" radius={[5, 5, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── Events Panel (Birthdays + Anniversaries) ── */}
          <Card className="shadow-sm flex flex-col">
            {/* Tab header */}
            <CardHeader className="pb-0 space-y-3">
              <div className="flex rounded-xl bg-muted p-1 gap-1">
                <button
                  onClick={() => setActiveEventsTab('birthdays')}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-all ${
                    activeEventsTab === 'birthdays'
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Cake className="w-3.5 h-3.5 text-pink-500" />
                  Birthdays
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                    {upcomingBirthdays.length}
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveEventsTab('anniversaries')}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-all ${
                    activeEventsTab === 'anniversaries'
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Anniversaries
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                    {filteredAnniversaries.length}
                  </Badge>
                </button>
              </div>

              {/* Range selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mr-1">Show:</span>
                {([7, 14, 30] as const).map(days => (
                  <button
                    key={days}
                    onClick={() => setEventsRange(days)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border
                      ${eventsRange === days
                        ? activeEventsTab === 'birthdays'
                          ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                          : 'bg-rose-500 border-rose-500 text-white shadow-sm'
                        : 'bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                      }`}
                  >
                    {days === 30 ? '1 Month' : `${days} Days`}
                  </button>
                ))}
              </div>
            </CardHeader>

            {/* Birthdays list */}
            {activeEventsTab === 'birthdays' && (
              <CardContent className="flex-1 overflow-y-auto max-h-72 pt-3">
                {upcomingBirthdays.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <Cake className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No birthdays in the next {eventsRange === 30 ? 'month' : `${eventsRange} days`}
                  </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingBirthdays.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                          <Cake className="w-4 h-4 text-pink-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{b.person_name}</p>
                          <p className="text-xs text-muted-foreground">{b.birthday_date}</p>
                        </div>
                        <Badge variant={b.days_until === 0 ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                          {b.days_until === 0 ? 'Today' : `${b.days_until}d`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}

            {/* Anniversaries list */}
            {activeEventsTab === 'anniversaries' && (
              <CardContent className="flex-1 overflow-y-auto max-h-72 pt-3">
                {filteredAnniversaries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <Heart className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No anniversaries in the next {eventsRange === 30 ? 'month' : `${eventsRange} days`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAnniversaries.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{a.person_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.spouse_name ? `& ${a.spouse_name} · ` : ''}{a.anniversary_date} · {a.years}yr
                          </p>
                        </div>
                        <Badge
                          variant={a.days_until === 0 ? 'default' : 'secondary'}
                          className={`text-xs flex-shrink-0 ${a.days_until === 0 ? '' : 'text-rose-600'}`}
                        >
                          {a.days_until === 0 ? 'Today' : `${a.days_until}d`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* ── Member Table ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  Members
                  {organizationFilter && (
                    <Badge variant="secondary" className="font-normal text-xs">
                      {organizationFilter === 'C' ? 'Children' : organizationFilter}
                      <button onClick={() => setOrganizationFilter(null)} className="ml-1.5 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredPeople.length} records</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search name or email…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-56 h-9 text-sm"
                  />
                </div>
                {(isSuperAdmin || canRegisterMembers) && (
                  <Button onClick={() => setShowAddMember(true)} size="sm" className="gap-1.5 h-9">
                    <UserPlus className="w-4 h-4" /> Add Member
                  </Button>
                )}
                {(isSuperAdmin || isEditor) && (
                  <Button onClick={handleExportToExcel} variant="outline" size="sm" className="gap-1.5 h-9">
                    <FileDown className="w-4 h-4" /> Export
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-xs uppercase tracking-wide pl-6">Member</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Org</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Age</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Gender</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Marital</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Email</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople.map(p => (
                    <TableRow key={p.uuid} className="hover:bg-muted/30 transition-colors group">
                      {/* Name + avatar */}
                      <TableCell className="pl-6 py-3">
                        <button
                          onClick={() => handleViewPerson(p)}
                          className="flex items-center gap-3 text-left group/name"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${AVATAR_BG[p.organization ?? ''] ?? 'bg-slate-400'}`}>
                            {getInitials(p.full_name || '??')}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground group-hover/name:text-primary transition-colors">
                              {p.full_name}
                            </p>
                          </div>
                        </button>
                      </TableCell>

                      {/* Org badge */}
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${ORG_BADGE[p.organization ?? ''] ?? 'bg-muted text-muted-foreground border-border'}`}>
                          {p.organization === 'C' ? 'Children' : p.organization || 'N/A'}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm tabular-nums">
                        {calculateAge(p.date_of_birth) ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>

                      <TableCell className="text-sm capitalize text-muted-foreground">{p.gender || '—'}</TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">{p.marital_status || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{p.email}</TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleViewPerson(p)}
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                          {(isSuperAdmin || isEditor) && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleResetPassword(p.email)} className="h-7 px-2 text-xs">
                                Reset
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(p.uuid)} className="h-7 px-2 text-xs">
                                Delete
                              </Button>
                            </>
                          )}
                          {!(isSuperAdmin || isEditor) && (
                            <span className="text-xs text-muted-foreground px-2">View only</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPeople.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                        <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                        No members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </main>

      {/* ── User Activity Log Section ── */}
      <section className="max-w-screen-xl mx-auto px-6 pb-10">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">User Login Activity</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Track when members log in to the system</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchActivityLogs} className="gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="pl-6">Member Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      <Activity className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      No login activity recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  activityLogs.map(log => {
                    const dt = new Date(log.created_at);
                    const dateStr = dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
                    const timeStr = dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 text-xs font-bold">
                              {(log.full_name || log.username || '?')[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{log.full_name || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground font-mono">{log.username || '—'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize bg-green-50 text-green-700 border-green-200">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{dateStr}</span>
                            <span className="text-muted-foreground/50">·</span>
                            <span>{timeStr}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Support Messages (Super Admin only) ── */}
      {isSuperAdmin && (
        <section className="max-w-screen-xl mx-auto px-6 pb-10">
          <AdminSupportPanel />
        </section>
      )}

      {/* ── Person Detail Dialog ── */}
      <Dialog open={!!selectedPerson} onOpenChange={open => !open && closePersonDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${AVATAR_BG[selectedPerson?.organization ?? ''] ?? 'bg-slate-400'}`}>
                {selectedPerson ? getInitials(selectedPerson.full_name || '??') : ''}
              </div>
              <div>
                <DialogTitle className="text-xl">{selectedPerson?.full_name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ORG_BADGE[selectedPerson?.organization ?? ''] ?? ''}`}>
                    {selectedPerson?.organization === 'C' ? 'Children' : selectedPerson?.organization}
                  </span>
                  <span>•</span>
                  <span>Registered {selectedPerson ? formatDate(selectedPerson.created_at) : ''}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedPerson && (
            <div className="space-y-5 mt-2">
              {/* Credentials */}
              {selectedPersonAuth && isSuperAdmin && (
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                      <Key className="w-4 h-4" /> Login Credentials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    {[['Username', selectedPersonAuth.username], ['Password', selectedPersonAuth.password]].map(([label, val]) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 w-20">{label}:</span>
                        <code className="flex-1 text-sm bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded font-mono">{val}</code>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Personal Info */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Personal Information</CardTitle>
                  {!isEditing && (isSuperAdmin || isEditor) ? (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-7 gap-1">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Button>
                  ) : isEditing ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} className="h-7 gap-1">
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditFormData(selectedPerson); }} className="h-7">
                        Cancel
                      </Button>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {!isEditing ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                      {[
                        ['Full Name', selectedPerson.full_name],
                        ['Email', selectedPerson.email],
                        ['Phone', selectedPerson.phone || '—'],
                        ['Birthday', formatDate(selectedPerson.date_of_birth)],
                        ['Age', calculateAge(selectedPerson.date_of_birth)?.toString() || '—'],
                        ['Gender', selectedPerson.gender || '—'],
                        ['Marital Status', selectedPerson.marital_status || '—'],
                        ['Organization', selectedPerson.organization || '—'],
                        ['Occupation', selectedPerson.occupation || '—'],
                        ['Education', selectedPerson.educational_background || '—'],
                        ['Address', selectedPerson.address || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <span className="text-sm font-medium text-foreground">{val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[['First Name','first_name'],['Middle Name','middle_name'],['Last Name','last_name']].map(([l, k]) => (
                          <div key={k}>
                            <Label className="text-xs">{l}</Label>
                            <Input value={(editFormData as Record<string, string>)[k] || ''} onChange={e => setEditFormData({...editFormData, [k]: e.target.value})} className="h-8 text-sm" />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Email</Label><Input type="email" value={editFormData.email||''} onChange={e=>setEditFormData({...editFormData,email:e.target.value})} className="h-8 text-sm" /></div>
                        <div><Label className="text-xs">Phone</Label><Input value={editFormData.phone||''} onChange={e=>setEditFormData({...editFormData,phone:e.target.value})} className="h-8 text-sm" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={editFormData.date_of_birth||''} onChange={e=>setEditFormData({...editFormData,date_of_birth:e.target.value})} className="h-8 text-sm" /></div>
                        <div>
                          <Label className="text-xs">Gender</Label>
                          <Select value={editFormData.gender||''} onValueChange={v=>setEditFormData({...editFormData,gender:v})}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Marital Status</Label>
                          <Select value={editFormData.marital_status||''} onValueChange={v=>setEditFormData({...editFormData,marital_status:v})}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="Married">Married</SelectItem>
                              <SelectItem value="Widowed">Widowed</SelectItem>
                              <SelectItem value="Separated">Separated</SelectItem>
                              <SelectItem value="Divorced">Divorced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Organization</Label>
                          <Select value={editFormData.organization||''} onValueChange={v=>setEditFormData({...editFormData,organization:v})}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CYAF">CYAF</SelectItem>
                              <SelectItem value="CYF">CYF</SelectItem>
                              <SelectItem value="CWA">CWA</SelectItem>
                              <SelectItem value="UCM">UCM</SelectItem>
                              <SelectItem value="C">Children</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Occupation</Label><Input value={editFormData.occupation||''} onChange={e=>setEditFormData({...editFormData,occupation:e.target.value})} className="h-8 text-sm" /></div>
                        <div><Label className="text-xs">Education</Label><Input value={editFormData.educational_background||''} onChange={e=>setEditFormData({...editFormData,educational_background:e.target.value})} className="h-8 text-sm" /></div>
                      </div>
                      <div><Label className="text-xs">Address</Label><Textarea value={editFormData.address||''} onChange={e=>setEditFormData({...editFormData,address:e.target.value})} rows={2} className="text-sm" /></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Spouse */}
              {(selectedPerson.spouse_name || selectedPerson.marital_status === 'Married') && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Spouse</CardTitle></CardHeader>
                  <CardContent>
                    {!isEditing ? (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div><span className="text-xs text-muted-foreground">Name</span><p className="text-sm font-medium">{selectedPerson.spouse_name || '—'}</p></div>
                        <div><span className="text-xs text-muted-foreground">Date of Marriage</span><p className="text-sm font-medium">{formatDate(selectedPerson.date_of_marriage)}</p></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Spouse Name</Label><Input value={editFormData.spouse_name||''} onChange={e=>setEditFormData({...editFormData,spouse_name:e.target.value})} className="h-8 text-sm" /></div>
                        <div><Label className="text-xs">Date of Marriage</Label><Input type="date" value={editFormData.date_of_marriage||''} onChange={e=>setEditFormData({...editFormData,date_of_marriage:e.target.value})} className="h-8 text-sm" /></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Parents */}
              {(selectedPerson.mother_name || selectedPerson.father_name) && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Parents</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {selectedPerson.mother_name && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Mother</p>
                          <p className="text-sm font-medium">{selectedPerson.mother_name}</p>
                          {selectedPerson.mother_birthday && <p className="text-xs text-muted-foreground mt-0.5">{formatDate(selectedPerson.mother_birthday)}</p>}
                        </div>
                      )}
                      {selectedPerson.father_name && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Father</p>
                          <p className="text-sm font-medium">{selectedPerson.father_name}</p>
                          {selectedPerson.father_birthday && <p className="text-xs text-muted-foreground mt-0.5">{formatDate(selectedPerson.father_birthday)}</p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Children */}
              {selectedPersonChildren.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Children ({selectedPersonChildren.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedPersonChildren.map((child, idx) => (
                        <div key={child.id} className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-0.5">Child {idx + 1}</p>
                          <p className="text-sm font-medium">{child.child_name}</p>
                          {child.child_birthday && <p className="text-xs text-muted-foreground mt-0.5">{formatDate(child.child_birthday)}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={closePersonDialog} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-1.5" /> Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Change Password Dialog ── */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="w-4 h-4" /> Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { id: 'old', label: 'Current Password', val: oldPassword, set: setOldPassword },
              { id: 'new', label: 'New Password', val: newPassword, set: setNewPassword },
              { id: 'confirm', label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword },
            ].map(f => (
              <div key={f.id} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input type="password" value={f.val} onChange={e => f.set(e.target.value)} className="h-9" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowPasswordDialog(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }} disabled={changingPassword}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleChangePassword} disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}>
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminAddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onCreated={fetchPeople}
      />

    </div>
  );
}