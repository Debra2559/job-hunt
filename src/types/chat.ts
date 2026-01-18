export interface KnowledgeSource {
  fileName: string;
  similarity: number;
  tags?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isFavorite?: boolean;
  sources?: KnowledgeSource[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
}

export interface QuickTag {
  id: string;
  title: string;
  description: string;
}

export interface AITool {
  id: string;
  name: string;
  icon: string;
  description: string;
}
