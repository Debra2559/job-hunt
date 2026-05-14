import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  password: string;
}

interface Rule {
  label: string;
  test: (p: string) => boolean;
}

const rules: Rule[] = [
  { label: '至少 8 个字符', test: (p) => p.length >= 8 },
  { label: '包含小写字母', test: (p) => /[a-z]/.test(p) },
  { label: '包含大写字母', test: (p) => /[A-Z]/.test(p) },
  { label: '包含数字', test: (p) => /\d/.test(p) },
  { label: '包含特殊符号', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrength({ password }: Props) {
  const { score, passed } = useMemo(() => {
    const passed = rules.map((r) => r.test(password));
    return { score: passed.filter(Boolean).length, passed };
  }, [password]);

  if (!password) return null;

  const levels = [
    { label: '非常弱', color: 'bg-destructive', text: 'text-destructive' },
    { label: '弱', color: 'bg-destructive', text: 'text-destructive' },
    { label: '一般', color: 'bg-amber-500', text: 'text-amber-600' },
    { label: '良好', color: 'bg-amber-500', text: 'text-amber-600' },
    { label: '强', color: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: '非常强', color: 'bg-emerald-500', text: 'text-emerald-600' },
  ];
  const level = levels[score];

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? level.color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">密码强度</span>
        <span className={`font-medium ${level.text}`}>{level.label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs pt-1">
        {rules.map((r, i) => (
          <li
            key={r.label}
            className={`flex items-center gap-1.5 transition-colors ${
              passed[i] ? 'text-emerald-600' : 'text-muted-foreground'
            }`}
          >
            {passed[i] ? (
              <Check className="w-3 h-3 shrink-0" />
            ) : (
              <X className="w-3 h-3 shrink-0 opacity-50" />
            )}
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
