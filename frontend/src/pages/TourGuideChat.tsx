import React, { useEffect, useState, useRef } from 'react';
import {
  CameraOutlined,
  PlusOutlined,
  SendOutlined,
  CloseOutlined,
  DeleteOutlined,
  HistoryOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { useChatStore } from '@/stores/chatStore';
import { embeddingsApi } from '@/api/embeddings';
import { rerankApi } from '@/api/rerank';
import { artifactsApi } from '@/api/artifacts';
import { fileToBase64 } from '@/utils/imageConversion';
import { validateImageFile } from '@/utils/fileValidation';
import ReactMarkdown from 'react-markdown';
import type { ArtifactInfo } from '@/types/chat';
import type { Conversation } from '@/types/chat';
import './TourGuideChat.scss';

export const TourGuideChat: React.FC = () => {
  const {
    messages,
    isProcessing,
    conversations,
    currentConversationId,
    addMessage,
    startNewConversation,
    loadConversation,
    deleteConversation,
    setProcessing,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && conversations.length === 0) {
      startNewConversation('新对话');
    } else if (currentConversationId && messages.length === 0) {
      // 如果有当前对话ID但没有消息，加载该对话
      loadConversation(currentConversationId);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageUpload = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return;
    }

    const base64 = await fileToBase64(file);
    setImagePreview(`data:image/jpeg;base64,${base64}`);
  };

  const handleSend = async () => {
    if (!inputText.trim() && !imagePreview) {
      return;
    }

    const imageBase64 = imagePreview?.split(',')[1];

    // 添加用户消息
    addMessage({
      role: 'user',
      content: inputText.trim() || '请帮我识别这件文物',
      image: imageBase64,
    });

    setInputText('');
    setImagePreview(null);
    setProcessing(true);

    try {
      let artifactInfo: ArtifactInfo | undefined;

      // 如果有图片，进行图片识别
      if (imageBase64) {
        await embeddingsApi.createEmbeddings({
          input: [{ image: `data:image/jpeg;base64,${imageBase64}` }],
        });

        const artifacts = await artifactsApi.getArtifacts();

        const rerankRequest = {
          query: { image: `data:image/jpeg;base64,${imageBase64}` },
          documents: artifacts.map((artifact) => ({
            text: artifact.description || artifact.name,
            image: artifact.images?.[0]?.image_url || '',
          })),
        };

        const rerankResult = await rerankApi.rerank(rerankRequest);

        if (rerankResult.results.length > 0) {
          const topResult = rerankResult.results[0];
          const matchedArtifact = artifacts[topResult.index];

          artifactInfo = {
            name: matchedArtifact.name,
            relevanceScore: topResult.relevance_score,
            description: matchedArtifact.description,
            images: matchedArtifact.images?.map(img => img.image_url) || [],
          };
        }
      }

      // 生成回复内容
      let replyContent = '';
      if (artifactInfo) {
        replyContent = `我为您找到了**${artifactInfo.name}**。

这是一件非常有趣的文物。根据分析，这件文物与您上传的图片匹配度很高。

${artifactInfo.description ? `\n${artifactInfo.description}` : ''}

如果您想了解更多关于这件文物的信息，欢迎继续提问！`;
      } else {
        replyContent = `抱歉，我暂时没有找到与这件文物相关的信息。您可以：

1. 尝试从不同角度拍摄照片
2. 确保照片光线充足
3. 或者直接告诉我您想了解的文物名称

我会尽力帮助您！`;
      }

      // 添加助手回复
      addMessage({
        role: 'assistant',
        content: replyContent,
        artifactInfo,
      });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: '抱歉，服务暂时不可用。请稍后重试。',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    startNewConversation(`对话 ${conversations.length + 1}`);
  };

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getConversationPreview = (conv: Conversation) => {
    const firstUserMsg = conv.messages.find((m) => m.role === 'user');
    if (firstUserMsg?.content) {
      return firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
    }
    if (firstUserMsg?.image) {
      return '📷 图片识别';
    }
    return '新对话';
  };

  return (
    <div className="tour-guide-chat-page">
      {/* 侧边栏 */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <HistoryOutlined />
            <span>历史对话</span>
          </div>
          <button className="sidebar-toggle mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <CloseOutlined /> : <HistoryOutlined />}
          </button>
        </div>

        <button className="new-chat-sidebar-btn" onClick={handleNewChat}>
          <PlusOutlined />
          <span>新建对话</span>
        </button>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">💬</span>
              <p className="empty-text">暂无历史对话</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  conversation.id === currentConversationId ? 'active' : ''
                }`}
                onClick={() => handleSelectConversation(conversation.id)}
                onMouseEnter={() => setHoveredConvId(conversation.id)}
                onMouseLeave={() => setHoveredConvId(null)}
              >
                <div className="conversation-content">
                  <div className="conversation-header-row">
                    <span className="conversation-title">{conversation.title}</span>
                    {hoveredConvId === conversation.id && conversation.id !== currentConversationId && (
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      >
                        <DeleteOutlined />
                      </button>
                    )}
                  </div>
                  <p className="conversation-preview">{getConversationPreview(conversation)}</p>
                  <div className="conversation-meta">
                    <span className="conversation-time">{formatTime(conversation.updatedAt)}</span>
                    <span className="conversation-count">{conversation.messages.length} 条消息</span>
                  </div>
                </div>
                {conversation.id === currentConversationId && (
                  <div className="active-indicator"></div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <p className="footer-text">智能导览 · 文化传承</p>
        </div>
      </aside>

      {/* 主聊天区域 */}
      <main className="chat-main">
        {/* 页面头部 */}
        <header className="chat-header">
          <div className="header-content">
            <div className="header-left">
              <button
                className="sidebar-toggle desktop-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <LeftOutlined />
              </button>
              <span className="header-seal">AI导览</span>
              <div className="header-titles">
                <h1 className="page-title">智能导览助手</h1>
                <p className="page-subtitle">上传文物图片，获取智能讲解</p>
              </div>
            </div>
            <button className="new-chat-btn" onClick={handleNewChat}>
              <PlusOutlined />
              <span>新建对话</span>
            </button>
          </div>
        </header>

        {/* 聊天容器 */}
        <div className="chat-container">
          {/* 消息列表 */}
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="welcome-state">
                <div className="welcome-icon">
                  <CameraOutlined />
                </div>
                <h2 className="welcome-title">欢迎来到智能导览</h2>
                <p className="welcome-desc">
                  上传文物图片或输入问题，AI 助手将为您提供专业讲解
                </p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-item ${message.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="message-avatar assistant-avatar">
                        <span>AI</span>
                      </div>
                    )}
                    <div className="message-bubble">
                      {message.image && (
                        <div className="message-image">
                          <img
                            src={`data:image/jpeg;base64,${message.image}`}
                            alt="上传的图片"
                          />
                        </div>
                      )}
                      {message.content && (
                        <div className="message-text">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}
                      {message.artifactInfo && (
                        <div className="artifact-info-card">
                          <div className="artifact-info-header">
                            <span className="artifact-badge">匹配文物</span>
                            <span className="artifact-score">
                              匹配度 {(message.artifactInfo.relevanceScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <h4 className="artifact-name">{message.artifactInfo.name}</h4>
                          {message.artifactInfo.description && (
                            <p className="artifact-desc">{message.artifactInfo.description}</p>
                          )}
                          {message.artifactInfo.images.length > 0 && (
                            <div className="artifact-images">
                              {message.artifactInfo.images.map((img: string, i: number) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`${message.artifactInfo!.name} ${i + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="message-avatar user-avatar">
                        <span>我</span>
                      </div>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="message-item assistant">
                    <div className="message-avatar assistant-avatar">
                      <span>AI</span>
                    </div>
                    <div className="message-bubble loading">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="chat-input-area">
            {/* 图片预览 */}
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="预览" />
                <button
                  className="remove-image-btn"
                  onClick={() => {
                    setImagePreview(null);
                  }}
                >
                  <CloseOutlined />
                </button>
              </div>
            )}

            {/* 输入框 */}
            <div className="input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
              />
              <button
                className="image-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <CameraOutlined />
              </button>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入问题或直接上传文物图片..."
                className="message-input"
                rows={1}
                disabled={isProcessing}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={isProcessing || (!inputText.trim() && !imagePreview)}
              >
                <SendOutlined />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
