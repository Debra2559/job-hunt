import { inferRoleCategory } from '@/lib/interviewTips';
import type { ResumeItem } from '@/lib/resumeTypes';
import type { GenerateSelfIntroInput, SelfIntroData } from './types';

const ROLE_KEYWORDS: Record<string, RegExp> = {
  product: /调研|竞品|用户|需求|产品|原型|数据|功能|体验/,
  data: /数据|分析|建模|统计|Python|SQL|Excel|SPSS|Tableau|Power BI|可视化/,
  operation: /内容|活动|社群|用户|运营|文案|复盘|增长/,
  tech: /开发|算法|代码|系统|前端|后端|测试|Java|Python|C\+\+|工程/,
};

function itemText(item: ResumeItem) {
  return [item.title, item.role, item.period, ...item.bullets].filter(Boolean).join(' ');
}

function scoreItem(item: ResumeItem, keywords: string[], rolePattern?: RegExp) {
  const text = itemText(item);
  const keywordScore = keywords.reduce((sum, keyword) => sum + (keyword && text.includes(keyword) ? 3 : 0), 0);
  const roleScore = rolePattern?.test(text) ? 6 : 0;
  const completenessScore = [item.title, item.role, item.period].filter(Boolean).length + item.bullets.length;
  return keywordScore + roleScore + completenessScore;
}

function pickCoreExperience(input: GenerateSelfIntroInput) {
  const { resumeData, targetContext } = input.workspaceState;
  const roleCategory = inferRoleCategory(targetContext.targetRole);
  const jdKeywords = [
    ...(input.jdAnalysisState?.businessKeywords ?? []),
    ...(input.jdAnalysisState?.roleKeywords ?? []),
    ...(input.jdAnalysisState?.requiredSkills ?? []),
  ];
  const rolePattern = ROLE_KEYWORDS[roleCategory];
  const allItems = [...resumeData.projects, ...resumeData.experience, ...resumeData.campus];
  if (!allItems.length) return null;

  return [...allItems].sort((a, b) => scoreItem(b, jdKeywords, rolePattern) - scoreItem(a, jdKeywords, rolePattern))[0];
}

function describeCandidate(input: GenerateSelfIntroInput) {
  const { resumeData, targetContext } = input.workspaceState;
  const targetRole = targetContext.targetRole;
  const name = resumeData.basic.name || '我';
  const school = resumeData.basic.school;
  const major = resumeData.basic.major;
  const identity = [school, major].filter(Boolean).join('，');
  const skills = resumeData.skills.slice(0, 4).join('、');
  const roleFocus = targetContext.requiredAbilities?.slice(0, 3).join('、') || input.interviewTipsData?.roleBasedGuide.interviewFocus.slice(0, 3).join('、') || '岗位相关能力';
  return { name, identity, targetRole, skills, roleFocus };
}

function buildExperienceScript(item: ResumeItem | null, targetRole: string) {
  if (!item) return undefined;
  const bullets = item.bullets.length ? item.bullets.join('；') : '我主要参与了资料整理、任务推进和结果汇报。';
  return {
    experienceTitle: item.title || '核心经历',
    script: `我想重点讲一段和${targetRole}相关的经历：${item.title || '这个项目'}。背景是${item.role || '我参与了其中一部分工作'}，我主要负责${bullets}。最后的交付物或结果需要我在面试前再补充具体证据，例如报告、PPT、数据、反馈或作品链接。复盘来看，这段经历能体现我的信息整理、问题拆解、执行推进和沟通表达能力，也能迁移到${targetRole}的实际工作中。`,
    followUps: [
      '你在这段经历里具体负责什么？',
      '最后交付了什么结果？',
      '这段经历和目标岗位有什么关系？',
      '如果重新做一次，你会怎么优化？',
    ],
  };
}

export function generateSelfIntroByRules(input: GenerateSelfIntroInput): SelfIntroData {
  const { resumeData, targetContext } = input.workspaceState;
  const { name, identity, targetRole, skills, roleFocus } = describeCandidate(input);
  const hasInternship = resumeData.experience.length > 0;
  const hasProject = resumeData.projects.length > 0;
  const hasCampus = resumeData.campus.length > 0;
  const coreExperience = pickCoreExperience(input);
  const coreTitle = coreExperience?.title || (hasProject ? '课程项目' : hasCampus ? '校园经历' : '待补充经历');
  const notes: string[] = [];

  if (!hasInternship) notes.push('当前没有正式实习经历，自我介绍会正面承认经验较少，并强调项目、课程、社团或学习迁移能力。');
  if (!coreExperience) notes.push('当前经历素材较少，建议至少补充一段课程项目、竞赛、科研或校园经历。');
  if (skills) notes.push(`已参考技能：${skills}`);

  const base = identity ? `您好，我是${name}，目前背景是${identity}。` : `您好，我是${name}。`;
  const match = hasInternship
    ? `我有过相关实习或工作经历，比较关注业务背景、负责内容和结果如何匹配${targetRole}。`
    : hasProject
      ? `虽然我正式实习经历还不多，但我会重点用${coreTitle}来证明我在${roleFocus}方面的基础能力。`
      : hasCampus
        ? `虽然我还没有正式实习和完整项目，但我会把校园经历中的组织协调、沟通执行和结果意识迁移到${targetRole}中。`
        : `我目前经历素材还比较少，会重点说明我对${targetRole}的理解、学习意愿和可补充的项目方向。`;

  return {
    targetRole,
    scripts: {
      short: `${base}我这次投递的是${targetRole}。${match}我希望在面试中进一步说明自己为什么适合这个方向。`,
      medium: `${base}我这次投递的是${targetRole}。我理解这个岗位比较看重${roleFocus}。${match}${skills ? `我也具备一些基础工具或技能，比如${skills}。` : ''}接下来我希望结合具体经历说明自己的匹配点，也会诚实说明目前经验不足的地方。`,
      long: `${base}我这次想争取的是${targetRole}。我对这个岗位的理解是，它不只看经历名称，更看能不能把问题拆清楚、把任务推进下去，并且在复盘中持续学习。${match}${coreExperience ? `我最想展开的是${coreExperience.title}，这段经历能体现我如何理解任务、推进执行并沉淀结果。` : '我也意识到当前简历素材还需要补充，所以会优先准备课程项目、竞赛、科研或校园经历作为证明。'}${skills ? `工具和技能方面，我目前写到的包括${skills}，面试前我会为每个技能准备真实使用场景。` : ''}我的期待是在真实业务中快速学习，把已有经历中的能力迁移到岗位工作里。`,
    },
    projectScript: buildExperienceScript(coreExperience, targetRole),
    generationNotes: notes,
    source: 'rules',
  };
}
