import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Eye, FileText, Pencil } from 'lucide-react';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import JobContextBanner from '@/components/career/JobContextBanner';
import ResumeAISuggestions from '@/components/career/ResumeAISuggestions';
import ResumeEditor from '@/components/career/ResumeEditor';
import ResumePreview from '@/components/career/ResumePreview';
import { Button } from '@/components/ui/button';
import type { ResumeData } from '@/lib/resumeTypes';
import { generateResumeSuggestions } from '@/lib/resumeSuggestions';
import {
  readResumeWorkspaceState,
  saveResumeWorkspaceState,
  type ResumeWorkspaceState,
} from '@/lib/resumeWorkspace';

const GRADIENT = 'from-sky-400 via-cyan-500 to-blue-500';

export default function CareerResumeWorkspace() {
  const [workspace, setWorkspace] = useState<ResumeWorkspaceState | null>(() => readResumeWorkspaceState());
  const [view, setView] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    setWorkspace(readResumeWorkspaceState());
  }, []);

  const suggestions = useMemo(() => {
    if (!workspace) return [];
    return generateResumeSuggestions(workspace.resumeData, workspace.targetContext, workspace.source);
  }, [workspace]);

  const updateResume = (resumeData: ResumeData) => {
    if (!workspace) return;
    const nextSuggestions = generateResumeSuggestions(resumeData, workspace.targetContext, workspace.source);
    const next = {
      ...workspace,
      resumeData,
      aiSuggestions: nextSuggestions,
    };
    setWorkspace(next);
    saveResumeWorkspaceState(next);
  };

  const handleExport = () => {
    setView('preview');
    setTimeout(() => window.print(), 250);
  };

  if (!workspace) {
    return (
      <Ch2PageShell
        emoji="📝"
        title="简历工作台"
        subtitle="统一编辑、建议、预览和导出"
        gradient={GRADIENT}
      >
        <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur p-8 text-center shadow-sm">
          <FileText className="w-10 h-10 mx-auto text-sky-500 mb-3" />
          <h2 className="text-lg font-extrabold">还没有可编辑的简历</h2>
          <p className="text-sm text-muted-foreground mt-2">请先从 0 创建简历，或上传旧简历解析。</p>
          <Link
            to="/career/resume"
            className={`mt-5 inline-flex items-center justify-center rounded-2xl h-11 px-5 text-white font-bold shadow-lg bg-gradient-to-r ${GRADIENT}`}
          >
            返回简历创建页 <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </Ch2PageShell>
    );
  }

  return (
    <Ch2PageShell
      emoji="🧰"
      title="简历工作台"
      subtitle={workspace.source === 'quest' ? '从 0 创建结果 · 继续编辑和优化' : '旧简历解析结果 · 继续编辑和优化'}
      gradient={GRADIENT}
      footer={
        <>
          <div className="flex-1 text-xs text-muted-foreground hidden sm:block">编辑后建议会自动刷新</div>
          <Button onClick={handleExport} className={`shrink-0 rounded-2xl h-11 px-5 text-white font-bold shadow-lg bg-gradient-to-r ${GRADIENT}`}>
            <Download className="w-4 h-4 mr-1" /> 导出 PDF
          </Button>
          <Link
            to="/career/tips"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-5 h-11 bg-white border border-sky-100 text-sky-700 font-bold shadow-sm hover:bg-sky-50"
          >
            进入面试准备 <ArrowRight className="w-4 h-4" />
          </Link>
        </>
      }
    >
      <JobContextBanner gradient={GRADIENT} hint="工作台会继续围绕这个目标岗位给出简历建议。" />

      <section className="mb-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
        <div className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground mb-1">目标岗位上下文</div>
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg font-extrabold">{workspace.targetContext.targetRole}</h2>
            <p className="text-xs text-muted-foreground mt-1">{workspace.targetContext.matchReason}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {workspace.targetContext.requiredAbilities.map((ability) => (
              <span key={ability} className="text-[11px] px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-semibold">
                {ability}
              </span>
            ))}
          </div>
          <p className="text-[12px] leading-relaxed text-foreground/75">{workspace.targetContext.resumeFocus}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
        <section className="min-w-0">
          <div className="sticky top-[60px] z-10 -mx-1 px-1 py-2 mb-3 flex items-center gap-2">
            <div className="inline-flex rounded-full bg-white/85 backdrop-blur border border-white p-0.5 shadow-sm">
              <button
                onClick={() => setView('edit')}
                className={`px-3 h-8 rounded-full text-xs font-semibold inline-flex items-center gap-1 transition ${
                  view === 'edit' ? `bg-gradient-to-r ${GRADIENT} text-white shadow` : 'text-foreground/70'
                }`}
              >
                <Pencil className="w-3 h-3" /> 编辑
              </button>
              <button
                onClick={() => setView('preview')}
                className={`px-3 h-8 rounded-full text-xs font-semibold inline-flex items-center gap-1 transition ${
                  view === 'preview' ? `bg-gradient-to-r ${GRADIENT} text-white shadow` : 'text-foreground/70'
                }`}
              >
                <Eye className="w-3 h-3" /> 预览
              </button>
            </div>
          </div>

          {view === 'edit' ? (
            <ResumeEditor data={workspace.resumeData} onChange={updateResume} />
          ) : (
            <div className="overflow-x-auto -mx-2 px-2 pb-4 print:hidden">
              <div className="origin-top scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100 mx-auto" style={{ width: 'fit-content' }}>
                <ResumePreview data={workspace.resumeData} />
              </div>
            </div>
          )}
        </section>

        <div className="xl:sticky xl:top-[84px]">
          <ResumeAISuggestions suggestions={workspace.aiSuggestions?.length ? workspace.aiSuggestions : suggestions} />
        </div>
      </div>

      <div className="hidden print:block">
        <ResumePreview data={workspace.resumeData} />
      </div>
    </Ch2PageShell>
  );
}
