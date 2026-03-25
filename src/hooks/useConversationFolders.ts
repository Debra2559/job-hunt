import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export function useConversationFolders(userId: string | undefined) {
  const [folders, setFolders] = useState<ConversationFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFolders = useCallback(async () => {
    if (!userId) {
      setFolders([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversation_folders')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setFolders(
        (data || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          icon: f.icon || 'folder',
          color: f.color || 'primary',
          sortOrder: f.sort_order || 0,
        }))
      );
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const createFolder = useCallback(async (name: string) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('conversation_folders')
        .insert({ user_id: userId, name })
        .select()
        .single();

      if (error) throw error;

      const newFolder: ConversationFolder = {
        id: data.id,
        name: data.name,
        icon: data.icon || 'folder',
        color: data.color || 'primary',
        sortOrder: data.sort_order || 0,
      };

      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }, [userId]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('conversation_folders')
        .update({ name: newName })
        .eq('id', folderId);

      if (error) throw error;

      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
      );
      return true;
    } catch (error) {
      console.error('Error renaming folder:', error);
      return false;
    }
  }, []);

  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      // Unassign conversations from this folder first
      await supabase
        .from('conversations')
        .update({ folder_id: null } as any)
        .eq('folder_id', folderId);

      const { error } = await supabase
        .from('conversation_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      return false;
    }
  }, []);

  const moveConversationToFolder = useCallback(async (conversationId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ folder_id: folderId } as any)
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error moving conversation:', error);
      return false;
    }
  }, []);

  return {
    folders,
    loading,
    createFolder,
    renameFolder,
    deleteFolder,
    moveConversationToFolder,
  };
}
