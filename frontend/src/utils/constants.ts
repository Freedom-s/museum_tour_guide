// 应用常量

// API 相关
export const API_CONFIG = {
  VL_SERVICE_URL: import.meta.env.VITE_VL_SERVICE_URL || 'http://localhost:8000',
  RERANK_SERVICE_URL: import.meta.env.VITE_RERANK_SERVICE_URL || 'http://localhost:8001',
};

// 文件上传限制
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: parseInt(import.meta.env.VITE_MAX_IMAGE_SIZE || '104857600'), // 100MB
  MAX_DOC_SIZE: parseInt(import.meta.env.VITE_MAX_DOC_SIZE || '52428800'), // 50MB
  MAX_IMAGE_COUNT: parseInt(import.meta.env.VITE_MAX_IMAGE_COUNT || '10'),
};

// 支持的文件类型
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  DOCS: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// 错误消息
export const ERROR_MESSAGES = {
  IMAGE_TYPE_INVALID: '请上传 JPG、PNG、WebP 或 GIF 格式的图片',
  IMAGE_SIZE_EXCEEDED: '图片大小不能超过 100MB',
  DOC_TYPE_INVALID: '请上传 .doc 或 .docx 格式的文档',
  DOC_SIZE_EXCEEDED: '文档大小不能超过 50MB',
  IMAGE_COUNT_EXCEEDED: '最多只能上传 10 张图片',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  API_ERROR: '服务暂时不可用，请稍后重试',
};

// 本地存储键
export const STORAGE_KEYS = {
  CHAT_HISTORY: 'museum_chat_history',
  UPLOAD_DRAFT: 'museum_upload_draft',
};
