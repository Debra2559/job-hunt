import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, File, Trash2, RefreshCw, FileSpreadsheet, Presentation, Eye, RotateCw, X, Plus, Filter, Sparkles, CheckCircle2, Loader2, CheckSquare, Square, Search, FolderInput, Tag } from 'lucide-react';
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
import { KnowledgeUsageStats } from './KnowledgeUsageStats';
import { CategoryManagement, KnowledgeCategory } from './CategoryManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  category_id?: string | null;
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

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
}

export const KnowledgeManagement = () => {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Filter files based on search query and category
  const filteredFiles = files.filter(file => {
    // Category filter
    if (selectedCategory === 'uncategorized' && file.category_id) return false;
    if (selectedCategory && selectedCategory !== 'uncategorized' && file.category_id !== selectedCategory) return false;
    
    // Search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesName = file.file_name.toLowerCase().includes(query);
    const matchesContent = file.content_text?.toLowerCase().includes(query);
    const matchesTags = file.tags?.some(tag => tag.toLowerCase().includes(query));
    return matchesName || matchesContent || matchesTags;
  });

  // Calculate file counts per category
  const fileCounts: Record<string, number> = {
    uncategorized: files.filter(f => !f.category_id).length,
  };
  categories.forEach(cat => {
    fileCounts[cat.id] = files.filter(f => f.category_id === cat.id).length;
  });

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Selection handlers
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    setIsDeleting(true);
    const filesToDelete = files.filter(f => selectedFiles.has(f.id));
    let successCount = 0;
    let errorCount = 0;

    for (const file of filesToDelete) {
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
        successCount++;
      } catch (error) {
        console.error('Error deleting file:', error);
        errorCount++;
      }
    }

    setIsDeleting(false);
    setSelectedFiles(new Set());
    
    toast({
      title: '批量删除完成',
      description: `成功删除 ${successCount} 个文件${errorCount > 0 ? `，${errorCount} 个失败` : ''}`,
    });

    fetchFiles();
  };

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
    fetchCategories();
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

  const processFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    setUploading(true);
    
    // Initialize progress for all files
    const initialProgress: UploadProgress[] = filesToUpload.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadProgress(initialProgress);
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error' as const, progress: 100 } : p
        ));
        toast({
          variant: 'destructive',
          title: '不支持的文件格式',
          description: `${file.name} 不是支持的格式。支持: ${ALLOWED_EXTENSIONS.join(', ')}`,
        });
        continue;
      }

      try {
        // Update progress to 20%
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 20 } : p
        ));

        // Generate a safe file path using UUID to avoid encoding issues with Chinese characters
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const safeFilePath = `${Date.now()}_${crypto.randomUUID()}.${fileExtension}`;
        
        // Upload to storage with safe path
        const { error: uploadError } = await supabase.storage
          .from('knowledge')
          .upload(safeFilePath, file);

        if (uploadError) throw uploadError;

        // Update progress to 50%
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 50 } : p
        ));

        // Determine initial status based on file type
        const needsParsing = ['pdf', 'docx', 'pptx'].includes(fileExtension);
        const isTextFile = ['md', 'txt'].includes(fileExtension);
        
        // For text files, read content directly
        let contentText: string | null = null;
        if (isTextFile) {
          contentText = await file.text();
        }

        // Update progress to 70%
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 70, status: needsParsing ? 'processing' as const : 'uploading' as const } : p
        ));
        
        // Create record in database - store original file name for display
        const { data: insertedFile, error: dbError } = await supabase
          .from('knowledge_files')
          .insert({
            file_name: file.name, // Keep original name for display
            file_type: file.type || `.${fileExtension}`,
            file_size: file.size,
            file_path: safeFilePath, // Use safe path for storage
            status: needsParsing ? 'processing' : 'ready',
            content_text: contentText, // Store content for text files
            tags: [],
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Update progress to 90%
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 90 } : p
        ));

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
        
        // For text files, trigger embedding generation
        if (isTextFile && insertedFile && contentText) {
          console.log('Generating embedding for text file:', file.name);
          supabase.functions.invoke('parse-document', {
            body: {
              fileId: insertedFile.id,
              regenerateEmbedding: true,
            },
          }).then(({ error: embedError }) => {
            if (embedError) {
              console.error('Embedding error:', embedError);
            }
            fetchFiles();
          });
        }

        // Update progress to 100% done
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 100, status: 'done' as const } : p
        ));

        toast({
          title: '上传成功',
          description: needsParsing 
            ? `${file.name} 正在解析中...` 
            : `${file.name} 已添加到知识库`,
        });
      } catch (error: any) {
        console.error('Error uploading file:', error);
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error' as const, progress: 100 } : p
        ));
        toast({
          variant: 'destructive',
          title: '上传失败',
          description: error.message || '请稍后重试',
        });
      }
    }

    setUploading(false);
    fetchFiles();
    
    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    await processFiles(selectedFiles);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      await processFiles(droppedFiles);
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

  const handleChangeCategory = async (fileId: string, categoryId: string | null) => {
    try {
      const { error } = await supabase
        .from('knowledge_files')
        .update({ category_id: categoryId })
        .eq('id', fileId);

      if (error) throw error;
      
      toast({ title: '分类已更新' });
      fetchFiles();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '更新分类失败',
        description: error.message,
      });
    }
  };

  const handleBatchChangeCategory = async (categoryId: string | null) => {
    if (selectedFiles.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('knowledge_files')
        .update({ category_id: categoryId })
        .in('id', Array.from(selectedFiles));

      if (error) throw error;
      
      toast({ title: `已将 ${selectedFiles.size} 个文件移动到分类` });
      setSelectedFiles(new Set());
      fetchFiles();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '批量更新失败',
        description: error.message,
      });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '未分类';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '未分类';
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return 'bg-gray-400';
    const category = categories.find(c => c.id === categoryId);
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      cyan: 'bg-cyan-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
    };
    return category ? (colorMap[category.color] || 'bg-gray-500') : 'bg-gray-400';
  };


  // Count files by status
  const filesWithoutContent = files.filter(f => f.status === 'ready' && !f.content_text);
  const filesWithoutEmbedding = files.filter(f => f.status === 'ready' && f.content_text && !f.embedding);
  const filesWithEmbedding = files.filter(f => f.embedding);

  // Batch process files without content (re-parse them)
  const handleBatchParseContent = async () => {
    const filesToProcess = filesWithoutContent;
    
    if (filesToProcess.length === 0) {
      toast({
        title: '无需处理',
        description: '所有文件都已有内容',
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
          body: { 
            fileId: file.id, 
            filePath: file.file_path, 
            fileName: file.file_name 
          },
        });

        if (error) {
          console.error(`Error parsing ${file.file_name}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing ${file.file_name}:`, error);
        errorCount++;
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setBatchProcessing(false);
    setBatchProgress({ current: 0, total: 0 });

    toast({
      title: '批量解析完成',
      description: `成功: ${successCount} 个文件，失败: ${errorCount} 个文件`,
    });

    fetchFiles();
  };

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
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">知识库管理</CardTitle>
                <CardDescription className="mt-0.5">
                  上传文档文件，AI将基于这些知识回答用户问题
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索文件名或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px]"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
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
          <div className="flex gap-6">
            {/* Category Sidebar */}
            <div className="w-56 flex-shrink-0 border-r pr-4">
              <CategoryManagement
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onCategoriesChange={fetchCategories}
                fileCounts={fileCounts}
              />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
          {/* Drag and Drop Zone */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              mb-4 p-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
              ${isDragging 
                ? 'border-primary bg-primary/5 scale-[1.01]' 
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }
            `}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
              <div>
                <p className={`font-medium ${isDragging ? 'text-primary' : 'text-foreground'}`}>
                  {isDragging ? '释放以上传文件' : '拖拽文件到此处上传'}
                </p>
                <p className="text-sm text-muted-foreground">
                  或点击选择文件 · 支持 PDF、Word、PPT、Markdown、TXT
                </p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="mb-4 space-y-2">
              {uploadProgress.map((item, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate max-w-[70%]">{item.fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.status === 'uploading' && '上传中...'}
                      {item.status === 'processing' && '解析中...'}
                      {item.status === 'done' && '✓ 完成'}
                      {item.status === 'error' && '✗ 失败'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        item.status === 'error' ? 'bg-destructive' :
                        item.status === 'done' ? 'bg-green-500' :
                        'bg-primary'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">
                支持的文件格式：PDF、Word文档(.docx)、PPT(.pptx)、Excel(.xlsx)、Markdown(.md)、文本文件(.txt)
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                推荐标签：政策法规、学业指导、心理健康、就业指导、校园生活、行政服务
              </p>
            </div>
            
            {/* Processing Status */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {filesWithoutContent.length > 0 && (
                  <span className="flex items-center gap-1.5 text-red-500">
                    <FileText className="w-4 h-4" />
                    <span>待解析: {filesWithoutContent.length}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-muted-foreground">待嵌入: {filesWithoutEmbedding.length}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">已就绪: {filesWithEmbedding.length}</span>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {filesWithoutContent.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchParseContent}
                    disabled={batchProcessing}
                    className="gap-2"
                  >
                    {batchProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        解析中 ({batchProgress.current}/{batchProgress.total})
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        批量解析内容
                      </>
                    )}
                  </Button>
                )}
                {filesWithoutEmbedding.length > 0 && !batchProcessing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchGenerateEmbeddings}
                    disabled={batchProcessing}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    批量生成嵌入
                  </Button>
                )}
              </div>
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
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的文件</p>
              <p className="text-sm">尝试其他搜索词或清除筛选条件</p>
            </div>
          ) : (
            <>
              {/* Batch Actions Bar */}
              {selectedFiles.size > 0 && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium">
                  已选择 {selectedFiles.size} 个文件
                </span>
                <div className="flex items-center gap-2">
                  {/* Batch Move to Category */}
                  <Select onValueChange={(value) => handleBatchChangeCategory(value === 'none' ? null : value)}>
                    <SelectTrigger className="w-[140px] h-8">
                      <FolderInput className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="移动到分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未分类</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getCategoryColor(cat.id)}`} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFiles(new Set())}
                  >
                    取消选择
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                        className="gap-2"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        批量删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除选中的 {selectedFiles.size} 个文件吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBatchDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={toggleSelectAll}
                    >
                      {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">文件名</TableHead>
                  <TableHead className="whitespace-nowrap">分类</TableHead>
                  <TableHead className="whitespace-nowrap">标签</TableHead>
                  <TableHead className="whitespace-nowrap">大小</TableHead>
                  <TableHead className="whitespace-nowrap">状态</TableHead>
                  <TableHead className="whitespace-nowrap">嵌入</TableHead>
                  <TableHead className="whitespace-nowrap">上传时间</TableHead>
                  <TableHead className="text-right whitespace-nowrap">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow 
                    key={file.id}
                    className={selectedFiles.has(file.id) ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        {selectedFiles.has(file.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.file_type)}
                        <span 
                          className="truncate max-w-[200px] cursor-pointer hover:text-primary hover:underline"
                          onClick={() => {
                            setPreviewFile(file);
                            setPreviewOpen(true);
                          }}
                        >
                          {file.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={file.category_id || 'none'} 
                        onValueChange={(value) => handleChangeCategory(file.id, value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="h-7 w-[100px] text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${getCategoryColor(file.category_id)}`} />
                            <span className="truncate">{getCategoryName(file.category_id)}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-400" />
                              未分类
                            </div>
                          </SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getCategoryColor(cat.id)}`} />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <TableCell className="whitespace-nowrap">{formatFileSize(file.file_size)}</TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(file.status)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {file.embedding ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : file.content_text ? (
                        <span className="text-amber-500 text-xs">待生成</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleString('zh-CN', {
                        month: 'numeric',
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
            </>
          )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Usage Statistics */}
      <KnowledgeUsageStats />

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

