import { backendClient } from './backend';
import type { Artifact, ArtifactDetail, ImageInfo } from '@/types/api';

/**
 * 上传文物
 *
 * @param name - 文物名称
 * @param docFile - docx文档文件
 * @param images - 图片文件数组（至少一张）
 * @returns 上传响应
 */
export async function uploadArtifact(
  name: string,
  docFile: File,
  images: File[]
): Promise<{
  artifact_id: string;
  name: string;
  description: string;
  image_count: number;
  images: ImageInfo[];
}> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('doc_file', docFile);

  // 添加所有图片（使用相同的字段名）
  images.forEach((image) => {
    formData.append('images', image);
  });

  const response = await backendClient.post('/api/v1/artifacts/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * 获取文物列表
 *
 * @param skip - 跳过的记录数
 * @param limit - 返回的最大记录数
 * @returns 文物列表
 */
export async function getArtifacts(
  skip: number = 0,
  limit: number = 100
): Promise<Artifact[]> {
  const response = await backendClient.get('/api/v1/artifacts', {
    params: { skip, limit },
  });
  return response.data;
}

/**
 * 获取文物详情
 *
 * @param artifactId - 文物ID
 * @returns 文物详情（包含图片）
 */
export async function getArtifact(artifactId: string): Promise<ArtifactDetail> {
  const response = await backendClient.get(`/api/v1/artifacts/${artifactId}`);
  return response.data;
}

// 导出统一的 API 对象
export const artifactsApi = {
  uploadArtifact,
  getArtifacts,
  getArtifact,
};
