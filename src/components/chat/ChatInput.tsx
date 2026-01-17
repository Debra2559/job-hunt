import { useState } from 'react';
import { Send, Wrench, ChevronDown, Plus } from 'lucide-react';
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
        <div className="relative border border-border rounded-xl bg-background">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入你的问题..."
            className="min-h-[52px] max-h-32 resize-none pr-12 rounded-xl border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isTyping}
          />
          
          {/* Bottom toolbar inside input */}
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all">
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

              <button className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={cn(
                "p-2 rounded-lg transition-all",
                input.trim() && !isTyping
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
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
