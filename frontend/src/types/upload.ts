// 上传相关类型定义

export interface UploadedFile {
  uid: string;
  name: string;
  status?: 'uploading' | 'done' | 'error';
  url?: string;
  originFileObj?: File;
  base64?: string;
}

export interface UploadState {
  artifactName: string;
  docFile: File | null;
  docContent: string | null;
  images: UploadedFile[];
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
}

export interface FileValidationRule {
  maxSize: number;
  allowedTypes: string[];
  errorMessage: string;
}
