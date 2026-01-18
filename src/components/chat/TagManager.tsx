import { useState } from 'react';
import { Plus, X, Tag, Pencil, Check, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConversationTag } from '@/hooks/useConversationTags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableTagItemProps {
  tag: ConversationTag;
  editingId: string | null;
  editName: string;
  onStartEdit: (tag: ConversationTag) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onDelete: (tagId: string) => void;
  getColorClass: (colorName: string) => string;
}

function SortableTagItem({
  tag,
  editingId,
  editName,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onEditNameChange,
  onDelete,
  getColorClass,
}: SortableTagItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-muted/50 group',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <span className={cn('w-3 h-3 rounded-full flex-shrink-0', getColorClass(tag.color))} />
      
      {editingId === tag.id ? (
        <>
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirmEdit()}
            className="flex-1 h-7 text-sm"
            autoFocus
          />
          <button
            onClick={onConfirmEdit}
            className="p-1.5 rounded text-primary hover:bg-primary/10"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCancelEdit}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{tag.name}</span>
          <button
            onClick={() => onStartEdit(tag)}
            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(tag.id)}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

interface TagManagerProps {
  tags: ConversationTag[];
  onCreateTag: (name: string, color: string) => Promise<ConversationTag | null>;
  onUpdateTag: (tagId: string, updates: Partial<{ name: string; color: string }>) => Promise<boolean>;
  onDeleteTag: (tagId: string) => Promise<boolean>;
  onReorderTags?: (reorderedTags: ConversationTag[]) => Promise<boolean>;
}

export function TagManager({ tags, onCreateTag, onUpdateTag, onDeleteTag, onReorderTags }: TagManagerProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('primary');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tags.findIndex((t) => t.id === active.id);
      const newIndex = tags.findIndex((t) => t.id === over.id);
      
      const reorderedTags = arrayMove(tags, oldIndex, newIndex).map((tag, index) => ({
        ...tag,
        sortOrder: index,
      }));

      if (onReorderTags) {
        await onReorderTags(reorderedTags);
      }
    }
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

          {/* Tag list with drag and drop */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无标签</p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={tags.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {tags.map((tag) => (
                    <SortableTagItem
                      key={tag.id}
                      tag={tag}
                      editingId={editingId}
                      editName={editName}
                      onStartEdit={handleStartEdit}
                      onConfirmEdit={handleConfirmEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditNameChange={setEditName}
                      onDelete={onDeleteTag}
                      getColorClass={getColorClass}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {tags.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              拖动 <GripVertical className="w-3 h-3 inline-block" /> 图标调整顺序
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
