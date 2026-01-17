import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { Message, Conversation } from '@/types/chat';
import { initialConversations } from '@/data/campusData';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Get all favorite messages
  const favoriteMessages = conversations.flatMap((conv) =>
    conv.messages.filter((m) => m.isFavorite)
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      // If no active conversation, create one
      if (!activeConversationId) {
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: content.slice(0, 20) + (content.length > 20 ? '...' : ''),
          messages: [userMessage],
          groupId: 'academic',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
      } else {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() }
              : conv
          )
        );
      }

      // Simulate AI response
      setIsTyping(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiResponses: Record<string, string> = {
        '课程论文怎么写？':
          '写课程论文可以分为以下几个步骤：\n\n1. **选题**：选择一个你感兴趣且有研究价值的题目\n2. **文献综述**：查阅相关资料，了解研究现状\n3. **拟定大纲**：确定论文结构，包括引言、正文、结论\n4. **撰写初稿**：按照大纲展开论述，注意逻辑性\n5. **修改完善**：检查语法、格式，确保引用规范\n\n需要更详细的指导吗？',
        '压力大怎么调节？':
          '应对学业压力，可以尝试以下方法：\n\n🧘 **放松技巧**\n- 深呼吸练习：4秒吸气-7秒屏息-8秒呼气\n- 冥想或正念练习\n\n🏃 **身体活动**\n- 适当运动，如跑步、打球\n- 保持规律作息\n\n💬 **社交支持**\n- 与朋友倾诉\n- 向辅导员或心理咨询中心寻求帮助\n\n如果压力持续影响生活，建议预约学校心理咨询服务。需要帮你查询预约方式吗？',
        '请假需要哪些材料？':
          '请假所需材料根据请假类型不同：\n\n📋 **病假**\n- 医院诊断证明或病历\n- 请假申请表\n\n🏠 **事假**\n- 书面说明事由\n- 相关证明材料（如家庭紧急情况证明）\n\n📝 **流程**\n1. 登录教务系统填写请假申请\n2. 辅导员审批\n3. 超过3天需院系领导审批\n\n请假期间的课程和考试需要提前与任课老师沟通。需要我帮你查询请假系统入口吗？',
        '奖学金申请条件？':
          '常见奖学金申请条件：\n\n🏆 **国家奖学金**\n- 学习成绩排名前10%\n- 综合测评成绩优秀\n- 无违纪记录\n\n🎯 **学业奖学金**\n- 学习成绩排名前30%\n- 无挂科记录\n\n💡 **助学金**\n- 家庭经济困难认定\n- 学习成绩达标\n\n申请时间通常在每年9-10月，请关注学院通知。需要帮你查询具体的申请流程吗？',
        '宿舍报修怎么操作？':
          '宿舍报修步骤：\n\n📱 **线上报修**\n1. 登录学校后勤服务平台/App\n2. 选择"宿舍报修"\n3. 填写宿舍楼栋、房号\n4. 描述故障情况（可上传照片）\n5. 提交等待处理\n\n⏰ **处理时效**\n- 一般问题：1-3个工作日\n- 紧急问题（如漏水）：当天响应\n\n📞 **紧急情况**\n可直接拨打后勤服务热线：xxxx-xxxxxxx\n\n需要我帮你查询报修进度吗？',
      };

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          aiResponses[content] ||
          `感谢你的提问！关于"${content}"，我来为你解答：\n\n这是一个很好的问题。作为校园AI辅导员，我可以帮助你了解相关政策、流程和资源。\n\n如果需要更详细的信息，建议你：\n1. 查阅学校官网相关公告\n2. 联系所在院系辅导员\n3. 前往学生事务中心咨询\n\n还有其他问题吗？`,
        timestamp: new Date(),
      };

      const targetConvId = activeConversationId || `conv-${Date.now()}`;
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === targetConvId
            ? { ...conv, messages: [...conv.messages, aiMessage], updatedAt: new Date() }
            : conv
        )
      );
      setIsTyping(false);
    },
    [activeConversationId]
  );

  const handleToggleFavorite = useCallback(
    (messageId: string) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === messageId ? { ...m, isFavorite: !m.isFavorite } : m
                ),
              }
            : conv
        )
      );
    },
    [activeConversationId]
  );

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setShowFavorites(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setShowFavorites(false);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card shadow-md border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative z-40 h-full transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          showFavorites={showFavorites}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Area */}
      <ChatArea
        messages={showFavorites ? favoriteMessages : messages}
        onSendMessage={handleSendMessage}
        onToggleFavorite={handleToggleFavorite}
        isTyping={isTyping}
      />
    </div>
  );
};

export default Index;
