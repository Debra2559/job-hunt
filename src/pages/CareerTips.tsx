import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Camera,
  ClipboardCheck,
  MessageSquareText,
  Route,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import JobContextBanner from '@/components/career/JobContextBanner';
import { buildInterviewTipsData } from '@/lib/interviewTips';
import { readResumeWorkspaceState } from '@/lib/resumeWorkspace';

const MODULES = [
  { value: 'target', label: '目标岗位', icon: BriefcaseBusiness },
  { value: 'flow', label: '流程总览', icon: Route },
  { value: 'rounds', label: '每轮重点', icon: Target },
  { value: 'risks', label: '高概率追问', icon: MessageSquareText },
  { value: 'role', label: '岗位准备', icon: Sparkles },
  { value: 'checklist', label: '准备清单', icon: ClipboardCheck },
  { value: 'video', label: '视频形象', icon: Camera },
] as const;

function CardBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function PillList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">暂无明确数据，建议先回到简历工作台补充。</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-100"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-slate-500">暂无建议。</p>;

  return (
    <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CareerTips() {
  const workspace = useMemo(() => readResumeWorkspaceState(), []);
  const tipsData = useMemo(() => (workspace ? buildInterviewTipsData(workspace) : null), [workspace]);

  if (!workspace || !tipsData) {
    return (
      <Ch2PageShell
        emoji="💡"
        title="面试情报站"
        subtitle="根据目标岗位和简历内容生成面试准备建议"
        gradient="from-amber-400 via-yellow-500 to-orange-500"
      >
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
            💡
          </div>
          <h2 className="text-xl font-black text-slate-950">还没有生成面试建议</h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-900/90">
            请先完成简历创建或上传旧简历，系统会根据你的目标岗位和简历内容生成面试准备建议。
          </p>
          <Button asChild className="mt-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 px-5 font-bold text-white">
            <Link to="/career/resume">返回简历创建页</Link>
          </Button>
        </div>
      </Ch2PageShell>
    );
  }

  const targetContext = workspace.targetContext;
  const abilityItems = workspace.abilitySummary?.map(item => `${item.name}：${item.evidence}`) ?? [];
  const highProbabilityQuestions = tipsData.personalizedRisks.length
    ? tipsData.personalizedRisks
    : [{
      id: 'general_follow_up',
      type: 'role_mismatch' as const,
      title: '请重点准备岗位动机和最相关经历',
      description: '当前简历暂未识别出明显风险，但面试官仍会围绕岗位动机、经历真实性和项目细节继续追问。',
      likelyQuestions: tipsData.roleBasedGuide.likelyQuestions.slice(0, 4),
      preparationAdvice: '准备一段 1 分钟自我介绍，并选 1-2 段最能证明岗位能力的经历讲清楚。',
    }];

  return (
    <Ch2PageShell
      emoji="💡"
      title="面试情报站"
      subtitle="根据目标岗位、简历内容和能力标签生成面试准备建议"
      gradient="from-amber-400 via-yellow-500 to-orange-500"
      footer={
        <>
          <Button asChild className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 font-bold text-white shadow-lg">
            <Link to="/career/self-intro">进入开场白训练室</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 rounded-2xl border-amber-200 bg-white/90 font-bold text-amber-800">
            <Link to="/career/resume-workspace">返回简历工作台</Link>
          </Button>
        </>
      }
    >
      <JobContextBanner
        gradient="from-amber-400 via-yellow-500 to-orange-500"
        hint="面试情报会读取你的目标岗位、简历内容和 AI 建议，优先提示最可能被追问的地方。"
      />

      <Tabs defaultValue="target" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-2xl bg-white/80 p-2">
          {MODULES.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-xl px-3 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="target" className="mt-0">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-100">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              当前目标岗位卡片
            </div>
            <h2 className="mt-3 text-2xl font-black text-slate-950">{tipsData.targetRole}</h2>
            <p className="mt-1 text-xs font-bold text-amber-700">岗位类别：{tipsData.roleCategory}</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
              {targetContext.matchReason || '系统会基于当前简历内容判断面试准备重点。'}
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <CardBlock title="核心能力要求">
                <PillList items={targetContext.requiredAbilities ?? tipsData.roleBasedGuide.interviewFocus} />
              </CardBlock>
              <CardBlock title="你的可讲素材">
                <BulletList items={tipsData.profileSummary.strengths.slice(0, 4)} />
              </CardBlock>
              <CardBlock title="需要重点补强">
                <BulletList items={tipsData.profileSummary.risks.slice(0, 4)} />
              </CardBlock>
              <CardBlock title="简历生成策略">
                <p className="text-sm leading-relaxed text-slate-700">
                  {targetContext.resumeFocus || '优先准备和目标岗位最相关的项目、课程、竞赛、实习或校园经历。'}
                </p>
              </CardBlock>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="flow" className="mt-0">
          <CardBlock title="面试流程总览">
            <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
              不同公司流程会不同，但实习和校招面试通常围绕“简历是否匹配、基础能力是否够用、动机是否稳定、团队是否愿意培养你”展开。
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {tipsData.commonFlow.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                  <div className="mb-2 text-xs font-black text-amber-600">STEP {index + 1}</div>
                  <h4 className="font-bold text-slate-900">{step.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{step.description}</p>
                </div>
              ))}
            </div>
          </CardBlock>
        </TabsContent>

        <TabsContent value="rounds" className="mt-0">
          <CardBlock title="每一轮面试看什么">
            <div className="grid gap-3 lg:grid-cols-2">
              {tipsData.roundFocus.map((round) => (
                <div key={round.title} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <h4 className="font-bold text-slate-900">{round.title}</h4>
                  <div className="mt-2">
                    <PillList items={round.focus} />
                  </div>
                  <div className="mt-3">
                    <BulletList items={round.questions.slice(0, 3)} />
                  </div>
                  <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">{round.advice}</p>
                </div>
              ))}
            </div>
          </CardBlock>
        </TabsContent>

        <TabsContent value="risks" className="mt-0">
          <CardBlock title="基于你简历的高概率追问">
            <div className="space-y-3">
              {highProbabilityQuestions.map((risk) => (
                <div key={risk.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <h4 className="font-bold text-slate-900">{risk.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{risk.description}</p>
                  <div className="mt-3 rounded-xl bg-white/80 p-3">
                    <div className="mb-2 text-xs font-bold text-amber-700">可能被问</div>
                    <BulletList items={risk.likelyQuestions} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-amber-900">
                    准备建议：{risk.preparationAdvice}
                  </p>
                </div>
              ))}
            </div>
          </CardBlock>
        </TabsContent>

        <TabsContent value="role" className="mt-0">
          <CardBlock title="岗位定向准备建议">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h4 className="mb-2 font-bold text-slate-900">这个岗位通常看什么</h4>
                <PillList items={tipsData.roleBasedGuide.interviewFocus} />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h4 className="mb-2 font-bold text-slate-900">面试前必须准备</h4>
                <BulletList items={tipsData.roleBasedGuide.mustPrepare} />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h4 className="mb-2 font-bold text-slate-900">高频问题</h4>
                <BulletList items={tipsData.roleBasedGuide.likelyQuestions} />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h4 className="mb-2 font-bold text-slate-900">结合你简历的高概率追问</h4>
                <BulletList items={tipsData.roleBasedGuide.resumeRiskQuestions.length ? tipsData.roleBasedGuide.resumeRiskQuestions : tipsData.roleBasedGuide.likelyQuestions.slice(0, 4)} />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h4 className="mb-2 font-bold text-slate-900">新手特别提醒</h4>
                <BulletList items={tipsData.roleBasedGuide.beginnerTips} />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h4 className="mb-2 font-bold text-slate-900">建议你准备的经历例子</h4>
                <BulletList items={[...tipsData.roleBasedGuide.suggestedExamplesToPrepare, ...abilityItems].slice(0, 8)} />
              </div>
            </div>
          </CardBlock>
        </TabsContent>

        <TabsContent value="checklist" className="mt-0">
          <CardBlock title="面试前准备清单">
            <div className="grid gap-4 lg:grid-cols-3">
              {tipsData.checklist.map((group) => (
                <div key={group.title} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <h4 className="mb-2 font-bold text-slate-900">{group.title}</h4>
                  <BulletList items={group.items} />
                </div>
              ))}
            </div>
          </CardBlock>
        </TabsContent>

        <TabsContent value="video" className="mt-0">
          <CardBlock title="视频面试与形象准备">
            <div className="grid gap-3 lg:grid-cols-2">
              {tipsData.videoGuide.map((guide) => (
                <div key={guide.title} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <h4 className="mb-2 font-bold text-slate-900">{guide.title}</h4>
                  <BulletList items={[...guide.items, ...(guide.avoid ? guide.avoid.map(item => `避免：${item}`) : [])]} />
                </div>
              ))}
            </div>
          </CardBlock>
        </TabsContent>
      </Tabs>
    </Ch2PageShell>
  );
}
