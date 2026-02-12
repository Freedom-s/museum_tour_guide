import { rerankApiClient } from './client';
import type { RerankRequest, RerankResponse } from '@/types/api';

/**
 * Rerank API 服务
 */
export const rerankApi = {
  /**
   * 对文档进行重排序
   */
  async rerank(request: RerankRequest): Promise<RerankResponse> {
    const response = await rerankApiClient.post<RerankResponse>(
      '/v1/rerank',
      request
    );
    return response.data;
  },

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await rerankApiClient.get('/health');
    return response.data;
  },
};
