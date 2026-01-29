import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ThumbsUp, ThumbsDown, Users, MessageSquare, HelpCircle, TrendingUp, Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, subMonths, startOfMonth, eachMonthOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AnalyticsData {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalQueries: number;
  positiveFeedback: number;
  negativeFeedback: number;
}

interface TrendData {
  date: string;
  users: number;
  conversations: number;
  messages: number;
}

interface FeedbackTrendData {
  date: string;
  positive: number;
  negative: number;
}

type TimeRange = '7d' | '30d' | '6m' | 'all';

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
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsTimeRange, setStatsTimeRange] = useState<TimeRange>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [feedbackTrend, setFeedbackTrend] = useState<FeedbackTrendData[]>([]);

  useEffect(() => {
    loadAnalytics(statsTimeRange);
  }, [statsTimeRange]);

  useEffect(() => {
    loadTrendData();
  }, [timeRange]);

  const getDateRange = (range: TimeRange): Date | null => {
    const now = new Date();
    switch (range) {
      case '7d':
        return subDays(now, 7);
      case '30d':
        return subDays(now, 30);
      case '6m':
        return subMonths(now, 6);
      case 'all':
        return null;
    }
  };

  const loadAnalytics = async (range: TimeRange) => {
    setStatsLoading(true);
    try {
      const startDate = getDateRange(range);
      
      // Build queries with optional date filter
      let usersQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
      let convsQuery = supabase.from('conversations').select('*', { count: 'exact', head: true });
      let messagesQuery = supabase.from('messages').select('*', { count: 'exact', head: true });
      let queriesQuery = supabase.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'user');
      let positiveQuery = supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('feedback_type', 'positive');
      let negativeQuery = supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('feedback_type', 'negative');

      if (startDate) {
        const isoDate = startDate.toISOString();
        usersQuery = usersQuery.gte('created_at', isoDate);
        convsQuery = convsQuery.gte('created_at', isoDate);
        messagesQuery = messagesQuery.gte('created_at', isoDate);
        queriesQuery = queriesQuery.gte('created_at', isoDate);
        positiveQuery = positiveQuery.gte('created_at', isoDate);
        negativeQuery = negativeQuery.gte('created_at', isoDate);
      }

      const [usersRes, convsRes, messagesRes, queriesRes, positiveRes, negativeRes] = await Promise.all([
        usersQuery,
        convsQuery,
        messagesQuery,
        queriesQuery,
        positiveQuery,
        negativeQuery,
      ]);

      setData({
        totalUsers: usersRes.count || 0,
        totalConversations: convsRes.count || 0,
        totalMessages: messagesRes.count || 0,
        totalQueries: queriesRes.count || 0,
        positiveFeedback: positiveRes.count || 0,
        negativeFeedback: negativeRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const loadTrendData = async () => {
    try {
      const now = new Date();
      let startDate: Date;
      let dateFormat: string;
      let intervals: Date[];

      if (timeRange === '7d') {
        startDate = subDays(now, 6);
        dateFormat = 'MM/dd';
        intervals = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(now) });
      } else if (timeRange === '30d') {
        startDate = subDays(now, 29);
        dateFormat = 'MM/dd';
        intervals = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(now) });
      } else {
        startDate = subMonths(now, 5);
        dateFormat = 'yyyy/MM';
        intervals = eachMonthOfInterval({ start: startOfMonth(startDate), end: startOfMonth(now) });
      }

      // Fetch all data in date range
      const [usersRes, convsRes, messagesRes, feedbackRes] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('conversations').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('messages').select('created_at').gte('created_at', startDate.toISOString()),
        supabase.from('feedbacks').select('created_at, feedback_type').gte('created_at', startDate.toISOString()),
      ]);

      // Process trend data
      const trend: TrendData[] = intervals.map((date) => {
        const dateStr = format(date, dateFormat, { locale: zhCN });
        const nextDate = timeRange === '6m' 
          ? new Date(date.getFullYear(), date.getMonth() + 1, 1)
          : new Date(date.getTime() + 24 * 60 * 60 * 1000);

        const users = (usersRes.data || []).filter((u) => {
          const d = new Date(u.created_at);
          return d >= date && d < nextDate;
        }).length;

        const conversations = (convsRes.data || []).filter((c) => {
          const d = new Date(c.created_at);
          return d >= date && d < nextDate;
        }).length;

        const messages = (messagesRes.data || []).filter((m) => {
          const d = new Date(m.created_at);
          return d >= date && d < nextDate;
        }).length;

        return { date: dateStr, users, conversations, messages };
      });

      // Process feedback trend
      const fbTrend: FeedbackTrendData[] = intervals.map((date) => {
        const dateStr = format(date, dateFormat, { locale: zhCN });
        const nextDate = timeRange === '6m' 
          ? new Date(date.getFullYear(), date.getMonth() + 1, 1)
          : new Date(date.getTime() + 24 * 60 * 60 * 1000);

        const feedbacks = (feedbackRes.data || []).filter((f) => {
          const d = new Date(f.created_at);
          return d >= date && d < nextDate;
        });

        return {
          date: dateStr,
          positive: feedbacks.filter((f) => f.feedback_type === 'positive').length,
          negative: feedbacks.filter((f) => f.feedback_type === 'negative').length,
        };
      });

      setTrendData(trend);
      setFeedbackTrend(fbTrend);
    } catch (error) {
      console.error('Error loading trend data:', error);
    }
  };

  const getTimeRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case '7d':
        return '近7天';
      case '30d':
        return '近30天';
      case '6m':
        return '近6个月';
      case 'all':
        return '全部时间';
    }
  };

  const stats = [
    {
      title: '新增用户',
      value: data.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: '新增对话',
      value: data.totalConversations,
      icon: MessageSquare,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: '用户提问',
      value: data.totalQueries,
      icon: HelpCircle,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: '正向反馈',
      value: data.positiveFeedback,
      icon: ThumbsUp,
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: '负向反馈',
      value: data.negativeFeedback,
      icon: ThumbsDown,
      gradient: 'from-red-500 to-red-600',
    },
    {
      title: '消息总数',
      value: data.totalMessages,
      icon: MessageSquare,
      gradient: 'from-orange-500 to-orange-600',
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">数据概览</h1>
            <p className="text-muted-foreground text-sm">系统使用数据统计</p>
          </div>
        </div>
      </div>

      {/* Stats Time Range Selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">统计数据</CardTitle>
                <CardDescription className="mt-0.5">
                  {getTimeRangeLabel(statsTimeRange)}数据统计
                </CardDescription>
              </div>
            </div>
            <Tabs value={statsTimeRange} onValueChange={(v) => setStatsTimeRange(v as TimeRange)}>
              <TabsList>
                <TabsTrigger value="7d">7天</TabsTrigger>
                <TabsTrigger value="30d">30天</TabsTrigger>
                <TabsTrigger value="6m">6个月</TabsTrigger>
                <TabsTrigger value="all">全部</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Trend Chart */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">使用趋势</CardTitle>
                <CardDescription className="mt-0.5">用户、对话和消息增长趋势</CardDescription>
              </div>
            </div>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <TabsList>
                <TabsTrigger value="7d">7天</TabsTrigger>
                <TabsTrigger value="30d">30天</TabsTrigger>
                <TabsTrigger value="6m">6个月</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(271, 91%, 65%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(271, 91%, 65%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="新用户"
                  stroke="hsl(217, 91%, 60%)"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  name="新对话"
                  stroke="hsl(271, 91%, 65%)"
                  fillOpacity={1}
                  fill="url(#colorConversations)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  name="新消息"
                  stroke="hsl(160, 84%, 39%)"
                  fillOpacity={1}
                  fill="url(#colorMessages)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Trend Chart */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">反馈趋势</CardTitle>
              <CardDescription className="mt-0.5">正向与负向反馈对比</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedbackTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="positive" name="正向反馈" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="negative" name="负向反馈" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
