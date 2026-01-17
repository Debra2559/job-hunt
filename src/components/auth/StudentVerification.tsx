import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Building, Calendar, IdCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

interface StudentVerificationProps {
  userId: string;
  onVerified: () => void;
}

const colleges = [
  '农学院',
  '园艺学院',
  '植物保护学院',
  '动物科学学院',
  '动物医学院',
  '食品科学学院',
  '资源与环境学院',
  '工程学院',
  '信息学院',
  '经济管理学院',
  '人文社会学院',
  '理学院',
  '外国语学院',
  '马克思主义学院',
];

const grades = [
  '大一',
  '大二',
  '大三',
  '大四',
  '研一',
  '研二',
  '研三',
  '博一',
  '博二',
  '博三',
  '博四',
];

export function StudentVerification({ userId, onVerified }: StudentVerificationProps) {
  const [studentId, setStudentId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [college, setCollege] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId.trim() || !displayName.trim() || !college || !grade) {
      toast.error('请填写完整信息');
      return;
    }

    // Validate student ID format (8-12 digits)
    if (!/^\d{8,12}$/.test(studentId.trim())) {
      toast.error('学号格式不正确，请输入8-12位数字');
      return;
    }

    // Validate name length
    if (displayName.trim().length < 2 || displayName.trim().length > 20) {
      toast.error('姓名长度应在2-20个字符之间');
      return;
    }

    setLoading(true);

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            student_id: studentId.trim(),
            display_name: displayName.trim(),
            college,
            grade,
            is_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            student_id: studentId.trim(),
            display_name: displayName.trim(),
            college,
            grade,
            is_verified: true,
          });

        if (error) throw error;
      }

      toast.success('学生认证成功！');
      onVerified();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('认证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl shadow-lg border border-border/60 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-primary/20 mx-auto mb-4">
              <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">皇家种地大学</h1>
            <p className="text-muted-foreground">学生身份认证</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="studentId" className="flex items-center gap-2 text-sm font-medium">
                <IdCard className="w-4 h-4 text-muted-foreground" />
                学号
              </Label>
              <Input
                id="studentId"
                type="text"
                placeholder="请输入8-12位学号"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-12 rounded-xl"
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-muted-foreground" />
                姓名
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="请输入真实姓名"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 rounded-xl"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college" className="flex items-center gap-2 text-sm font-medium">
                <Building className="w-4 h-4 text-muted-foreground" />
                学院
              </Label>
              <Select value={college} onValueChange={setCollege}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="请选择所在学院" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {colleges.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                现年级
              </Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="请选择当前年级" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl gradient-primary text-white font-semibold shadow-glow hover:opacity-90 transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  认证中...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  完成认证
                </div>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            认证信息仅用于校园服务，我们将严格保护您的隐私
          </p>
        </div>
      </div>
    </div>
  );
}
