import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, FileText, MessageSquare, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FileUsageStat {
  file_id: string;
  file_name: string;
  reference_count: number;
  avg_similarity: number;
  recent_queries: string[];
  last_used: string;
}

export const KnowledgeUsageStats = () => {
  const [stats, setStats] = useState<FileUsageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReferences, setTotalReferences] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch usage data with file info
      const { data: usageData, error } = await supabase
        .from('knowledge_usage')
        .select(`
          id,
          file_id,
          user_query,
          similarity,
          created_at,
          knowledge_files!inner(file_name)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching usage stats:', error);
        return;
      }

      // Aggregate by file
      const fileMap = new Map<string, {
        file_id: string;
        file_name: string;
        count: number;
        total_similarity: number;
        queries: { query: string; time: string }[];
        last_used: string;
      }>();

      for (const usage of usageData || []) {
        const fileId = usage.file_id;
        const fileName = (usage.knowledge_files as any)?.file_name || 'Unknown';
        
        if (!fileMap.has(fileId)) {
          fileMap.set(fileId, {
            file_id: fileId,
            file_name: fileName,
            count: 0,
            total_similarity: 0,
            queries: [],
            last_used: usage.created_at,
          });
        }
        
        const stat = fileMap.get(fileId)!;
        stat.count++;
        stat.total_similarity += usage.similarity || 0;
        if (stat.queries.length < 5) {
          stat.queries.push({ 
            query: usage.user_query, 
            time: usage.created_at 
          });
        }
      }

      // Convert to array and sort by count
      const statsArray: FileUsageStat[] = Array.from(fileMap.values())
        .map(s => ({
          file_id: s.file_id,
          file_name: s.file_name,
          reference_count: s.count,
          avg_similarity: s.count > 0 ? s.total_similarity / s.count : 0,
          recent_queries: s.queries.map(q => q.query),
          last_used: s.last_used,
        }))
        .sort((a, b) => b.reference_count - a.reference_count);

      setStats(statsArray);
      setTotalReferences(usageData?.length || 0);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (fileId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">知识库使用统计</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">知识库使用统计</CardTitle>
              <CardDescription className="mt-0.5">
                追踪知识库文件被引用的频率和相关问题
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{totalReferences}</div>
              <div className="text-xs text-muted-foreground">总引用次数</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{stats.length}</div>
              <div className="text-xs text-muted-foreground">被引用文件</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无使用记录</p>
            <p className="text-sm">当用户提问并引用知识库时，统计数据将在此显示</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead className="text-center">引用次数</TableHead>
                  <TableHead className="text-center">平均相关度</TableHead>
                  <TableHead>最近使用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <Collapsible key={stat.file_id} asChild>
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleRow(stat.file_id)}
                            >
                              {expandedRows.has(stat.file_id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{stat.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono">
                            {stat.reference_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="text-sm">
                              {(stat.avg_similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(stat.last_used)}
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={5} className="p-0">
                            {expandedRows.has(stat.file_id) && (
                              <div className="p-4 space-y-2">
                                <div className="text-sm font-medium text-muted-foreground mb-2">
                                  最近相关问题：
                                </div>
                                {stat.recent_queries.map((query, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 text-sm p-2 bg-background rounded-md"
                                  >
                                    <MessageSquare className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                                    <span className="line-clamp-2">{query}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
