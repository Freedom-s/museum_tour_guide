import React, { useState } from 'react';
import { Upload, Modal } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fileToBase64, fileToDataUrl } from '@/utils/imageConversion';
import { validateImageFile, validateImageCount } from '@/utils/fileValidation';
import type { UploadedFile } from '@/types/upload';
import './ImageUploader.scss';

interface ExtendedUploadFile extends UploadFile {
  base64?: string;
}

interface ImageUploaderProps {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  maxCount?: number;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = [],
  onChange,
  maxCount = 10,
  disabled = false,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>(
    value.map((file) => ({
      uid: file.uid,
      name: file.name,
      status: file.status || 'done',
      url: file.url || file.base64,
    }))
  );

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await fileToDataUrl(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
    // 验证图片数量
    const validation = validateImageCount(newFileList.filter((f) => f.status !== 'removed').length);
    if (!validation.valid) {
      // 移除新添加的文件
      setFileList(fileList);
      return;
    }

    // 处理新文件
    const processedFiles = await Promise.all(
      newFileList.map(async (f) => {
        if (f.originFileObj && !(f as ExtendedUploadFile).base64) {
          try {
            const validation = validateImageFile(f.originFileObj);
            if (!validation.valid) {
              return { ...f, status: 'error' as const };
            }
            const base64 = await fileToBase64(f.originFileObj);
            const dataUrl = await fileToDataUrl(f.originFileObj);
            return {
              ...f,
              base64,
              url: dataUrl,
              status: 'done' as const,
            };
          } catch {
            return { ...f, status: 'error' as const };
          }
        }
        return f;
      })
    );

    setFileList(processedFiles);

    // 转换为 UploadedFile 格式
    const uploadedFiles: UploadedFile[] = processedFiles
      .filter((f) => f.status !== 'removed' && f.status !== 'error')
      .map((f) => ({
        uid: f.uid,
        name: f.name,
        status: f.status as 'uploading' | 'done' | 'error',
        url: f.url || (f as ExtendedUploadFile).base64,
        originFileObj: f.originFileObj,
        base64: (f as ExtendedUploadFile).base64,
      }));

    onChange?.(uploadedFiles);
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button" disabled={disabled}>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </button>
  );

  return (
    <>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        beforeUpload={() => false}
        maxCount={maxCount}
        disabled={disabled}
        accept="image/*"
        className="image-uploader"
      >
        {fileList.length >= maxCount || disabled ? null : uploadButton}
      </Upload>
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};
