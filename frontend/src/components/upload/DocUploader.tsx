import React, { useState } from 'react';
import { Upload, message, Button } from 'antd';
import type { UploadProps } from 'antd';
import { InboxOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { validateDocFile } from '@/utils/fileValidation';
import { extractDocxText } from '@/utils/docxParser';
import './DocUploader.scss';

const { Dragger } = Upload;

interface DocUploaderProps {
  value?: { file: File; content: string } | null;
  onChange?: (data: { file: File; content: string } | null) => void;
  disabled?: boolean;
}

export const DocUploader: React.FC<DocUploaderProps> = ({ value, onChange, disabled = false }) => {
  const [uploading, setUploading] = useState(false);

  const handleRemove = () => {
    onChange?.(null);
  };

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.doc,.docx',
    disabled: disabled || uploading,
    beforeUpload: async (file) => {
      // 验证文件
      const validation = validateDocFile(file);
      if (!validation.valid) {
        message.error(validation.error);
        return Upload.LIST_IGNORE;
      }

      setUploading(true);

      try {
        // 提取文档内容
        const content = await extractDocxText(file);
        onChange?.({ file, content });
        message.success('文档解析成功');
      } catch (error) {
        message.error('文档解析失败，请确保文件格式正确');
      } finally {
        setUploading(false);
      }

      return Upload.LIST_IGNORE;
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  if (value) {
    return (
      <div className="doc-uploader-preview">
        <div className="doc-preview-item">
          <FileTextOutlined className="doc-icon" />
          <div className="doc-info">
            <div className="doc-name">{value.file.name}</div>
            <div className="doc-size">
              {(value.file.size / 1024).toFixed(2)} KB
            </div>
            <div className="doc-preview-text">
              {value.content.slice(0, 100)}
              {value.content.length > 100 ? '...' : ''}
            </div>
          </div>
          {!disabled && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={handleRemove}
              className="doc-remove-btn"
            >
              移除
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dragger {...props} className="doc-uploader">
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
      <p className="ant-upload-hint">支持 .doc 或 .docx 格式文档，最大 50MB</p>
    </Dragger>
  );
};
