# 智能博物馆导览系统

基于 AI 的智能博物馆文物导览系统，支持文物上传、智能识别、拍照讲解等功能。

## 项目结构

```
museum_tour_guide/
├── backend/                 # 后端服务 (FastAPI)
│   ├── app/                # 应用代码
│   ├── main.py             # 入口文件
│   ├── start.sh            # 启动脚本
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端服务 (React + Vite)
│   ├── src/                # 源代码
│   └── package.json        # 依赖配置
├── museum_docker/          # Docker 部署配置
├── Qwen3-VL-Embedding-2B/ # Embedding 服务
├── qwen3-rerank-service/  # Rerank 服务
└── qwen3-vl-service/      # 视觉语言模型服务
```

## 环境要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- MinIO (对象存储)

## 快速开始

### 1. 启动 Docker 服务

```bash
cd museum_docker
docker compose up -d
```

这会启动 PostgreSQL、MinIO 等依赖服务。

### 2. 配置环境变量

复制后端环境变量模板：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，配置数据库、MinIO 等服务地址。

### 3. 启动后端服务

```bash
cd backend
# 创建虚拟环境
conda create -n museume python==3.10

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

后端服务运行在 `http://localhost:5000`

### 4. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务运行在 `http://localhost:3000`


## 许可证

MIT License
