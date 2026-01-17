import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ThumbsUp, ThumbsDown, Eye, MessageSquare } from 'lucide-react';

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

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            数据概览
          </CardTitle>
          <CardDescription>系统使用数据统计</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="总用户数"
          value={data.totalUsers}
          icon={Eye}
          color="bg-blue-500"
        />
        <StatCard
          title="总对话数"
          value={data.totalConversations}
          icon={MessageSquare}
          color="bg-purple-500"
        />
        <StatCard
          title="总提问数"
          value={data.totalQueries}
          icon={BarChart3}
          color="bg-green-500"
        />
        <StatCard
          title="正向反馈"
          value={data.positiveFeedback}
          icon={ThumbsUp}
          color="bg-emerald-500"
        />
        <StatCard
          title="负向反馈"
          value={data.negativeFeedback}
          icon={ThumbsDown}
          color="bg-red-500"
        />
        <StatCard
          title="总消息数"
          value={data.totalMessages}
          icon={MessageSquare}
          color="bg-orange-500"
        />
      </div>
    </div>
  );
}
