import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, eachWeekOfInterval, subWeeks, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface FeedbackData {
  id: string;
  feedback_type: string;
  created_at: string;
}

interface ChartDataPoint {
  date: string;
  label: string;
  positive: number;
  negative: number;
  total: number;
  satisfactionRate: number;
}

type TimeRange = '7d' | '30d' | '6m';

export function FeedbackTrendChart() {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  useEffect(() => {
    loadFeedbacks();
  }, [timeRange]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const daysToFetch = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 180;
      const startDate = subDays(new Date(), daysToFetch);

      const { data, error } = await supabase
        .from('feedbacks')
        .select('id, feedback_type, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error loading feedback trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = (): ChartDataPoint[] => {
    const now = new Date();

    if (timeRange === '12w') {
      // Weekly data
      const weeks = eachWeekOfInterval({
        start: subWeeks(now, 11),
        end: now,
      }, { weekStartsOn: 1 });

      return weeks.map((weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekFeedbacks = feedbacks.filter((f) => {
          const date = new Date(f.created_at);
          return date >= weekStart && date <= weekEnd;
        });

        const positive = weekFeedbacks.filter(f => f.feedback_type === 'positive').length;
        const negative = weekFeedbacks.filter(f => f.feedback_type === 'negative').length;
        const total = positive + negative;

        return {
          date: format(weekStart, 'yyyy-MM-dd'),
          label: format(weekStart, 'M/d', { locale: zhCN }),
          positive,
          negative,
          total,
          satisfactionRate: total > 0 ? Math.round((positive / total) * 100) : 0,
        };
      });
    } else {
      // Daily data
      const days = timeRange === '7d' ? 7 : 30;
      const dateRange = eachDayOfInterval({
        start: subDays(now, days - 1),
        end: now,
      });

      return dateRange.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayFeedbacks = feedbacks.filter((f) => {
          const date = new Date(f.created_at);
          return date >= dayStart && date < dayEnd;
        });

        const positive = dayFeedbacks.filter(f => f.feedback_type === 'positive').length;
        const negative = dayFeedbacks.filter(f => f.feedback_type === 'negative').length;
        const total = positive + negative;

        return {
          date: format(day, 'yyyy-MM-dd'),
          label: format(day, timeRange === '7d' ? 'E' : 'M/d', { locale: zhCN }),
          positive,
          negative,
          total,
          satisfactionRate: total > 0 ? Math.round((positive / total) * 100) : 0,
        };
      });
    }
  };

  const chartData = getChartData();
  const totalPositive = chartData.reduce((sum, d) => sum + d.positive, 0);
  const totalNegative = chartData.reduce((sum, d) => sum + d.negative, 0);
  const totalFeedback = totalPositive + totalNegative;
  const overallSatisfaction = totalFeedback > 0 ? Math.round((totalPositive / totalFeedback) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              好评: {data.positive}
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              差评: {data.negative}
            </p>
            <p className="text-muted-foreground pt-1 border-t">
              满意度: {data.satisfactionRate}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">反馈趋势</CardTitle>
              <CardDescription className="mt-0.5">
                反馈数量与满意度变化趋势
              </CardDescription>
            </div>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="7d" className="text-xs">7天</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs">30天</TabsTrigger>
              <TabsTrigger value="12w" className="text-xs">12周</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{totalFeedback}</p>
                <p className="text-xs text-muted-foreground">总反馈</p>
              </div>
              <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{totalPositive}</p>
                <p className="text-xs text-muted-foreground">好评</p>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{totalNegative}</p>
                <p className="text-xs text-muted-foreground">差评</p>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{overallSatisfaction}%</p>
                <p className="text-xs text-muted-foreground">满意度</p>
              </div>
            </div>

            {/* Feedback Count Bar Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                反馈数量
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value) => value === 'positive' ? '好评' : '差评'}
                    />
                    <Bar dataKey="positive" name="positive" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="negative" name="negative" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Satisfaction Rate Line Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                满意度趋势
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '满意度']}
                      labelFormatter={(label) => chartData.find(d => d.label === label)?.date || label}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="satisfactionRate" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
