import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Loader2, ArrowRight, Upload, FileText, Wand2, Download, Eye, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import JobContextBanner from '@/components/career/JobContextBanner';
import ResumeEditor from '@/components/career/ResumeEditor';
import ResumePreview from '@/components/career/ResumePreview';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { extractTextFromFile } from '@/lib/parseResumeFile';
import { emptyResume, normalizeResume, type ResumeData } from '@/lib/resumeTypes';
import { supabase } from '@/integrations/supabase/client';

const GRADIENT = 'from-sky-400 via-cyan-500 to-blue-500';

async function generateStructured(input: string): Promise<ResumeData> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/ch2-toolkit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON,
      Authorization: `Bearer ${accessToken || ANON}`,
    },
    body: JSON.stringify({ mode: 'resume-structured', input }),
  });
  if (!resp.ok) throw new Error(`AI ${resp.status}`);
  const json = await resp.json();
  return normalizeResume(json?.data);
}

export default function CareerResume() {
  const [resume, setResume] = useState<ResumeData>(emptyResume());
  const [desc, setDesc] = useState('');
  const [tab, setTab] = useState<'desc' | 'upload'>('desc');
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { markDone, isDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();
  const fileRef = useRef<HTMLInputElement>(null);

  const markGenerated = () => {
    setHasContent(true);
    if (!isDone('resume')) {
      markDone('resume');
      onStageCompleted('resume');
      setCompleted(true);
      toast({ title: '🎉 第 1 关通关', description: '简历草稿已生成，可继续编辑或导出 PDF' });
    } else {
      setCompleted(true);
    }
  };

  const handleGenerateFromDesc = async () => {
    if (!desc.trim()) {
      toast({ title: '先描述一下你的经历', description: '哪怕只是一段话也可以' });
      return;
    }
    setLoading(true);
    try {
      const data = await generateStructured(desc.trim());
      setResume(data);
      markGenerated();
    } catch (e: any) {
      toast({ title: '生成失败', description: e?.message || '稍后再试', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      toast({ title: '正在解析文件…', description: file.name });
      const text = await extractTextFromFile(file);
      if (!text || text.length < 20) throw new Error('未能从文件中提取出有效内容');
      const data = await generateStructured(`以下是用户上传的简历原文，请解析为结构化 JSON：\n\n${text}`);
      setResume(data);
      markGenerated();
      toast({ title: '解析完成', description: '已自动填入下方表单，记得检查' });
    } catch (e: any) {
      toast({ title: '解析失败', description: e?.message || '稍后再试', variant: 'destructive' });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleStartBlank = () => {
    setResume(emptyResume());
    setHasContent(true);
    setView('edit');
  };

  const handleExport = () => {
    setView('preview');
    setTimeout(() => window.print(), 250);
  };

  return (
    <Ch2PageShell
      emoji="📝"
      title="一键简历"
      subtitle="上传 / 描述 / 手填三选一，AI 自动结构化，直接导出 PDF"
      gradient={GRADIENT}
      footer={
        completed ? (
          <>
            <div className="flex-1 text-xs text-muted-foreground hidden sm:block">🎉 第 1 关已通关</div>
            <Button onClick={handleExport} variant="outline" className="shrink-0 rounded-2xl h-11 px-4 font-semibold">
              <Download className="w-4 h-4 mr-1" /> 导出 PDF
            </Button>
            <Link
              to="/career/tips"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-5 h-11 bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-500 text-white font-bold shadow-lg hover:opacity-95"
            >
              下一关 <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : hasContent ? (
          <>
            <div className="flex-1 text-xs text-muted-foreground hidden sm:block">填好后可直接导出 PDF</div>
            <Button onClick={handleExport} className={`shrink-0 rounded-2xl h-11 px-5 text-white font-bold shadow-lg bg-gradient-to-r ${GRADIENT}`}>
              <Download className="w-4 h-4 mr-1" /> 导出 PDF
            </Button>
          </>
        ) : (
          <div className="flex-1 text-xs text-muted-foreground text-center">从上传、描述或空白开始 ⬆</div>
        )
      }
    >
      <JobContextBanner gradient={GRADIENT} hint="设定目标岗位后，AI 写简历会按这个方向定关键词与项目侧重。" />

      {!hasContent && (
        <div className="rounded-3xl border border-white/70 bg-white/85 backdrop-blur p-4 sm:p-5 shadow-sm mb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'desc' | 'upload')}>
            <TabsList className="grid grid-cols-2 w-full mb-3 bg-sky-50">
              <TabsTrigger value="desc" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Wand2 className="w-3.5 h-3.5 mr-1" /> 描述生成
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Upload className="w-3.5 h-3.5 mr-1" /> 上传简历
              </TabsTrigger>
            </TabsList>

            <TabsContent value="desc" className="mt-0">
              <p className="text-xs text-muted-foreground mb-2">
                用一段话讲讲你自己：学校、专业、实习、项目、技能…AI 会自动拆解成结构化简历。
              </p>
              <Textarea
                rows={6}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={`示例：我是同济大学计算机大三学生，2026 届。\n暑期在字节做了 2 个月数据分析实习，用 SQL + Python 搭了一个用户留存看板。\n自己做过一个校园二手书 App，React + Supabase，上线 3 个月 800+ 用户。\n想找数据分析 / 增长方向的岗位。`}
                className="resize-none text-sm bg-white/70 border-white"
              />
              <Button
                onClick={handleGenerateFromDesc}
                disabled={loading}
                className={`w-full mt-3 h-11 rounded-2xl text-white font-bold shadow-lg bg-gradient-to-r ${GRADIENT}`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {loading ? '正在生成…' : '一键生成可编辑简历'}
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="w-full rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 hover:bg-sky-50 transition py-8 text-center"
              >
                {loading ? (
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-sky-500" />
                ) : (
                  <FileText className="w-7 h-7 mx-auto text-sky-500" />
                )}
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {loading ? '正在解析…' : '点击上传简历'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">支持 PDF / DOCX / TXT，本地解析后由 AI 结构化</div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-3 text-center">
            <button
              onClick={handleStartBlank}
              className="text-[12px] text-sky-600 hover:text-sky-700 font-medium"
            >
              或者，从空白开始手动填写 →
            </button>
          </div>
        </div>
      )}

      {hasContent && (
        <>
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
            <div className="flex-1" />
            <button
              onClick={() => { setHasContent(false); setResume(emptyResume()); setDesc(''); }}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              重新开始
            </button>
          </div>

          {view === 'edit' ? (
            <ResumeEditor data={resume} onChange={setResume} />
          ) : (
            <div className="overflow-x-auto -mx-2 px-2 pb-4">
              <div className="origin-top-left scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100" style={{ transformOrigin: 'top center' }}>
                <ResumePreview data={resume} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Always render hidden printable copy so print works from any view */}
      {hasContent && view !== 'preview' && (
        <div className="hidden print:block">
          <ResumePreview data={resume} />
        </div>
      )}
    </Ch2PageShell>
  );
}
