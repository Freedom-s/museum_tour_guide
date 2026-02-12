import { FILE_LIMITS, ALLOWED_FILE_TYPES, ERROR_MESSAGES } from './constants';

/**
 * 验证图片文件
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // 检查文件类型
  if (!ALLOWED_FILE_TYPES.IMAGES.includes(file.type)) {
    return { valid: false, error: ERROR_MESSAGES.IMAGE_TYPE_INVALID };
  }

  // 检查文件大小
  if (file.size > FILE_LIMITS.MAX_IMAGE_SIZE) {
    return { valid: false, error: ERROR_MESSAGES.IMAGE_SIZE_EXCEEDED };
  }

  return { valid: true };
};

/**
 * 验证文档文件
 */
export const validateDocFile = (file: File): { valid: boolean; error?: string } => {
  // 检查文件类型
  if (!ALLOWED_FILE_TYPES.DOCS.includes(file.type)) {
    return { valid: false, error: ERROR_MESSAGES.DOC_TYPE_INVALID };
  }

  // 检查文件大小
  if (file.size > FILE_LIMITS.MAX_DOC_SIZE) {
    return { valid: false, error: ERROR_MESSAGES.DOC_SIZE_EXCEEDED };
  }

  return { valid: true };
};

/**
 * 验证图片数量
 */
export const validateImageCount = (currentCount: number, addingCount: number = 1): { valid: boolean; error?: string } => {
  if (currentCount + addingCount > FILE_LIMITS.MAX_IMAGE_COUNT) {
    return { valid: false, error: ERROR_MESSAGES.IMAGE_COUNT_EXCEEDED };
  }
  return { valid: true };
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
