# 博物馆智能导览系统 - Docker 部署方案

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Nginx (反向代理)                           │
│                         Port: 80 / 443                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
    ┌─────────────────────┐    ┌─────────────────────┐
    │      Frontend       │    │   Artifacts API     │
    │   (React 静态文件)   │    │   (Go/Python 后端)   │
    │   Container: nginx  │    │    Port: 8080       │
    └─────────────────────┘    └──────────┬──────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────┐
            │                             │                         │
            ▼                             ▼                         ▼
    ┌───────────────┐           ┌───────────────┐         ┌───────────────┐
    │  PostgreSQL   │           │  VL Service   │         │Rerank Service │
    │  Port: 5432   │           │  Port: 8000   │         │  Port: 8001   │
    │  (pgvector)   │           │ (向量嵌入服务) │         │ (重排序服务)   │
    └───────────────┘           └───────────────┘         └───────────────┘
                                          │                         │
                                          └──────────┬────────────────┘
                                                     │
                                    ┌────────────────┴────────────────┐
                                    │                                  │
                                    ▼                                  ▼
                            ┌───────────────┐                ┌───────────────┐
                            │     MinIO     │                │    Redis      │
                            │  Port: 9000   │                │  Port: 6379   │
                            │  (图片存储)    │                │   (缓存)      │
                            └───────────────┘                └───────────────┘
```

## 调用链路说明

```
前端浏览器
    │
    │  HTTP Request
    ▼
┌─────────┐
│  Nginx  │  ← 反向代理，静态文件服务
└────┬────┘
     │
     ├──► /                    → 前端静态文件 (React SPA)
     │
     └──► /api/*               → Artifacts Service
            │
            │ 用户上传图片/提问
            ▼
     ┌────────────────┐
     │ Artifacts      │
     │ Service        │
     └───────┬────────┘
             │
             │ 1. 调用向量服务
             ▼
      ┌─────────────┐
      │VL Service   │  ← 内部调用，前端无感知
      │生成图片向量 │
      └─────────────┘
             │
             │ 2. 获取文物列表
             ▼
      ┌─────────────┐
      │ PostgreSQL  │
      └─────────────┘
             │
             │ 3. 调用重排序服务
             ▼
      ┌─────────────┐
      │Rerank       │  ← 内部调用，前端无感知
      │Service      │
      └─────────────┘
             │
             │ 4. 返回匹配结果
             ▼
     ┌────────────────┐
     │ 前端展示结果   │
     └────────────────┘
```

---

## Docker 组件清单

### 1. Nginx (反向代理 + 前端服务)

**镜像**: `nginx:alpine`

**端口**: `80`, `443`

**功能**:
- 服务前端静态文件
- 反向代理到 Artifacts Service
- SSL/TLS 终止
- Gzip 压缩

**docker-compose.yml 配置**:
```yaml
nginx:
  image: nginx:alpine
  container_name: museum-nginx
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./frontend/dist:/usr/share/nginx/html:ro
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
  depends_on:
    - artifacts-service
  restart: unless-stopped
  networks:
    - museum-network
```

---

### 2. Frontend (前端构建)

**镜像**: `node:18-alpine` (构建时) / `nginx:alpine` (运行时)

**功能**:
- React + Vite 前端应用
- 只调用 `/api/*` 接口与后端通信

**Dockerfile**:
```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 3. Artifacts Service (文物管理服务 - 唯一对外API)

**镜像**: 自定义构建

**基础镜像**: `golang:1.21-alpine` 或 `python:3.11-slim`

**端口**: `8080`

**功能**:
- 对外提供所有业务 API
- 文物 CRUD 操作
- 图片上传处理
- 文档解析
- **内部调用** VL Service 生成向量
- **内部调用** Rerank Service 进行匹配

**对外接口**:

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/artifacts/upload` | 上传文物 |
| GET | `/api/artifacts` | 获取文物列表 |
| GET | `/api/artifacts/{id}` | 获取文物详情 |
| DELETE | `/api/artifacts/{id}` | 删除文物 |

**docker-compose.yml 配置**:
```yaml
artifacts-service:
  build: ./backend/artifacts-service
  container_name: museum-artifacts-service
  ports:
    - "8080:8080"
  environment:
    # 数据库连接
    - DATABASE_URL=postgresql://museum:museum_password@postgres:5432/museum_db
    # Redis 缓存
    - REDIS_URL=redis://:redis_password@redis:6379/0
    # 内部服务调用（前端无感知）
    - VL_SERVICE_URL=http://vl-service:8000
    - RERANK_SERVICE_URL=http://rerank-service:8001
    # 对象存储
    - MINIO_ENDPOINT=minio:9000
    - MINIO_ACCESS_KEY=minioadmin
    - MINIO_SECRET_KEY=minioadmin
    - MINIO_BUCKET=artifacts
    - MINIO_USE_SSL=false
  volumes:
    - ./uploads:/tmp/uploads
  depends_on:
    - postgres
    - redis
    - minio
    - vl-service
    - rerank-service
  restart: unless-stopped
  networks:
    - museum-network
```

---

### 4. VL Service (向量嵌入服务 - 内部)

**镜像**: 自定义 AI 模型服务

**端口**: `8000` (仅内网访问)

**功能**:
- 文本向量化
- 图像向量化
- **仅被 Artifacts Service 调用**

**docker-compose.yml 配置**:
```yaml
vl-service:
  build: ./backend/vl-service
  container_name: museum-vl-service
  ports:  # 开发环境可暴露端口，生产环境建议不暴露
    - "8000:8000"
  environment:
    - MODEL_PATH=/models
    - DEVICE=cuda  # 或 cpu
    - API_PORT=8000
  volumes:
    - ./models/embedding:/models:ro
  # GPU 支持（可选）
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
  restart: unless-stopped
  networks:
    - museum-network
```

---

### 5. Rerank Service (重排序服务 - 内部)

**镜像**: 自定义 AI 模型服务

**端口**: `8001` (仅内网访问)

**功能**:
- 文档相关性排序
- 图文匹配评分
- **仅被 Artifacts Service 调用**

**docker-compose.yml 配置**:
```yaml
rerank-service:
  build: ./backend/rerank-service
  container_name: museum-rerank-service
  ports:  # 开发环境可暴露端口，生产环境建议不暴露
    - "8001:8001"
  environment:
    - MODEL_PATH=/models
    - DEVICE=cuda
    - API_PORT=8001
  volumes:
    - ./models/rerank:/models:ro
  # GPU 支持（可选）
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
  restart: unless-stopped
  networks:
    - museum-network
```

---

### 6. PostgreSQL (关系型数据库)

**镜像**: `pgvector/pgvector:pg15`

**端口**: `5432`

**功能**:
- 存储用户数据
- 存储文物信息
- 存储对话记录
- 存储向量数据 (pgvector 扩展)

**docker-compose.yml 配置**:
```yaml
postgres:
  image: pgvector/pgvector:pg15
  container_name: museum-postgres
  ports:
    - "5432:5432"
  environment:
    - POSTGRES_DB=museum_db
    - POSTGRES_USER=museum
    - POSTGRES_PASSWORD=museum_password
    - PGDATA=/var/lib/postgresql/data/pgdata
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U museum -d museum_db"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
  networks:
    - museum-network

volumes:
  postgres_data:
```

---

### 7. MinIO (对象存储)

**镜像**: `minio/minio:latest`

**端口**: `9000` (API), `9001` (Console)

**功能**:
- 存储文物图片
- 存储用户上传的文件
- 提供文件访问URL

**docker-compose.yml 配置**:
```yaml
minio:
  image: minio/minio:latest
  container_name: museum-minio
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    - MINIO_ROOT_USER=minioadmin
    - MINIO_ROOT_PASSWORD=minioadmin
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3
  restart: unless-stopped
  networks:
    - museum-network

volumes:
  minio_data:
```

**初始化 Bucket**:
```bash
# 首次运行后创建
docker exec -it museum-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it museum-minio mc mb local/artifacts
docker exec -it museum-minio mc anonymous set download local/artifacts
```

---

### 8. Redis (缓存 + 队列)

**镜像**: `redis:7-alpine`

**端口**: `6379`

**功能**:
- API 响应缓存
- 向量缓存
- 会话存储

**docker-compose.yml 配置**:
```yaml
redis:
  image: redis:7-alpine
  container_name: museum-redis
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes --requirepass redis_password
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "redis_password", "ping"]
    interval: 10s
    timeout: 3s
    retries: 3
  restart: unless-stopped
  networks:
    - museum-network

volumes:
  redis_data:
```

---

## 完整 docker-compose.yml

```yaml
version: '3.8'

services:
  # ==================== Nginx 反向代理 ====================
  nginx:
    image: nginx:alpine
    container_name: museum-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - artifacts-service
    restart: unless-stopped
    networks:
      - museum-network

  # ==================== 后端服务 ====================
  artifacts-service:
    build: ./backend/artifacts-service
    container_name: museum-artifacts-service
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://museum:museum_password@postgres:5432/museum_db
      - REDIS_URL=redis://:redis_password@redis:6379/0
      # 内部服务地址
      - VL_SERVICE_URL=http://vl-service:8000
      - RERANK_SERVICE_URL=http://rerank-service:8001
      # 对象存储
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - MINIO_BUCKET=artifacts
      - MINIO_USE_SSL=false
    volumes:
      - ./uploads:/tmp/uploads
    depends_on:
      - postgres
      - redis
      - minio
      - vl-service
      - rerank-service
    restart: unless-stopped
    networks:
      - museum-network

  # ==================== AI 服务 (内部调用) ====================
  vl-service:
    build: ./backend/vl-service
    container_name: museum-vl-service
    # 生产环境建议不暴露端口，仅开发环境使用
    expose:
      - "8000"
    environment:
      - MODEL_PATH=/models
      - DEVICE=cuda
      - API_PORT=8000
    volumes:
      - ./models/embedding:/models:ro
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    networks:
      - museum-network

  rerank-service:
    build: ./backend/rerank-service
    container_name: museum-rerank-service
    # 生产环境建议不暴露端口，仅开发环境使用
    expose:
      - "8001"
    environment:
      - MODEL_PATH=/models
      - DEVICE=cuda
      - API_PORT=8001
    volumes:
      - ./models/rerank:/models:ro
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    networks:
      - museum-network

  # ==================== 数据存储 ====================
  postgres:
    image: pgvector/pgvector:pg15
    container_name: museum-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=museum_db
      - POSTGRES_USER=museum
      - POSTGRES_PASSWORD=museum_password
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U museum -d museum_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - museum-network

  minio:
    image: minio/minio:latest
    container_name: museum-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    restart: unless-stopped
    networks:
      - museum-network

  redis:
    image: redis:7-alpine
    container_name: museum-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redis_password
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_password", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped
    networks:
      - museum-network

volumes:
  postgres_data:
    driver: local
  minio_data:
    driver: local
  redis_data:
    driver: local

networks:
  museum-network:
    driver: bridge
```

---

## Nginx 配置

**`nginx/nginx.conf`**:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml application/json application/javascript;

    # 上游服务定义
    upstream artifacts_backend {
        server artifacts-service:8080;
    }

    # 图片访问上游
    upstream minio_images {
        server minio:9000;
    }

    server {
        listen 80;
        server_name localhost;

        # 前端路由 - 所有非API请求返回index.html
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "public, max-age=3600";
        }

        # 文物API - 代理到后端服务
        location /api/ {
            proxy_pass http://artifacts_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 支持大文件上传
            client_max_body_size 50M;
            client_body_timeout 300s;
            proxy_read_timeout 300s;
            proxy_send_timeout 300s;
        }

        # 图片访问 - 代理到MinIO
        location /images/ {
            proxy_pass http://minio_images/artifacts/;
            proxy_set_header Host $host;
            add_header Cache-Control "public, max-age=86400";
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

**关键点**：
- 前端只调用 `/api/*` 接口
- `/api/*` 请求被转发到 `artifacts-service:8080`
- `/images/*` 请求被转发到 MinIO
- **没有** 直接暴露 VL Service 和 Rerank Service 的路由

---

## 前端 API 调用配置

**前端环境变量配置** (`.env.production`):

```bash
# 前端只需要配置后端 API 地址
VITE_API_BASE_URL=http://your-domain.com/api
VITE_IMAGE_BASE_URL=http://your-domain.com/images
```

**前端 API 客户端** (`src/api/client.ts`):

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 所有请求都通过 Artifacts Service
export const artifactsApi = {
  uploadArtifact: (data: ArtifactUploadRequest) =>
    apiClient.post('/artifacts/upload', data),

  getArtifacts: () =>
    apiClient.get<Artifact[]>('/artifacts'),

  getArtifact: (id: string) =>
    apiClient.get<Artifact>(`/artifacts/${id}`),
};
```

---

## 后端服务内部调用

**Artifacts Service 内部调用示例** (伪代码):

```go
// Artifacts Service 处理文物识别请求
func (s *Service) IdentifyArtifact(imageBase64 string) (*ArtifactMatch, error) {
    // 1. 调用 VL Service 生成向量
    embedding, err := s.vlClient.CreateEmbedding(imageBase64)

    // 2. 从数据库获取所有文物
    artifacts, err := s.db.GetAllArtifacts()

    // 3. 调用 Rerank Service 进行匹配
    result, err := s.rerankClient.Rerank(embedding, artifacts)

    // 4. 返回结果给前端
    return result, nil
}
```

---

## 网络隔离（生产环境）

生产环境建议将 AI 服务放在单独的内网网络：

```yaml
networks:
  # 外部网络 - 对外服务
  public-network:
    driver: bridge

  # 内部网络 - AI 服务
  ai-network:
    driver: bridge
    internal: true  # 完全隔离，无外网访问

services:
  nginx:
    networks:
      - public-network

  artifacts-service:
    networks:
      - public-network
      - ai-network  # 需要同时访问两个网络

  vl-service:
    networks:
      - ai-network  # 只在内网

  rerank-service:
    networks:
      - ai-network  # 只在内网
```

---

## 资源规划

| 服务 | CPU | 内存 | GPU | 对外暴露 |
|------|-----|------|-----|----------|
| Nginx | 1核 | 256MB | - | ✅ |
| Artifacts Service | 2核 | 2GB | - | ✅ |
| VL Service | 4核+ | 8GB+ | 推荐 | ❌ |
| Rerank Service | 4核+ | 8GB+ | 推荐 | ❌ |
| PostgreSQL | 2核 | 2GB | - | ❌ |
| MinIO | 2核 | 1GB | - | ❌ |
| Redis | 1核 | 512MB | - | ❌ |

---

## 部署步骤

### 1. 构建前端

```bash
cd frontend
npm install
npm run build
# dist 目录将挂载到 nginx 容器
```

### 2. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f artifacts-service
```

### 3. 初始化数据库

```bash
# 连接数据库
docker exec -it museum-postgres psql -U museum -d museum_db

# 初始化脚本会自动执行 ./sql/init.sql
```

### 4. 配置 MinIO

```bash
# 创建 bucket
docker exec -it museum-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it museum-minio mc mb local/artifacts
docker exec -it museum-minio mc anonymous set download local/artifacts
```

---

## 健康检查

```bash
# 检查各服务状态
docker exec museum-nginx curl -s http://localhost/health

# 检查后端服务
curl http://localhost:8080/health

# 检查数据库
docker exec museum-postgres pg_isready -U museum
```

---

## 故障排查

```bash
# 查看服务日志
docker-compose logs -f [service-name]

# 进入容器调试
docker exec -it museum-artifacts-service sh

# 重启单个服务
docker-compose restart artifacts-service

# 查看网络连接
docker network inspect museum-network
```
