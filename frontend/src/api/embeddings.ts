import { vlApiClient } from './client';
import type { EmbeddingRequest, EmbeddingResponse } from '@/types/api';

/**
 * Embeddings API 服务
 */
export const embeddingsApi = {
  /**
   * 创建文本/图片的 embedding
   */
  async createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await vlApiClient.post<EmbeddingResponse>(
      '/v1/embeddings',
      request
    );
    return response.data;
  },

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await vlApiClient.get('/health');
    return response.data;
  },
};
