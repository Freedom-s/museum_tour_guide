# 博物馆智能导览系统 - API 设计文档

## 概述

本文档基于前端实现，详细描述了后端需要实现的所有 API 接口。

系统采用微服务架构，包含两个独立的服务：
- **VL Service** (Vision-Language 服务)：提供图像/文本向量化能力
- **Rerank Service** (重排序服务)：提供文档/图像检索和重排序能力

---

## 基础配置

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_VL_SERVICE_URL` | VL服务地址 | `http://localhost:8000` |
| `VITE_RERANK_SERVICE_URL` | Rerank服务地址 | `http://localhost:8001` |
| `VITE_API_TIMEOUT` | API超时时间(毫秒) | `60000` (60秒) |
| `VITE_MAX_IMAGE_SIZE` | 最大图片大小(字节) | `10485760` (10MB) |
| `VITE_MAX_DOC_SIZE` | 最大文档大小(字节) | `52428800` (50MB) |
| `VITE_MAX_IMAGE_COUNT` | 单次最大图片数量 | `10` |

### 通用请求头

```
Content-Type: application/json
Authorization: Bearer {token}  // 可选，预留认证接口
```

---

## 1. 文物管理 API (Artifacts API)

### 1.1 上传文物

**接口描述**：上传新文物，支持多张图片和可选的介绍文档

- **Method**: `POST`
- **URL**: `/api/artifacts/upload`
- **Content-Type**: `multipart/form-data` 或 `application/json`

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 文物名称，最大100字符 |
| `documentContent` | string | 否 | 介绍文档内容（已提取的纯文本） |
| `images` | string[] | 是 | Base64编码的图片数组，至少1张，最多10张 |

**请求示例**：

```json
{
  "name": "青铜夔纹鼎",
  "documentContent": "商代晚期青铜器，高24厘米，口径18厘米。此鼎造型庄重，纹饰精美...",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD..."
  ]
}
```

**响应示例**：

```json
{
  "artifactId": "artifact_1709234567890",
  "status": "success",
  "message": "文物上传成功",
  "uploadedImages": [
    "image_001.jpg",
    "image_002.jpg"
  ]
}
```

**状态码说明**：

| 状态码 | 说明 |
|--------|------|
| 200 | 上传成功 |
| 400 | 请求参数错误 |
| 413 | 文件过大 |
| 500 | 服务器错误 |

---

### 1.2 获取所有文物列表

**接口描述**：获取系统中所有文物的列表

- **Method**: `GET`
- **URL**: `/api/artifacts`

**查询参数**（可选）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | int | 页码，从1开始 |
| `pageSize` | int | 每页数量，默认20 |
| `search` | string | 搜索关键词 |

**响应示例**：

```json
{
  "data": [
    {
      "id": "1",
      "name": "青铜鼎",
      "description": "商代晚期青铜器，高24厘米，口径18厘米。此鼎造型庄重，纹饰精美，鼎身饰饕餮纹，云雷纹地。",
      "images": [
        "https://cdn.example.com/artifacts/bronze-ding-1.jpg",
        "https://cdn.example.com/artifacts/bronze-ding-2.jpg"
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "2",
      "name": "唐三彩骆驼载乐俑",
      "description": "唐代三彩陶器，高58厘米。骆驼昂首嘶鸣，背骑五人，手持各种乐器...",
      "images": [
        "https://cdn.example.com/artifacts/tang-camel.jpg"
      ],
      "createdAt": "2024-01-20T14:20:00Z"
    }
  ],
  "total": 4,
  "page": 1,
  "pageSize": 20
}
```

---

### 1.3 获取单个文物详情

**接口描述**：获取指定文物的详细信息

- **Method**: `GET`
- **URL**: `/api/artifacts/{id}`

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 文物ID |

**响应示例**：

```json
{
  "id": "1",
  "name": "青铜鼎",
  "description": "商代晚期青铜器，高24厘米，口径18厘米。此鼎造型庄重，纹饰精美，鼎身饰饕餮纹，云雷纹地。三足呈柱状，上粗下细，两面各有扉棱。是商代青铜礼器的典型代表，用于祭祀和宴飨场合，体现了当时高超的青铜铸造工艺。",
  "images": [
    "https://cdn.example.com/artifacts/bronze-ding-1.jpg",
    "https://cdn.example.com/artifacts/bronze-ding-2.jpg"
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**错误响应**：

```json
{
  "error": "Artifact not found",
  "message": "未找到ID为xxx的文物"
}
```

---

### 1.4 删除文物（可选扩展）

**接口描述**：删除指定文物

- **Method**: `DELETE`
- **URL**: `/api/artifacts/{id}`

**响应示例**：

```json
{
  "status": "success",
  "message": "文物已删除"
}
```

---

## 2. 向量嵌入 API (Embeddings API)

**服务地址**：`{VITE_VL_SERVICE_URL}` (默认: `http://localhost:8000`)

### 2.1 创建向量嵌入

**接口描述**：将文本或图像转换为向量嵌入，用于后续的语义搜索和匹配

- **Method**: `POST`
- **URL**: `/v1/embeddings`

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `input` | string\|string[]\|object\|object[] | 是 | 输入内容，支持多种格式 |
| `model` | string | 否 | 模型名称 |
| `encoding_format` | string | 否 | 编码格式，默认"float" |

**input 参数格式说明**：

1. **纯文本**：
```json
{
  "input": "这是一件青铜器"
}
```

2. **文本数组**：
```json
{
  "input": ["青铜器", "陶瓷", "玉器"]
}
```

3. **图像对象**：
```json
{
  "input": {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
}
```

4. **图文混合对象**：
```json
{
  "input": {
    "text": "青铜鼎",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
}
```

5. **对象数组**：
```json
{
  "input": [
    {"text": "青铜器", "image": "data:image/jpeg;base64..."},
    {"text": "唐三彩", "image": "data:image/jpeg;base64..."}
  ]
}
```

**响应示例**：

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.0234, -0.0521, 0.1234, ...],
      "index": 0
    }
  ],
  "model": "multimodal-embedding-v1",
  "usage": {
    "prompt_tokens": 128,
    "total_tokens": 128
  }
}
```

**错误响应**：

```json
{
  "error": {
    "message": "Invalid input format",
    "type": "invalid_request_error",
    "code": null
  }
}
```

---

### 2.2 健康检查

**接口描述**：检查向量服务是否正常运行

- **Method**: `GET`
- **URL**: `/health`

**响应示例**：

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## 3. 文档重排序 API (Rerank API)

**服务地址**：`{VITE_RERANK_SERVICE_URL}` (默认: `http://localhost:8001`)

### 3.1 文档重排序

**接口描述**：根据查询对文档进行重排序，返回相关性评分

- **Method**: `POST`
- **URL**: `/v1/rerank`

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 否 | 模型名称 |
| `query` | string\|object | 是 | 查询内容，文本或图文对象 |
| `documents` | string[]\|object[] | 是 | 待排序的文档数组 |
| `instruction` | string | 否 | 排序指令 |
| `fps` | number | 否 | 每秒处理帧数 |

**请求示例**：

```json
{
  "model": "rerank-model-v1",
  "query": {
    "text": "这是什么文物",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  },
  "documents": [
    {
      "text": "商代晚期青铜器，高24厘米，口径18厘米。此鼎造型庄重，纹饰精美，鼎身饰饕餮纹，云雷纹地。",
      "image": "https://cdn.example.com/artifacts/bronze-ding-1.jpg"
    },
    {
      "text": "唐代三彩陶器，高58厘米。骆驼昂首嘶鸣，背骑五人，手持各种乐器，生动展现了丝绸之路上的文化交流场景。",
      "image": "https://cdn.example.com/artifacts/tang-camel.jpg"
    },
    {
      "text": "明代永乐年间青花瓷，高32厘米，口径8厘米。瓶身绘有缠枝莲纹，青花发色浓艳，纹饰清晰。",
      "image": "https://cdn.example.com/artifacts/blue-white-vase.jpg"
    }
  ]
}
```

**响应示例**：

```json
{
  "model": "rerank-model-v1",
  "results": [
    {
      "index": 0,
      "relevance_score": 0.92,
      "document": {
        "text": "商代晚期青铜器，高24厘米，口径18厘米。此鼎造型庄重，纹饰精美，鼎身饰饕餮纹，云雷纹地。",
        "image": "https://cdn.example.com/artifacts/bronze-ding-1.jpg"
      }
    },
    {
      "index": 2,
      "relevance_score": 0.45,
      "document": {
        "text": "明代永乐年间青花瓷，高32厘米，口径8厘米。瓶身绘有缠枝莲纹，青花发色浓艳，纹饰清晰。",
        "image": "https://cdn.example.com/artifacts/blue-white-vase.jpg"
      }
    },
    {
      "index": 1,
      "relevance_score": 0.23,
      "document": {
        "text": "唐代三彩陶器，高58厘米。骆驼昂首嘶鸣，背骑五人，手持各种乐器，生动展现了丝绸之路上的文化交流场景。",
        "image": "https://cdn.example.com/artifacts/tang-camel.jpg"
      }
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `index` | int | 原文档在请求数组中的索引 |
| `relevance_score` | float | 相关性评分，范围0-1，越高越相关 |
| `document` | object | 对应的文档内容 |

---

### 3.2 健康检查

**接口描述**：检查重排序服务是否正常运行

- **Method**: `GET`
- **URL**: `/health`

**响应示例**：

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## 4. 业务流程说明

### 4.1 文物上传流程

```
1. 用户上传文物信息（名称、介绍文档、图片）
   ↓
2. 前端验证文件格式和大小
   ↓
3. 调用 POST /api/artifacts/upload
   ↓
4. 后端保存图片到存储服务
   ↓
5. 后端提取文档文本内容
   ↓
6. 后端调用 VL Service 生成图片和文本的向量嵌入
   ↓
7. 后端保存文物信息到数据库
   ↓
8. 返回上传结果
```

### 4.2 文物识别流程

```
1. 用户上传文物照片或输入问题
   ↓
2. 调用 POST /v1/embeddings 生成查询向量
   ↓
3. 调用 GET /api/artifacts 获取所有文物
   ↓
4. 调用 POST /v1/rerank 进行相关性排序
   ↓
5. 获取最匹配的文物信息
   ↓
6. 生成智能回复返回给用户
```

---

## 5. 文件上传限制

### 支持的文件格式

| 类型 | 支持格式 | 最大大小 |
|------|----------|----------|
| 图片 | JPEG, JPG, PNG, WebP, GIF | 10MB |
| 文档 | DOC, DOCX | 50MB |

### 验证规则

- 图片数量：1-10张
- 文物名称：1-100字符
- 文档内容：自动提取为纯文本

---

## 6. 数据模型定义

### Artifact（文物）

```typescript
interface Artifact {
  id: string;                    // 文物唯一标识
  name: string;                  // 文物名称
  description?: string;          // 文物描述
  images: string[];              // 图片URL数组
  createdAt: string;             // 创建时间（ISO 8601格式）
}
```

### EmbeddingData（向量数据）

```typescript
interface EmbeddingData {
  object: string;                // 固定值 "embedding"
  embedding: number[];           // 向量数组
  index: number;                 // 索引
}
```

### RerankResult（重排序结果）

```typescript
interface RerankResult {
  index: number;                 // 原文档索引
  relevance_score: number;       // 相关性评分 (0-1)
}
```

---

## 7. 错误处理

### 统一错误响应格式

```json
{
  "error": {
    "message": "错误描述信息",
    "type": "error_type",
    "code": "ERROR_CODE"
  }
}
```

### 常见错误类型

| 错误类型 | HTTP状态码 | 说明 |
|----------|------------|------|
| `invalid_request_error` | 400 | 请求参数错误 |
| `authentication_error` | 401 | 认证失败 |
| `not_found_error` | 404 | 资源不存在 |
| `file_too_large` | 413 | 文件过大 |
| `rate_limit_error` | 429 | 请求过于频繁 |
| `server_error` | 500 | 服务器内部错误 |

---

## 8. 安全建议

1. **认证授权**：所有 API 应实现 Token 认证机制
2. **文件验证**：严格验证上传文件的类型和内容
3. **速率限制**：实现 API 调用频率限制
4. **CORS 配置**：正确配置跨域资源共享
5. **敏感信息**：图片和文档中可能包含敏感信息，需妥善处理

---

## 9. 扩展接口建议

以下接口前端暂未使用，但建议后续实现：

### 9.1 用户认证

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 9.2 聊天记录

- `GET /api/chat/conversations` - 获取用户对话列表
- `GET /api/chat/conversations/{id}` - 获取对话详情
- `POST /api/chat/conversations` - 创建新对话
- `DELETE /api/chat/conversations/{id}` - 删除对话

### 9.3 文物管理增强

- `PUT /api/artifacts/{id}` - 更新文物信息
- `POST /api/artifacts/{id}/feedback` - 用户反馈（识别结果不准确时）

---

## 10. 部署架构建议

```
┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  API Gateway│
│   (Vite)    │     │  (Nginx)    │
└─────────────┘     └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐
    │Artifacts  │  │  VL       │  │  Rerank   │
    │  Service  │  │ Service   │  │ Service   │
    └───────────┘  └───────────┘  └───────────┘
           │
           ▼
    ┌───────────┐
    │ Database  │
    │ (Postgres)│
    └───────────┘
```

---

## 附录：前端 Mock 数据

当前前端使用的 Mock 数据位于 `src/api/artifacts.ts`，包含4件文物：

1. **青铜鼎** - 商代晚期青铜器
2. **唐三彩骆驼载乐俑** - 唐代三彩陶器
3. **青花瓷瓶** - 明代永乐年间青花瓷
4. **玉琮** - 良渚文化玉器

后端实现时可参考这些数据结构进行初始化。
