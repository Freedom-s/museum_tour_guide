# ==================== MinIO 存储服务 ====================
import os
import uuid
from typing import Optional, Literal
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException
from loguru import logger

from app.config import settings


class MinioService:
    """MinIO 对象存储服务"""

    def __init__(self):
        self.client: Optional[Minio] = None
        self._initialized = False

    async def initialize(self):
        """初始化 MinIO 客户端"""
        if self._initialized:
            return

        try:
            self.client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )

            # 确保bucket存在
            bucket = settings.MINIO_BUCKET_DOCS
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)
                logger.info(f"Created bucket: {bucket}")
                # 设置bucket为公共可读
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{bucket}/*"]
                        }
                    ]
                }
                import json
                self.client.set_bucket_policy(bucket, json.dumps(policy))

            self._initialized = True
            logger.info(f"MinIO client initialized: {settings.MINIO_ENDPOINT}")

        except S3Error as e:
            logger.error(f"Failed to initialize MinIO: {e}")
            raise HTTPException(status_code=500, detail=f"MinIO initialization failed: {e}")

    def _generate_object_name(self, artifact_id: str, filename: str, file_type: str) -> str:
        """生成存储对象名称"""
        # 统一使用原始文件名
        return f"{artifact_id}/{filename}"

    async def upload_file(
        self,
        file: UploadFile,
        artifact_id: str,
        file_type: Literal["doc", "image"]
    ) -> str:
        """
        上传文件到 MinIO

        Args:
            file: 上传的文件
            artifact_id: 文物ID
            file_type: 文件类型 ("doc" 或 "image")

        Returns:
            文件的MinIO URL (minio://bucket/object_name)
        """
        if not self._initialized:
            await self.initialize()

        bucket = settings.MINIO_BUCKET_DOCS  # 统一使用 artifacts bucket
        object_name = self._generate_object_name(artifact_id, file.filename or "unknown", file_type)

        try:
            # 读取文件内容
            content = await file.read()
            file.file.seek(0)  # 重置文件指针

            # 上传到MinIO
            from io import BytesIO
            self.client.put_object(
                bucket,
                object_name,
                BytesIO(content),
                length=len(content),
                content_type=file.content_type
            )

            # 返回minio://格式的URL
            minio_url = f"minio://{bucket}/{object_name}"
            logger.info(f"Uploaded file: {minio_url}")
            return minio_url

        except S3Error as e:
            logger.error(f"Failed to upload file: {e}")
            raise HTTPException(status_code=500, detail=f"File upload failed: {e}")

    async def upload_bytes(
        self,
        content: bytes,
        artifact_id: str,
        filename: str,
        content_type: str,
        file_type: Literal["doc", "image"]
    ) -> str:
        """
        上传字节数据到 MinIO

        Args:
            content: 文件内容字节
            artifact_id: 文物ID
            filename: 文件名
            content_type: MIME类型
            file_type: 文件类型 ("doc" 或 "image")

        Returns:
            文件的MinIO URL (minio://bucket/object_name)
        """
        if not self._initialized:
            await self.initialize()

        bucket = settings.MINIO_BUCKET_DOCS  # 统一使用 artifacts bucket
        object_name = self._generate_object_name(artifact_id, filename, file_type)

        try:
            from io import BytesIO
            self.client.put_object(
                bucket,
                object_name,
                BytesIO(content),
                length=len(content),
                content_type=content_type
            )

            minio_url = f"minio://{bucket}/{object_name}"
            logger.info(f"Uploaded bytes: {minio_url}")
            return minio_url

        except S3Error as e:
            logger.error(f"Failed to upload bytes: {e}")
            raise HTTPException(status_code=500, detail=f"File upload failed: {e}")

    def get_public_url(self, minio_url: str) -> str:
        """
        将minio:// URL转换为HTTP可访问的URL

        Args:
            minio_url: minio://bucket/object_name 格式的URL

        Returns:
            http://endpoint/bucket/object_name 格式的URL
        """
        if not minio_url.startswith("minio://"):
            return minio_url

        # minio://bucket/object_name -> /bucket/object_name
        path = minio_url[8:]  # 去掉 "minio://"
        protocol = "https" if settings.MINIO_SECURE else "http"
        return f"{protocol}://{settings.MINIO_ENDPOINT}/{path}"

    async def delete_file(self, minio_url: str) -> bool:
        """
        删除MinIO中的文件

        Args:
            minio_url: minio://bucket/object_name 格式的URL

        Returns:
            是否删除成功
        """
        if not self._initialized:
            await self.initialize()

        if not minio_url.startswith("minio://"):
            logger.warning(f"Not a MinIO URL: {minio_url}")
            return False

        try:
            path = minio_url[8:]  # 去掉 "minio://"
            parts = path.split("/", 1)
            if len(parts) != 2:
                logger.error(f"Invalid MinIO URL: {minio_url}")
                return False

            bucket, object_name = parts
            self.client.remove_object(bucket, object_name)
            logger.info(f"Deleted file: {minio_url}")
            return True

        except S3Error as e:
            logger.error(f"Failed to delete file: {e}")
            return False


# 全局MinIO服务实例
minio_service = MinioService()
