import { emptyResume, type ResumeData, type ResumeItem } from '@/lib/resumeTypes';
import type { ResumeTargetContext } from '@/lib/resumeWorkspace';

const sectionPatterns = [
  { key: 'education', reg: /教育经历|教育背景|学习经历|学历/i },
  { key: 'experience', reg: /实习经历|工作经历|工作经验|实践经历/i },
  { key: 'projects', reg: /项目经历|项目经验|项目/i },
  { key: 'campus', reg: /校园经历|社团经历|学生工作|志愿经历|竞赛经历/i },
  { key: 'skills', reg: /技能|专业技能|技能证书|个人技能/i },
  { key: 'certs', reg: /奖项|证书|荣誉|获奖/i },
] as const;

function splitLines(rawText: string) {
  return rawText
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function detectSections(lines: string[]) {
  const sections: Record<string, string[]> = { unknown: [] };
  let current = 'unknown';
  lines.forEach(line => {
    const matched = sectionPatterns.find(p => p.reg.test(line) && line.length <= 18);
    if (matched) {
      current = matched.key;
      sections[current] ||= [];
      return;
    }
    sections[current] ||= [];
    sections[current].push(line);
  });
  return sections;
}

function toItems(lines: string[], fallbackTitle: string): ResumeItem[] {
  if (lines.length === 0) return [];
  const chunks: string[][] = [];
  let current: string[] = [];

  lines.forEach(line => {
    const looksLikeTitle = /公司|项目|社团|学生会|协会|实验室|工作室|平台|系统|比赛|竞赛/.test(line) && line.length <= 40;
    if (looksLikeTitle && current.length > 0) {
      chunks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  });
  if (current.length > 0) chunks.push(current);

  return chunks.map((chunk, idx) => ({
    title: chunk[0] || `${fallbackTitle}${idx + 1}`,
    role: '',
    period: chunk.find(line => /\d{4}|至今|现在/.test(line)) || '',
    bullets: chunk.slice(1).length > 0 ? chunk.slice(1, 5) : [chunk[0]],
  }));
}

function parseSkills(lines: string[]) {
  const text = lines.join('，');
  return text
    .split(/[，,、;；\s]+/)
    .map(x => x.trim())
    .filter(x => x && x.length <= 24)
    .slice(0, 24);
}

export function parseResumeTextToResumeData(
  rawText: string,
  targetContext: ResumeTargetContext,
): {
  resumeData: ResumeData;
  parseWarnings: string[];
} {
  const parseWarnings: string[] = [];
  const resumeData = emptyResume();
  const normalized = rawText.trim();

  if (!normalized) {
    return { resumeData, parseWarnings: ['没有可解析的简历文本'] };
  }

  const email = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = normalized.match(/(?:\+?86[-\s]?)?1[3-9]\d{9}/)?.[0] || '';
  resumeData.basic.email = email;
  resumeData.basic.phone = phone;
  resumeData.basic.targetRole = targetContext.targetRole;

  const lines = splitLines(normalized);
  const firstNameLine = lines.find(line => line.length <= 8 && !/[：:0-9@]/.test(line));
  if (firstNameLine) resumeData.basic.name = firstNameLine;

  const sections = detectSections(lines);

  const educationLines = sections.education || [];
  if (educationLines.length > 0) {
    resumeData.education = [{
      school: educationLines.find(line => /大学|学院|学校/.test(line)) || '',
      period: educationLines.find(line => /\d{4}|至今/.test(line)) || '',
      degree: educationLines.find(line => /本科|硕士|博士|专业|学士|研究生/.test(line)) || '',
      gpa: educationLines.find(line => /GPA|绩点|排名/i.test(line)) || '',
      extra: educationLines.filter(line => !/大学|学院|学校|\d{4}|本科|硕士|博士|专业|学士|研究生|GPA|绩点|排名/i.test(line)).slice(0, 3).join('；'),
    }];
  } else {
    parseWarnings.push('未识别到明确的教育经历模块');
  }

  resumeData.experience = toItems(sections.experience || [], '实习经历');
  resumeData.projects = toItems(sections.projects || [], '项目经历');
  resumeData.campus = toItems(sections.campus || [], '校园经历');
  resumeData.skills = parseSkills(sections.skills || []);
  resumeData.certs = parseSkills(sections.certs || []);

  const usedLines = new Set([
    ...educationLines,
    ...(sections.experience || []),
    ...(sections.projects || []),
    ...(sections.campus || []),
    ...(sections.skills || []),
    ...(sections.certs || []),
  ]);
  const leftover = lines.filter(line => !usedLines.has(line));
  if (leftover.length > 0) {
    resumeData.selfEval = leftover.slice(0, 12).join('\n');
    parseWarnings.push('有部分内容未能归入标准模块，已暂存到自我评价中');
  }

  if (!resumeData.projects.length && !resumeData.experience.length && !resumeData.campus.length) {
    parseWarnings.push('未识别到项目、实习或校园经历，建议在工作台中手动补充');
  }

  return { resumeData, parseWarnings };
}
