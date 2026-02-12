# ==================== 应用配置 ====================
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置类，从环境变量读取配置"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

    # 应用配置
    APP_NAME: str = "Museum Tour Guide Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 5000

    # 数据库配置
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "museum"
    DB_PASSWORD: str = "123456"
    DB_NAME: str = "museum"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # MinIO 配置
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_DOCS: str = "artifacts"  # 文档存储bucket
    MINIO_BUCKET_IMAGES: str = "artifacts"  # 图片存储bucket

    # Embedding 服务配置
    EMBEDDING_SERVICE_URL: str = "http://localhost:8000"
    EMBEDDING_BATCH_SIZE: int = 1  # 每批处理的图片数量

    # 上传配置
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    ALLOWED_DOC_TYPES: list[str] = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
        "application/msword",  # .doc
    ]

    # Base URL for accessing uploaded files
    BASE_URL: str = "http://localhost:5000"


# 全局配置实例
settings = Settings()
