import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft, Loader2, Plus, Trash2, ShieldCheck, UserCog, Eye, Users,
} from 'lucide-react';

interface AdminRecord {
  id: string;
  username: string;
  role: 'super_admin' | 'editor' | 'viewer';
  created_at: string;
}

interface AdminSession {
  token: string;
  adminId: string;
  role: string;
  expiresAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  editor: 'bg-blue-100 text-blue-700 border-blue-200',
  viewer: 'bg-gray-100 text-gray-700 border-gray-200',
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  super_admin: <ShieldCheck className="w-3.5 h-3.5" />,
  editor: <UserCog className="w-3.5 h-3.5" />,
  viewer: <Eye className="w-3.5 h-3.5" />,
};

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('admin_session');
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    return session.token;
  } catch {
    return null;
  }
}

export default function AdminManagement() {
  const navigate = useNavigate();
  const { isSuperAdmin, adminId, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'viewer' | 'editor'>('viewer');
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'list_admins', token },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAdmins(data.admins || []);
    } catch (error) {
      toast({
        title: 'Failed to load admins',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) {
      navigate('/admin/dashboard');
      return;
    }
    fetchAdmins();
  }, [authLoading, isSuperAdmin, navigate, fetchAdmins]);

  const handleCreateAdmin = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({ title: 'Missing fields', description: 'Username and password are required.', variant: 'destructive' });
      return;
    }
    const token = getToken();
    if (!token) return;

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'create_admin',
          token,
          new_username: newUsername.trim(),
          new_password: newPassword,
          new_role: newRole,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Admin created', description: `${newUsername} was added as ${newRole}.` });
      setShowCreateDialog(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('viewer');
      fetchAdmins();
    } catch (error) {
      toast({
        title: 'Failed to create admin',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return;
    const token = getToken();
    if (!token) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'delete_admin', token, target_admin_id: deleteTarget.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Admin removed', description: `${deleteTarget.username} was deleted.` });
      setDeleteTarget(null);
      fetchAdmins();
    } catch (error) {
      toast({
        title: 'Failed to delete admin',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-none">Manage Admins</h1>
              <p className="text-muted-foreground text-xs mt-0.5">Super admin access only</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Admin
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Admin Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">No admin accounts found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map(admin => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${ROLE_BADGE[admin.role]}`}>
                          {ROLE_ICON[admin.role]}
                          {admin.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(admin.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.role !== 'super_admin' && admin.id !== adminId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(admin)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Admin Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Admin</DialogTitle>
            <DialogDescription>Create a new editor or viewer account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Username</Label>
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as 'viewer' | 'editor')}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateAdmin} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete admin account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.username}'s access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
