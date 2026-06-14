import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, FileText, MessageSquareText, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import { buildInterviewTipsData, type InterviewTipsData } from '@/lib/interviewTips';
import { readResumeWorkspaceState, type ResumeWorkspaceState } from '@/lib/resumeWorkspace';
import { generateSelfIntro } from '@/lib/self-intro/service';
import type { JDAnalysisState, SelfIntroData } from '@/lib/self-intro/types';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useQuestProgress } from '@/hooks/useQuestProgress';

function readJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : undefined;
  } catch {
    return undefined;
  }
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <Ch2PageShell emoji="🎙️" title="开场白训练室" subtitle="生成自我介绍和核心经历讲述稿" gradient="from-rose-400 via-orange-400 to-amber-500">
      <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">还没有可用于生成面试准备材料的简历内容</h2>
        <p className="mt-3 text-sm leading-relaxed text-orange-900/90">请先完成简历创建或上传旧简历。</p>
        <Button asChild className="mt-5 rounded-2xl bg-gradient-to-r from-rose-400 via-orange-400 to-amber-500 font-bold text-white">
          <Link to="/career/resume">返回简历创建页</Link>
        </Button>
      </div>
    </Ch2PageShell>
  );
}

export default function CareerSelfIntro() {
  const workspace = useMemo(() => readResumeWorkspaceState(), []);
  const interviewTipsData = useMemo(() => {
    if (!workspace) return undefined;
    return readJson<InterviewTipsData>('interviewTipsData') ?? buildInterviewTipsData(workspace);
  }, [workspace]);
  const jdAnalysisState = useMemo(() => readJson<JDAnalysisState>('jdAnalysisState'), []);
  const [introData, setIntroData] = useState<SelfIntroData | null>(null);
  const { isDone, markDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  useEffect(() => {
    if (!workspace) return;
    generateSelfIntro({
      workspaceState: workspace as ResumeWorkspaceState,
      interviewTipsData,
      jdAnalysisState,
      mode: 'auto',
    }).then(setIntroData);
  }, [workspace, interviewTipsData, jdAnalysisState]);

  useEffect(() => {
    if (!introData || isDone('self-intro')) return;
    markDone('self-intro');
    onStageCompleted('self-intro');
  }, [introData, isDone, markDone, onStageCompleted]);

  if (!workspace) return <EmptyState />;

  return (
    <Ch2PageShell
      emoji="🎙️"
      title="开场白训练室"
      subtitle="自我介绍逐字稿与核心经历讲述稿"
      gradient="from-rose-400 via-orange-400 to-amber-500"
      footer={
        <>
          <Button asChild className="flex-1 rounded-2xl bg-gradient-to-r from-rose-400 via-orange-400 to-amber-500 font-bold text-white shadow-lg">
            <Link to="/career/interview-question-bank">进入面试题库站 <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 rounded-2xl border-orange-200 bg-white/90 font-bold text-orange-800">
            <Link to="/career/tips">返回面试情报站</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-orange-800 ring-1 ring-orange-100">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            当前目标岗位
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-950">{workspace.targetContext.targetRole}</h2>
          <p className="mt-2 text-sm leading-relaxed text-orange-900/90">
            {workspace.targetContext.resumeFocus || workspace.targetContext.matchReason || '系统会基于你的简历内容生成保守、不虚构的面试开场表达。'}
          </p>
        </div>

        {!introData ? (
          <Card title="正在生成">
            <p className="text-sm text-slate-600">正在根据简历工作台生成规则版逐字稿。</p>
          </Card>
        ) : (
          <>
            <Card title="自我介绍版本切换">
              <Tabs defaultValue="medium">
                <TabsList className="mb-3 rounded-2xl bg-orange-50 p-1">
                  <TabsTrigger value="short" className="rounded-xl">30 秒</TabsTrigger>
                  <TabsTrigger value="medium" className="rounded-xl">1 分钟</TabsTrigger>
                  <TabsTrigger value="long" className="rounded-xl">2 分钟</TabsTrigger>
                </TabsList>
                <TabsContent value="short"><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{introData.scripts.short}</p></TabsContent>
                <TabsContent value="medium"><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{introData.scripts.medium}</p></TabsContent>
                <TabsContent value="long"><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{introData.scripts.long}</p></TabsContent>
              </Tabs>
            </Card>

            <Card title="逐字稿展示区">
              <div className="flex items-start gap-3 rounded-2xl bg-orange-50 p-4">
                <Mic2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <p className="text-sm leading-relaxed text-orange-950">{introData.scripts.medium}</p>
              </div>
            </Card>

            <Card title="核心经历讲述稿">
              {introData.projectScript ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    <FileText className="h-3.5 w-3.5" />
                    {introData.projectScript.experienceTitle}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{introData.projectScript.script}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">素材不足。建议先补充至少一段课程项目、竞赛、科研或校园经历。</p>
              )}
            </Card>

            <Card title="可能追问">
              <ul className="space-y-2 text-sm text-slate-700">
                {(introData.projectScript?.followUps ?? interviewTipsData?.roleBasedGuide.likelyQuestions ?? []).map(item => (
                  <li key={item} className="flex gap-2">
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="生成说明">
              <ul className="space-y-2 text-sm text-slate-600">
                {introData.generationNotes.map(note => <li key={note}>{note}</li>)}
              </ul>
            </Card>
          </>
        )}
      </div>
    </Ch2PageShell>
  );
}
