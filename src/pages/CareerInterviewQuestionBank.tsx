import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, BriefcaseBusiness, ListFilter, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import { buildInterviewTipsData, type InterviewTipsData } from '@/lib/interviewTips';
import { readResumeWorkspaceState } from '@/lib/resumeWorkspace';
import { generateQuestionBank } from '@/lib/interview-question-bank/service';
import type { InterviewQuestionBankData, QuestionCategory, QuestionCount } from '@/lib/interview-question-bank/types';
import type { JDAnalysisState } from '@/lib/self-intro/types';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useQuestProgress } from '@/hooks/useQuestProgress';

const COUNTS: QuestionCount[] = [5, 10, 15, 20];
const CATEGORY_LABELS: Record<QuestionCategory | 'all', string> = {
  all: '全部',
  education: '教育背景',
  motivation: '求职动机',
  resume_deep_dive: '简历深挖',
  role_business: '岗位业务',
  behavioral: '行为题',
  hr_stability: 'HR 稳定性',
  reverse_question: '反问面试官',
};

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
    <Ch2PageShell emoji="📚" title="面试题库站" subtitle="岗位定向面经库和 QA 问题" gradient="from-indigo-400 via-sky-500 to-cyan-500">
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">还没有可用于生成面试准备材料的简历内容</h2>
        <p className="mt-3 text-sm leading-relaxed text-sky-900/90">请先完成简历创建或上传旧简历。</p>
        <Button asChild className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-400 via-sky-500 to-cyan-500 font-bold text-white">
          <Link to="/career/resume">返回简历创建页</Link>
        </Button>
      </div>
    </Ch2PageShell>
  );
}

export default function CareerInterviewQuestionBank() {
  const workspace = useMemo(() => readResumeWorkspaceState(), []);
  const interviewTipsData = useMemo(() => {
    if (!workspace) return undefined;
    return readJson<InterviewTipsData>('interviewTipsData') ?? buildInterviewTipsData(workspace);
  }, [workspace]);
  const jdAnalysisState = useMemo(() => readJson<JDAnalysisState>('jdAnalysisState'), []);
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [activeCategory, setActiveCategory] = useState<QuestionCategory | 'all'>('all');
  const [bankData, setBankData] = useState<InterviewQuestionBankData | null>(null);
  const { isDone, markDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  useEffect(() => {
    if (!workspace) return;
    generateQuestionBank({
      workspaceState: workspace,
      interviewTipsData,
      jdAnalysisState,
      questionCount,
      mode: 'auto',
    }).then(setBankData);
  }, [workspace, interviewTipsData, jdAnalysisState, questionCount]);

  useEffect(() => {
    if (!bankData || isDone('question-bank')) return;
    markDone('question-bank');
    onStageCompleted('question-bank');
  }, [bankData, isDone, markDone, onStageCompleted]);

  if (!workspace) return <EmptyState />;

  const categories = bankData ? (Object.keys(bankData.categoryDistribution) as QuestionCategory[]).filter(c => bankData.categoryDistribution[c] > 0) : [];
  const visibleQuestions = bankData?.questions.filter(q => activeCategory === 'all' || q.category === activeCategory) ?? [];

  return (
    <Ch2PageShell
      emoji="📚"
      title="面试题库站"
      subtitle="岗位定向面经库和 QA 问题"
      gradient="from-indigo-400 via-sky-500 to-cyan-500"
      footer={
        <>
          <Button disabled className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-400 via-sky-500 to-cyan-500 font-bold text-white shadow-lg disabled:opacity-60">
            进入模拟面试
          </Button>
          <Button asChild variant="outline" className="flex-1 rounded-2xl border-sky-200 bg-white/90 font-bold text-sky-800">
            <Link to="/career/self-intro">返回开场白训练室</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-sky-800 ring-1 ring-sky-100">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            当前目标岗位
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-950">{workspace.targetContext.targetRole}</h2>
          <p className="mt-2 text-sm leading-relaxed text-sky-900/90">题库会优先围绕目标岗位、简历经历、面试情报站风险点生成。</p>
        </div>

        <Card title="题目数量选择">
          <div className="flex flex-wrap gap-2">
            {COUNTS.map(count => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${questionCount === count ? 'bg-sky-500 text-white shadow' : 'bg-sky-50 text-sky-800 hover:bg-sky-100'}`}
              >
                {count} 题
              </button>
            ))}
          </div>
        </Card>

        <Card title="题型分布说明">
          <div className="flex flex-wrap gap-2">
            {bankData && categories.map(category => (
              <span key={category} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-100">
                {CATEGORY_LABELS[category]} {bankData.categoryDistribution[category]}
              </span>
            ))}
          </div>
        </Card>

        <Card title="题型筛选">
          <div className="flex flex-wrap gap-2">
            {(['all', ...categories] as Array<QuestionCategory | 'all'>).map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition ${activeCategory === category ? 'bg-sky-500 text-white shadow' : 'bg-sky-50 text-sky-800 hover:bg-sky-100'}`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </Card>

        <Card title="QA 问题列表">
          <div className="space-y-3">
            {visibleQuestions.map((item, index) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">Q{index + 1}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{CATEGORY_LABELS[item.category]}</span>
                </div>
                <h4 className="text-base font-black text-slate-950">{item.question}</h4>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl bg-sky-50 p-3">
                    <div className="mb-1 text-xs font-bold text-sky-700">面试官想考察什么</div>
                    <p className="text-sm leading-relaxed text-slate-700">{item.interviewerIntent}</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 p-3">
                    <div className="mb-1 text-xs font-bold text-sky-700">准备材料</div>
                    <p className="text-sm leading-relaxed text-slate-700">{item.materialsToPrepare.join('、')}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 text-xs font-bold text-sky-700">回答思路</div>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {item.answerStrategy.map(strategy => <li key={strategy}>- {strategy}</li>)}
                  </ul>
                </div>
                <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                  <div className="mb-1 text-xs font-bold text-slate-700">参考回答</div>
                  <p className="text-sm leading-relaxed text-slate-700">{item.sampleAnswer}</p>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-sky-700">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    可能追问
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">{item.followUps.join('；')}</p>
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </Ch2PageShell>
  );
}
