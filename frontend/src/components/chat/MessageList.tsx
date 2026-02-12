import React, { useEffect, useRef } from 'react';
import { Empty, Typography } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { ChatMessageItem } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import './MessageList.scss';

const { Text } = Typography;

interface MessageListProps {
  messages: ChatMessageType[];
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, loading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="message-list-empty">
        <Empty
          image={<CameraOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <div>
              <Text type="secondary">欢迎使用智能导览助手</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 14 }}>
                上传文物图片或输入问题，开始探索文物世界
              </Text>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} />
      ))}
      {loading && (
        <ChatMessageItem
          message={{
            id: 'loading',
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true,
          }}
        />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
