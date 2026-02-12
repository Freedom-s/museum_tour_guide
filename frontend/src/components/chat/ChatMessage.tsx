import React from 'react';
import { Avatar, Card, Tag, Image } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, ArtifactInfo } from '@/types/chat';
import './ChatMessage.scss';

interface ChatMessageItemProps {
  message: ChatMessage;
}

const ArtifactCard: React.FC<{ info: ArtifactInfo }> = ({ info }) => {
  return (
    <Card
      size="small"
      className="artifact-card"
      title={
        <div className="artifact-card-title">
          <span>{info.name}</span>
          <Tag color="green">匹配度 {(info.relevanceScore * 100).toFixed(0)}%</Tag>
        </div>
      }
    >
      {info.description && (
        <div className="artifact-description">
          <ReactMarkdown>{info.description}</ReactMarkdown>
        </div>
      )}
      {info.images.length > 0 && (
        <div className="artifact-images">
          <Image.PreviewGroup>
            {info.images.map((img, index) => (
              <Image
                key={index}
                src={img}
                alt={`${info.name} ${index + 1}`}
                width={80}
                height={80}
                style={{ objectFit: 'cover' }}
              />
            ))}
          </Image.PreviewGroup>
        </div>
      )}
    </Card>
  );
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? (
          <Avatar icon={<UserOutlined />} />
        ) : (
          <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
        )}
      </div>
      <div className="message-content">
        {isAssistant && (
          <div className="message-sender">智能导览助手</div>
        )}
        {message.image && (
          <div className="message-image">
            <Image src={`data:image/jpeg;base64,${message.image}`} alt="上传的图片" width={200} />
          </div>
        )}
        {message.content && (
          <div className="message-text">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {isAssistant && message.artifactInfo && (
          <ArtifactCard info={message.artifactInfo} />
        )}
        {message.isLoading && (
          <div className="message-loading">
            正在分析...
          </div>
        )}
      </div>
    </div>
  );
};
