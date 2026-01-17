import { useState } from 'react';
import { Send, Wrench, ChevronDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="bg-gradient-to-t from-background via-background to-transparent pt-4 pb-6 px-4"
    >
      <div className="max-w-3xl mx-auto">
        <motion.div 
          whileFocus={{ scale: 1.01 }}
          className="relative border border-border/60 rounded-2xl bg-card shadow-elegant transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-lg"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入你的问题..."
            className="min-h-[56px] max-h-36 resize-none pr-14 rounded-2xl border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            disabled={isTyping}
          />
          
          {/* Bottom toolbar inside input */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-all duration-200"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    工具
                    <ChevronDown className="w-3 h-3" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 bg-popover shadow-lg border border-border/60 rounded-xl p-1">
                  {aiTools.map((tool) => (
                    <DropdownMenuItem key={tool.id} className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 cursor-pointer">
                      <span className="font-medium text-sm">{tool.name}</span>
                      <span className="text-xs text-muted-foreground">{tool.description}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-secondary/80 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: input.trim() && !isTyping ? 1.1 : 1 }}
              whileTap={{ scale: input.trim() && !isTyping ? 0.9 : 1 }}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200",
                input.trim() && !isTyping
                  ? "gradient-primary text-white shadow-glow"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{
                      y: [0, -6, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                ))}
              </div>
              <span>AI辅导员正在思考...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
