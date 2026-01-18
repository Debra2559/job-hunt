import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, ThumbsDown, RefreshCw, MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackTrendChart } from './FeedbackTrendChart';

// Tag label mappings
const TAG_LABELS: Record<string, string> = {
  accurate: '回答准确',
  clear: '解释清晰',
  helpful: '很有帮助',
  fast: '响应迅速',
  professional: '专业可靠',
  inaccurate: '回答不准确',
  unclear: '解释不清',
  irrelevant: '答非所问',
  incomplete: '回答不完整',
  slow: '响应太慢',
};

interface FeedbackWithMessage {
  id: string;
  user_id: string;
  message_id: string | null;
  feedback_type: string;
  content: string | null;
  created_at: string;
  status: string;
  admin_notes: string | null;
  resolved_at: string | null;
  tags: string[] | null;
  message_content?: string;
  user_display_name?: string;
}

type StatusType = 'pending' | 'in_progress' | 'resolved' | 'ignored';

const statusConfig: Record<StatusType, { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  pending: { label: '待处理', icon: Clock, variant: 'secondary' },
  in_progress: { label: '处理中', icon: AlertCircle, variant: 'default', className: 'bg-amber-500 hover:bg-amber-600' },
  resolved: { label: '已解决', icon: CheckCircle, variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-600' },
  ignored: { label: '已忽略', icon: Clock, variant: 'outline' },
};

export function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<StatusType>('pending');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      const enrichedFeedbacks = await Promise.all(
        (feedbackData || []).map(async (feedback) => {
          let message_content = '';
          let user_display_name = '';

          if (feedback.message_id) {
            const { data: messageData } = await supabase
              .from('messages')
              .select('content')
              .eq('id', feedback.message_id)
              .single();
            message_content = messageData?.content || '';
          }

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

  const handleOpenStatusDialog = (feedback: FeedbackWithMessage) => {
    setSelectedFeedback(feedback);
    setNewStatus((feedback.status as StatusType) || 'pending');
    setAdminNotes(feedback.admin_notes || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedFeedback) return;

    setUpdating(true);
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        admin_notes: adminNotes || null,
      };

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('feedbacks')
        .update(updateData)
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      toast.success('状态更新成功');
      setSelectedFeedback(null);
      loadFeedbacks();
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const positiveCount = feedbacks.filter(f => f.feedback_type === 'positive').length;
  const negativeCount = feedbacks.filter(f => f.feedback_type === 'negative').length;
  const pendingCount = feedbacks.filter(f => f.feedback_type === 'negative' && f.status === 'pending').length;
  const satisfactionRate = feedbacks.length > 0 
    ? ((positiveCount / feedbacks.length) * 100).toFixed(1) 
    : '0';

  const filteredFeedbacks = feedbacks.filter(f => {
    if (activeTab === 'all') return true;
    if (activeTab === 'negative') return f.feedback_type === 'negative';
    if (activeTab === 'pending') return f.feedback_type === 'negative' && f.status === 'pending';
    if (activeTab === 'resolved') return f.status === 'resolved';
    return true;
  });

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status as StatusType] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 w-fit ${config.className || ''}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Trend Chart */}
      <FeedbackTrendChart />

      {/* Feedback List */}
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              反馈管理
            </CardTitle>
            <CardDescription>用户反馈记录与跟进处理</CardDescription>
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
              {pendingCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-amber-500/20 text-amber-600 border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  待处理 {pendingCount}
                </Badge>
              )}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">全部 ({feedbacks.length})</TabsTrigger>
            <TabsTrigger value="negative">差评 ({negativeCount})</TabsTrigger>
            <TabsTrigger value="pending">待处理 ({pendingCount})</TabsTrigger>
            <TabsTrigger value="resolved">已解决 ({feedbacks.filter(f => f.status === 'resolved').length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">类型</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead className="max-w-[150px]">标签</TableHead>
                  <TableHead className="max-w-xs">反馈内容</TableHead>
                  <TableHead className="max-w-xs">相关消息</TableHead>
                  <TableHead className="w-36">时间</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      暂无反馈数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        {feedback.feedback_type === 'positive' ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit bg-emerald-500 hover:bg-emerald-600">
                            <ThumbsUp className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <ThumbsDown className="w-3 h-3" />
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(feedback.status)}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {feedback.user_display_name}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        {feedback.tags && feedback.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {feedback.tags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  feedback.feedback_type === 'positive' 
                                    ? "border-green-500/30 text-green-600 bg-green-500/10"
                                    : "border-red-500/30 text-red-600 bg-red-500/10"
                                )}
                              >
                                {TAG_LABELS[tag] || tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {feedback.content ? (
                          <p className="text-sm truncate" title={feedback.content}>
                            {feedback.content}
                          </p>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {feedback.message_content ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-full block">
                                <span className="flex items-center gap-1.5">
                                  <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{feedback.message_content.slice(0, 40)}...</span>
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
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(feedback.created_at), 'MM-dd HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenStatusDialog(feedback)}
                            >
                              处理
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>处理反馈</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">状态</label>
                                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as StatusType)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">待处理</SelectItem>
                                    <SelectItem value="in_progress">处理中</SelectItem>
                                    <SelectItem value="resolved">已解决</SelectItem>
                                    <SelectItem value="ignored">已忽略</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">管理员备注</label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="添加处理备注..."
                                  className="min-h-[100px]"
                                />
                              </div>
                              {feedback.content && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">用户反馈</label>
                                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                                    {feedback.content}
                                  </div>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">取消</Button>
                              </DialogClose>
                              <Button onClick={handleUpdateStatus} disabled={updating}>
                                {updating ? '更新中...' : '保存'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
    </div>
  );
}
