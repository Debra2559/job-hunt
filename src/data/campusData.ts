import { Group, QuickTag, Conversation, AITool } from '@/types/chat';

export const groups: Group[] = [
  { id: 'academic', name: '学业相关', icon: 'GraduationCap' },
  { id: 'life', name: '生活服务', icon: 'Home' },
  { id: 'mental', name: '心理支持', icon: 'Heart' },
  { id: 'admin', name: '行政流程', icon: 'FileText' },
];

export const quickTags: QuickTag[] = [
  { id: '1', title: '学业问题咨询', description: '课程论文怎么写？' },
  { id: '2', title: '心理情绪疏导', description: '压力大怎么调节？' },
  { id: '3', title: '请假流程指引', description: '请假需要哪些材料？' },
  { id: '4', title: '奖助学金申请', description: '奖学金申请条件？' },
  { id: '5', title: '宿舍生活帮助', description: '宿舍报修怎么操作？' },
  { id: '6', title: '职业规划咨询', description: '如何规划未来职业发展？' },
];

export const initialConversations: Conversation[] = [
  {
    id: '1',
    title: '如何写课程论文',
    groupId: 'academic',
    messages: [],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: '2',
    title: '缓考申请步骤',
    groupId: 'admin',
    messages: [],
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14'),
  },
  {
    id: '3',
    title: '宿舍报修流程',
    groupId: 'life',
    messages: [],
    createdAt: new Date('2025-01-13'),
    updatedAt: new Date('2025-01-13'),
  },
  {
    id: '4',
    title: '考试焦虑如何缓解',
    groupId: 'mental',
    messages: [],
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-12'),
  },
  {
    id: '5',
    title: '国家奖学金申请',
    groupId: 'academic',
    messages: [],
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-11'),
  },
];

export const aiTools: AITool[] = [
  { id: 'schedule', name: '课表查询', icon: 'Calendar', description: '查询本周/本学期课表' },
  { id: 'grade', name: '成绩分析', icon: 'BarChart3', description: '分析历史成绩趋势' },
  { id: 'library', name: '图书馆查询', icon: 'BookOpen', description: '查询图书借阅信息' },
  { id: 'repair', name: '宿舍报修', icon: 'Wrench', description: '提交宿舍报修申请' },
];
