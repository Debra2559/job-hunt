import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, ThumbsUp, ThumbsDown, Users, MessageSquare, HelpCircle } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalQueries: number;
  positiveFeedback: number;
  negativeFeedback: number;
}

export function DataManagement() {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    totalQueries: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total conversations
      const { count: convsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      // Get total messages (queries)
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Get user messages count (actual queries)
      const { count: queriesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      // Get feedback counts
      const { count: positiveCount } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('feedback_type', 'positive');

      const { count: negativeCount } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('feedback_type', 'negative');

      setData({
        totalUsers: usersCount || 0,
        totalConversations: convsCount || 0,
        totalMessages: messagesCount || 0,
        totalQueries: queriesCount || 0,
        positiveFeedback: positiveCount || 0,
        negativeFeedback: negativeCount || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: '总用户数',
      value: data.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      title: '总对话数',
      value: data.totalConversations,
      icon: MessageSquare,
      gradient: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
    },
    {
      title: '总提问数',
      value: data.totalQueries,
      icon: HelpCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
    },
    {
      title: '正向反馈',
      value: data.positiveFeedback,
      icon: ThumbsUp,
      gradient: 'from-green-500 to-green-600',
      bgLight: 'bg-green-50',
    },
    {
      title: '负向反馈',
      value: data.negativeFeedback,
      icon: ThumbsDown,
      gradient: 'from-red-500 to-red-600',
      bgLight: 'bg-red-50',
    },
    {
      title: '总消息数',
      value: data.totalMessages,
      icon: MessageSquare,
      gradient: 'from-orange-500 to-orange-600',
      bgLight: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">数据概览</h1>
            <p className="text-muted-foreground text-sm">系统使用数据统计</p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">数据概览</h1>
          <p className="text-muted-foreground text-sm">系统使用数据统计</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
