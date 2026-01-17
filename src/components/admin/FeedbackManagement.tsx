import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';

interface Feedback {
  id: string;
  user_id: string;
  message_id: string | null;
  feedback_type: string;
  content: string | null;
  created_at: string;
}

export function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const positiveCount = feedbacks.filter(f => f.feedback_type === 'positive').length;
  const negativeCount = feedbacks.filter(f => f.feedback_type === 'negative').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              反馈管理
            </CardTitle>
            <CardDescription>用户反馈记录</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {positiveCount}
            </Badge>
            <Badge variant="destructive" className="flex items-center gap-1">
              <ThumbsDown className="w-3 h-3" />
              {negativeCount}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>反馈内容</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      暂无反馈数据
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        {feedback.feedback_type === 'positive' ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <ThumbsUp className="w-3 h-3" />
                            正向
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <ThumbsDown className="w-3 h-3" />
                            负向
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {feedback.content || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(feedback.created_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
