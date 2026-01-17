import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, GraduationCap, Home, Heart, FileText, Briefcase, Book, Users, Star } from 'lucide-react';
import { Group } from '@/types/chat';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GroupManagerProps {
  groups: Group[];
  onAddGroup: (name: string, icon: string) => void;
  onEditGroup: (id: string, name: string, icon: string) => void;
  onDeleteGroup: (id: string) => void;
}

const availableIcons = [
  { id: 'GraduationCap', icon: GraduationCap, label: '学业' },
  { id: 'Home', icon: Home, label: '生活' },
  { id: 'Heart', icon: Heart, label: '心理' },
  { id: 'FileText', icon: FileText, label: '行政' },
  { id: 'Briefcase', icon: Briefcase, label: '工作' },
  { id: 'Book', icon: Book, label: '阅读' },
  { id: 'Users', icon: Users, label: '社交' },
  { id: 'Star', icon: Star, label: '收藏' },
];

export function GroupManager({ groups, onAddGroup, onEditGroup, onDeleteGroup }: GroupManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('GraduationCap');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim(), selectedIcon);
      setNewGroupName('');
      setSelectedIcon('GraduationCap');
    }
  };

  const startEdit = (group: Group) => {
    setEditingId(group.id);
    setEditName(group.name);
    setEditIcon(group.icon);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onEditGroup(editingId, editName.trim(), editIcon);
      setEditingId(null);
      setEditName('');
      setEditIcon('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
  };

  const getIconComponent = (iconName: string) => {
    const found = availableIcons.find(i => i.id === iconName);
    return found ? found.icon : GraduationCap;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="hover:text-foreground transition-colors p-1 rounded hover:bg-sidebar-accent">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>管理分组</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Add new group */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  {(() => {
                    const IconComp = getIconComponent(selectedIcon);
                    return <IconComp className="w-4 h-4" />;
                  })()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                <div className="grid grid-cols-4 gap-1 p-2">
                  {availableIcons.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIcon(item.id)}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                        selectedIcon === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="新分组名称"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
            />
            <button
              onClick={handleAddGroup}
              disabled={!newGroupName.trim()}
              className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Group list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {groups.map((group) => {
              const IconComp = getIconComponent(group.icon);
              const isEditing = editingId === group.id;
              
              return (
                <div key={group.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  {isEditing ? (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-9 h-9 rounded-lg bg-background flex items-center justify-center hover:bg-muted transition-colors">
                            {(() => {
                              const EditIconComp = getIconComponent(editIcon);
                              return <EditIconComp className="w-4 h-4" />;
                            })()}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-popover">
                          <div className="grid grid-cols-4 gap-1 p-2">
                            {availableIcons.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setEditIcon(item.id)}
                                className={cn(
                                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                                  editIcon === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                )}
                              >
                                <item.icon className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-9"
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      />
                      <button onClick={saveEdit} className="p-2 text-primary hover:bg-primary/10 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-2 text-muted-foreground hover:bg-muted rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                        <IconComp className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="flex-1 text-sm">{group.name}</span>
                      <button onClick={() => startEdit(group)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDeleteGroup(group.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
