import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, Conversation } from '@/types/chat';

interface ChatState {
  // 当前对话
  messages: ChatMessage[];
  currentConversationId: string | null;

  // 对话历史
  conversations: Conversation[];

  // UI 状态
  isProcessing: boolean;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  startNewConversation: (title?: string) => void;
  loadConversation: (id: string) => void;
  setProcessing: (processing: boolean) => void;
  deleteConversation: (id: string) => void;
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      currentConversationId: null,
      conversations: [],
      isProcessing: false,

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
        }));

        // 保存到对话历史
        const { currentConversationId, conversations } = get();
        if (currentConversationId) {
          const updatedConversations = conversations.map((conv) => {
            if (conv.id === currentConversationId) {
              return {
                ...conv,
                messages: [...conv.messages, newMessage],
                updatedAt: new Date(),
              };
            }
            return conv;
          });
          set({ conversations: updatedConversations });
        }
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));

        // 更新对话历史中的消息
        const { currentConversationId, conversations } = get();
        if (currentConversationId) {
          const updatedConversations = conversations.map((conv) => {
            if (conv.id === currentConversationId) {
              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === id ? { ...msg, ...updates } : msg
                ),
              };
            }
            return conv;
          });
          set({ conversations: updatedConversations });
        }
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      startNewConversation: (title = '新对话') => {
        const newConversation: Conversation = {
          id: `conv_${Date.now()}`,
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: newConversation.id,
          messages: [],
        }));
      },

      loadConversation: (id) => {
        const { conversations } = get();
        const conversation = conversations.find((conv) => conv.id === id);

        if (conversation) {
          set({
            currentConversationId: id,
            messages: conversation.messages,
          });
        }
      },

      setProcessing: (processing) => {
        set({ isProcessing: processing });
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          currentConversationId:
            state.currentConversationId === id ? null : state.currentConversationId,
          messages: state.currentConversationId === id ? [] : state.messages,
        }));
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);
