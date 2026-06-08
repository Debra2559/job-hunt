import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import ResumeTargetCard from '@/components/career/ResumeTargetCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { generateStructuredResume } from '@/lib/resumeGenerate';
import { formatRoleContextForPrompt, readResumeRoleContext, type ResumeRoleContext } from '@/lib/resumeRoleContext';
import { generateResumeSuggestions } from '@/lib/resumeSuggestions';
import { saveResumeWorkspaceState } from '@/lib/resumeWorkspace';

const GRADIENT = 'from-sky-400 via-cyan-500 to-blue-500';

const identityOptions = ['应届生', '低年级学生', '转专业/转行', '已有实习经验', '暂无正式实习'];
const baseSkills = ['PPT', 'Excel', 'Word', '沟通表达', '信息整理', '活动执行', '数据分析', '英语'];
const experienceOptions = ['课程作业 / 课堂项目', '调研 / 数据分析项目', '大学生竞赛', '社团 / 学生会 / 班委', '科研 / 论文经历', '内容运营 / 个人作品', '兼职 / 志愿服务', '实习 / 工作'];

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter(x => x !== item) : [...list, item];
}

export default function CareerResumeQuest() {
  const navigate = useNavigate();
  const [roleContext, setRoleContext] = useState<ResumeRoleContext | null>(() => readResumeRoleContext());
  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState<string[]>([]);
  const [basic, setBasic] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkills, setCustomSkills] = useState('');
  const [experienceTypes, setExperienceTypes] = useState<string[]>([]);
  const [experienceDetails, setExperienceDetails] = useState('');
  const [strengths, setStrengths] = useState('');
  const [loading, setLoading] = useState(false);
  const { markDone, isDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  const recommendedSkills = useMemo(() => {
    const roleSkills = roleContext?.requiredAbilities || [];
    return Array.from(new Set([...roleSkills, ...baseSkills])).slice(0, 14);
  }, [roleContext]);

  const recommendedExperiences = useMemo(() => {
    const signals = roleContext?.preferredExperienceSignals || [];
    return Array.from(new Set([...signals, ...experienceOptions])).slice(0, 12);
  }, [roleContext]);

  const generate = async () => {
    if (!basic.trim() && !experienceDetails.trim()) {
      toast({ title: '信息还不够', description: '至少补充基础身份或一段经历细节' });
      return;
    }
    setLoading(true);
    try {
      const data = await generateStructuredResume(`请根据以下闯关式问答结果，生成岗位定向的结构化中文简历 JSON。

【目标岗位上下文】
${formatRoleContextForPrompt(roleContext)}

【Level 1 基础身份】
身份标签：${identity.join('、') || '未选择'}
基础信息：${basic || '未填写'}

【Level 2 技能发现】
已选择技能：${skills.join('、') || '未选择'}
补充技能：${customSkills || '无'}

【Level 3 经历考古】
可挖掘经历类型：${experienceTypes.join('、') || '未选择'}

【Level 4 经历细化】
${experienceDetails || '未填写'}

【Level 5 能力发现】
${strengths || '未填写'}

要求：
1. 不要编造事实，缺失信息用「待补充：xxx」占位。
2. 面向目标岗位选择表达重点。
3. bullets 使用动作 + 方法 + 结果，尽量加入量化；没有量化就提示待补充。
4. 没有正式实习时，优先把课程项目、调研、竞赛、社团和个人作品转写成岗位相关经历。`);
      const targetContext = roleContext || {
        targetRole: data.basic.target || '通用校招岗位',
        roleCategory: '通用',
        matchReason: '用户从 0 创建简历时暂未设置明确目标岗位。',
        requiredAbilities: ['学习能力', '沟通表达', '结构化思考', '执行力'],
        preferredExperienceSignals: ['课程项目', '竞赛经历', '社团活动', '个人作品'],
        resumeFocus: '优先整理真实经历，并补足动作、方法、结果和量化信息。',
      };
      saveResumeWorkspaceState({
        source: 'quest',
        targetContext,
        resumeData: data,
        skillGroups: [{ title: '已选择技能', skills: [...skills, ...customSkills.split(/[，,、\s]+/).filter(Boolean)] }],
        abilitySummary: strengths ? [{ name: '自我优势', evidence: strengths }] : [],
        aiSuggestions: generateResumeSuggestions(data, targetContext, 'quest'),
        createdAt: new Date().toISOString(),
      });
      if (!isDone('resume')) {
        markDone('resume');
        onStageCompleted('resume');
      }
      toast({ title: '简历草稿已生成', description: '正在进入简历工作台' });
      navigate('/career/resume-workspace');
    } catch (e: any) {
      toast({ title: '生成失败', description: e?.message || '稍后再试', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Level 1 · 基础身份',
      body: (
        <div className="space-y-4">
          <ChoiceGrid values={identityOptions} selected={identity} onToggle={(v) => setIdentity(toggle(identity, v))} />
          <Textarea
            rows={5}
            value={basic}
            onChange={(e) => setBasic(e.target.value)}
            placeholder="写下你的学校、专业、年级、目标城市、想投岗位、当前经历状态。例：同济大学大三，信息管理专业，想投产品经理实习，目前没有正式实习但做过课程调研和社团活动。"
            className="resize-none bg-white/80"
          />
        </div>
      ),
    },
    {
      title: 'Level 2 · 技能发现',
      body: (
        <div className="space-y-4">
          <ChoiceGrid values={recommendedSkills} selected={skills} onToggle={(v) => setSkills(toggle(skills, v))} />
          <Textarea
            rows={3}
            value={customSkills}
            onChange={(e) => setCustomSkills(e.target.value)}
            placeholder="还有哪些工具、课程、证书、语言、软件能力？可以随便写，AI 会帮你筛选。"
            className="resize-none bg-white/80"
          />
        </div>
      ),
    },
    {
      title: 'Level 3 · 经历考古',
      body: <ChoiceGrid values={recommendedExperiences} selected={experienceTypes} onToggle={(v) => setExperienceTypes(toggle(experienceTypes, v))} />,
    },
    {
      title: 'Level 4 · 经历细化',
      body: (
        <Textarea
          rows={8}
          value={experienceDetails}
          onChange={(e) => setExperienceDetails(e.target.value)}
          placeholder="挑 1-3 段经历写细一点：背景是什么，你负责什么，用了什么方法，最后有什么结果。没有结果数字也可以先写大概。"
          className="resize-none bg-white/80"
        />
      ),
    },
    {
      title: 'Level 5 · 能力发现',
      body: (
        <Textarea
          rows={6}
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          placeholder="你觉得自己比较擅长什么？别人通常怎么评价你？做事时有什么稳定特点？这些会被转成简历里的能力表达。"
          className="resize-none bg-white/80"
        />
      ),
    },
    {
      title: 'Level 6 · 生成岗位定向简历草稿',
      body: (
        <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5">
          <div className="text-sm font-bold text-sky-900">准备生成草稿</div>
          <p className="text-xs text-sky-900/75 leading-relaxed mt-2">
            系统会把你的身份、技能、经历和目标岗位合并，优先选择最能证明岗位能力的素材生成简历。
          </p>
          <Button
            onClick={generate}
            disabled={loading}
            className={`mt-4 w-full rounded-2xl h-11 text-white font-bold shadow-lg bg-gradient-to-r ${GRADIENT}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {loading ? '正在生成…' : '生成岗位定向简历草稿'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Ch2PageShell
      emoji="🧩"
      title="从 0 创建简历"
      subtitle="通过 6 步闯关，把零散经历转成岗位定向简历"
      gradient={GRADIENT}
      footer={
        <>
          <Button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || loading}
            variant="outline"
            className="shrink-0 rounded-2xl h-11 px-5 font-semibold"
          >
            上一步
          </Button>
          <Button
            onClick={() => step === steps.length - 1 ? generate() : setStep(Math.min(steps.length - 1, step + 1))}
            disabled={loading}
            className={`shrink-0 rounded-2xl h-11 px-5 text-white font-bold shadow-lg bg-gradient-to-r ${GRADIENT}`}
          >
            {step === steps.length - 1 ? '生成草稿' : '下一步'} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </>
      }
    >
      <ResumeTargetCard gradient={GRADIENT} onChange={setRoleContext} />

      <section className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={`h-2 flex-1 rounded-full transition ${i <= step ? 'bg-sky-400' : 'bg-slate-200'}`}
              aria-label={s.title}
            />
          ))}
        </div>
        <h2 className="text-base font-extrabold mb-4">{steps[step].title}</h2>
        {steps[step].body}
      </section>
    </Ch2PageShell>
  );
}

function ChoiceGrid({
  values,
  selected,
  onToggle,
}: {
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {values.map((value) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`min-h-10 rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition flex items-center gap-2 ${
              active ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-border/60 bg-white text-foreground/80 hover:border-sky-200'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${active ? 'bg-sky-500 border-sky-500' : 'border-slate-300'}`}>
              {active && <Check className="w-3 h-3 text-white" />}
            </span>
            <span>{value}</span>
          </button>
        );
      })}
    </div>
  );
}
