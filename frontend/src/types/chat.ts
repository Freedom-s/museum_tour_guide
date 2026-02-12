// 聊天相关类型定义

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; // base64
  timestamp: Date;
  artifactInfo?: ArtifactInfo;
  isLoading?: boolean;
}

export interface ArtifactInfo {
  name: string;
  relevanceScore: number;
  description?: string;
  images: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
