import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder, Plus, Pencil, Trash2, FolderOpen, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CategoryManagementProps {
  categories: KnowledgeCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onCategoriesChange: () => void;
  fileCounts: Record<string, number>;
}

const CATEGORY_COLORS = [
  { value: 'gray', label: '灰色', class: 'bg-gray-500' },
  { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
  { value: 'green', label: '绿色', class: 'bg-green-500' },
  { value: 'purple', label: '紫色', class: 'bg-purple-500' },
  { value: 'orange', label: '橙色', class: 'bg-orange-500' },
  { value: 'pink', label: '粉色', class: 'bg-pink-500' },
  { value: 'cyan', label: '青色', class: 'bg-cyan-500' },
  { value: 'red', label: '红色', class: 'bg-red-500' },
  { value: 'yellow', label: '黄色', class: 'bg-yellow-500' },
];

export const CategoryManagement = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onCategoriesChange,
  fileCounts,
}: CategoryManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<KnowledgeCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'gray',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const getColorClass = (color: string) => {
    return CATEGORY_COLORS.find(c => c.value === color)?.class || 'bg-gray-500';
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: 'gray' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (category: KnowledgeCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: '请输入分类名称' });
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('knowledge_categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({ title: '分类已更新' });
      } else {
        const maxOrder = Math.max(0, ...categories.map(c => c.sort_order));
        const { error } = await supabase
          .from('knowledge_categories')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            sort_order: maxOrder + 1,
          });

        if (error) throw error;
        toast({ title: '分类已创建' });
      }

      setIsDialogOpen(false);
      onCategoriesChange();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({ variant: 'destructive', title: '保存失败', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      // First, unassign all files from this category
      await supabase
        .from('knowledge_files')
        .update({ category_id: null })
        .eq('category_id', categoryToDelete.id);

      // Then delete the category
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast({ title: '分类已删除' });
      
      if (selectedCategory === categoryToDelete.id) {
        onSelectCategory(null);
      }
      
      onCategoriesChange();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({ variant: 'destructive', title: '删除失败', description: error.message });
    } finally {
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const totalFiles = Object.values(fileCounts).reduce((a, b) => a + b, 0);
  const uncategorizedCount = fileCounts['uncategorized'] || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">文件分类</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* All files option */}
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
          selectedCategory === null
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted text-foreground"
        )}
      >
        <FolderOpen className="w-4 h-4" />
        <span className="flex-1">全部文件</span>
        <span className="text-xs text-muted-foreground">{totalFiles}</span>
      </button>

      {/* Uncategorized option */}
      <button
        onClick={() => onSelectCategory('uncategorized')}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
          selectedCategory === 'uncategorized'
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted text-foreground"
        )}
      >
        <Folder className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1">未分类</span>
        <span className="text-xs text-muted-foreground">{uncategorizedCount}</span>
      </button>

      <div className="h-px bg-border my-2" />

      {/* Category list */}
      {categories.map((category) => (
        <div
          key={category.id}
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            selectedCategory === category.id
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted text-foreground"
          )}
        >
          <button
            onClick={() => onSelectCategory(category.id)}
            className="flex-1 flex items-center gap-2 text-left"
          >
            <div className={cn("w-3 h-3 rounded-full", getColorClass(category.color))} />
            <span className="flex-1 truncate">{category.name}</span>
            <span className="text-xs text-muted-foreground">
              {fileCounts[category.id] || 0}
            </span>
          </button>
          
          <div className="hidden group-hover:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(category);
              }}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setCategoryToDelete(category);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          暂无分类，点击 + 创建
        </p>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '创建分类'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入分类名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入分类描述"
              />
            </div>
            <div className="space-y-2">
              <Label>颜色</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", color.class)} />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除分类</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除分类 "{categoryToDelete?.name}" 吗？分类下的文件将变为未分类状态。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
