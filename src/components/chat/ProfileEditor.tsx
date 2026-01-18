import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { colleges, grades } from '@/data/campusData';

interface ProfileEditorProps {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  college?: string;
  grade?: string;
  onProfileUpdated: (profile: {
    display_name: string | null;
    avatar_url: string | null;
    college: string | null;
    grade: string | null;
  }) => void;
  children: React.ReactNode;
}

type DuplicateAction = 'replace' | 'keep-both' | 'keep-original' | null;

interface PendingUpload {
  file: File;
  fileName: string;
  existingPath: string;
}

export function ProfileEditor({
  userId,
  displayName,
  avatarUrl,
  college,
  grade,
  onProfileUpdated,
  children,
}: ProfileEditorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    displayName: displayName || '',
    avatarUrl: avatarUrl || '',
    college: college || '',
    grade: grade || '',
  });
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkDuplicateFile = async (fileName: string): Promise<string | null> => {
    // Check if file exists in user's folder
    const { data, error } = await supabase.storage
      .from('avatars')
      .list(userId, { search: fileName });

    if (error) {
      console.error('Error checking for duplicate:', error);
      return null;
    }

    const existing = data?.find((f) => f.name === fileName);
    return existing ? `${userId}/${fileName}` : null;
  };

  const uploadFile = async (file: File, filePath: string, upsert: boolean = false) => {
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Add cache busting parameter
    return `${publicUrl}?t=${Date.now()}`;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const baseFileName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseFileName}.${fileExt}`;

    setUploadingAvatar(true);

    try {
      // Check for duplicate
      const existingPath = await checkDuplicateFile(fileName);

      if (existingPath) {
        // Show duplicate dialog
        setPendingUpload({ file, fileName, existingPath });
        setDuplicateDialogOpen(true);
        setUploadingAvatar(false);
        return;
      }

      // No duplicate, upload directly
      const filePath = `${userId}/${fileName}`;
      const publicUrl = await uploadFile(file, filePath);
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast.success('头像上传成功');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDuplicateAction = async (action: DuplicateAction) => {
    if (!pendingUpload || !action) {
      setDuplicateDialogOpen(false);
      setPendingUpload(null);
      return;
    }

    setDuplicateDialogOpen(false);
    setUploadingAvatar(true);

    try {
      const { file, fileName } = pendingUpload;

      if (action === 'keep-original') {
        // User wants to keep original, do nothing
        toast.info('已取消上传');
      } else if (action === 'replace') {
        // Replace existing file
        const filePath = `${userId}/${fileName}`;
        const publicUrl = await uploadFile(file, filePath, true);
        setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
        toast.success('头像已替换');
      } else if (action === 'keep-both') {
        // Keep both - add timestamp to new file name
        const fileExt = fileName.split('.').pop();
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const newFileName = `${baseName}_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${newFileName}`;
        const publicUrl = await uploadFile(file, filePath);
        setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
        toast.success('头像上传成功（已重命名）');
      }
    } catch (error) {
      console.error('Error handling duplicate:', error);
      toast.error('操作失败');
    } finally {
      setUploadingAvatar(false);
      setPendingUpload(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName || null,
          avatar_url: formData.avatarUrl || null,
          college: formData.college || null,
          grade: formData.grade || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      onProfileUpdated({
        display_name: formData.displayName || null,
        avatar_url: formData.avatarUrl || null,
        college: formData.college || null,
        grade: formData.grade || null,
      });

      toast.success('个人资料已更新');
      setOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFormData({
        displayName: displayName || '',
        avatarUrl: avatarUrl || '',
        college: college || '',
        grade: grade || '',
      });
    }
    setOpen(isOpen);
  };

  const name = formData.displayName || '用户';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑个人资料</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                <AvatarImage src={formData.avatarUrl} alt={name} />
                <AvatarFallback className="gradient-primary text-white text-2xl font-semibold">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">点击头像更换（最大 2MB）</p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">昵称</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="输入您的昵称"
            />
          </div>

          {/* College */}
          <div className="space-y-2">
            <Label htmlFor="college">学院</Label>
            <Select
              value={formData.college}
              onValueChange={(value) => setFormData(prev => ({ ...prev, college: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择学院" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <Label htmlFor="grade">年级</Label>
            <Select
              value={formData.grade}
              onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择年级" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Duplicate File Dialog */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>文件已存在</AlertDialogTitle>
            <AlertDialogDescription>
              已存在同名文件 "{pendingUpload?.fileName}"，请选择处理方式：
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => handleDuplicateAction('keep-original')}>
              保留原文件
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDuplicateAction('keep-both')}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              全部保留
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleDuplicateAction('replace')}>
              替换
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
