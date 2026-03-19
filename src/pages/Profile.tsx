import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    const metadata = user.user_metadata || {};
    setFullName(String(metadata.full_name || ''));
    setPhone(String(metadata.phone || ''));
    setCompany(String(metadata.company_name || ''));
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const currentMetadata = user.user_metadata || {};
      const { error } = await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          full_name: fullName.trim(),
          phone: phone.trim(),
          company_name: company.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile details have been saved successfully.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update profile.';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'Missing fields', description: 'Please fill both password fields.', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Weak password',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated', description: 'Your login password was updated successfully.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update password.';
      toast({ title: 'Password update failed', description: message, variant: 'destructive' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const initials = (fullName || user?.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Profile</h1>
        <p className="text-muted-foreground">Manage your account identity and security settings.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{fullName || 'Account User'}</CardTitle>
            <CardDescription>{user?.email || 'No email found'}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>These details are stored in your Supabase user profile metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Your company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Security
          </CardTitle>
          <CardDescription>Change your password securely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype password"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleUpdatePassword} disabled={updatingPassword}>
              {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
