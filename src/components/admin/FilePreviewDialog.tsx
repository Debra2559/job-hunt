import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, ExternalLink, FileText, Loader2, FileCode, Eye } from 'lucide-react';

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id: string;
    file_name: string;
    file_type: string;
    file_path: string;
    content_text?: string | null;
  } | null;
}

export const FilePreviewDialog = ({ open, onOpenChange, file }: FilePreviewDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'content'>('preview');

  useEffect(() => {
    if (open && file) {
      loadFileContent();
      // Default to content tab if we have content_text but not a previewable format
      const ext = file.file_name.split('.').pop()?.toLowerCase();
      const isPreviewable = ['pdf', 'md', 'txt'].includes(ext || '');
      if (!isPreviewable && file.content_text) {
        setActiveTab('content');
      } else {
        setActiveTab('preview');
      }
    } else {
      setContent(null);
      setDownloadUrl(null);
      setError(null);
    }
  }, [open, file]);

  const loadFileContent = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get download URL
      const { data: urlData } = await supabase.storage
        .from('knowledge')
        .createSignedUrl(file.file_path, 3600);
      
      if (urlData?.signedUrl) {
        setDownloadUrl(urlData.signedUrl);
      }

      // If content_text is already stored in DB, use it
      if (file.content_text) {
        setContent(file.content_text);
        setLoading(false);
        return;
      }

      // For text-based files, try to fetch and display content
      const ext = file.file_name.split('.').pop()?.toLowerCase();
      
      if (['md', 'txt'].includes(ext || '')) {
        const { data, error: downloadError } = await supabase.storage
          .from('knowledge')
          .download(file.file_path);

        if (downloadError) throw downloadError;

        const text = await data.text();
        setContent(text);
      } else {
        // For binary files (PDF, DOCX, etc.), show message
        setContent(null);
      }
    } catch (err: any) {
      console.error('Error loading file:', err);
      setError(err.message || '加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF文档';
    if (fileType.includes('word')) return 'Word文档';
    if (fileType.includes('presentation')) return 'PPT演示文稿';
    if (fileType.includes('spreadsheet')) return 'Excel表格';
    if (fileType.includes('markdown') || fileType === '.md') return 'Markdown文档';
    if (fileType.includes('text') || fileType === '.txt') return '文本文件';
    return '文档';
  };

  const ext = file?.file_name.split('.').pop()?.toLowerCase();
  const isPdfFile = file?.file_type.includes('pdf');
  const isTextFile = ['md', 'txt'].includes(ext || '');
  const isOfficeFile = ['docx', 'pptx', 'xlsx'].includes(ext || '');
  const hasExtractedContent = !!file?.content_text;

  // For Office files, use Microsoft Office Online Viewer
  const getOfficeViewerUrl = (url: string) => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileText className="w-5 h-5 text-primary" />
            <span className="truncate">{file?.file_name}</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({getFileTypeLabel(file?.file_type || '')})
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs for preview and content */}
        {hasExtractedContent && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'content')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="w-4 h-4" />
                原始预览
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileCode className="w-4 h-4" />
                提取内容
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex-1 min-h-0 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : activeTab === 'content' && hasExtractedContent ? (
            // Show extracted content
            <ScrollArea className="flex-1 max-h-[500px] rounded-lg border bg-muted/30">
              <pre className="p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed">{file?.content_text}</pre>
            </ScrollArea>
          ) : isPdfFile && downloadUrl ? (
            <div className="flex-1 min-h-[500px]">
              <iframe
                src={`${downloadUrl}#toolbar=0`}
                className="w-full h-full rounded-lg border"
                title={file?.file_name}
              />
            </div>
          ) : isTextFile && content ? (
            <ScrollArea className="flex-1 max-h-[500px] rounded-lg border bg-muted/30">
              <pre className="p-4 text-sm whitespace-pre-wrap font-mono">{content}</pre>
            </ScrollArea>
          ) : isOfficeFile && downloadUrl ? (
            <div className="flex-1 min-h-[500px] flex flex-col">
              <div className="flex-1 rounded-lg border overflow-hidden">
                <iframe
                  src={getOfficeViewerUrl(downloadUrl)}
                  className="w-full h-full"
                  title={file?.file_name}
                  frameBorder="0"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                使用 Microsoft Office Online 预览 · 如无法显示请下载后查看
              </p>
            </div>
          ) : hasExtractedContent ? (
            // If we have extracted content but can't preview, show it
            <ScrollArea className="flex-1 max-h-[500px] rounded-lg border bg-muted/30">
              <pre className="p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed">{file?.content_text}</pre>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">
                该文件格式暂不支持在线预览
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                请下载后使用对应软件打开
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {downloadUrl && (
            <>
              <Button variant="outline" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  新窗口打开
                </a>
              </Button>
              <Button asChild>
                <a href={downloadUrl} download={file?.file_name}>
                  <Download className="w-4 h-4 mr-2" />
                  下载文件
                </a>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
