import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, ThumbsDown, RefreshCw, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FeedbackWithMessage {
  id: string;
  user_id: string;
  message_id: string | null;
  feedback_type: string;
  content: string | null;
  created_at: string;
  message_content?: string;
  user_display_name?: string;
}

export function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      // Fetch feedbacks
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      // Enrich with message content and user info
      const enrichedFeedbacks = await Promise.all(
        (feedbackData || []).map(async (feedback) => {
          let message_content = '';
          let user_display_name = '';

          // Get message content if message_id exists
          if (feedback.message_id) {
            const { data: messageData } = await supabase
              .from('messages')
              .select('content')
              .eq('id', feedback.message_id)
              .single();
            message_content = messageData?.content || '';
          }

          // Get user display name
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', feedback.user_id)
            .single();
          user_display_name = profileData?.display_name || '匿名用户';

          return {
            ...feedback,
            message_content,
            user_display_name,
          };
        })
      );

      setFeedbacks(enrichedFeedbacks);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeedbacks();
  };

  const positiveCount = feedbacks.filter(f => f.feedback_type === 'positive').length;
  const negativeCount = feedbacks.filter(f => f.feedback_type === 'negative').length;
  const satisfactionRate = feedbacks.length > 0 
    ? ((positiveCount / feedbacks.length) * 100).toFixed(1) 
    : '0';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              反馈管理
            </CardTitle>
            <CardDescription>用户反馈记录与分析</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Badge variant="default" className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {positiveCount}
              </Badge>
              <Badge variant="destructive" className="flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" />
                {negativeCount}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                满意度 {satisfactionRate}%
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>
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
                  <TableHead className="w-24">类型</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead className="max-w-md">相关消息</TableHead>
                  <TableHead>反馈内容</TableHead>
                  <TableHead className="w-40">时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      暂无反馈数据
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        {feedback.feedback_type === 'positive' ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit bg-emerald-500 hover:bg-emerald-600">
                            <ThumbsUp className="w-3 h-3" />
                            好评
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <ThumbsDown className="w-3 h-3" />
                            差评
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {feedback.user_display_name}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {feedback.message_content ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-full block">
                                <span className="flex items-center gap-1.5">
                                  <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{feedback.message_content.slice(0, 60)}...</span>
                                </span>
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>AI回复内容</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-96">
                                <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg">
                                  {feedback.message_content}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {feedback.content || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
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
