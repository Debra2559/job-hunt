import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, FileText, Loader2, Route, Upload,
} from 'lucide-react';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import ResumeTargetCard from '@/components/career/ResumeTargetCard';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { extractTextFromFile } from '@/lib/parseResumeFile';
import { generateStructuredResume } from '@/lib/resumeGenerate';
import { parseResumeTextToResumeData } from '@/lib/resumeParser';
import { readResumeRoleContext, type ResumeRoleContext } from '@/lib/resumeRoleContext';
import { generateResumeSuggestions } from '@/lib/resumeSuggestions';
import { saveResumeWorkspaceState } from '@/lib/resumeWorkspace';

const GRADIENT = 'from-sky-400 via-cyan-500 to-blue-500';

function buildResumeParsePrompt(rawText: string) {
  return `
你是一个严格的简历结构化解析器。请把下面的中文或英文简历文本解析成结构化 JSON。

重要规则：
1. 只根据原文解析，不要编造任何公司、学校、岗位、项目、奖项、技能、时间、数据。
2. 原文没有的信息用空字符串、空数组或省略字段，不要猜。
3. 不要把课程项目包装成正式实习。
4. 不要把未获奖比赛写成获奖。
5. 不要把未发表论文写成已发表。
6. 不要修改姓名、学校、公司、项目名称等专有名词。
7. 输出必须是纯 JSON，不要 markdown，不要解释，不要代码块。
8. 如果某段经历无法确定类型，优先放入 projects。
9. bullet points 要保留原文含义，可以轻微改写为简历表达，但不能新增事实。

请输出如下 JSON 结构：

{
  "basic": {
    "name": "",
    "email": "",
    "phone": "",
    "city": "",
    "links": []
  },
  "education": [
    {
      "school": "",
      "degree": "",
      "major": "",
      "start": "",
      "end": "",
      "gpa": "",
      "courses": [],
      "honors": []
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "start": "",
      "end": "",
      "location": "",
      "bullets": []
    }
  ],
  "projects": [
    {
      "name": "",
      "role": "",
      "start": "",
      "end": "",
      "bullets": [],
      "tools": []
    }
  ],
  "campus": [
    {
      "organization": "",
      "role": "",
      "start": "",
      "end": "",
      "bullets": []
    }
  ],
  "skills": [],
  "certificates": [],
  "awards": [],
  "summary": ""
}

解析要求：

basic：
- 从简历顶部提取姓名、邮箱、电话、城市、链接。
- 链接包括 GitHub、作品集、个人主页、LinkedIn、公众号、小红书等。

education：
- 提取学校、学历、专业、时间、GPA、课程、荣誉。
- 如果时间是“2022.09-2026.06”，start 写 “2022.09”，end 写 “2026.06”。

experience：
- 只放正式实习、工作、兼职、校园大使、助教、助研等组织型经历。
- 每段经历保留 2-5 条 bullets。

projects：
- 放课程项目、比赛项目、科研项目、论文项目、作品项目、数据分析项目、产品项目等。
- 每段项目保留 2-5 条 bullets。
- 如果原文有工具、方法、模型、技术栈，放入 tools。

campus：
- 放社团、学生会、班委、志愿活动、社会实践、校园活动组织等。
- 每段经历保留 1-4 条 bullets。

skills：
- 提取语言、办公软件、数据分析、编程、产品工具、设计工具、科研工具等技能。
- 不要重复。

certificates：
- 提取证书，例如语言证书、职业证书、技能证书。

awards：
- 提取明确奖项、荣誉、奖学金。
- 没有明确获奖不要编。

summary：
- 如果原文已有个人总结，可以提取。
- 如果原文没有总结，可以基于原文保守生成 1-2 句话，但不能新增事实。

下面是简历原文：

${rawText.slice(0, 12000)}
`;
}

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
      resumeData = await generateStructuredResume(buildResumeParsePrompt(text));
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
      const text = await extractTextFromFile(file);
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
            支持粘贴文本，或上传 PDF / DOCX / TXT。解析后统一进入简历工作台。
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? '正在解析…' : '上传文件'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
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
