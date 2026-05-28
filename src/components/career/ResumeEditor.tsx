import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ResumeData, ResumeItem, ResumeEducation } from '@/lib/resumeTypes';

type Props = { data: ResumeData; onChange: (next: ResumeData) => void };

const Card = ({ title, onAdd, children }: { title: string; onAdd?: () => void; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur p-3 sm:p-4 shadow-sm mb-3">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-bold">{title}</h3>
      {onAdd && (
        <button onClick={onAdd} className="text-[11px] text-sky-600 font-semibold inline-flex items-center gap-0.5 hover:text-sky-700">
          <Plus className="w-3 h-3" /> 添加
        </button>
      )}
    </div>
    {children}
  </div>
);

const TextField = ({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <label className="block">
    <span className="block text-[11px] text-muted-foreground mb-0.5">{label}</span>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-8 text-sm bg-white/70" />
  </label>
);

export default function ResumeEditor({ data, onChange }: Props) {
  const setBasic = (k: keyof ResumeData['basic'], v: string) =>
    onChange({ ...data, basic: { ...data.basic, [k]: v } });

  const updateItem = <K extends 'experience' | 'projects' | 'campus' | 'education'>(
    key: K, idx: number, patch: Partial<ResumeData[K][number]>,
  ) => {
    const list = [...data[key]] as ResumeData[K];
    // deno-lint-ignore no-explicit-any
    list[idx] = { ...(list[idx] as any), ...(patch as any) };
    onChange({ ...data, [key]: list } as ResumeData);
  };
  const removeAt = (key: 'experience' | 'projects' | 'campus' | 'education', idx: number) => {
    const list = [...data[key]];
    list.splice(idx, 1);
    onChange({ ...data, [key]: list } as ResumeData);
  };

  const newItem = (): ResumeItem => ({ title: '', role: '', period: '', bullets: [''] });
  const newEdu = (): ResumeEducation => ({ school: '', period: '', degree: '', gpa: '', extra: '' });

  const renderItemList = (
    key: 'experience' | 'projects' | 'campus',
    titleLabel: string,
  ) => (
    <Card
      title={
        key === 'experience' ? '💼 实习 / 工作' : key === 'projects' ? '🚀 项目经历' : '🎓 校园经历'
      }
      onAdd={() => onChange({ ...data, [key]: [...data[key], newItem()] } as ResumeData)}
    >
      {data[key].length === 0 && (
        <p className="text-xs text-muted-foreground py-2">暂无，点右上「添加」一条</p>
      )}
      <div className="space-y-3">
        {data[key].map((it, idx) => (
          <div key={idx} className="rounded-xl border border-sky-100 bg-sky-50/40 p-2.5">
            <div className="flex items-center gap-1 mb-1.5">
              <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground flex-1">#{idx + 1}</span>
              <button onClick={() => removeAt(key, idx)} className="text-[11px] text-rose-500 hover:text-rose-600 inline-flex items-center gap-0.5">
                <Trash2 className="w-3 h-3" /> 删除
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <TextField label={titleLabel} value={it.title} onChange={(v) => updateItem(key, idx, { title: v })} />
              <TextField label="职位 / 身份" value={it.role} onChange={(v) => updateItem(key, idx, { role: v })} />
              <TextField label="时间" value={it.period} onChange={(v) => updateItem(key, idx, { period: v })} placeholder="2024.06 - 2024.09" />
            </div>
            <div className="space-y-1.5">
              {it.bullets.map((b, bi) => (
                <div key={bi} className="flex items-start gap-1.5">
                  <span className="text-sky-500 mt-2">•</span>
                  <Textarea
                    rows={2}
                    value={b}
                    onChange={(e) => {
                      const bs = [...it.bullets]; bs[bi] = e.target.value;
                      updateItem(key, idx, { bullets: bs });
                    }}
                    placeholder="动词开头 + 量化结果，例如：主导用户增长项目，3 周提升新增 32%"
                    className="resize-none text-[12.5px] bg-white/80 border-white"
                  />
                  <button
                    onClick={() => {
                      const bs = [...it.bullets]; bs.splice(bi, 1);
                      updateItem(key, idx, { bullets: bs.length ? bs : [''] });
                    }}
                    className="text-rose-400 hover:text-rose-500 mt-1.5"
                    aria-label="删除条目"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateItem(key, idx, { bullets: [...it.bullets, ''] })}
                className="text-[11px] text-sky-600 inline-flex items-center gap-0.5 hover:text-sky-700"
              >
                <Plus className="w-3 h-3" /> 加一条 bullet
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div>
      <Card title="👤 基本信息">
        <div className="grid grid-cols-2 gap-2">
          <TextField label="姓名" value={data.basic.name} onChange={(v) => setBasic('name', v)} />
          <TextField label="目标岗位" value={data.basic.target} onChange={(v) => setBasic('target', v)} placeholder="如：产品经理（增长方向）" />
          <TextField label="学校" value={data.basic.school} onChange={(v) => setBasic('school', v)} />
          <TextField label="专业" value={data.basic.major} onChange={(v) => setBasic('major', v)} />
          <TextField label="年级 / 届" value={data.basic.grade} onChange={(v) => setBasic('grade', v)} placeholder="2026 届" />
          <TextField label="电话" value={data.basic.phone} onChange={(v) => setBasic('phone', v)} />
          <TextField label="邮箱" value={data.basic.email} onChange={(v) => setBasic('email', v)} />
        </div>
      </Card>

      <Card
        title="📚 教育背景"
        onAdd={() => onChange({ ...data, education: [...data.education, newEdu()] })}
      >
        {data.education.length === 0 && <p className="text-xs text-muted-foreground py-2">暂无，点右上「添加」</p>}
        <div className="space-y-3">
          {data.education.map((e, idx) => (
            <div key={idx} className="rounded-xl border border-sky-100 bg-sky-50/40 p-2.5">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[10px] text-muted-foreground flex-1">#{idx + 1}</span>
                <button onClick={() => removeAt('education', idx)} className="text-[11px] text-rose-500 hover:text-rose-600 inline-flex items-center gap-0.5">
                  <Trash2 className="w-3 h-3" /> 删除
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <TextField label="学校" value={e.school} onChange={(v) => updateItem('education', idx, { school: v })} />
                <TextField label="学位 / 专业" value={e.degree} onChange={(v) => updateItem('education', idx, { degree: v })} />
                <TextField label="时间" value={e.period} onChange={(v) => updateItem('education', idx, { period: v })} />
                <TextField label="GPA / 排名" value={e.gpa} onChange={(v) => updateItem('education', idx, { gpa: v })} />
              </div>
              <div className="mt-2">
                <TextField label="奖学金 / 主修课程" value={e.extra} onChange={(v) => updateItem('education', idx, { extra: v })} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {renderItemList('experience', '公司')}
      {renderItemList('projects', '项目名称')}
      {renderItemList('campus', '组织 / 社团')}

      <Card title="🛠 技能">
        <Textarea
          rows={2}
          value={data.skills.join('，')}
          onChange={(e) => onChange({ ...data, skills: e.target.value.split(/[，,、\s]+/).filter(Boolean) })}
          placeholder="用逗号分隔，例如：Python，Figma，SQL，英语 CET-6"
          className="resize-none text-sm bg-white/70 border-white"
        />
      </Card>

      <Card title="🏅 证书 / 奖项">
        <Textarea
          rows={2}
          value={data.certs.join('，')}
          onChange={(e) => onChange({ ...data, certs: e.target.value.split(/[，,、\s]+/).filter(Boolean) })}
          placeholder="用逗号分隔，例如：互联网+ 国奖，PMP"
          className="resize-none text-sm bg-white/70 border-white"
        />
      </Card>

      <Card title="✨ 自我评价">
        <Textarea
          rows={3}
          value={data.selfEval}
          onChange={(e) => onChange({ ...data, selfEval: e.target.value })}
          placeholder="一段简短的自我评价，可选"
          className="resize-none text-sm bg-white/70 border-white"
        />
      </Card>
    </div>
  );
}
