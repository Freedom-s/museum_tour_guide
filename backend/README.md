# Backend - Museum Tour Guide

博物馆智能导览系统后端服务

## 功能特性

- 文物信息上传（名称 + docx文档 + 多张图片）
- MinIO 对象存储
- PostgreSQL + pgvector 向量存储
- 图片 Embedding 生成
- 文档内容解析（docx/pdf）

## 环境配置

1. 复制 `.env.example` 到 `.env`:
```bash
cp .env.example .env
```

2. 根据需要修改 `.env` 中的配置

## 安装依赖

```bash
pip install -r requirements.txt
```

## 启动服务

```bash
# 方式1: 直接运行
python main.py

# 方式2: 使用启动脚本
bash start.sh

# 方式3: 使用 uvicorn
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

## API 接口

### 上传文物

```
POST /api/v1/artifacts/upload

Content-Type: multipart/form-data

Form Data:
- name: 文物名称
- doc_file: docx 文档文件
- images: 图片文件（可多个，至少一个）
```

### 获取文物列表

```
GET /api/v1/artifacts?skip=0&limit=100
```

### 获取文物详情

```
GET /api/v1/artifacts/{artifact_id}
```

### 健康检查

```
GET /health
```

## 依赖服务

- PostgreSQL (localhost:5432)
- MinIO (localhost:9000)
- Embedding Service (localhost:8000)

## 项目结构

```
backend/
├── app/
│   ├── api/           # API 路由
│   ├── models/        # Pydantic 模型
│   ├── services/      # 业务逻辑服务
│   └── config.py      # 配置管理
├── main.py            # 应用入口
├── requirements.txt   # Python 依赖
└── README.md          # 本文件
```
