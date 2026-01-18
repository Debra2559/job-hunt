import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationTag {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
}

export function useConversationTags(userId: string | undefined) {
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [tagAssignments, setTagAssignments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Load tags and assignments
  const loadTags = useCallback(async () => {
    if (!userId) {
      setTags([]);
      setTagAssignments({});
      setLoading(false);
      return;
    }

    try {
      // Load tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('conversation_tags')
        .select('*')
        .order('sort_order', { ascending: true });

      if (tagsError) throw tagsError;

      setTags(
        (tagsData || []).map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color || 'primary',
          icon: t.icon || 'tag',
          sortOrder: t.sort_order || 0,
        }))
      );

      // Load assignments
      const { data: assignData, error: assignError } = await supabase
        .from('conversation_tag_assignments')
        .select('conversation_id, tag_id');

      if (assignError) throw assignError;

      const assignments: Record<string, string[]> = {};
      (assignData || []).forEach((a) => {
        if (!assignments[a.conversation_id]) {
          assignments[a.conversation_id] = [];
        }
        assignments[a.conversation_id].push(a.tag_id);
      });
      setTagAssignments(assignments);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Create a new tag
  const createTag = useCallback(
    async (name: string, color: string = 'primary') => {
      if (!userId) return null;

      try {
        const { data, error } = await supabase
          .from('conversation_tags')
          .insert({
            user_id: userId,
            name,
            color,
            sort_order: tags.length,
          })
          .select()
          .single();

        if (error) throw error;

        const newTag: ConversationTag = {
          id: data.id,
          name: data.name,
          color: data.color || 'primary',
          icon: data.icon || 'tag',
          sortOrder: data.sort_order || 0,
        };

        setTags((prev) => [...prev, newTag]);
        return newTag;
      } catch (error) {
        console.error('Error creating tag:', error);
        return null;
      }
    },
    [userId, tags.length]
  );

  // Update a tag
  const updateTag = useCallback(async (tagId: string, updates: Partial<{ name: string; color: string }>) => {
    try {
      const { error } = await supabase
        .from('conversation_tags')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', tagId);

      if (error) throw error;

      setTags((prev) =>
        prev.map((t) => (t.id === tagId ? { ...t, ...updates } : t))
      );
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      return false;
    }
  }, []);

  // Delete a tag
  const deleteTag = useCallback(async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      setTags((prev) => prev.filter((t) => t.id !== tagId));
      // Also remove from assignments
      setTagAssignments((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((convId) => {
          updated[convId] = updated[convId].filter((id) => id !== tagId);
        });
        return updated;
      });
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      return false;
    }
  }, []);

  // Assign tag to conversation
  const assignTag = useCallback(async (conversationId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_tag_assignments')
        .insert({ conversation_id: conversationId, tag_id: tagId });

      if (error) throw error;

      setTagAssignments((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), tagId],
      }));
      return true;
    } catch (error) {
      console.error('Error assigning tag:', error);
      return false;
    }
  }, []);

  // Remove tag from conversation
  const removeTagAssignment = useCallback(async (conversationId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_tag_assignments')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('tag_id', tagId);

      if (error) throw error;

      setTagAssignments((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter((id) => id !== tagId),
      }));
      return true;
    } catch (error) {
      console.error('Error removing tag assignment:', error);
      return false;
    }
  }, []);

  // Get tags for a conversation
  const getConversationTags = useCallback(
    (conversationId: string): ConversationTag[] => {
      const tagIds = tagAssignments[conversationId] || [];
      return tags.filter((t) => tagIds.includes(t.id));
    },
    [tags, tagAssignments]
  );

  return {
    tags,
    tagAssignments,
    loading,
    createTag,
    updateTag,
    deleteTag,
    assignTag,
    removeTagAssignment,
    getConversationTags,
    refreshTags: loadTags,
  };
}
