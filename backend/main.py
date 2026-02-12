# ==================== FastAPI 主应用 ====================
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys

from app.config import settings
from app.api.upload import router as upload_router
from app.services.database import init_db
from app.services.minio_service import minio_service
from app.services.embedding_service import embedding_service


# 配置日志
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO" if not settings.DEBUG else "DEBUG"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("Starting Museum Tour Guide Backend...")

    # 初始化 MinIO
    try:
        await minio_service.initialize()
    except Exception as e:
        logger.error(f"Failed to initialize MinIO: {e}")

    # 初始化数据库
    try:
        await init_db()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    # 检查 embedding 服务
    embedding_healthy = await embedding_service.health_check()
    if embedding_healthy:
        logger.info(f"Embedding service is healthy: {settings.EMBEDDING_SERVICE_URL}")
    else:
        logger.warning(f"Embedding service is not available: {settings.EMBEDDING_SERVICE_URL}")

    logger.info("Backend started successfully")

    yield

    # 关闭时执行
    logger.info("Shutting down backend...")


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(upload_router)


# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


# 健康检查接口
@app.get("/health", tags=["health"])
async def health_check():
    """健康检查"""
    embedding_ok = await embedding_service.health_check()

    return {
        "status": "healthy" if embedding_ok else "degraded",
        "services": {
            "embedding": "ok" if embedding_ok else "unavailable"
        }
    }


@app.get("/", tags=["root"])
async def root():
    """根路径"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
