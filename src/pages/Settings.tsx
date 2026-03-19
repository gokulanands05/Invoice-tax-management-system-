import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AppPreferences {
  emailNotifications: boolean;
  overdueAlerts: boolean;
  weeklySummary: boolean;
  compactLayout: boolean;
  defaultCurrency: string;
  timezone: string;
}

const defaultPreferences: AppPreferences = {
  emailNotifications: true,
  overdueAlerts: true,
  weeklySummary: false,
  compactLayout: false,
  defaultCurrency: 'INR',
  timezone: 'Asia/Kolkata',
};

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences);

  useEffect(() => {
    if (!user) return;

    const metadata = user.user_metadata || {};
    const stored = metadata.preferences as Partial<AppPreferences> | undefined;
    setPreferences({
      ...defaultPreferences,
      ...(stored || {}),
    });
  }, [user]);

  const updatePreference = <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const currentMetadata = user.user_metadata || {};
      const { error } = await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          preferences,
        },
      });

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your preferences are now synced to your account.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save settings.';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Settings</h1>
        <p className="text-muted-foreground">Control notifications, layout, and workspace preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what kind of reminders you want.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive important account and compliance emails.</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="overdueAlerts">Overdue Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when a bill or compliance item is overdue.</p>
            </div>
            <Switch
              id="overdueAlerts"
              checked={preferences.overdueAlerts}
              onCheckedChange={(checked) => updatePreference('overdueAlerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="weeklySummary">Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">Receive a weekly snapshot of key metrics.</p>
            </div>
            <Switch
              id="weeklySummary"
              checked={preferences.weeklySummary}
              onCheckedChange={(checked) => updatePreference('weeklySummary', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Adjust visual and regional defaults.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select value={preferences.defaultCurrency} onValueChange={(value) => updatePreference('defaultCurrency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={preferences.timezone} onValueChange={(value) => updatePreference('timezone', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">America/New_York</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="compactLayout">Compact Layout</Label>
              <p className="text-sm text-muted-foreground">Use denser table and card spacing.</p>
            </div>
            <Switch
              id="compactLayout"
              checked={preferences.compactLayout}
              onCheckedChange={(checked) => updatePreference('compactLayout', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
