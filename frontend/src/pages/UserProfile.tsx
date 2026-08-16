import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '@/hooks/useUserAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, Loader2, Plus, X, Mail, Lock, Camera, Film, MessageSquare } from 'lucide-react';
import { useProfilePictureUpload } from '@/hooks/useProfilePictureUpload';
import GalleryPanel from '@/components/GalleryPanel';
import ChatSupportWidget from '@/components/ChatSupportWidget';

interface Child {
  id: string;
  child_name: string;
  child_birthday: string | null;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { personId, isLoggedIn, loading: authLoading, signOut } = useUserAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    organization: '',
    marital_status: '',
    spouse_name: '',
    date_of_marriage: '',
    occupation: '',
    educational_background: '',
    mother_name: '',
    mother_birthday: '',
    father_name: '',
    father_birthday: '',
    profile_picture: '',
  });
  const [children, setChildren] = useState<Child[]>([]);
  
  // Profile picture upload hook
  const profilePictureUpload = useProfilePictureUpload();
  
  // Email change states
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState<'request' | 'verify'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Username change states
  const [showUsernameChange, setShowUsernameChange] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameChanging, setUsernameChanging] = useState(false);
  const [usernameChanged, setUsernameChanged] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/user/login');
    } else if (isLoggedIn && personId) {
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authLoading, personId, navigate]);

  const fetchProfileData = async () => {
    try {
      const { data: personData, error } = await supabase
        .from('people')
        .select('*')
        .eq('uuid', personId)
        .single();

      if (error) throw error;

      console.log('Loaded profile data:', personData);
      console.log('Profile picture from DB:', personData.profile_picture);

      setFormData({
        first_name: personData.first_name || '',
        middle_name: personData.middle_name || '',
        last_name: personData.last_name || '',
        suffix: personData.suffix || '',
        email: personData.email || '',
        phone: personData.phone || '',
        address: personData.address || '',
        date_of_birth: personData.date_of_birth || '',
        gender: personData.gender || '',
        organization: personData.organization || '',
        marital_status: personData.marital_status || '',
        spouse_name: personData.spouse_name || '',
        date_of_marriage: personData.date_of_marriage || '',
        occupation: personData.occupation || '',
        educational_background: personData.educational_background || '',
        mother_name: personData.mother_name || '',
        mother_birthday: personData.mother_birthday || '',
        father_name: personData.father_name || '',
        father_birthday: personData.father_birthday || '',
        profile_picture: personData.profile_picture || '',
      });

      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('person_id', personId);

      if (childrenData) {
        setChildren(childrenData);
      }

      // Fetch username info
      const { data: authData } = await supabase
        .from('user_auth')
        .select('username, username_changed')
        .eq('person_id', personId)
        .single();

      if (authData) {
        setCurrentUsername(authData.username || '');
        setUsernameChanged(authData.username_changed || false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get the full profile picture URL
  const getProfilePictureUrl = () => {
    // If there's a preview URL (during upload), use it
    if (profilePictureUpload.previewUrl) {
      return profilePictureUpload.previewUrl;
    }

    if (!formData.profile_picture) return null;

    // Already a full URL
    if (formData.profile_picture.startsWith('http://') || formData.profile_picture.startsWith('https://')) {
      return formData.profile_picture;
    }

    // OSS path with bucket prefix e.g. "grazia-prod:resources/..."
    // Strip everything up to and including the first colon
    const ossPath = formData.profile_picture.includes(':')
      ? formData.profile_picture.split(':').slice(1).join(':')
      : formData.profile_picture;

    return `https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/${ossPath}`;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('Saving profile with data:', formData);
      
      const { error } = await supabase
        .from('people')
        .update(formData)
        .eq('uuid', personId);

      if (error) throw error;

      // Update children
      await supabase.from('children').delete().eq('person_id', personId);
      
      const childrenToInsert = children.filter(child => child.child_name.trim() !== '');
      if (childrenToInsert.length > 0) {
        const childrenData = childrenToInsert.map(child => ({
          person_id: personId,
          child_name: child.child_name,
          child_birthday: child.child_birthday || null,
        }));

        await supabase.from('children').insert(childrenData);
      }

      console.log('Profile updated successfully');
      
      toast({
        title: 'Profile Updated',
        description: 'Your information has been saved successfully.',
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const addChild = () => {
    setChildren([...children, { id: crypto.randomUUID(), child_name: '', child_birthday: null }]);
  };

  const removeChild = (index: number) => {
    if (children.length > 0) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index: number, field: 'child_name' | 'child_birthday', value: string) => {
    const newChildren = [...children];
    newChildren[index][field] = value;
    setChildren(newChildren);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-3xl mx-auto my-8 space-y-4">

        {/* ── Top header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground leading-tight">
                {formData.first_name ? `${formData.first_name} ${formData.last_name}` : 'My Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground">Member Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/feed')}>
              <MessageSquare className="w-4 h-4 mr-2" /> Community Feed
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="profile">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1 gap-2">
              <User className="w-4 h-4" /> My Profile
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1 gap-2">
              <Film className="w-4 h-4" /> Media Gallery
            </TabsTrigger>
          </TabsList>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">My Profile</CardTitle>
                <CardDescription>Edit your personal information</CardDescription>
              </CardHeader>
              <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Profile Picture Upload Section */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="text-lg font-semibold mb-3">Profile Picture</h3>
                <div className="flex flex-col items-center gap-4">
                  {/* Display current or uploaded profile picture */}
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {getProfilePictureUrl() ? (
                      <img
                        src={getProfilePictureUrl()!}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>

                  {/* Upload button and info */}
                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="file"
                      id="profile-picture-input"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const resourcePath = await profilePictureUpload.uploadFile(file);
                        if (resourcePath) {
                          // Update local form state
                          setFormData(prev => ({ ...prev, profile_picture: resourcePath }));
                          // Auto-save to database immediately
                          const { error } = await supabase
                            .from('people')
                            .update({ profile_picture: resourcePath })
                            .eq('uuid', personId);
                          if (error) {
                            toast({ title: 'Error', description: 'Profile picture uploaded but failed to save. Please click Save Changes.', variant: 'destructive' });
                          } else {
                            toast({ title: 'Profile picture updated!', description: 'Your new photo has been saved.' });
                          }
                        } else if (profilePictureUpload.error) {
                          toast({ title: 'Error', description: profilePictureUpload.error, variant: 'destructive' });
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('profile-picture-input')?.click()}
                      disabled={profilePictureUpload.isUploading}
                    >
                      {profilePictureUpload.isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {formData.profile_picture ? 'Change Picture' : 'Upload Picture'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Max {profilePictureUpload.config.maxFileSizeMB}MB • {profilePictureUpload.config.allowedExtensions.join(', ').toUpperCase()}
                    </p>
                    {profilePictureUpload.isUploading && (
                      <div className="w-full max-w-xs">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${profilePictureUpload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="text-lg font-semibold mb-3">Name Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={formData.middle_name}
                      onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Select value={formData.suffix} onValueChange={(value) => setFormData({ ...formData, suffix: value })}>
                      <SelectTrigger id="suffix">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jr.">Jr.</SelectItem>
                        <SelectItem value="Sr.">Sr.</SelectItem>
                        <SelectItem value="II">II</SelectItem>
                        <SelectItem value="III">III</SelectItem>
                        <SelectItem value="IV">IV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marital_status">Marital Status *</Label>
                  <Select required value={formData.marital_status} onValueChange={(value) => setFormData({ ...formData, marital_status: value })}>
                    <SelectTrigger id="marital_status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                      <SelectItem value="Separated">Separated</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization *</Label>
                <Select required value={formData.organization} onValueChange={(value) => setFormData({ ...formData, organization: value })}>
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CYAF">CYAF - Christian Young Adult Fellowship</SelectItem>
                    <SelectItem value="CYF">CYF - Christian Youth Fellowship</SelectItem>
                    <SelectItem value="CWA">CWA - Christian Women Association</SelectItem>
                    <SelectItem value="UCM">UCM - United Church Men</SelectItem>
                    <SelectItem value="C">C - Children</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="e.g. Engineer, Teacher, Student"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educational_background">Educational Background</Label>
                  <Input
                    id="educational_background"
                    value={formData.educational_background}
                    onChange={(e) => setFormData({ ...formData, educational_background: e.target.value })}
                    placeholder="e.g. Bachelor's Degree, High School"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="flex-1"
                  />
                  <Dialog open={showEmailChange} onOpenChange={setShowEmailChange}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Change
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Email</DialogTitle>
                        <DialogDescription>
                          {emailChangeStep === 'request' 
                            ? 'Enter your current email to receive a verification code'
                            : 'Enter the verification code and your new email'}
                        </DialogDescription>
                      </DialogHeader>
                      {emailChangeStep === 'request' ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Current Email</Label>
                            <Input value={formData.email} disabled />
                          </div>
                          {verificationCode && (
                            <div className="p-3 bg-orange-100 border border-orange-300 rounded-md">
                              <p className="text-sm font-medium text-orange-900">
                                Development Mode - Your code: <strong>{verificationCode}</strong>
                              </p>
                            </div>
                          )}
                          <Button
                            onClick={async () => {
                              setEmailChanging(true);
                              try {
                                const { data, error } = await supabase.functions.invoke('send-verification-code', {
                                  body: { email: formData.email, type: 'email_change' },
                                });
                                if (error) throw error;
                                if (data?.code) setVerificationCode(data.code);
                                toast({ title: 'Code sent', description: data?.code ? `Code: ${data.code}` : 'Check your email' });
                                setEmailChangeStep('verify');
                              } catch (error) {
                                toast({ title: 'Error', description: 'Failed to send code', variant: 'destructive' });
                              } finally {
                                setEmailChanging(false);
                              }
                            }}
                            disabled={emailChanging}
                            className="w-full"
                          >
                            {emailChanging ? 'Sending...' : 'Send Verification Code'}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Verification Code</Label>
                            <Input
                              value={emailCode}
                              onChange={(e) => setEmailCode(e.target.value)}
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>New Email</Label>
                            <Input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="new@email.com"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEmailChangeStep('request');
                                setEmailCode('');
                                setNewEmail('');
                              }}
                              className="flex-1"
                            >
                              Back
                            </Button>
                            <Button
                              onClick={async () => {
                                setEmailChanging(true);
                                try {
                                  const { data, error } = await supabase.functions.invoke('verify-and-update', {
                                    body: {
                                      email: formData.email,
                                      code: emailCode,
                                      type: 'email_change',
                                      newEmail,
                                    },
                                  });
                                  if (error || data?.error) throw new Error(data?.error || 'Failed to update');
                                  toast({ title: 'Success', description: 'Email updated successfully' });
                                  setFormData({ ...formData, email: newEmail });
                                  setShowEmailChange(false);
                                  setEmailChangeStep('request');
                                  setEmailCode('');
                                  setNewEmail('');
                                } catch (error) {
                                  toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' });
                                } finally {
                                  setEmailChanging(false);
                                }
                              }}
                              disabled={emailChanging || !emailCode || !newEmail}
                              className="flex-1"
                            >
                              {emailChanging ? 'Updating...' : 'Update Email'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (11 digits) *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 11) {
                      setFormData({ ...formData, phone: value });
                    }
                  }}
                  pattern="\d{11}"
                  maxLength={11}
                />
              </div>

              {/* Security Section */}
              <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                <h3 className="text-lg font-semibold">Security</h3>
                
                {/* Current Username Display */}
                <div className="space-y-2">
                  <Label>Current Username</Label>
                  <div className="flex gap-2 items-center">
                    <Input value={currentUsername} disabled className="flex-1" />
                    {!usernameChanged && (
                      <Dialog open={showUsernameChange} onOpenChange={setShowUsernameChange}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <User className="w-4 h-4 mr-2" />
                            Change (One Time Only)
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Username (One Time Only)</DialogTitle>
                            <DialogDescription>
                              You can change your default username once. Choose carefully!
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Current Username</Label>
                              <Input value={currentUsername} disabled />
                            </div>
                            <div className="space-y-2">
                              <Label>New Username</Label>
                              <Input
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                placeholder="Enter new username"
                                maxLength={20}
                              />
                              <p className="text-xs text-muted-foreground">
                                3-20 characters, letters, numbers, and underscores only
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Current Password (for verification)</Label>
                              <Input
                                type="password"
                                value={usernamePassword}
                                onChange={(e) => setUsernamePassword(e.target.value)}
                                placeholder="••••••••"
                              />
                            </div>
                            <Button
                              onClick={async () => {
                                if (!newUsername || newUsername.length < 3) {
                                  toast({ title: 'Error', description: 'Username must be at least 3 characters', variant: 'destructive' });
                                  return;
                                }
                                setUsernameChanging(true);
                                try {
                                  const { data, error } = await supabase.rpc('change_user_username', {
                                    p_person_id: personId,
                                    p_current_password: usernamePassword,
                                    p_new_username: newUsername,
                                  });
                                  
                                  if (error) throw error;
                                  
                                  const result = data?.[0];
                                  if (!result?.success) {
                                    throw new Error(result?.message || 'Failed to change username');
                                  }
                                  
                                  toast({ title: 'Success', description: 'Username changed successfully! Please login with your new username.' });
                                  setCurrentUsername(newUsername);
                                  setUsernameChanged(true);
                                  setShowUsernameChange(false);
                                  setNewUsername('');
                                  setUsernamePassword('');
                                  
                                  // Sign out user so they can login with new username
                                  setTimeout(() => {
                                    signOut();
                                    navigate('/user/login');
                                  }, 2000);
                                } catch (error) {
                                  toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to change username', variant: 'destructive' });
                                } finally {
                                  setUsernameChanging(false);
                                }
                              }}
                              disabled={usernameChanging || !newUsername || !usernamePassword}
                              className="w-full"
                            >
                              {usernameChanging ? 'Changing...' : 'Change Username'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {usernameChanged && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Already changed</span>
                    )}
                  </div>
                </div>

                <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>Enter your current password and new password</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (newPassword !== confirmNewPassword) {
                            toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
                            return;
                          }
                          if (newPassword.length < 6) {
                            toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
                            return;
                          }
                          setPasswordChanging(true);
                          try {
                            // Verify current password by attempting login
                            const { data: authData } = await supabase
                              .from('user_auth')
                              .select('username')
                              .eq('person_id', personId)
                              .single();
                            
                            if (!authData?.username) throw new Error('User not found');
                            
                            const { data: verifyData, error: verifyError } = await supabase.rpc('verify_user_credentials', {
                              p_username: authData.username,
                              p_password: currentPassword,
                            });
                            
                            if (verifyError || !verifyData) throw new Error('Current password is incorrect');
                            
                            // Update password
                            const { error: updateError } = await supabase.rpc('update_user_password', {
                              p_email: formData.email,
                              p_password: newPassword,
                            });
                            
                            if (updateError) throw updateError;
                            
                            toast({ title: 'Success', description: 'Password updated successfully' });
                            setShowPasswordChange(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmNewPassword('');
                          } catch (error) {
                            toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update password', variant: 'destructive' });
                          } finally {
                            setPasswordChanging(false);
                          }
                        }}
                        disabled={passwordChanging || !currentPassword || !newPassword || !confirmNewPassword}
                        className="w-full"
                      >
                        {passwordChanging ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>

              {formData.marital_status === 'Married' && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Spouse Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spouse_name">Spouse Name</Label>
                      <Input
                        id="spouse_name"
                        value={formData.spouse_name}
                        onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_marriage">Date of Marriage</Label>
                      <Input
                        id="date_of_marriage"
                        type="date"
                        value={formData.date_of_marriage}
                        onChange={(e) => setFormData({ ...formData, date_of_marriage: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Parents Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mother_name">Mother's Name</Label>
                    <Input
                      id="mother_name"
                      value={formData.mother_name}
                      onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother_birthday">Mother's Birthday</Label>
                    <Input
                      id="mother_birthday"
                      type="date"
                      value={formData.mother_birthday}
                      onChange={(e) => setFormData({ ...formData, mother_birthday: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father_name">Father's Name</Label>
                    <Input
                      id="father_name"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father_birthday">Father's Birthday</Label>
                    <Input
                      id="father_birthday"
                      type="date"
                      value={formData.father_birthday}
                      onChange={(e) => setFormData({ ...formData, father_birthday: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Children Information</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addChild}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Child
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {children.length > 0 ? children.map((child, index) => (
                    <div key={child.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-lg relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(index)}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="space-y-2">
                        <Label htmlFor={`child_name_${index}`}>Child's Name</Label>
                        <Input
                          id={`child_name_${index}`}
                          value={child.child_name}
                          onChange={(e) => updateChild(index, 'child_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`child_birthday_${index}`}>Child's Birthday</Label>
                        <Input
                          id={`child_birthday_${index}`}
                          type="date"
                          value={child.child_birthday || ''}
                          onChange={(e) => updateChild(index, 'child_birthday', e.target.value)}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-muted-foreground py-4">No children added yet.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Gallery Tab ── */}
      <TabsContent value="gallery">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" /> Media Gallery
            </CardTitle>
            <CardDescription>View and upload photos &amp; videos for the congregation</CardDescription>
          </CardHeader>
          <CardContent>
            <GalleryPanel
              canUpload={true}
              canDelete={false}
              defaultUploaderName={
                formData.first_name
                  ? `${formData.first_name} ${formData.last_name}`.trim()
                  : ''
              }
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

      </div>
      <ChatSupportWidget
        userName={formData.first_name ? `${formData.first_name} ${formData.last_name}`.trim() : undefined}
        personId={personId}
      />
    </div>
  );
}
