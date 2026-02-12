# ==================== Pydantic 数据模型 ====================
from typing import Optional, List
from pydantic import BaseModel, Field, UUID4
from datetime import datetime


# ==================== 请求模型 ====================
class ArtifactUploadRequest(BaseModel):
    """文物上传请求"""
    name: str = Field(..., min_length=1, max_length=200, description="文物名称")
    # description 是可选的，如果没有提供，会从 docx 文件中解析


class ImageInfo(BaseModel):
    """图片信息"""
    id: str
    artifact_id: str
    image_url: str
    created_at: datetime


# ==================== 响应模型 ====================
class ArtifactResponse(BaseModel):
    """文物响应"""
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ArtifactDetailResponse(ArtifactResponse):
    """文物详情响应（包含图片）"""
    images: List[ImageInfo] = []


class UploadResponse(BaseModel):
    """上传响应"""
    artifact_id: str
    name: str
    description: Optional[str] = None
    image_count: int
    images: List[ImageInfo] = []


class ErrorResponse(BaseModel):
    """错误响应"""
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    services: dict
