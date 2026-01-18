import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, FileText, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchResult {
  id: string;
  file_name: string;
  content_text: string;
  tags: string[];
  similarity: number;
}

export const KnowledgeSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      // Call the chat edge function with a special search mode
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: { query: query.trim() },
      });

      if (error) throw error;

      setResults(data?.results || []);
    } catch (error: any) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.7) return 'bg-green-500';
    if (similarity >= 0.5) return 'bg-amber-500';
    return 'bg-orange-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          语义搜索测试
        </CardTitle>
        <CardDescription>
          输入问题测试知识库的语义匹配效果，验证向量嵌入是否正常工作
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="输入问题测试语义搜索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {searched && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">正在搜索...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>未找到相关内容</p>
                <p className="text-sm">请确保知识库文件已生成向量嵌入</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {results.map((result, index) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-muted-foreground">
                            #{index + 1}
                          </span>
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="font-medium truncate max-w-[200px]">
                            {result.file_name}
                          </span>
                        </div>
                        <Badge className={`${getSimilarityColor(result.similarity)} text-white`}>
                          {(result.similarity * 100).toFixed(1)}% 相关
                        </Badge>
                      </div>
                      
                      {result.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {result.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {result.content_text?.substring(0, 300)}...
                      </p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
