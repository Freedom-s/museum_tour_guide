import React, { useState } from 'react';
import { Input, Button, Upload, Image } from 'antd';
import { SendOutlined, CameraOutlined, CloseOutlined } from '@ant-design/icons';
import { fileToBase64 } from '@/utils/imageConversion';
import { validateImageFile } from '@/utils/fileValidation';
import './ChatInput.scss';

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (content: string, image?: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false, loading = false }) => {
  const [content, setContent] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const handleSend = () => {
    if (!content.trim() && !imageBase64) {
      return;
    }

    onSend(content.trim(), imageBase64 || undefined);
    setContent('');
    setImageBase64(null);
  };

  const handleImageUpload = async (file: File) => {
    // 验证文件
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return false;
    }

    try {
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
    } catch (error) {
      console.error('Failed to process image:', error);
    }

    return false; // 阻止自动上传
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input">
      {imageBase64 && (
        <div className="chat-input-image-preview">
          <Image
            src={`data:image/jpeg;base64,${imageBase64}`}
            alt="预览"
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: 8 }}
          />
          <Button
            type="text"
            danger
            icon={<CloseOutlined />}
            onClick={handleRemoveImage}
            className="image-remove-btn"
          />
        </div>
      )}
      <div className="chat-input-main">
        <Upload
          beforeUpload={handleImageUpload}
          accept="image/*"
          showUploadList={false}
          disabled={disabled || loading}
        >
          <Button
            type="text"
            icon={<CameraOutlined />}
            disabled={disabled || loading}
            className="image-upload-btn"
          />
        </Upload>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入问题或直接上传文物图片..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={disabled || loading}
          className="chat-textarea"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled || loading || (!content.trim() && !imageBase64)}
          className="send-btn"
        />
      </div>
    </div>
  );
};
