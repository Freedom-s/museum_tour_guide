// API 类型定义

// Embedding API 类型
export interface EmbeddingInput {
  text?: string;
  image?: string; // base64, http://, minio://, data:image/
}

export interface EmbeddingRequest {
  input: string | string[] | EmbeddingInput | EmbeddingInput[];
  model?: string;
  encoding_format?: 'float';
}

export interface EmbeddingData {
  object: string;
  embedding: number[];
  index: number;
}

export interface EmbeddingResponse {
  object: 'list';
  data: EmbeddingData[];
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Rerank API 类型
export interface RerankInputItem {
  text?: string;
  image?: string;
}

export interface RerankRequest {
  model?: string;
  query: string | RerankInputItem;
  documents: Array<string | RerankInputItem>;
  instruction?: string;
  fps?: number;
}

export interface RerankResult {
  index: number;
  relevance_score: number;
}

export interface RerankResponse {
  model: string;
  results: RerankResult[];
}

// ==================== 文物 API 类型 ====================

// 图片信息
export interface ImageInfo {
  id: string;
  artifact_id: string;
  image_url: string;
  filename?: string;  // 文件名
  created_at: string;
}

// 文物信息类型（列表）
export interface Artifact {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  image_count?: number;  // 图片数量
  thumbnail_url?: string;  // 缩略图
  images?: ImageInfo[];  // 图片列表（可选）
}

// 文物详情（包含图片）
export interface ArtifactDetail extends Artifact {
  images: ImageInfo[];
  image_count: number;  // 图片数量（详情中必有）
}

// 健康检查响应
export interface HealthResponse {
  status: 'healthy' | 'degraded';
  services: {
    embedding: 'ok' | 'unavailable';
  };
}

// 错误响应
export interface ErrorResponse {
  error?: string;
  detail?: string;
}
