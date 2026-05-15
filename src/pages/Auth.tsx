import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, User, Building, Calendar, IdCard, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';
import { colleges, grades } from '@/data/campusData';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

const emailSchema = z.string().email('请输入有效的邮箱地址');
const passwordSchema = z.string().min(6, '密码至少需要6个字符');

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'account' | 'profile'>('account');
  
  // Account fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [college, setCollege] = useState('');
  const [grade, setGrade] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { signIn, signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in and verified
  useEffect(() => {
    const checkUserStatus = async () => {
      if (authLoading) return; // Wait for auth to initialize
      
      if (user) {
        // Check if user has verified profile
        const { data } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data?.is_verified) {
          navigate('/', { replace: true });
          return;
        }
      }
      setCheckingAuth(false);
    };
    checkUserStatus();
  }, [user, authLoading, navigate]);

  // Show loading while checking auth status
  if (checkingAuth || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const validateAccountInputs = () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return false;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return false;
    }

    return true;
  };

  const validateProfileInputs = () => {
    if (!studentId.trim() || !displayName.trim() || !college || !grade) {
      toast.error('请填写完整信息');
      return false;
    }

    if (!/^\d{8,12}$/.test(studentId.trim())) {
      toast.error('学号格式不正确，请输入8-12位数字');
      return false;
    }

    if (displayName.trim().length < 2 || displayName.trim().length > 20) {
      toast.error('姓名长度应在2-20个字符之间');
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAccountInputs()) return;

    setLoading(true);

    try {
      const { error } = await signIn(email, password, rememberMe);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('邮箱或密码错误');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('登录成功！');
        navigate('/', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAccountInputs()) return;
    
    setStep('profile');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileInputs()) return;

    setLoading(true);

    try {
      // Sign up the user
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName.trim(),
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('该邮箱已被注册');
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      // If sign up successful, create the verified profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            student_id: studentId.trim(),
            display_name: displayName.trim(),
            college,
            grade,
            is_verified: true,
          }, {
            onConflict: 'user_id',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error('创建用户资料失败');
          return;
        }

        toast.success('注册成功！');
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error('Google登录失败: ' + error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Login form
  if (isLogin) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 via-accent/15 to-secondary/10 blur-2xl scale-[1.6]" />
              <img src={aiTeacherAvatar} alt="AI辅导员" className="relative w-full h-full object-cover drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-1">皇家种地大学</h1>
            <p className="text-muted-foreground text-sm">登录以同步你的对话记录</p>
          </div>

          {/* Form Card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-elegant border border-border/60 p-6">
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 h-11"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <GoogleIcon />
              <span className="ml-2">
                {googleLoading ? '正在跳转...' : '使用 Google 账号登录'}
              </span>
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">或使用邮箱</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  邮箱
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="至少6个字符"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showLoginPassword ? '隐藏密码' : '显示密码'}
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  记住登录状态
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setStep('account');
                }}
                className="text-sm text-primary hover:underline"
              >
                没有账号？点击注册
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            登录即表示同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    );
  }

  // Registration flow
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl shadow-lg border border-border/60 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 via-accent/15 to-secondary/10 blur-2xl scale-[1.6]" />
              <img src={aiTeacherAvatar} alt="AI辅导员" className="relative w-full h-full object-cover drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-1">皇家种地大学</h1>
            <p className="text-muted-foreground">
              {step === 'account' ? '创建账号' : '完善学生信息'}
            </p>
            
            {/* Step indicator */}
            <div className="flex justify-center gap-2 mt-4">
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 'account' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 'profile' ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </div>

          {step === 'account' ? (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  邮箱
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  密码
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="至少6个字符，建议混合大小写、数字和符号"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showRegPassword ? '隐藏密码' : '显示密码'}
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl"
              >
                下一步
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-sm text-primary hover:underline"
                >
                  已有账号？点击登录
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
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

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setStep('account')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  上一步
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl gradient-primary text-white font-semibold shadow-glow hover:opacity-90 transition-all"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      注册中...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      完成注册
                    </div>
                  )}
                </Button>
              </div>
            </form>
          )}

          <p className="text-xs text-muted-foreground text-center mt-6">
            注册即表示同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
