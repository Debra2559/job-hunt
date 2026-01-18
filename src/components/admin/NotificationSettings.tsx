import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, X, Save, Bell } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'admin_notification_emails')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const value = data?.value as { emails?: string[] } | null;
      if (value?.emails) {
        setEmails(value.emails);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    
    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }
    
    if (emails.includes(email)) {
      toast.error('该邮箱已添加');
      return;
    }
    
    setEmails([...emails, email]);
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(e => e !== emailToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'admin_notification_emails',
          value: { emails },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;
      toast.success('通知设置已保存');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          通知设置
        </CardTitle>
        <CardDescription>
          配置接收差评反馈通知的管理员邮箱地址
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="输入管理员邮箱地址"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleAddEmail} variant="secondary">
            <Plus className="w-4 h-4 mr-1" />
            添加
          </Button>
        </div>

        {emails.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {emails.map((email) => (
              <Badge key={email} variant="secondary" className="px-3 py-1.5 text-sm">
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                {email}
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="ml-2 hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂未配置通知邮箱</p>
            <p className="text-xs">添加邮箱后，收到差评时将自动发送通知</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
