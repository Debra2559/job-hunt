import { useState } from 'react';
import { Tag, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConversationTag } from '@/hooks/useConversationTags';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

const TAG_COLORS: Record<string, string> = {
  primary: 'bg-primary',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  orange: 'bg-orange-500',
};

interface ConversationTagSelectorProps {
  conversationId: string;
  allTags: ConversationTag[];
  assignedTags: ConversationTag[];
  onAssignTag: (conversationId: string, tagId: string) => Promise<boolean>;
  onRemoveTag: (conversationId: string, tagId: string) => Promise<boolean>;
  onCreateTag: (name: string, color: string) => Promise<ConversationTag | null>;
}

export function ConversationTagSelector({
  conversationId,
  allTags,
  assignedTags,
  onAssignTag,
  onRemoveTag,
  onCreateTag,
}: ConversationTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const assignedIds = new Set(assignedTags.map((t) => t.id));

  const handleToggleTag = async (tagId: string) => {
    if (assignedIds.has(tagId)) {
      await onRemoveTag(conversationId, tagId);
    } else {
      await onAssignTag(conversationId, tagId);
    }
  };

  const handleQuickCreate = async () => {
    if (!newTagName.trim()) return;
    setIsCreating(true);
    const newTag = await onCreateTag(newTagName.trim(), 'primary');
    if (newTag) {
      await onAssignTag(conversationId, newTag.id);
    }
    setNewTagName('');
    setIsCreating(false);
  };

  const getColorClass = (colorName: string) => TAG_COLORS[colorName] || TAG_COLORS.primary;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Tag className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-2">选择标签</p>
          
          {/* Tag list */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {allTags.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">暂无标签</p>
            ) : (
              allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-muted text-sm"
                >
                  <span className={cn('w-2.5 h-2.5 rounded-full', getColorClass(tag.color))} />
                  <span className="flex-1 text-left truncate">{tag.name}</span>
                  {assignedIds.has(tag.id) && (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Quick create */}
          <div className="pt-2 border-t border-border">
            <div className="flex gap-1">
              <Input
                placeholder="创建新标签..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
                className="h-7 text-xs"
              />
              <button
                onClick={handleQuickCreate}
                disabled={isCreating || !newTagName.trim()}
                className="p-1.5 rounded text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
