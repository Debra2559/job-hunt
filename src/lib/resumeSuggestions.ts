import type { ResumeData, ResumeItem } from '@/lib/resumeTypes';
import type { ResumeTargetContext, AISuggestion } from '@/lib/resumeWorkspace';

function allResumeText(resumeData: ResumeData) {
  const itemText = (items: ResumeItem[]) =>
    items.map(item => [item.title, item.role, item.period, ...item.bullets].join(' ')).join(' ');
  return [
    Object.values(resumeData.basic).join(' '),
    resumeData.education.map(e => Object.values(e).join(' ')).join(' '),
    itemText(resumeData.experience),
    itemText(resumeData.projects),
    itemText(resumeData.campus),
    resumeData.skills.join(' '),
    resumeData.certs.join(' '),
    resumeData.selfEval,
  ].join(' ');
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
}

function allItems(resumeData: ResumeData) {
  return [
    ...resumeData.experience.map(item => ({ section: '实习/工作', item })),
    ...resumeData.projects.map(item => ({ section: '项目经历', item })),
    ...resumeData.campus.map(item => ({ section: '校园经历', item })),
  ];
}

function makeSuggestion(
  type: AISuggestion['type'],
  severity: AISuggestion['severity'],
  section: string,
  problem: string,
  suggestion: string,
  suggestedRewrite?: string,
): AISuggestion {
  return {
    id: `${type}-${section}-${problem}`.replace(/\s+/g, '-').slice(0, 96),
    type,
    severity,
    section,
    problem,
    suggestion,
    suggestedRewrite,
  };
}

export function generateResumeSuggestions(
  resumeData: ResumeData,
  targetContext: ResumeTargetContext,
  source: 'quest' | 'upload',
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const text = allResumeText(resumeData);
  const role = targetContext.targetRole || '';

  if (/产品/.test(role) && !hasAny(text, ['用户', '需求', '竞品', '调研', '产品', '原型', '数据'])) {
    suggestions.push(makeSuggestion(
      '岗位匹配',
      'high',
      '项目经历',
      '目标岗位偏产品，但简历里还没有明显的产品相关关键词。',
      '补充用户需求、竞品分析、调研方法、原型方案或数据依据，证明你具备产品基础能力。',
      '围绕用户反馈梳理核心需求，完成竞品功能对比，并输出产品优化建议。',
    ));
  }

  if (/数据|分析/.test(role) && !hasAny(text, ['Python', 'SQL', 'Excel', 'SPSS', '数据', '模型', '可视化'])) {
    suggestions.push(makeSuggestion(
      '岗位匹配',
      'high',
      '技能/项目经历',
      '目标岗位偏数据，但工具和项目中缺少数据分析信号。',
      '补充你使用过的数据工具、分析方法、数据来源和可视化结果。',
      '使用 Excel / SQL 对样本数据进行清洗与统计，产出可视化图表并总结关键结论。',
    ));
  }

  if (/运营/.test(role) && !hasAny(text, ['活动', '内容', '用户', '社群', '文案', '复盘'])) {
    suggestions.push(makeSuggestion(
      '岗位匹配',
      'medium',
      '经历表达',
      '目标岗位偏运营，但简历里缺少运营动作和结果。',
      '补充内容策划、用户触达、活动执行、社群维护或数据复盘相关细节。',
      '参与活动策划与用户触达，整理反馈并复盘转化数据，沉淀后续优化建议。',
    ));
  }

  const itemRows = allItems(resumeData);
  itemRows.forEach(({ section, item }) => {
    const itemText = [item.title, item.role, item.period, ...item.bullets].join(' ');
    if (!hasAny(itemText, ['交付', '产出', '完成', '上线', '报告', '原型', '方案', '作品'])) {
      suggestions.push(makeSuggestion(
        '信息完整度',
        'medium',
        section,
        `「${item.title || '未命名经历'}」缺少明确交付物或结果。`,
        '补充你最后产出了什么，例如报告、PPT、原型、代码、活动方案、数据看板等。',
      ));
    }
    if (!/\d/.test(itemText)) {
      suggestions.push(makeSuggestion(
        '量化建议',
        'low',
        section,
        `「${item.title || '未命名经历'}」没有数字信息。`,
        '补充项目周期、团队人数、问卷数量、活动人数、报告页数、作品数量或提升比例。',
      ));
    }
  });

  const skillEvidenceMap: Record<string, RegExp> = {
    Python: /python/i,
    SQL: /sql/i,
    SPSS: /spss/i,
    Figma: /figma/i,
    Axure: /axure/i,
    CAD: /cad/i,
  };
  resumeData.skills.forEach(skill => {
    const evidenceReg = skillEvidenceMap[skill];
    if (!evidenceReg) return;
    const experienceText = [
      ...resumeData.experience,
      ...resumeData.projects,
      ...resumeData.campus,
    ].map(item => [item.title, item.role, ...item.bullets].join(' ')).join(' ');
    if (!evidenceReg.test(experienceText)) {
      suggestions.push(makeSuggestion(
        '技能可信度',
        'medium',
        '技能',
        `技能里写了 ${skill}，但经历中没有对应使用场景。`,
        `在项目或实习 bullet 中补充 ${skill} 的具体使用方式和产出结果。`,
      ));
    }
  });

  const weakWords = /做了|弄了|搞了|参加了|帮忙/;
  allItems(resumeData).forEach(({ section, item }) => {
    item.bullets.forEach(bullet => {
      if (weakWords.test(bullet)) {
        suggestions.push(makeSuggestion(
          '表达专业度',
          'low',
          section,
          '存在口语化表达，动作不够专业。',
          '把“做了/弄了/搞了/参加了/帮忙”替换为“负责、参与、完成、梳理、分析、产出、协助”等更清晰的动作词。',
          bullet.replace(/做了|弄了|搞了/g, '完成').replace(/参加了/g, '参与').replace(/帮忙/g, '协助'),
        ));
      }
    });
  });

  const riskWords = /主导|统筹|独立负责|显著提升|增长|转化率|发表|获奖/;
  allItems(resumeData).forEach(({ section, item }) => {
    item.bullets.forEach(bullet => {
      if (riskWords.test(bullet) && !/\d|证明|链接|证书|奖项|排名|数据|截图|作品/.test(bullet)) {
        suggestions.push(makeSuggestion(
          '真实性风险',
          'high',
          section,
          '存在强成果或强责任表达，但缺少证据支撑。',
          '补充具体数据、排名、证书、作品链接、截图材料或明确你的真实职责边界。',
        ));
      }
    });
  });

  if (!/\d/.test(text)) {
    suggestions.push(makeSuggestion(
      '量化建议',
      source === 'quest' ? 'medium' : 'high',
      '整体',
      '整份简历几乎没有数字，可信度和说服力会偏弱。',
      '优先补充团队人数、项目周期、问卷数量、活动人数、PPT页数、报告页数、作品数量等基础数字。',
    ));
  }

  return suggestions.slice(0, 12);
}
