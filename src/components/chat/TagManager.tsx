import { useState } from 'react';
import { Plus, X, Tag, Pencil, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConversationTag } from '@/hooks/useConversationTags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const TAG_COLORS = [
  { name: 'primary', class: 'bg-primary text-primary-foreground' },
  { name: 'blue', class: 'bg-blue-500 text-white' },
  { name: 'green', class: 'bg-green-500 text-white' },
  { name: 'yellow', class: 'bg-yellow-500 text-white' },
  { name: 'red', class: 'bg-red-500 text-white' },
  { name: 'purple', class: 'bg-purple-500 text-white' },
  { name: 'pink', class: 'bg-pink-500 text-white' },
  { name: 'orange', class: 'bg-orange-500 text-white' },
];

interface TagManagerProps {
  tags: ConversationTag[];
  onCreateTag: (name: string, color: string) => Promise<ConversationTag | null>;
  onUpdateTag: (tagId: string, updates: Partial<{ name: string; color: string }>) => Promise<boolean>;
  onDeleteTag: (tagId: string) => Promise<boolean>;
}

export function TagManager({ tags, onCreateTag, onUpdateTag, onDeleteTag }: TagManagerProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('primary');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    setIsCreating(true);
    await onCreateTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setNewTagColor('primary');
    setIsCreating(false);
  };

  const handleStartEdit = (tag: ConversationTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const handleConfirmEdit = async () => {
    if (editingId && editName.trim()) {
      await onUpdateTag(editingId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const getColorClass = (colorName: string) => {
    return TAG_COLORS.find((c) => c.name === colorName)?.class || TAG_COLORS[0].class;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:bg-sidebar-accent/70 text-sidebar-foreground">
          <Tag className="w-4 h-4" />
          <span>管理标签</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>管理标签</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Create new tag */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="新标签名称..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1"
              />
              <Button onClick={handleCreate} disabled={isCreating || !newTagName.trim()} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {/* Color picker */}
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setNewTagColor(color.name)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-all',
                    color.class,
                    newTagColor === color.name ? 'ring-2 ring-offset-2 ring-primary' : ''
                  )}
                />
              ))}
            </div>
          </div>

          {/* Tag list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无标签</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                >
                  <span className={cn('w-3 h-3 rounded-full', getColorClass(tag.color))} />
                  {editingId === tag.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit()}
                        className="flex-1 h-7 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleConfirmEdit}
                        className="p-1.5 rounded text-primary hover:bg-primary/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded text-muted-foreground hover:bg-muted"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{tag.name}</span>
                      <button
                        onClick={() => handleStartEdit(tag)}
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTag(tag.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
