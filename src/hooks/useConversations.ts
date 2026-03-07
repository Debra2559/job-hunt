import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, KnowledgeSource } from '@/types/chat';

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversations from database
  const loadConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Load messages for each conversation
      const conversationsWithMessages: Conversation[] = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: msgData } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          const messages: Message[] = (msgData || []).map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isFavorite: msg.is_favorite,
          }));

          return {
            id: conv.id,
            title: conv.title,
            messages,
            groupId: conv.group_id,
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at),
            isPinned: conv.is_pinned,
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create a new conversation
  const createConversation = useCallback(async (title: string, groupId: string = 'academic') => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title,
          group_id: groupId,
        })
        .select()
        .single();

      if (error) throw error;

      const newConv: Conversation = {
        id: data.id,
        title: data.title,
        messages: [],
        groupId: data.group_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setConversations((prev) => [newConv, ...prev]);
      return newConv;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [userId]);

  // Add a message to a conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    sources?: KnowledgeSource[]
  ) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage: Message = {
        id: data.id,
        role: data.role as 'user' | 'assistant',
        content: data.content,
        timestamp: new Date(data.created_at),
        isFavorite: data.is_favorite,
        sources,
      };

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, messages: [...conv.messages, newMessage], updatedAt: new Date() }
            : conv
        )
      );

      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, []);

  // Update message content (for streaming)
  const updateMessageContent = useCallback(async (messageId: string, content: string) => {
    try {
      await supabase
        .from('messages')
        .update({ content })
        .eq('id', messageId);

      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          messages: conv.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content } : msg
          ),
        }))
      );
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (messageId: string) => {
    try {
      // Find the message to get current favorite status
      let currentFavorite = false;
      conversations.forEach((conv) => {
        const msg = conv.messages.find((m) => m.id === messageId);
        if (msg) currentFavorite = msg.isFavorite || false;
      });

      await supabase
        .from('messages')
        .update({ is_favorite: !currentFavorite })
        .eq('id', messageId);

      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          messages: conv.messages.map((msg) =>
            msg.id === messageId ? { ...msg, isFavorite: !msg.isFavorite } : msg
          ),
        }))
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [conversations]);

  // Update local message (for streaming updates before save)
  const updateLocalMessage = useCallback((
    conversationId: string, 
    messageId: string, 
    content: string,
    sources?: KnowledgeSource[]
  ) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== conversationId) return conv;
        
        // If content is empty, remove the temp message
        if (!content || content.trim() === '') {
          return {
            ...conv,
            messages: conv.messages.filter((m) => m.id !== messageId),
          };
        }
        
        const existingMsg = conv.messages.find((m) => m.id === messageId);
        if (existingMsg) {
          return {
            ...conv,
            messages: conv.messages.map((m) =>
              m.id === messageId ? { ...m, content, sources: sources || m.sources } : m
            ),
          };
        } else {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                id: messageId,
                role: 'assistant' as const,
                content,
                timestamp: new Date(),
                sources,
              },
            ],
          };
        }
      })
    );
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      // Delete messages first (due to foreign key constraint)
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete the conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }, []);

  // Rename a conversation
  const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, title: newTitle, updatedAt: new Date() }
            : conv
        )
      );
      return true;
    } catch (error) {
      console.error('Error renaming conversation:', error);
      return false;
    }
  }, []);

  // Pin/unpin a conversation
  const pinConversation = useCallback(async (conversationId: string, pinned: boolean) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: pinned } as any)
        .eq('id', conversationId);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isPinned: pinned } : conv
        )
      );
      return true;
    } catch (error) {
      console.error('Error pinning conversation:', error);
      return false;
    }
  }, []);

  return {
    conversations,
    loading,
    createConversation,
    addMessage,
    updateMessageContent,
    toggleFavorite,
    updateLocalMessage,
    deleteConversation,
    renameConversation,
    pinConversation,
    setConversations,
  };
  };
}
