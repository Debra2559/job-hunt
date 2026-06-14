import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import ResumeTargetCard from '@/components/career/ResumeTargetCard';
import ResumePreview from '@/components/career/ResumePreview';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { readResumeRoleContext, type ResumeRoleContext } from '@/lib/resumeRoleContext';
import { saveResumeWorkspaceState } from '@/lib/resumeWorkspace';
import { generateFollowUpPrompt, inferExperienceTypesFromRawText, type FollowUpPromptResult } from '@/lib/resumeQuestFollowUp';
import { polishResumeDraftWithAI } from '@/lib/resumeQuestLLM';
import {
  buildAbilitiesFromQuestData,
  createEmptyQuestData,
  createExperience,
  EXPERIENCE_META,
  generateResumeDraftFromQuestData,
  generateSkillDisplayAdvice,
  getRecommendedCompanies,
  getRoleContextFromTarget,
  questDataToWorkspaceState,
  RESUME_QUEST_DRAFT_KEY,
  SKILL_GROUPS,
  type ExperienceType,
  type QuestExperience,
  type ResumeGenerateResult,
  type ResumeQuestData,
} from '@/lib/resumeQuest';

const GRADIENT = 'from-sky-400 via-cyan-500 to-blue-500';
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() - 8 + i));
const DAYS_OPTIONS = ['2天', '3天', '4天', '5天', '全职', '暂不确定'];
const DURATION_OPTIONS = ['1个月', '2-3个月', '3-6个月', '6个月以上', '暂不确定'];
const DEGREE_OPTIONS = ['本科', '硕士', '博士', '大专', '其他'];
const EXPERIENCE_TYPES: ExperienceType[] = ['internship', 'project', 'competition', 'research', 'campus', 'volunteer', 'content', 'none'];
const EXPERIENCE_FORM_TYPES: Array<Exclude<ExperienceType, 'none'>> = ['internship', 'project', 'competition', 'research', 'campus', 'volunteer', 'content'];
const COMPETITION_TYPES = ['创新创业', '市场调研', '数学建模', '工科设计', '专业竞赛', '其他'];
const AWARD_OPTIONS = ['国家级奖项', '省级奖项', '校级奖项', '院级奖项', '入围', '完成作品但未获奖', '结果待公布', '不记得', '其他'];
const PUBLICATION_STATUS = ['未发表', '课程论文', '毕业论文', '投稿中', '已发表', '会议展示', '专利 / 软著'];
const QUICK_TAGS = {
  projectRoles: ['查资料', '做 PPT', '写报告', '数据分析', '问卷设计', '访谈', '汇报', '竞品分析', '用户研究', '方案设计', '代码实现', '实验记录'],
  deliverables: ['PPT', '报告', '程序', '数据分析', '海报', '路演', '问卷', '课堂展示', '实验报告', '课程论文', '原型图', '可视化图表'],
  campusRoles: ['活动策划', '宣传推广', '现场执行', '物料准备', '成员沟通', '招新', '社群运营', '活动复盘', '文案撰写', '海报制作'],
  contentRoles: ['选题', '文案', '排版', '剪辑', '封面', '发布', '数据复盘', '用户互动'],
};
const TARGET_CITY_OPTIONS = ['北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '南京', '香港', '远程', '其他'];
const GAME_CONTENT_COMPANIES = ['米哈游', '网易游戏', '腾讯游戏', '莉莉丝', '叠纸', '鹰角网络', 'TapTap'];

type CollapsedMap = Record<string, boolean>;

function readDraft(roleContext?: ResumeRoleContext | null) {
  try {
    const raw = localStorage.getItem(RESUME_QUEST_DRAFT_KEY);
    if (!raw) return createEmptyQuestData(roleContext);
    const parsed = JSON.parse(raw) as ResumeQuestData;
    const base = createEmptyQuestData(roleContext);
    const legacyTarget = parsed.target as ResumeQuestData['target'] & { roleCategory?: string; targetIndustry?: string };
    const targetRole = parsed.target?.targetRole || base.target.targetRole;
    const inferred = getRoleContextFromTarget(targetRole);
    return {
      ...base,
      ...parsed,
      basicInfo: { ...base.basicInfo, ...parsed.basicInfo },
      target: {
        ...base.target,
        ...parsed.target,
        targetRole,
        inferredRoleCategory: parsed.target?.inferredRoleCategory || legacyTarget?.roleCategory || inferred.inferredRoleCategory,
        requiredAbilities: parsed.target?.requiredAbilities?.length ? parsed.target.requiredAbilities : inferred.requiredAbilities,
        resumeFocus: parsed.target?.resumeFocus || inferred.resumeFocus,
        targetCompanies: parsed.target?.targetCompanies || [],
        customCompanies: parsed.target?.customCompanies || [],
        targetCities: parsed.target?.targetCities || [],
      },
      skills: {
        ...base.skills,
        ...(parsed.skills || {}),
        evidenceMap: parsed.skills?.evidenceMap || {},
        displayAdvice: parsed.skills?.displayAdvice || [],
      },
    };
  } catch {
    return createEmptyQuestData(roleContext);
  }
}

function splitTags(text: string) {
  return text.split(/[，,、\n\s]+/).map(x => x.trim()).filter(Boolean);
}

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter(x => x !== item) : [...list, item];
}

function toggleExperienceType(list: ExperienceType[], item: ExperienceType) {
  if (item === 'none') return list.includes('none') ? [] : ['none'];
  const withoutNone = list.filter(x => x !== 'none');
  return withoutNone.includes(item) ? withoutNone.filter(x => x !== item) : [...withoutNone, item];
}

export default function CareerResumeQuest() {
  const navigate = useNavigate();
  const [roleContext, setRoleContext] = useState<ResumeRoleContext | null>(() => readResumeRoleContext());
  const [data, setData] = useState<ResumeQuestData>(() => readDraft(readResumeRoleContext()));
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(() => Boolean(localStorage.getItem(RESUME_QUEST_DRAFT_KEY)));
  const [collapsed, setCollapsed] = useState<CollapsedMap>({});
  const { markDone, isDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  useEffect(() => {
    localStorage.setItem(RESUME_QUEST_DRAFT_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!roleContext) return;
    setData(prev => ({
      ...prev,
      target: {
        ...prev.target,
        targetRole: prev.target.targetRole || roleContext.targetRole,
        inferredRoleCategory: prev.target.inferredRoleCategory || roleContext.roleCategory,
        requiredAbilities: prev.target.requiredAbilities?.length ? prev.target.requiredAbilities : roleContext.requiredAbilities,
        resumeFocus: prev.target.resumeFocus || roleContext.resumeFocus,
      },
    }));
  }, [roleContext]);

  const abilities = useMemo(() => buildAbilitiesFromQuestData(data), [data]);
  const selectedTypes = data.selectedExperienceTypes.filter((type): type is Exclude<ExperienceType, 'none'> => type !== 'none');

  const updateData = (updater: (prev: ResumeQuestData) => ResumeQuestData) => setData(updater);
  const patchBasic = (patch: Partial<ResumeQuestData['basicInfo']>) => updateData(prev => ({ ...prev, basicInfo: { ...prev.basicInfo, ...patch } }));
  const patchTarget = (patch: Partial<ResumeQuestData['target']>) => updateData(prev => ({ ...prev, target: { ...prev.target, ...patch } }));

  const validateStep = (index: number) => {
    if (index === 0) {
      if (!data.basicInfo.name.trim() || !data.basicInfo.email.trim() || !data.basicInfo.phone.trim()) {
        toast({ title: '基础信息未完成', description: '姓名、邮箱、电话是必填项' });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.basicInfo.email)) {
        toast({ title: '邮箱格式不正确', description: '请填写一个可联系到你的邮箱' });
        return false;
      }
    }
    if (index === 1) {
      for (const edu of data.education) {
        if (!edu.school || !edu.degree || !edu.major || !edu.startYear || !edu.endYear) {
          toast({ title: '教育背景未完成', description: '学校、教育层次、专业、入学年份、毕业年份必填' });
          return false;
        }
        if (Number(edu.startYear) > Number(edu.endYear)) {
          toast({ title: '教育时间不合理', description: '入学年份不能晚于毕业年份' });
          return false;
        }
      }
    }
    if (index === 2 && !data.target.targetRole.trim()) {
      toast({ title: '请确认目标岗位', description: '简历需要围绕一个目标岗位生成' });
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(Math.min(steps.length - 1, step + 1));
  };

  const generate = async (draftOverride?: ResumeGenerateResult) => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;
    setLoading(true);
    try {
      const withAbilities = { ...data, abilities };
      const workspace = questDataToWorkspaceState(withAbilities, roleContext, draftOverride);
      saveResumeWorkspaceState(workspace);
      localStorage.removeItem(RESUME_QUEST_DRAFT_KEY);
      if (!isDone('resume')) {
        markDone('resume');
        onStageCompleted('resume');
      }
      toast({ title: '简历草稿已生成', description: '正在进入简历工作台' });
      navigate('/career/resume-workspace');
    } finally {
      setLoading(false);
    }
  };

  const resetDraft = () => {
    const fresh = createEmptyQuestData(roleContext);
    setData(fresh);
    setStep(0);
    setShowDraftPrompt(false);
    localStorage.setItem(RESUME_QUEST_DRAFT_KEY, JSON.stringify(fresh));
  };

  const addExperienceForType = (type: Exclude<ExperienceType, 'none'>) => {
    updateData(prev => ({ ...prev, experiences: [...prev.experiences, createExperience(type)] }));
  };

  const ensureTypeSections = () => {
    selectedTypes.forEach(type => {
      if (!data.experiences.some(exp => exp.type === type)) addExperienceForType(type);
    });
  };

  useEffect(() => {
    selectedTypes.forEach(type => {
      if (!data.experiences.some(exp => exp.type === type)) {
        setData(prev => ({ ...prev, experiences: [...prev.experiences, createExperience(type)] }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.selectedExperienceTypes.join('|')]);

  const steps = [
    { title: 'Step 1 · 基础信息', body: <BasicStep data={data} patchBasic={patchBasic} updateData={updateData} /> },
    { title: 'Step 2 · 教育背景', body: <EducationStep data={data} updateData={updateData} /> },
    { title: 'Step 3 · 求职目标', body: <TargetStep data={data} patchTarget={patchTarget} roleContext={roleContext} setRoleContext={setRoleContext} /> },
    { title: 'Step 4 · 经历资产', body: <ExperienceAssetsStep data={data} updateData={updateData} /> },
    { title: 'Step 5 · 经历细化', body: <ExperienceDetailStep data={data} updateData={updateData} collapsed={collapsed} setCollapsed={setCollapsed} addExperienceForType={addExperienceForType} ensureTypeSections={ensureTypeSections} /> },
    { title: 'Step 6 · 技能与证书', body: <SkillStep data={data} updateData={updateData} /> },
    { title: 'Step 7 · 能力图谱 / 生成草稿', body: <AbilityStep abilities={abilities} data={data} generate={generate} loading={loading} /> },
  ];

  return (
    <Ch2PageShell
      emoji="🧩"
      title="从 0 创建简历"
      subtitle="按真实简历结构，把零散经历整理成岗位定向简历"
      gradient={GRADIENT}
      footer={
        <>
          <Button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || loading} variant="outline" className="shrink-0 rounded-2xl h-11 px-5 font-semibold">
            上一步
          </Button>
          {step < steps.length - 1 && (
            <Button onClick={goNext} disabled={loading} className={`shrink-0 rounded-2xl h-11 px-5 text-white font-bold shadow-lg bg-gradient-to-r ${GRADIENT}`}>
              下一步 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </>
      }
    >
      {showDraftPrompt && (
        <section className="mb-4 rounded-3xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <div className="font-extrabold text-sky-950">检测到你上次填写的草稿，是否继续？</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setShowDraftPrompt(false)} className={`rounded-2xl bg-gradient-to-r ${GRADIENT} text-white font-bold`}>继续填写</Button>
            <Button onClick={resetDraft} variant="outline" className="rounded-2xl">重新开始</Button>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s, i) => (
            <button key={s.title} onClick={() => setStep(i)} className={`h-2 flex-1 rounded-full transition ${i <= step ? 'bg-sky-400' : 'bg-slate-200'}`} aria-label={s.title} />
          ))}
        </div>
        <h2 className="text-lg font-extrabold">{steps[step].title}</h2>
        <div className="mt-4">{steps[step].body}</div>
      </section>
    </Ch2PageShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-10 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${props.className || ''}`} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-10 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${props.className || ''}`} />;
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <h3 className="font-extrabold text-slate-950">{title}</h3>
      {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function FieldHint({ prompt, fieldKey }: { prompt: FollowUpPromptResult | null; fieldKey: string }) {
  const item = prompt?.fieldHints.find(hint => hint.fieldKey === fieldKey);
  if (!item) return null;
  return (
    <div className="mt-1 rounded-2xl bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-900">
      <div>{item.hint}</div>
      {item.example && <div className="mt-1 text-sky-700">{item.example}</div>}
    </div>
  );
}

function FollowUpPanel({ exp, prompt, updateExp }: { exp: QuestExperience; prompt: FollowUpPromptResult | null; updateExp: (patch: Partial<QuestExperience>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="用原话描述这段经历">
        <Textarea rows={3} value={exp.rawText || ''} onChange={e => updateExp({ rawText: e.target.value })} placeholder="例如：我做过一次课堂展示，和同学分析了咖啡品牌竞品，最后交了 PPT。" className="resize-none rounded-2xl bg-white" />
      </Field>
      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-sm leading-relaxed text-sky-950">
        {exp.rawText?.trim() ? (
          <>
            <div className="font-extrabold">你刚才提到：</div>
            <blockquote className="mt-1 border-l-2 border-sky-300 pl-3 text-sky-900">“{exp.rawText.trim()}”</blockquote>
            <p className="mt-2">下面我会继续问几个关键问题，把这句话补成可写进简历的经历。</p>
          </>
        ) : (
          <p>{prompt?.introText || '先补充这段经历的关键事实：这是什么、在哪里做、你做了什么、交付了什么、结果是什么。'}</p>
        )}
      </div>
      {exp.rawText?.trim() && prompt?.introText && <p className="rounded-2xl bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">{prompt.introText}</p>}
    </div>
  );
}

function TagEditor({ values, onChange, placeholder, suggestions = [] }: { values: string[]; onChange: (values: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [text, setText] = useState('');
  const add = (value: string) => {
    const tags = splitTags(value);
    if (!tags.length) return;
    onChange(Array.from(new Set([...values, ...tags])));
    setText('');
  };
  return (
    <div className="space-y-2">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map(item => (
            <button key={item} type="button" onClick={() => values.includes(item) ? onChange(values.filter(v => v !== item)) : onChange([...values, item])} className={`rounded-full border px-3 py-1 text-xs font-semibold ${values.includes(item) ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600'}`}>
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(text); } }} placeholder={placeholder || '输入后回车添加'} />
        <Button type="button" onClick={() => add(text)} variant="outline" className="rounded-2xl">添加</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map(item => (
          <button key={item} type="button" onClick={() => onChange(values.filter(v => v !== item))} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            {item} ×
          </button>
        ))}
      </div>
    </div>
  );
}

function BasicStep({ data, patchBasic, updateData }: { data: ResumeQuestData; patchBasic: (patch: Partial<ResumeQuestData['basicInfo']>) => void; updateData: (updater: (prev: ResumeQuestData) => ResumeQuestData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-slate-950">先补全你的基础信息</h3>
        <p className="mt-1 text-sm text-slate-500">这些信息会出现在简历顶部。姓名、邮箱、电话是必填；实习时间和 base 地不确定可以先跳过。</p>
      </div>
      <Card title="联系方式">
        <Field label="姓名" required><Input value={data.basicInfo.name} onChange={e => patchBasic({ name: e.target.value })} /></Field>
        <Field label="邮箱" required><Input value={data.basicInfo.email} onChange={e => patchBasic({ email: e.target.value })} placeholder="name@example.com" /></Field>
        <Field label="电话" required><Input value={data.basicInfo.phone} onChange={e => patchBasic({ phone: e.target.value })} /></Field>
      </Card>
      <Card title="实习可用性">
        <Field label="当前所在城市"><Input value={data.basicInfo.city || ''} onChange={e => patchBasic({ city: e.target.value })} /></Field>
        <Field label="一周可到岗几天"><Select value={data.basicInfo.daysPerWeek || ''} onChange={e => patchBasic({ daysPerWeek: e.target.value })}><option value="">请选择</option>{DAYS_OPTIONS.map(v => <option key={v}>{v}</option>)}</Select></Field>
        <Field label="可持续实习多久"><Select value={data.basicInfo.internshipDuration || ''} onChange={e => patchBasic({ internshipDuration: e.target.value })}><option value="">请选择</option>{DURATION_OPTIONS.map(v => <option key={v}>{v}</option>)}</Select></Field>
        <Field label="可接受 base 地"><TagEditor values={data.basicInfo.baseLocations || []} onChange={baseLocations => patchBasic({ baseLocations })} placeholder="例如 上海、北京、远程" suggestions={['上海', '北京', '深圳', '广州', '杭州', '远程']} /></Field>
      </Card>
      <Card title="补充链接">
        <TagEditor values={data.basicInfo.links || []} onChange={links => updateData(prev => ({ ...prev, basicInfo: { ...prev.basicInfo, links } }))} placeholder="GitHub / 作品集 / 个人主页链接" />
      </Card>
    </div>
  );
}

function EducationStep({ data, updateData }: { data: ResumeQuestData; updateData: (updater: (prev: ResumeQuestData) => ResumeQuestData) => void }) {
  const updateEdu = (id: string, patch: Partial<ResumeQuestData['education'][number]>) => updateData(prev => ({ ...prev, education: prev.education.map(edu => edu.id === id ? { ...edu, ...patch } : edu) }));
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-slate-950">再填写你的教育背景</h3>
        <p className="mt-1 text-sm text-slate-500">教育背景是学生简历里最稳定的一部分。请把学校、学历、专业和时间放在同一段经历里，避免生成时混乱。</p>
      </div>
      {data.education.map((edu, index) => (
        <Card key={edu.id} title={`教育经历 ${index + 1}`}>
          <Field label="学校" required><Input value={edu.school} onChange={e => updateEdu(edu.id, { school: e.target.value })} /></Field>
          <Field label="教育层次" required><Select value={edu.degree} onChange={e => updateEdu(edu.id, { degree: e.target.value })}><option value="">请选择</option>{DEGREE_OPTIONS.map(v => <option key={v}>{v}</option>)}</Select></Field>
          <Field label="专业" required><Input value={edu.major} onChange={e => updateEdu(edu.id, { major: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="入学年份" required><Select value={edu.startYear} onChange={e => updateEdu(edu.id, { startYear: e.target.value })}>{YEAR_OPTIONS.map(v => <option key={v}>{v}</option>)}</Select></Field>
            <Field label="毕业年份" required><Select value={edu.endYear} onChange={e => updateEdu(edu.id, { endYear: e.target.value })}>{YEAR_OPTIONS.map(v => <option key={v}>{v}</option>)}</Select></Field>
          </div>
          <Field label="GPA"><Input value={edu.gpa || ''} onChange={e => updateEdu(edu.id, { gpa: e.target.value })} placeholder="例如 3.6 / 4.0" /></Field>
          <Field label="修读课程"><TagEditor values={edu.courses || []} onChange={courses => updateEdu(edu.id, { courses })} /></Field>
          <Field label="荣誉奖励"><TagEditor values={edu.honors || []} onChange={honors => updateEdu(edu.id, { honors })} /></Field>
          <Field label="奖学金 / 排名"><Input value={edu.scholarshipOrRanking || ''} onChange={e => updateEdu(edu.id, { scholarshipOrRanking: e.target.value })} /></Field>
          {data.education.length > 1 && <Button variant="outline" className="rounded-2xl text-red-600" onClick={() => updateData(prev => ({ ...prev, education: prev.education.filter(item => item.id !== edu.id) }))}>删除这段教育经历</Button>}
        </Card>
      ))}
      <Button variant="outline" className="rounded-2xl" onClick={() => updateData(prev => ({ ...prev, education: [...prev.education, { ...createEmptyQuestData().education[0], id: `edu_${Date.now()}` }] }))}><Plus className="mr-1 h-4 w-4" /> 添加另一段教育经历</Button>
    </div>
  );
}

function TargetStep({ data, patchTarget, roleContext, setRoleContext }: { data: ResumeQuestData; patchTarget: (patch: Partial<ResumeQuestData['target']>) => void; roleContext: ResumeRoleContext | null; setRoleContext: (value: ResumeRoleContext | null) => void }) {
  const companyGroups = getRecommendedCompanies(data.target.targetRole);
  const selectedCompanies = [...(data.target.targetCompanies || []), ...(data.target.customCompanies || [])];
  const hasGameContentCompany = selectedCompanies.some(company => GAME_CONTENT_COMPANIES.includes(company));
  const updateTargetRole = (targetRole: string) => {
    const inferred = getRoleContextFromTarget(targetRole);
    if (roleContext?.targetRole !== targetRole) setRoleContext(null);
    patchTarget({
      targetRole,
      inferredRoleCategory: inferred.inferredRoleCategory,
      requiredAbilities: inferred.requiredAbilities,
      resumeFocus: inferred.resumeFocus,
    });
  };
  const toggleCompany = (company: string) => {
    patchTarget({ targetCompanies: toggle(data.target.targetCompanies || [], company) });
  };
  return (
    <div className="space-y-4">
      <ResumeTargetCard gradient={GRADIENT} onChange={ctx => { setRoleContext(ctx); if (ctx) patchTarget({ targetRole: ctx.targetRole, inferredRoleCategory: ctx.roleCategory, requiredAbilities: ctx.requiredAbilities, resumeFocus: ctx.resumeFocus }); }} />
      <Card title="确认这份简历要投向哪里" subtitle="同一段经历，投不同岗位和公司时写法会不一样。这里先确认目标岗位和目标公司，后面会围绕它生成更匹配的简历表达。">
        {roleContext && (
          <div className="rounded-2xl bg-sky-50 p-3 text-sm text-sky-900">
            <div className="font-bold">推荐岗位：{roleContext.targetRole}</div>
            <p className="mt-1">{roleContext.matchReason}</p>
            <p className="mt-1">核心能力：{roleContext.requiredAbilities.join('、')}</p>
            <p className="mt-1">表达重点：{roleContext.resumeFocus}</p>
          </div>
        )}
        <Field label="目标岗位" required><Input value={data.target.targetRole} onChange={e => updateTargetRole(e.target.value)} placeholder="例如 产品经理实习生" /></Field>
      </Card>
      <Card title="目标公司" subtitle="选填，可多选。不确定也可以跳过，后面仍然会按目标岗位生成。">
        {companyGroups.map(group => (
          <div key={group.title} className="space-y-2">
            <div className="text-xs font-extrabold text-slate-500">{group.title}</div>
            <div className="flex flex-wrap gap-2">
              {group.companies.map(company => (
                <button key={`${group.title}-${company}`} type="button" onClick={() => toggleCompany(company)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${data.target.targetCompanies?.includes(company) ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                  {company}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Field label="其他公司"><TagEditor values={data.target.customCompanies || []} onChange={customCompanies => patchTarget({ customCompanies })} placeholder="输入公司名后回车添加" /></Field>
        <Button type="button" variant="outline" className="rounded-2xl" onClick={() => patchTarget({ targetCompanies: [], customCompanies: [] })}>不确定，先跳过</Button>
      </Card>
      <Card title="目标城市" subtitle="选填，可多选。城市会影响简历里实习可用性和投递表达。">
        <TagEditor values={data.target.targetCities || []} onChange={targetCities => patchTarget({ targetCities })} suggestions={TARGET_CITY_OPTIONS} />
      </Card>
      <Card title="岗位能力承接卡片">
        <div className="rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
          <div className="font-extrabold text-slate-950">当前目标：{data.target.targetRole || '待填写目标岗位'}</div>
          <p className="mt-2">系统内部推断岗位类别：{data.target.inferredRoleCategory || '通用'}</p>
          <p className="mt-2">这份简历会优先突出：{data.target.requiredAbilities?.length ? data.target.requiredAbilities.join('、') : '学习能力、沟通表达、结构化思考、执行力'}</p>
          <p className="mt-2">生成策略：{data.target.resumeFocus || '优先整理真实经历，并补足动作、方法、结果和量化信息。'}</p>
          {hasGameContentCompany && (
            <p className="mt-2 rounded-2xl bg-sky-50 p-3 text-sky-900">你选择了游戏 / 内容类公司，后续简历表达会更重视用户体验、内容理解、玩法/活动分析、社区反馈和数据意识。</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ExperienceAssetsStep({ data, updateData }: { data: ResumeQuestData; updateData: (updater: (prev: ResumeQuestData) => ResumeQuestData) => void }) {
  const inferredTypes = data.uncertainExperienceText?.trim() ? inferExperienceTypesFromRawText(data.uncertainExperienceText) : [];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-slate-950">找找你可以写进简历的经历</h3>
        <p className="mt-1 text-sm text-slate-500">不用判断它够不够高级。课程作业、比赛、社团、兼职、论文、公众号、课堂展示，都可能变成简历素材。选你做过的，也可以直接用大白话补充。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {EXPERIENCE_TYPES.map(type => {
          const active = data.selectedExperienceTypes.includes(type);
          return (
            <button key={type} onClick={() => updateData(prev => ({ ...prev, selectedExperienceTypes: toggleExperienceType(prev.selectedExperienceTypes as ExperienceType[], type) }))} className={`rounded-3xl border p-4 text-left transition ${active ? 'border-sky-300 bg-sky-50' : 'border-slate-100 bg-white hover:border-sky-200'}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-sky-500 bg-sky-500' : 'border-slate-300'}`}>{active && <Check className="h-3.5 w-3.5 text-white" />}</span>
                <span>
                  <span className="block text-sm font-extrabold text-slate-950">{EXPERIENCE_META[type].title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{EXPERIENCE_META[type].desc}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <Field label="还有什么你不确定能不能写？">
        <Textarea rows={5} value={data.uncertainExperienceText || ''} onChange={e => updateData(prev => ({ ...prev, uncertainExperienceText: e.target.value }))} placeholder="还有什么你不确定能不能写？直接说，比如“我只是做过一次课堂展示”“我帮老师整理过资料”“我参加过一个没获奖的比赛”。" className="resize-none rounded-2xl bg-white/90" />
      </Field>
      {inferredTypes.length > 0 && (
        <div className="rounded-2xl bg-sky-50 p-3 text-sm text-sky-950">
          <div className="font-extrabold">根据你的原话，系统建议优先整理为：</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {inferredTypes.map(type => (
              <button key={type} type="button" onClick={() => updateData(prev => ({ ...prev, selectedExperienceTypes: prev.selectedExperienceTypes.includes(type) ? prev.selectedExperienceTypes : [...prev.selectedExperienceTypes.filter(item => item !== 'none'), type] }))} className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                {EXPERIENCE_META[type].title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExperienceDetailStep({ data, updateData, collapsed, setCollapsed, addExperienceForType, ensureTypeSections }: { data: ResumeQuestData; updateData: (updater: (prev: ResumeQuestData) => ResumeQuestData) => void; collapsed: CollapsedMap; setCollapsed: (updater: CollapsedMap | ((prev: CollapsedMap) => CollapsedMap)) => void; addExperienceForType: (type: Exclude<ExperienceType, 'none'>) => void; ensureTypeSections: () => void }) {
  const selectedTypes = data.selectedExperienceTypes.filter((type): type is Exclude<ExperienceType, 'none'> => type !== 'none');
  useEffect(() => ensureTypeSections(), []);
  if (data.selectedExperienceTypes.includes('none') || selectedTypes.length === 0) {
    return <Card title="可以先跳过经历填写"><p className="text-sm leading-relaxed text-slate-600">你可以先跳过经历填写，系统会生成基础版简历。后续建议补充至少一段课程项目、比赛、科研或校园经历。</p></Card>;
  }
  const updateExp = (id: string, patch: Partial<QuestExperience>) => updateData(prev => ({ ...prev, experiences: prev.experiences.map(exp => exp.id === id ? { ...exp, ...patch } : exp) }));
  return (
    <div className="space-y-5">
      {selectedTypes.map(type => {
        const items = data.experiences.filter(exp => exp.type === type);
        return (
          <section key={type} className="rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-950">{EXPERIENCE_META[type].title}填写区</h3>
                <p className="mt-1 text-xs text-slate-500">{EXPERIENCE_META[type].desc}</p>
              </div>
              <Button variant="outline" className="rounded-2xl" onClick={() => addExperienceForType(type)}><Plus className="mr-1 h-4 w-4" /> 再添加一段</Button>
            </div>
            <div className="mt-4 space-y-3">
              {items.map((exp, index) => (
                <div key={exp.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setCollapsed(prev => ({ ...prev, [exp.id]: !prev[exp.id] }))} className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      {collapsed[exp.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {EXPERIENCE_META[type].title} {index + 1}
                    </button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateData(prev => ({ ...prev, experiences: prev.experiences.filter(item => item.id !== exp.id) }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  {!collapsed[exp.id] && <ExperienceForm exp={exp} updateExp={patch => updateExp(exp.id, patch)} />}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ExperienceForm({ exp, updateExp }: { exp: QuestExperience; updateExp: (patch: Partial<QuestExperience>) => void }) {
  const [prompt, setPrompt] = useState<FollowUpPromptResult | null>(null);
  useEffect(() => {
    let alive = true;
    generateFollowUpPrompt({ rawText: exp.rawText, experienceType: exp.type }).then(result => {
      if (alive) setPrompt(result);
    });
    return () => { alive = false; };
  }, [exp.rawText, exp.type]);

  if (exp.type === 'internship') {
    return <CommonExperienceFields exp={exp} updateExp={updateExp} prompt={prompt} titleKey="organization" titleLabel="公司 / 组织" roleLabel="岗位名称" actionLabel="日常做什么" resultLabel="结果或反馈" deliverablesLabel="完成任务 / 交付物" toolSuggestions={[]} />;
  }
  if (exp.type === 'project') {
    return (
      <div className="mt-3 space-y-3">
        <FollowUpPanel exp={exp} prompt={prompt} updateExp={updateExp} />
        <Field label="项目名称"><Input value={exp.title} onChange={e => updateExp({ title: e.target.value })} /></Field>
        <FieldHint prompt={prompt} fieldKey="title" />
        <Field label="所属课程"><Input value={exp.organization || ''} onChange={e => updateExp({ organization: e.target.value })} /></Field>
        <FieldHint prompt={prompt} fieldKey="organization" />
        <Field label="团队人数"><Input value={exp.teamSize || ''} onChange={e => updateExp({ teamSize: e.target.value })} /></Field>
        <FieldHint prompt={prompt} fieldKey="teamSize" />
        <Field label="我的职责"><Input value={exp.role || ''} onChange={e => updateExp({ role: e.target.value })} /></Field>
        <FieldHint prompt={prompt} fieldKey="role" />
        <Field label="我做了什么"><Textarea rows={4} value={exp.actions || ''} onChange={e => updateExp({ actions: e.target.value })} className="resize-none rounded-2xl bg-white" /></Field>
        <FieldHint prompt={prompt} fieldKey="actions" />
        <Field label="工具方法"><TagEditor values={exp.methods || []} onChange={methods => updateExp({ methods })} /></Field>
        <FieldHint prompt={prompt} fieldKey="methods" />
        <Field label="最终交付物"><TagEditor values={exp.deliverables || []} onChange={deliverables => updateExp({ deliverables })} suggestions={QUICK_TAGS.deliverables} /></Field>
        <FieldHint prompt={prompt} fieldKey="deliverables" />
        <Field label="结果反馈"><Textarea rows={3} value={exp.result || ''} onChange={e => updateExp({ result: e.target.value })} placeholder="页数、团队人数、问卷数量、展示时长、课程成绩、老师反馈等。" className="resize-none rounded-2xl bg-white" /></Field>
        <FieldHint prompt={prompt} fieldKey="result" />
      </div>
    );
  }
  if (exp.type === 'competition') {
    return <CompetitionFields exp={exp} updateExp={updateExp} prompt={prompt} />;
  }
  if (exp.type === 'research') {
    return <ResearchFields exp={exp} updateExp={updateExp} prompt={prompt} />;
  }
  if (exp.type === 'campus') {
    return <CommonExperienceFields exp={exp} updateExp={updateExp} prompt={prompt} titleKey="title" titleLabel="活动 / 事务名称" orgLabel="组织名称" roleLabel="角色" actionLabel="我负责什么" resultLabel="结果" deliverablesLabel="交付物" toolSuggestions={QUICK_TAGS.campusRoles} />;
  }
  if (exp.type === 'volunteer') {
    return <CommonExperienceFields exp={exp} updateExp={updateExp} prompt={prompt} titleKey="title" titleLabel="活动 / 实践名称" orgLabel="所属组织 / 服务对象" roleLabel="我的角色" actionLabel="我做了什么" resultLabel="结果或反馈" deliverablesLabel="交付物" />;
  }
  return <ContentFields exp={exp} updateExp={updateExp} prompt={prompt} />;
}

function CommonExperienceFields({ exp, updateExp, prompt, titleKey, titleLabel, orgLabel, roleLabel, actionLabel, resultLabel, deliverablesLabel, toolSuggestions = [] }: { exp: QuestExperience; updateExp: (patch: Partial<QuestExperience>) => void; prompt: FollowUpPromptResult | null; titleKey: 'title' | 'organization'; titleLabel: string; orgLabel?: string; roleLabel: string; actionLabel: string; resultLabel: string; deliverablesLabel: string; toolSuggestions?: string[] }) {
  const titleValue = titleKey === 'organization' ? exp.organization || '' : exp.title;
  const updateTitle = (value: string) => titleKey === 'organization' ? updateExp({ organization: value }) : updateExp({ title: value });
  return (
    <div className="mt-3 space-y-3">
      <FollowUpPanel exp={exp} prompt={prompt} updateExp={updateExp} />
      <Field label={titleLabel}><Input value={titleValue} onChange={e => updateTitle(e.target.value)} /></Field>
      <FieldHint prompt={prompt} fieldKey={titleKey} />
      {orgLabel && <Field label={orgLabel}><Input value={exp.organization || ''} onChange={e => updateExp({ organization: e.target.value })} /></Field>}
      {orgLabel && <FieldHint prompt={prompt} fieldKey="organization" />}
      <Field label={roleLabel}><Input value={exp.role || ''} onChange={e => updateExp({ role: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="role" />
      <Field label="时间"><Input value={exp.time || ''} onChange={e => updateExp({ time: e.target.value })} placeholder="例如 2024.03 - 2024.06" /></Field>
      <FieldHint prompt={prompt} fieldKey="time" />
      <Field label={actionLabel}><Textarea rows={4} value={exp.actions || ''} onChange={e => updateExp({ actions: e.target.value })} className="resize-none rounded-2xl bg-white" /></Field>
      <FieldHint prompt={prompt} fieldKey="actions" />
      <Field label="使用工具 / 职责标签"><TagEditor values={exp.tools || []} onChange={tools => updateExp({ tools })} suggestions={toolSuggestions} /></Field>
      <FieldHint prompt={prompt} fieldKey="tools" />
      <Field label={deliverablesLabel}><TagEditor values={exp.deliverables || []} onChange={deliverables => updateExp({ deliverables })} suggestions={QUICK_TAGS.deliverables} /></Field>
      <FieldHint prompt={prompt} fieldKey="deliverables" />
      <Field label={resultLabel}><Textarea rows={3} value={exp.result || ''} onChange={e => updateExp({ result: e.target.value })} className="resize-none rounded-2xl bg-white" /></Field>
      <FieldHint prompt={prompt} fieldKey="result" />
    </div>
  );
}

function CompetitionFields({ exp, updateExp, prompt }: { exp: QuestExperience; updateExp: (patch: Partial<QuestExperience>) => void; prompt: FollowUpPromptResult | null }) {
  return (
    <div className="mt-3 space-y-3">
      <FollowUpPanel exp={exp} prompt={prompt} updateExp={updateExp} />
      <Field label="比赛名称"><Input value={exp.organization || ''} onChange={e => updateExp({ organization: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="organization" />
      <Field label="比赛类型"><Select value={exp.competitionType || ''} onChange={e => updateExp({ competitionType: e.target.value })}><option value="">请选择</option>{COMPETITION_TYPES.map(v => <option key={v}>{v}</option>)}</Select></Field>
      <FieldHint prompt={prompt} fieldKey="competitionType" />
      <Field label="项目主题"><Input value={exp.title} onChange={e => updateExp({ title: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="title" />
      <Field label="团队人数"><Input value={exp.teamSize || ''} onChange={e => updateExp({ teamSize: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="teamSize" />
      <Field label="我的角色"><Input value={exp.role || ''} onChange={e => updateExp({ role: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="role" />
      <Field label="我做了什么"><Textarea rows={4} value={exp.actions || ''} onChange={e => updateExp({ actions: e.target.value })} className="resize-none rounded-2xl bg-white" /></Field>
      <FieldHint prompt={prompt} fieldKey="actions" />
      <Field label="方法工具"><TagEditor values={exp.methods || []} onChange={methods => updateExp({ methods })} /></Field>
      <FieldHint prompt={prompt} fieldKey="methods" />
      <Field label="最终交付物"><TagEditor values={exp.deliverables || []} onChange={deliverables => updateExp({ deliverables })} suggestions={QUICK_TAGS.deliverables} /></Field>
      <FieldHint prompt={prompt} fieldKey="deliverables" />
      <Field label="比赛结果"><Select value={exp.awardLevel || ''} onChange={e => updateExp({ awardLevel: e.target.value })}><option value="">请选择</option>{AWARD_OPTIONS.map(v => <option key={v}>{v}</option>)}</Select></Field>
      <FieldHint prompt={prompt} fieldKey="awardLevel" />
      {exp.awardLevel === '其他' && <Field label="自定义比赛结果"><Input value={exp.proof || ''} onChange={e => updateExp({ proof: e.target.value })} placeholder="例如 完成省赛答辩、获得优秀展示、团队进入复赛" /></Field>}
      {exp.awardLevel === '其他' && <FieldHint prompt={prompt} fieldKey="proof" />}
    </div>
  );
}

function ResearchFields({ exp, updateExp, prompt }: { exp: QuestExperience; updateExp: (patch: Partial<QuestExperience>) => void; prompt: FollowUpPromptResult | null }) {
  return (
    <div className="mt-3 space-y-3">
      <FollowUpPanel exp={exp} prompt={prompt} updateExp={updateExp} />
      <Field label="研究题目"><Input value={exp.title} onChange={e => updateExp({ title: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="title" />
      <Field label="所属课程 / 实验室"><Input value={exp.organization || ''} onChange={e => updateExp({ organization: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="organization" />
      <Field label="指导老师"><Input value={exp.advisor || ''} onChange={e => updateExp({ advisor: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="advisor" />
      <Field label="研究方向"><Input value={exp.background || ''} onChange={e => updateExp({ background: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="background" />
      <Field label="我的职责"><Input value={exp.role || ''} onChange={e => updateExp({ role: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="role" />
      <Field label="我做了什么"><Textarea rows={4} value={exp.actions || ''} onChange={e => updateExp({ actions: e.target.value })} className="resize-none rounded-2xl bg-white" /></Field>
      <FieldHint prompt={prompt} fieldKey="actions" />
      <Field label="方法工具"><TagEditor values={exp.methods || []} onChange={methods => updateExp({ methods })} /></Field>
      <FieldHint prompt={prompt} fieldKey="methods" />
      <Field label="产出"><TagEditor values={exp.deliverables || []} onChange={deliverables => updateExp({ deliverables })} suggestions={['文献综述', '实验报告', '课程论文', '毕业论文', '数据集', '汇报 PPT']} /></Field>
      <FieldHint prompt={prompt} fieldKey="deliverables" />
      <Field label="状态"><Select value={exp.researchStatus || exp.publicationStatus || ''} onChange={e => updateExp({ researchStatus: e.target.value })}><option value="">请选择</option>{PUBLICATION_STATUS.map(v => <option key={v}>{v}</option>)}</Select></Field>
      <FieldHint prompt={prompt} fieldKey="researchStatus" />
    </div>
  );
}

function ContentFields({ exp, updateExp, prompt }: { exp: QuestExperience; updateExp: (patch: Partial<QuestExperience>) => void; prompt: FollowUpPromptResult | null }) {
  return (
    <div className="mt-3 space-y-3">
      <FollowUpPanel exp={exp} prompt={prompt} updateExp={updateExp} />
      <Field label="平台 / 作品载体"><Input value={exp.platform || ''} onChange={e => updateExp({ platform: e.target.value })} placeholder="例如 小红书、B站、公众号、GitHub、作品集" /></Field>
      <FieldHint prompt={prompt} fieldKey="platform" />
      <Field label="内容主题 / 作品名称"><Input value={exp.title} onChange={e => updateExp({ title: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="title" />
      <Field label="持续时间 / 发布频率"><Input value={exp.role || ''} onChange={e => updateExp({ role: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="role" />
      <Field label="我负责什么"><Textarea rows={4} value={exp.actions || ''} onChange={e => updateExp({ actions: e.target.value })} className="resize-none rounded-2xl bg-white" /></Field>
      <FieldHint prompt={prompt} fieldKey="actions" />
      <Field label="工具 / 内容动作"><TagEditor values={exp.tools || []} onChange={tools => updateExp({ tools })} suggestions={QUICK_TAGS.contentRoles} /></Field>
      <FieldHint prompt={prompt} fieldKey="tools" />
      <Field label="发布内容 / 作品交付"><TagEditor values={exp.deliverables || []} onChange={deliverables => updateExp({ deliverables })} suggestions={['图文笔记', '视频', '推文', '作品集', '代码仓库', '设计稿']} /></Field>
      <FieldHint prompt={prompt} fieldKey="deliverables" />
      <Field label="结果"><Textarea rows={3} value={exp.result || ''} onChange={e => updateExp({ result: e.target.value })} className="resize-none rounded-2xl bg-white" /></Field>
      <FieldHint prompt={prompt} fieldKey="result" />
      <Field label="作品链接"><Input value={exp.link || ''} onChange={e => updateExp({ link: e.target.value })} /></Field>
      <FieldHint prompt={prompt} fieldKey="link" />
    </div>
  );
}

function SkillStep({ data, updateData }: { data: ResumeQuestData; updateData: (updater: (prev: ResumeQuestData) => ResumeQuestData) => void }) {
  const allSkills = Array.from(new Set([...data.skills.selected, ...data.skills.custom]));
  const displayAdvice = generateSkillDisplayAdvice(data);
  const toggleSelectedSkill = (skill: string) => {
    updateData(prev => {
      const selected = toggle(prev.skills.selected, skill);
      const nextAllSkills = Array.from(new Set([...selected, ...(prev.skills.custom || [])]));
      const evidenceMap = Object.fromEntries(Object.entries(prev.skills.evidenceMap || {}).filter(([key]) => nextAllSkills.includes(key)));
      const nextData = { ...prev, skills: { ...prev.skills, selected, evidenceMap } };
      return { ...nextData, skills: { ...nextData.skills, displayAdvice: generateSkillDisplayAdvice(nextData) } };
    });
  };
  const updateCustomSkills = (custom: string[]) => {
    updateData(prev => {
      const nextAllSkills = Array.from(new Set([...(prev.skills.selected || []), ...custom]));
      const evidenceMap = Object.fromEntries(Object.entries(prev.skills.evidenceMap || {}).filter(([key]) => nextAllSkills.includes(key)));
      const nextData = { ...prev, skills: { ...prev.skills, custom, evidenceMap } };
      return { ...nextData, skills: { ...nextData.skills, displayAdvice: generateSkillDisplayAdvice(nextData) } };
    });
  };
  const updateSkillEvidence = (skill: string, evidence: string[]) => {
    updateData(prev => {
      const nextData = {
        ...prev,
        skills: {
          ...prev.skills,
          evidenceMap: { ...(prev.skills.evidenceMap || {}), [skill]: evidence },
        },
      };
      return { ...nextData, skills: { ...nextData.skills, displayAdvice: generateSkillDisplayAdvice(nextData) } };
    });
  };
  const levelLabel = {
    recommended: '推荐展示',
    optional: '可选展示',
    not_suggested: '暂不建议重点展示',
  };
  const levelStyle = {
    recommended: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    optional: 'border-sky-200 bg-sky-50 text-sky-900',
    not_suggested: 'border-slate-200 bg-slate-50 text-slate-600',
  };
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-slate-950">补充你的技能和证书</h3>
        <p className="mt-1 text-sm text-slate-500">选真实用过的工具或能力，并补充它出现在哪段经历里。系统会根据岗位相关性和经历支撑，判断哪些技能适合展示。</p>
      </div>
      {SKILL_GROUPS.map(group => (
        <Card key={group.title} title={group.title}>
          <div className="flex flex-wrap gap-2">
            {group.skills.map(skill => (
              <button key={skill} onClick={() => toggleSelectedSkill(skill)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${data.skills.selected.includes(skill) ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600'}`}>{skill}</button>
            ))}
          </div>
        </Card>
      ))}
      <Card title="手动添加技能"><TagEditor values={data.skills.custom} onChange={updateCustomSkills} /></Card>
      <Card title="技能使用证据" subtitle="不用排序。给技能补充真实使用场景，后续简历会优先展示有证据支撑、和目标岗位相关的技能。">
        {allSkills.length === 0 ? (
          <p className="text-sm text-slate-500">先在上面选择或添加技能，再补充它们出现在哪些经历里。</p>
        ) : (
          <div className="space-y-3">
            {allSkills.map(skill => {
              const advice = displayAdvice.find(item => item.skill === skill);
              return (
                <div key={skill} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-950">{skill}</span>
                    {advice && <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${levelStyle[advice.level]}`}>{levelLabel[advice.level]}</span>}
                  </div>
                  {advice && <p className="mb-2 text-xs leading-relaxed text-slate-600">{advice.reason}</p>}
                  <TagEditor
                    values={data.skills.evidenceMap?.[skill] || []}
                    onChange={evidence => updateSkillEvidence(skill, evidence)}
                    placeholder="例如：咖啡品牌竞品分析、数学建模比赛、社团招新海报"
                    suggestions={data.experiences.map(exp => exp.title || exp.organization || EXPERIENCE_META[exp.type].title).filter(Boolean).slice(0, 8)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <Card title="证书 / 奖项"><TagEditor values={data.certificates} onChange={certificates => updateData(prev => ({ ...prev, certificates }))} placeholder="例如 CET-6、普通话、奖学金、比赛奖项" /></Card>
    </div>
  );
}

function AbilityStep({ abilities, data, generate, loading }: { abilities: ReturnType<typeof buildAbilitiesFromQuestData>; data: ResumeQuestData; generate: (draftOverride?: ResumeGenerateResult) => void; loading: boolean }) {
  const ruleDraft = useMemo(() => generateResumeDraftFromQuestData({ ...data, abilities }), [data, abilities]);
  const [draft, setDraft] = useState<ResumeGenerateResult>(ruleDraft);
  const [polishStatus, setPolishStatus] = useState<'loading' | 'success' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;
    const roleDerived = getRoleContextFromTarget(data.target.targetRole);
    setDraft(ruleDraft);
    setPolishStatus('loading');

    polishResumeDraftWithAI({
      resumeData: ruleDraft.resumeData,
      questData: { ...data, abilities },
      targetContext: {
        targetRole: data.target.targetRole || '通用校招岗位',
        roleCategory: data.target.inferredRoleCategory || roleDerived.inferredRoleCategory || '通用',
        matchReason: '用户从 0 创建简历时确认的目标岗位。',
        requiredAbilities: data.target.requiredAbilities?.length ? data.target.requiredAbilities : roleDerived.requiredAbilities,
        preferredExperienceSignals: ['课程项目', '竞赛经历', '社团活动', '个人作品'],
        resumeFocus: data.target.resumeFocus || roleDerived.resumeFocus,
      },
      missingInfoWarnings: ruleDraft.missingInfoWarnings,
      generatedHighlights: ruleDraft.generatedHighlights,
    })
      .then(polished => {
        if (cancelled) return;
        setDraft(polished);
        setPolishStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setDraft(ruleDraft);
        setPolishStatus('fallback');
      });

    return () => {
      cancelled = true;
    };
  }, [abilities, data, ruleDraft]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-slate-950">已生成一版简历草稿</h3>
        <p className="mt-1 text-sm text-slate-500">我已经根据你填写的基础信息、教育背景、经历和技能，生成了一版可编辑简历。你可以先查看草稿，再进入工作台继续修改。</p>
      </div>

      <Card title="AI 润色状态">
        {polishStatus === 'loading' && <p className="text-sm text-slate-600">正在尝试调用 LLM 润色经历 bullet 和自我评价。失败时会自动保留规则版草稿。</p>}
        {polishStatus === 'success' && <p className="text-sm font-semibold text-emerald-700">已使用 LLM 润色经历 bullet 和自我评价。</p>}
        {polishStatus === 'fallback' && <p className="text-sm text-amber-700">LLM 暂不可用，当前展示规则版草稿。</p>}
      </Card>

      <Card title="生成摘要">
        <p className="text-sm leading-relaxed text-slate-700">{draft.generationSummary}</p>
      </Card>

      <Card title="已生成亮点">
        <div className="grid gap-2 sm:grid-cols-2">
          {draft.generatedHighlights.map(item => (
            <div key={item} className="rounded-2xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900">{item}</div>
          ))}
        </div>
      </Card>

      <Card title="简历草稿预览">
        <div className="max-h-[680px] overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="origin-top-left scale-[0.72] sm:scale-[0.82] lg:scale-90">
            <ResumePreview data={draft.resumeData} />
          </div>
        </div>
      </Card>

      <Card title="还可以补充的信息">
        {draft.missingInfoWarnings.length === 0 ? (
          <p className="text-sm text-slate-600">当前基础信息比较完整，可以进入工作台继续优化措辞和排版。</p>
        ) : (
          <div className="space-y-2">
            {draft.missingInfoWarnings.map((warning, index) => (
              <div key={`${warning.module}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <div className="font-extrabold">{warning.issue}</div>
                <p className="mt-1 text-amber-900">{warning.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {abilities.length > 0 && (
        <Card title="能力提炼依据">
          {abilities.map(ability => (
            <div key={ability.name} className="rounded-2xl bg-slate-50 p-3">
              <div className="font-extrabold text-slate-950">{ability.name}</div>
              <p className="mt-1 text-sm text-slate-700">证据来源：{ability.evidence.join('、')}</p>
              <p className="mt-1 text-sm text-slate-700">可写进简历：{ability.resumeExpression}</p>
            </div>
          ))}
        </Card>
      )}

      <Card title="进入下一步">
        <p className="text-sm leading-relaxed text-slate-600">点击后会把这版草稿写入 localStorage.resumeWorkspaceState，并进入简历工作台继续手动调整和优化。</p>
        <Button onClick={() => generate(draft)} disabled={loading} className={`mt-4 w-full rounded-2xl h-11 text-white font-bold shadow-lg bg-gradient-to-r ${GRADIENT}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {loading ? '正在写入…' : '进入简历工作台继续优化'}
        </Button>
      </Card>
    </div>
  );
}
