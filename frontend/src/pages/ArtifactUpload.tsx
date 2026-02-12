import React, { useState } from 'react';
import { message, Upload, Input, Modal } from 'antd';
import { CloudUploadOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { uploadArtifact } from '@/api/artifacts';
import { validateImageFile, validateDocFile } from '@/utils/fileValidation';
import type { UploadFile } from 'antd';
import './ArtifactUpload.scss';

export const ArtifactUpload: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 表单状态
  const [artifactName, setArtifactName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 图片预览状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 处理文档上传
  const handleDocUpload = async (file: File) => {
    const validation = validateDocFile(file);
    if (!validation.valid) {
      message.error(validation.error);
      return false;
    }

    setDocFile(file);
    message.success('文档已选择');
    return false; // 阻止自动上传
  };

  // 移除图片
  const handleRemoveImage = (file: UploadFile) => {
    // 清理 object URL，避免内存泄漏
    if (file.url && typeof file.url === 'string' && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
    const newList = fileList.filter(item => item.uid !== file.uid);
    setFileList(newList);
  };

  // 预览图片
  const handlePreview = async (file: UploadFile) => {
    if (!file.url) return false;
    setPreviewImage(file.url);
    setPreviewOpen(true);
    return false; // 阻止 Ant Design 默认的在新标签页打开
  };

  const handleSubmit = async () => {
    // 验证
    if (!artifactName.trim()) {
      message.error('请输入文物名称');
      return;
    }

    if (!docFile) {
      message.error('请上传文物介绍文档');
      return;
    }

    if (fileList.length === 0) {
      message.error('请至少上传一张文物图片');
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    try {
      // 从 fileList 中提取纯 File 对象数组
      const imageFiles: File[] = [];
      fileList.forEach(item => {
        if (item.originFileObj instanceof File) {
          imageFiles.push(item.originFileObj);
        }
      });

      // 调用真实API上传
      const result = await uploadArtifact(artifactName, docFile, imageFiles);

      setUploadProgress(100);
      message.success(
        `文物"${artifactName}"上传成功！已处理 ${result.image_count} 张图片`
      );

      // 重置表单
      handleReset();
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || '上传失败，请重试';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    // 先清理 object URLs
    fileList.forEach(item => {
      if (item.url && typeof item.url === 'string' && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    setArtifactName('');
    setDocFile(null);
    setFileList([]);
  };

  return (
    <div className="artifact-upload-page">
      {/* 页面头部 */}
      <header className="page-header">
        <div className="header-decoration">
          <span className="section-number">数字化存档</span>
        </div>
        <h1 className="page-title">文物上传</h1>
        <p className="page-subtitle">建立文物数字档案，传承历史文化记忆</p>
      </header>

      {/* 上传表单 */}
      <div className="upload-container">
        <div className="upload-form">
          {/* 文物名称 */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-number">01</span>
              <span className="label-text">文物名称</span>
              <span className="label-required">*</span>
            </label>
            <Input
              value={artifactName}
              onChange={(e) => setArtifactName(e.target.value)}
              placeholder="请输入文物名称，如：青铜夔纹鼎"
              size="large"
              maxLength={200}
              showCount
              disabled={submitting}
            />
          </div>

          {/* 文档上传 */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-number">02</span>
              <span className="label-text">介绍文档</span>
              <span className="label-required">*</span>
            </label>
            <Upload.Dragger
              beforeUpload={handleDocUpload}
              accept=".doc,.docx"
              showUploadList={false}
              disabled={submitting}
              className="doc-uploader"
              fileList={docFile ? [{} as UploadFile] : []}
              onRemove={() => setDocFile(null)}
            >
              {docFile ? (
                <div className="doc-preview">
                  <div className="doc-icon-wrapper">
                    <span className="doc-icon-text">DOC</span>
                  </div>
                  <div className="doc-info">
                    <span className="doc-name">{docFile.name}</span>
                    <span className="doc-size">{(docFile.size / 1024).toFixed(2)} KB</span>
                  </div>
                  <button
                    className="doc-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocFile(null);
                    }}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <CloudUploadOutlined className="upload-icon-large" />
                  <p className="upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="upload-hint">支持 .doc 或 .docx 格式文档，最大 50MB</p>
                </div>
              )}
            </Upload.Dragger>
          </div>

          {/* 图片上传 */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-number">03</span>
              <span className="label-text">文物图片</span>
              <span className="label-required">*</span>
            </label>

            {/* 图片上传区域 */}
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={(file) => {
                // 验证文件
                const validation = validateImageFile(file);
                if (!validation.valid) {
                  message.error(validation.error);
                  return Upload.LIST_IGNORE;
                }
                // 创建预览 URL
                const previewUrl = URL.createObjectURL(file);
                const fileWithPreview = {
                  uid: `${Date.now()}-${Math.random().toString(36)}`,
                  name: file.name,
                  status: 'done' as const,
                  url: previewUrl,
                  thumbUrl: previewUrl,
                  originFileObj: file,
                };
                // 使用函数式更新避免创建新数组导致的重渲染
                setFileList(prev => [...prev, fileWithPreview]);
                return Upload.LIST_IGNORE;
              }}
              onRemove={handleRemoveImage}
              onPreview={handlePreview}
              disabled={submitting}
              accept="image/*"
              multiple
              maxCount={10}
              className="image-uploader"
              itemRender={(originNode, file) => (
                <div className="upload-item-wrapper" key={file.uid}>
                  {originNode}
                  <button
                    className="upload-item-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(file as UploadFile);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8, fontSize: '14px' }}>上传图片</div>
              </div>
            </Upload>

            {/* 提示信息 */}
            <p className="form-hint">
              {fileList.length === 0
                ? '请至少上传一张清晰的文物图片'
                : `已添加 ${fileList.length} 张图片，${fileList.length >= 10 ? '已达上限' : `还可添加 ${10 - fileList.length} 张`}`}
            </p>
          </div>

          {/* 进度条 */}
          {submitting && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <span className="progress-glow"></span>
                </div>
              </div>
              <span className="progress-text">
                {uploadProgress < 30
                  ? '正在上传文件...'
                  : uploadProgress < 60
                    ? '正在解析文档内容...'
                    : uploadProgress < 85
                    ? '正在生成图片向量...'
                    : '即将完成...'}
              </span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={submitting}
            >
              重置
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '上传中...' : '确认上传'}
            </button>
          </div>
        </div>

        {/* 侧边说明 */}
        <aside className="upload-sidebar">
        <div className="sidebar-card">
          <h3 className="sidebar-title">上传须知</h3>
          <ul className="sidebar-list">
            <li>请确保文物名称准确，使用规范的文物命名</li>
            <li>文档支持 .docx 格式，系统将自动提取文本内容</li>
            <li>图片要求清晰、光线均匀，建议多角度拍摄</li>
            <li>支持拖拽或 Shift+点击多选图片</li>
            <li>单张图片不超过 100MB，最多可上传 10 张</li>
          </ul>
        </div>

        <div className="sidebar-card">
          <h3 className="sidebar-title">上传进度</h3>
          <div className="upload-stats">
            <div className="stat-item">
              <span className="stat-value">{fileList.length}</span>
              <span className="stat-label">张图片</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{docFile ? 1 : 0}</span>
              <span className="stat-label">份文档</span>
            </div>
          </div>
          <div className="progress-ring">
            <svg className="progress-svg" viewBox="0 0 100 100">
              <circle
                className="progress-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
              />
              <circle
                className="progress-bar-circle"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - fileList.length / 10)}`}
                transform="rotate(-90 50 50)"
              />
              </svg>
              <span className="progress-text-center">{fileList.length}/10</span>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">服务状态</h3>
            <div className="service-status">
              <span className="status-dot status-ok"></span>
              <span>后端服务</span>
              <span className="status-text">连接正常</span>
            </div>
          </div>
        </aside>
      </div>

      {/* 图片预览弹窗 */}
      <Modal
        open={previewOpen}
        title={null}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        className="image-preview-modal"
        width="90vw"
        style={{ top: 20 }}
        centered
      >
        <img
          src={previewImage}
          alt="预览"
          style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
        />
      </Modal>
    </div>
  );
};
