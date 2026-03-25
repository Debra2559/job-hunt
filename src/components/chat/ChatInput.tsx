import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Send, Wrench, ChevronDown, Plus, X, FileText, Image as ImageIcon, Calendar, BarChart3, BookOpen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { aiTools } from '@/data/campusData';
import { VoiceInput } from './VoiceInput';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Map tool IDs to their icons
const toolIcons: Record<string, React.ReactNode> = {
  schedule: <Calendar className="w-4 h-4 text-primary" />,
  grade: <BarChart3 className="w-4 h-4 text-primary" />,
  library: <BookOpen className="w-4 h-4 text-primary" />,
  repair: <Wrench className="w-4 h-4 text-primary" />,
};


export interface ChatInputRef {
  fillInput: (text: string) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
}

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  isTyping: boolean;
  onToolSelect?: (toolId: string, toolName: string) => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  function ChatInput({ onSendMessage, isTyping, onToolSelect }, ref) {
    const [input, setInput] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleVoiceTranscript = (text: string) => {
      setInput(prev => prev + text);
    };


    useImperativeHandle(ref, () => ({
      fillInput: (text: string) => {
        setInput(text);
        textareaRef.current?.focus();
      },
    }));

    const handleSend = () => {
      if ((input.trim() || uploadedFiles.length > 0) && !isTyping) {
        onSendMessage(input.trim(), uploadedFiles.map(f => f.file));
        setInput('');
        setUploadedFiles([]);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleFileSelect = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newFiles: UploadedFile[] = files.map(file => {
        const uploadedFile: UploadedFile = { file };
        if (file.type.startsWith('image/')) {
          uploadedFile.preview = URL.createObjectURL(file);
        }
        return uploadedFile;
      });
      setUploadedFiles(prev => [...prev, ...newFiles]);
      // Reset input so the same file can be selected again
      e.target.value = '';
    };

    const removeFile = (index: number) => {
      setUploadedFiles(prev => {
        const newFiles = [...prev];
        if (newFiles[index].preview) {
          URL.revokeObjectURL(newFiles[index].preview!);
        }
        newFiles.splice(index, 1);
        return newFiles;
      });
    };

    const getFileIcon = (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (file.type.startsWith('image/')) {
        return <ImageIcon className="w-4 h-4" />;
      }
      if (ext === 'pdf') {
        return <FileText className="w-4 h-4 text-destructive" />;
      }
      return <FileText className="w-4 h-4" />;
    };

    return (
      <div className="bg-gradient-to-t from-background via-background to-transparent pt-3 sm:pt-4 pb-4 sm:pb-6 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative border rounded-2xl bg-card shadow-elegant transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-lg border-border/60">
            {/* File previews */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {uploadedFiles.map((uploadedFile, index) => (
                  <div
                    key={index}
                    className="relative group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 text-sm"
                  >
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : (
                      getFileIcon(uploadedFile.file)
                    )}
                    <span className="max-w-[120px] truncate text-xs">
                      {uploadedFile.file.name}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入你的问题..."
              className="min-h-[36px] sm:min-h-[44px] max-h-36 resize-none pr-14 py-2 sm:py-3 rounded-2xl border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              disabled={isTyping}
            />
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Bottom toolbar inside input */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-background text-muted-foreground hover:bg-secondary transition-all duration-200 border border-border/50">
                      <Wrench className="w-3.5 h-3.5" />
                      工具
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 bg-popover shadow-lg border border-border/60 rounded-xl p-1">
                  {aiTools.map((tool) => (
                      <DropdownMenuItem 
                        key={tool.id} 
                        className="flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                        onClick={() => onToolSelect?.(tool.id, tool.name)}
                      >
                        <div className="mt-0.5">
                          {toolIcons[tool.id]}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">{tool.name}</span>
                          <span className="text-xs text-muted-foreground">{tool.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button 
                  onClick={handleFileSelect}
                  className="p-2 rounded-full hover:bg-secondary/80 transition-colors duration-200"
                  title="添加文件"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>

                <VoiceInput 
                  onTranscript={handleVoiceTranscript}
                  disabled={isTyping}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={(!input.trim() && uploadedFiles.length === 0) || isTyping}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  (input.trim() || uploadedFiles.length > 0) && !isTyping
                    ? "gradient-primary text-white shadow-glow hover:scale-105 active:scale-95"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isTyping && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>AI辅导员正在思考...</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);