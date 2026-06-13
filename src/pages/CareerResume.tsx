import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, FileText, Image as ImageIcon, Loader2, Route, Upload,
} from 'lucide-react';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import ResumeTargetCard from '@/components/career/ResumeTargetCard';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { extractTextFromFile } from '@/lib/parseResumeFile';
import { generateStructuredResume } from '@/lib/resumeGenerate';
import { parseResumeTextToResumeData } from '@/lib/resumeParser';
import { formatRoleContextForPrompt, readResumeRoleContext, type ResumeRoleContext } from '@/lib/resumeRoleContext';
import { generateResumeSuggestions } from '@/lib/resumeSuggestions';
import { saveResumeWorkspaceState } from '@/lib/resumeWorkspace';

const GRADIENT = 'from-sky-400 via-cyan-500 to-blue-500';

export default function CareerResume() {
  const navigate = useNavigate();
  const [roleContext, setRoleContext] = useState<ResumeRoleContext | null>(() => readResumeRoleContext());
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentTargetContext = () => roleContext || {
    targetRole: '通用校招岗位',
    roleCategory: '通用',
    matchReason: '用户暂未设置明确目标岗位。',
    requiredAbilities: ['学习能力', '沟通表达', '结构化思考', '执行力'],
    preferredExperienceSignals: ['课程项目', '竞赛经历', '社团活动', '个人作品'],
    resumeFocus: '优先整理真实经历，并补足动作、方法、结果和量化信息。',
  };

  const createWorkspaceFromText = async (text: string, sourceName = '粘贴文本') => {
    const targetContext = currentTargetContext();
    let parseWarnings: string[] = [];
    let resumeData;

    try {
      toast({ title: '正在用 AI 解析简历…', description: '会优先识别教育、项目、实习、校园经历和技能' });
      resumeData = await generateStructuredResume(`你是简历结构化解析器。请把用户上传或粘贴的旧简历文本，转换成 ResumeData JSON，并面向目标岗位进行轻度优化。

【目标岗位上下文】
${formatRoleContextForPrompt(targetContext)}

【原始简历文本】
${text}

解析要求：
1. 必须尽可能保留真实信息，不要编造学校、公司、奖项、项目、数字。
2. 识别并填入 basic、education、experience、projects、campus、skills、certs、selfEval。
3. 如果 PDF 文本顺序混乱，请根据语义重新归类，不要把整段原文塞进 selfEval。
4. 项目、实习、校园经历的 bullets 要改写为简历表达：动作 + 方法 + 结果。
5. 如果缺少结果或数字，用「待补充：具体结果/数字」占位。
6. target 优先使用目标岗位。
7. 只输出符合 schema 的 JSON。`);
    } catch (error) {
      const parsed = parseResumeTextToResumeData(text, targetContext);
      resumeData = parsed.resumeData;
      parseWarnings = [
        'AI 解析失败，已使用本地规则兜底，结果可能需要手动整理',
        ...parsed.parseWarnings,
      ];
    }

    const aiSuggestions = generateResumeSuggestions(resumeData, targetContext, 'upload');
    saveResumeWorkspaceState({
      source: 'upload',
      targetContext,
      resumeData,
      aiSuggestions,
      sourceEvidence: {
        rawResumeText: text,
        parseWarnings,
      },
      createdAt: new Date().toISOString(),
    });
    if (parseWarnings.length > 0) {
      toast({ title: `${sourceName}解析完成`, description: parseWarnings[0] });
    } else {
      toast({ title: `${sourceName}解析完成`, description: '正在进入简历工作台' });
    }
    navigate('/career/resume-workspace');
  };

  const handlePasteParse = async () => {
    if (!rawText.trim()) {
      toast({ title: '请先粘贴简历文本' });
      return;
    }
    setLoading(true);
    try {
      await createWorkspaceFromText(rawText.trim(), '文本');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      toast({ title: '正在解析文件…', description: file.name });
      const lowerName = file.name.toLowerCase();
      let text = '';
      if (file.type.startsWith('image/') || /\.(png|jpe?g)$/.test(lowerName)) {
        text = `【图片简历：${file.name}】\nMVP 暂无法在前端完成图片 OCR，请在工作台中手动补充，或先把图片中的文字复制到粘贴框。`;
      } else {
        text = await extractTextFromFile(file);
      }
      if (!text || text.length < 20) throw new Error('未能从文件中提取出有效内容');
      await createWorkspaceFromText(text, file.name);
    } catch (e: any) {
      toast({ title: '解析失败', description: e?.message || '稍后再试', variant: 'destructive' });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Ch2PageShell
      emoji="📝"
      title="岗位定向简历"
      subtitle="承接目标岗位，选择从 0 创建或上传旧简历优化"
      gradient={GRADIENT}
      footer={
        <div className="flex-1 text-xs text-muted-foreground text-center">先确认目标岗位，再选择创建方式 ⬆</div>
      }
    >
      <ResumeTargetCard gradient={GRADIENT} onChange={setRoleContext} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Link
          to="/career/resume-quest"
          className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white flex items-center justify-center mb-4 shadow-lg">
            <Route className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base">我没有简历，从 0 开始创建</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            通过闯关式问答完成基础身份、技能发现、经历考古、经历细化和能力发现。
          </p>
          <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-sky-600">
            开始闯关 <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur p-5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-sky-500 text-white flex items-center justify-center mb-4 shadow-lg">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base">我有旧简历，上传解析</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            支持粘贴文本，或上传 PDF / DOCX / TXT / PNG / JPG。解析后统一进入简历工作台。
          </p>
          <Textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="也可以直接把旧简历文本粘贴到这里..."
            className="mt-4 resize-none text-sm bg-white/80"
          />
          <div className="mt-3 grid grid-cols-1 gap-2">
            <button
              onClick={handlePasteParse}
              disabled={loading || !rawText.trim()}
              className="w-full rounded-2xl border border-sky-200 bg-sky-50 hover:bg-sky-100 transition px-4 h-11 text-sm font-bold text-sky-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> 解析粘贴文本
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full rounded-2xl border border-violet-200 bg-violet-50 hover:bg-violet-100 transition px-4 h-11 text-sm font-bold text-violet-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {loading ? '正在解析…' : '上传文件'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
        </div>
      </div>

    </Ch2PageShell>
  );
}
