# Backend API 文档

## 基础信息

- **Base URL**: `http://localhost:5000`
- **API 前缀**: `/api/v1`
- **Content-Type**: `application/json` 或 `multipart/form-data`

---

## 目录

1. [健康检查](#1-健康检查)
2. [上传文物](#2-上传文物)
3. [获取文物列表](#3-获取文物列表)
4. [获取文物详情](#4-获取文物详情)
5. [错误响应](#5-错误响应)

---

## 接口详情

### 1. 健康检查

检查服务运行状态及依赖服务可用性。

**请求**

```
GET /health
```

**响应示例**

```json
{
  "status": "healthy",
  "services": {
    "embedding": "ok"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 服务状态：`healthy`(正常) 或 `degraded`(部分服务不可用) |
| services.embedding | string | embedding服务状态：`ok` 或 `unavailable` |

---

### 2. 上传文物

上传文物信息，包括名称、文档和图片。

**请求**

```
POST /api/v1/artifacts/upload
Content-Type: multipart/form-data
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 文物名称，1-200字符 |
| doc_file | file | 是 | docx文档文件 |
| images | file[] | 是 | 文物图片，至少一张 |

**支持的文件类型**

- 文档: `.docx` (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- 图片: `.jpg`, `.jpeg`, `.png`, `.webp`

**请求示例 (cURL)**

```bash
curl -X POST "http://localhost:5000/api/v1/artifacts/upload" \
  -F "name=青铜鼎" \
  -F "doc_file=@/path/to/document.docx" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**请求示例 (JavaScript)**

```javascript
const formData = new FormData();
formData.append('name', '青铜鼎');
formData.append('doc_file', docxFileBlob);
formData.append('images', image1Blob);
formData.append('images', image2Blob);

const response = await fetch('http://localhost:5000/api/v1/artifacts/upload', {
  method: 'POST',
  body: formData
});
```

**响应**

```
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "artifact_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "青铜鼎",
  "description": "从docx文件解析出的描述内容...",
  "image_count": 2,
  "images": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "artifact_id": "550e8400-e29b-41d4-a716-446655440000",
      "image_url": "http://localhost:9000/uploads/550e8400/images/uuid1.jpg",
      "created_at": "2025-02-12T10:30:00"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "artifact_id": "550e8400-e29b-41d4-a716-446655440000",
      "image_url": "http://localhost:9000/uploads/550e8400/images/uuid2.jpg",
      "created_at": "2025-02-12T10:30:01"
    }
  ]
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| artifact_id | string (UUID) | 文物唯一标识 |
| name | string | 文物名称 |
| description | string | 从docx解析的描述内容 |
| image_count | number | 成功上传的图片数量 |
| images | array | 图片信息数组 |
| images[].id | string (UUID) | 图片唯一标识 |
| images[].artifact_id | string (UUID) | 所属文物ID |
| images[].image_url | string | 图片访问URL |
| images[].created_at | string (ISO8601) | 创建时间 |

---

### 3. 获取文物列表

获取所有文物的分页列表。

**请求**

```
GET /api/v1/artifacts?skip=0&limit=100
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| skip | number | 否 | 0 | 跳过的记录数 |
| limit | number | 否 | 100 | 返回的最大记录数 |

**请求示例**

```bash
curl "http://localhost:5000/api/v1/artifacts?skip=0&limit=10"
```

**响应**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "青铜鼎",
    "description": "商代晚期青铜礼器...",
    "created_at": "2025-02-12T10:30:00",
    "updated_at": "2025-02-12T10:30:00"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "青花瓷瓶",
    "description": "明代青花瓷器...",
    "created_at": "2025-02-12T11:00:00",
    "updated_at": "2025-02-12T11:00:00"
  }
]
```

---

### 4. 获取文物详情

获取指定文物的完整信息，包括所有图片。

**请求**

```
GET /api/v1/artifacts/{artifact_id}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| artifact_id | string (UUID) | 文物ID |

**请求示例**

```bash
curl "http://localhost:5000/api/v1/artifacts/550e8400-e29b-41d4-a716-446655440000"
```

**响应**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "青铜鼎",
  "description": "商代晚期青铜礼器，用于祭祀...",
  "created_at": "2025-02-12T10:30:00",
  "updated_at": "2025-02-12T10:30:00",
  "images": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "artifact_id": "550e8400-e29b-41d4-a716-446655440000",
      "image_url": "http://localhost:9000/uploads/550e8400/images/uuid1.jpg",
      "vector": [0.123, -0.456, ...],
      "created_at": "2025-02-12T10:30:00",
      "updated_at": "2025-02-12T10:30:00"
    }
  ]
}
```

---

## 5. 错误响应

### 400 Bad Request - 请求参数错误

```json
{
  "detail": "不支持的文档类型: application/pdf，请上传 .docx 格式文件"
}
```

### 404 Not Found - 资源不存在

```json
{
  "detail": "Artifact not found"
}
```

### 500 Internal Server Error - 服务器错误

```json
{
  "error": "Internal server error",
  "detail": "具体错误信息"
}
```

---

## 处理流程说明

### 文物上传处理流程

```
1. 接收请求
   ↓
2. 验证文件类型
   ↓
3. 解析docx文档内容 → description
   ↓
4. 创建文物记录 (PostgreSQL)
   ↓
5. 上传文档到 MinIO
   ↓
6. 上传图片到 MinIO
   ↓
7. 调用Embedding服务获取图片向量
   ↓
8. 存储图片信息和向量 (PostgreSQL)
   ↓
9. 返回结果
```

---

## 数据库表结构

### artifacts (文物表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(200) | 文物名称 |
| description | TEXT | 描述 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### artifact_images (图片表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| artifact_id | UUID | 关联文物ID |
| image_url | VARCHAR(500) | MinIO URL |
| vector | VECTOR(2048) | 图片向量 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

## 依赖服务

| 服务 | 地址 | 用途 |
|------|------|------|
| PostgreSQL | localhost:5432 | 数据存储 |
| MinIO | localhost:9000 | 文件存储 |
| Embedding | localhost:8000 | 图片向量化 |

---

## 交互式文档

启动服务后，访问以下地址查看自动生成的交互式API文档：

- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc
