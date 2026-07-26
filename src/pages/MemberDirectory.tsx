import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Search } from 'lucide-react';
import ChatSupportWidget from '@/components/ChatSupportWidget';

interface Member {
  uuid: string;
  full_name: string;
  organization: string | null;
  gender: string | null;
  created_at: string;
  profile_picture: string | null;
}

const ORG_COLORS: Record<string, string> = {
  CYAF: 'bg-blue-100 text-blue-700 border-blue-200',
  CYF:  'bg-green-100 text-green-700 border-green-200',
  CWA:  'bg-purple-100 text-purple-700 border-purple-200',
  UCM:  'bg-orange-100 text-orange-700 border-orange-200',
  C:    'bg-pink-100 text-pink-700 border-pink-200',
};

const ORG_AVATAR: Record<string, string> = {
  CYAF: 'from-blue-400 to-blue-600',
  CYF:  'from-green-400 to-green-600',
  CWA:  'from-purple-400 to-purple-600',
  UCM:  'from-orange-400 to-orange-600',
  C:    'from-pink-400 to-pink-600',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getProfilePictureUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const ossPath = path.includes(':') ? path.split(':').slice(1).join(':') : path;
  return `https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/${ossPath}`;
}

const ORGS = ['All', 'CYAF', 'CYF', 'CWA', 'UCM', 'C'];

export default function MemberDirectory() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('All');

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('people')
        .select('uuid, full_name, organization, gender, created_at, profile_picture')
        .order('full_name', { ascending: true });
      setMembers((data || []) as Member[]);
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const filtered = members.filter(m => {
    const matchSearch = !search ||
      m.full_name.toLowerCase().includes(search.toLowerCase());
    const matchOrg = orgFilter === 'All' || m.organization === orgFilter;
    return matchSearch && matchOrg;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Member Directory</h1>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12">
        <div className="container mx-auto px-4 text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Our Members</h2>
          <p className="text-muted-foreground">
            {members.length} registered members across all organizations
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORGS.map(o => (
                <SelectItem key={o} value={o}>
                  {o === 'All' ? 'All Organizations' : o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading members…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground font-medium">No members found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(member => {
              const avatarGradient = ORG_AVATAR[member.organization ?? ''] ?? 'from-slate-400 to-slate-600';
              const pictureUrl = getProfilePictureUrl(member.profile_picture);
              return (
                <div
                  key={member.uuid}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-all"
                >
                  {/* Avatar */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center mb-3 overflow-hidden shadow`}>
                    {pictureUrl ? (
                      <img
                        src={pictureUrl}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {getInitials(member.full_name)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                    {member.full_name}
                  </p>

                  {member.organization && (
                    <Badge
                      variant="outline"
                      className={`mt-2 text-xs ${ORG_COLORS[member.organization] ?? ''}`}
                    >
                      {member.organization}
                    </Badge>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {member.gender ?? '—'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ChatSupportWidget />
    </div>
  );
}
