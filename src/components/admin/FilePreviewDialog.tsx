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
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    if (open && file) {
      loadFileContent();
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

  const isPdfFile = file?.file_type.includes('pdf');
  const isTextFile = ['md', 'txt'].includes(file?.file_name.split('.').pop()?.toLowerCase() || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileText className="w-5 h-5 text-primary" />
            <span className="truncate">{file?.file_name}</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({getFileTypeLabel(file?.file_type || '')})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : isPdfFile && downloadUrl ? (
            <div className="flex-1 min-h-[400px]">
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
