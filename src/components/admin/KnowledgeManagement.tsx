import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, File, Trash2, RefreshCw, FileSpreadsheet, Presentation, Eye, RotateCw, Tag, X, Plus, Filter, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilePreviewDialog } from './FilePreviewDialog';
import { KnowledgeSearch } from './KnowledgeSearch';

interface KnowledgeFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
  status: string;
  content_text?: string | null;
  tags?: string[] | null;
  embedding?: string | null;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/markdown',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.xlsx', '.md', '.txt'];

// Predefined tag colors
const TAG_COLORS: Record<string, string> = {
  '政策法规': 'bg-blue-500',
  '学业指导': 'bg-green-500',
  '心理健康': 'bg-purple-500',
  '就业指导': 'bg-orange-500',
  '校园生活': 'bg-pink-500',
  '行政服务': 'bg-cyan-500',
};

export const KnowledgeManagement = () => {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('knowledge_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterTag) {
        query = query.contains('tags', [filterTag]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);

      // Extract all unique tags
      const tags = new Set<string>();
      data?.forEach(file => {
        file.tags?.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error fetching knowledge files:', error);
      toast({
        variant: 'destructive',
        title: '获取知识库文件失败',
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [filterTag]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (fileType.includes('word')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (fileType.includes('presentation')) return <Presentation className="w-4 h-4 text-orange-500" />;
    if (fileType.includes('spreadsheet')) return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-500">已就绪</Badge>;
      case 'processing':
        return <Badge variant="secondary">处理中</Badge>;
      case 'error':
        return <Badge variant="destructive">错误</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTagColor = (tag: string) => {
    return TAG_COLORS[tag] || 'bg-gray-500';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    
    for (const file of Array.from(selectedFiles)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast({
          variant: 'destructive',
          title: '不支持的文件格式',
          description: `${file.name} 不是支持的格式。支持: ${ALLOWED_EXTENSIONS.join(', ')}`,
        });
        continue;
      }

      try {
        // Generate a safe file path using UUID to avoid encoding issues with Chinese characters
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const safeFilePath = `${Date.now()}_${crypto.randomUUID()}.${fileExtension}`;
        
        // Upload to storage with safe path
        const { error: uploadError } = await supabase.storage
          .from('knowledge')
          .upload(safeFilePath, file);

        if (uploadError) throw uploadError;

        // Determine initial status based on file type
        const needsParsing = ['pdf', 'docx', 'pptx'].includes(ext.replace('.', ''));
        
        // Create record in database - store original file name for display
        const { data: insertedFile, error: dbError } = await supabase
          .from('knowledge_files')
          .insert({
            file_name: file.name, // Keep original name for display
            file_type: file.type || `.${fileExtension}`,
            file_size: file.size,
            file_path: safeFilePath, // Use safe path for storage
            status: needsParsing ? 'processing' : 'ready',
            tags: [],
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Trigger document parsing for PDF, DOCX, PPTX
        if (needsParsing && insertedFile) {
          console.log('Triggering document parsing for:', file.name);
          supabase.functions.invoke('parse-document', {
            body: {
              fileId: insertedFile.id,
              filePath: safeFilePath,
              fileName: file.name,
            },
          }).then(({ error: parseError }) => {
            if (parseError) {
              console.error('Parse error:', parseError);
              toast({
                variant: 'destructive',
                title: '文档解析失败',
                description: `${file.name} 解析失败，请稍后重试`,
              });
            } else {
              toast({
                title: '解析完成',
                description: `${file.name} 文本内容已提取`,
              });
            }
            fetchFiles();
          });
        }

        toast({
          title: '上传成功',
          description: needsParsing 
            ? `${file.name} 正在解析中...` 
            : `${file.name} 已添加到知识库`,
        });
      } catch (error: any) {
        console.error('Error uploading file:', error);
        toast({
          variant: 'destructive',
          title: '上传失败',
          description: error.message || '请稍后重试',
        });
      }
    }

    setUploading(false);
    fetchFiles();
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file: KnowledgeFile) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('knowledge')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('knowledge_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: '删除成功',
        description: `${file.file_name} 已从知识库移除`,
      });

      fetchFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error.message || '请稍后重试',
      });
    }
  };

  const handleAddTag = async (fileId: string, currentTags: string[], newTag: string) => {
    if (!newTag.trim() || currentTags.includes(newTag.trim())) return;
    
    const updatedTags = [...currentTags, newTag.trim()];
    try {
      const { error } = await supabase
        .from('knowledge_files')
        .update({ tags: updatedTags })
        .eq('id', fileId);

      if (error) throw error;
      
      // Trigger embedding regeneration
      supabase.functions.invoke('parse-document', {
        body: { fileId, regenerateEmbedding: true },
      });

      fetchFiles();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '添加标签失败',
        description: error.message,
      });
    }
  };

  const handleRemoveTag = async (fileId: string, currentTags: string[], tagToRemove: string) => {
    const updatedTags = currentTags.filter(t => t !== tagToRemove);
    try {
      const { error } = await supabase
        .from('knowledge_files')
        .update({ tags: updatedTags })
        .eq('id', fileId);

      if (error) throw error;
      fetchFiles();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '删除标签失败',
        description: error.message,
      });
    }
  };

  // Count files without embeddings
  const filesWithoutEmbedding = files.filter(f => f.status === 'ready' && f.content_text && !f.embedding);
  const filesWithEmbedding = files.filter(f => f.embedding);

  // Batch generate embeddings for all files
  const handleBatchGenerateEmbeddings = async () => {
    const filesToProcess = filesWithoutEmbedding;
    
    if (filesToProcess.length === 0) {
      toast({
        title: '无需处理',
        description: '所有文件都已生成向量嵌入',
      });
      return;
    }

    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: filesToProcess.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      setBatchProgress({ current: i + 1, total: filesToProcess.length });

      try {
        const { error } = await supabase.functions.invoke('parse-document', {
          body: { fileId: file.id, regenerateEmbedding: true },
        });

        if (error) {
          console.error(`Error generating embedding for ${file.file_name}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing ${file.file_name}:`, error);
        errorCount++;
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setBatchProcessing(false);
    setBatchProgress({ current: 0, total: 0 });

    toast({
      title: '批量处理完成',
      description: `成功: ${successCount} 个文件，失败: ${errorCount} 个文件`,
    });

    fetchFiles();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>知识库管理</CardTitle>
              <CardDescription>
                上传文档文件，AI将基于这些知识回答用户问题
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="w-4 h-4" />
                    {filterTag || '筛选标签'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="space-y-1">
                    <Button
                      variant={filterTag === null ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setFilterTag(null)}
                    >
                      全部
                    </Button>
                    {allTags.map(tag => (
                      <Button
                        key={tag}
                        variant={filterTag === tag ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFilterTag(tag)}
                      >
                        <span className={`w-2 h-2 rounded-full mr-2 ${getTagColor(tag)}`} />
                        {tag}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchFiles}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? '上传中...' : '上传文件'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">
                支持的文件格式：PDF、Word文档(.docx)、PPT(.pptx)、Excel(.xlsx)、Markdown(.md)、文本文件(.txt)
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                推荐标签：政策法规、学业指导、心理健康、就业指导、校园生活、行政服务
              </p>
            </div>
            
            {/* Embedding Status */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">已嵌入: {filesWithEmbedding.length}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-muted-foreground">待嵌入: {filesWithoutEmbedding.length}</span>
                </span>
              </div>
              
              {filesWithoutEmbedding.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchGenerateEmbeddings}
                  disabled={batchProcessing}
                  className="gap-2"
                >
                  {batchProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      处理中 ({batchProgress.current}/{batchProgress.total})
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      批量生成嵌入
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>知识库为空</p>
              <p className="text-sm">上传文件开始构建知识库</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>嵌入</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.file_type)}
                        <span className="truncate max-w-[200px]">{file.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TagEditor 
                        fileId={file.id}
                        tags={file.tags || []}
                        onAddTag={handleAddTag}
                        onRemoveTag={handleRemoveTag}
                        getTagColor={getTagColor}
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    <TableCell>{getStatusBadge(file.status)}</TableCell>
                    <TableCell>
                      {file.embedding ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : file.content_text ? (
                        <span className="text-amber-500 text-xs">待生成</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(file.created_at).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setPreviewFile(file);
                            setPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(file.status === 'error' || (file.status === 'ready' && !file.content_text)) && 
                          ['pdf', 'docx', 'pptx'].includes(file.file_name.split('.').pop()?.toLowerCase() || '') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="重新解析"
                            onClick={async () => {
                              toast({ title: '正在解析...', description: file.file_name });
                              const { error } = await supabase.functions.invoke('parse-document', {
                                body: {
                                  fileId: file.id,
                                  filePath: file.file_path,
                                  fileName: file.file_name,
                                },
                              });
                              if (error) {
                                toast({ variant: 'destructive', title: '解析失败', description: error.message });
                              } else {
                                toast({ title: '解析成功', description: `${file.file_name} 已更新` });
                              }
                              fetchFiles();
                            }}
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除 "{file.file_name}" 吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(file)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Semantic Search Test */}
      <KnowledgeSearch />

      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        file={previewFile}
      />
    </div>
  );
};

// Tag Editor Component
interface TagEditorProps {
  fileId: string;
  tags: string[];
  onAddTag: (fileId: string, currentTags: string[], newTag: string) => void;
  onRemoveTag: (fileId: string, currentTags: string[], tagToRemove: string) => void;
  getTagColor: (tag: string) => string;
}

const TagEditor = ({ fileId, tags, onAddTag, onRemoveTag, getTagColor }: TagEditorProps) => {
  const [newTag, setNewTag] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const suggestedTags = ['政策法规', '学业指导', '心理健康', '就业指导', '校园生活', '行政服务'];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map(tag => (
        <Badge 
          key={tag} 
          variant="secondary" 
          className={`${getTagColor(tag)} text-white text-xs flex items-center gap-1`}
        >
          {tag}
          <X 
            className="w-3 h-3 cursor-pointer hover:opacity-70" 
            onClick={() => onRemoveTag(fileId, tags, tag)}
          />
        </Badge>
      ))}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-2">
            <Input
              placeholder="输入标签..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  onAddTag(fileId, tags, newTag);
                  setNewTag('');
                  setIsOpen(false);
                }
              }}
              className="h-8"
            />
            <div className="flex flex-wrap gap-1">
              {suggestedTags.filter(t => !tags.includes(t)).slice(0, 4).map(tag => (
                <Badge 
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs"
                  onClick={() => {
                    onAddTag(fileId, tags, tag);
                    setIsOpen(false);
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};