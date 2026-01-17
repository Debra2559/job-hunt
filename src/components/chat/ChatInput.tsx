import { useState } from 'react';
import { Send, Brain, Globe, Wrench, ChevronDown, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { aiTools } from '@/data/campusData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isTyping: boolean;
}

export function ChatInput({ onSendMessage, isTyping }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [deepThinking, setDeepThinking] = useState(false);
  const [webSearch, setWebSearch] = useState(false);

  const handleSend = () => {
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入你的问题..."
            className="min-h-[52px] max-h-32 resize-none pr-12 rounded-xl border-border bg-background text-sm"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={cn(
              "absolute right-3 bottom-3 p-2 rounded-lg transition-all",
              input.trim() && !isTyping
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* AI Capabilities */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setDeepThinking(!deepThinking)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              deepThinking
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <Brain className="w-3.5 h-3.5" />
            深度思考
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  webSearch
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                联网搜索
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              <DropdownMenuItem onClick={() => setWebSearch(!webSearch)}>
                {webSearch ? '关闭联网搜索' : '开启联网搜索'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all">
                <Wrench className="w-3.5 h-3.5" />
                工具
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-popover">
              {aiTools.map((tool) => (
                <DropdownMenuItem key={tool.id} className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-xs text-muted-foreground">{tool.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          <button className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {isTyping && (
          <div className="mt-2 text-xs text-muted-foreground animate-pulse-soft">
            AI辅导员正在输入...
          </div>
        )}
      </div>
    </div>
  );
}
