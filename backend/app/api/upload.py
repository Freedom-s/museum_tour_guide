# ==================== 文物上传 API ====================
from typing import List
from uuid import UUID

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.services.database import get_db, ArtifactRepository, ArtifactImageRepository
from app.services.minio_service import minio_service
from app.services.embedding_service import embedding_service
from app.services.docx_parser import docx_parser
from app.models.schemas import UploadResponse, ImageInfo
from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["upload"])


@router.post("/artifacts/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_artifact(
    name: str = Form(..., min_length=1, max_length=200, description="文物名称"),
    doc_file: UploadFile = File(..., description="docx 文档文件"),
    images: List[UploadFile] = File(..., min_length=1, description="文物图片（至少一张）"),
    db: AsyncSession = Depends(get_db)
):
    """
    上传文物信息

    Args:
        name: 文物名称
        doc_file: docx 文档文件
        images: 文物图片列表（至少一张）
        db: 数据库会话

    Returns:
        UploadResponse: 上传结果，包含文物信息和图片信息
    """

    # 1. 验证文件类型
    if doc_file.content_type not in settings.ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文档类型: {doc_file.content_type}，请上传 .docx 格式文件"
        )

    for img in images:
        if img.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的图片类型: {img.content_type}"
            )

    # 2. 解析文档内容
    doc_content = await doc_file.read()
    doc_file.file.seek(0)
    description = docx_parser.parse(doc_content, doc_file.content_type)

    if not description:
        description = f"{name}的描述文档"
        logger.warning(f"Failed to parse document, using default description")

    # 3. 创建文物记录
    artifact = await ArtifactRepository.create(db, name=name, description=description)
    artifact_id_str = str(artifact.id)

    logger.info(f"Created artifact: {artifact_id_str} - {name}")

    # 4. 上传文档到 MinIO
    try:
        # 上传doc到minio，然后返回一个minio的地址
        doc_url = await minio_service.upload_file(
            file=doc_file,
            artifact_id=artifact_id_str,
            file_type="doc"
        )
        logger.info(f"Uploaded document: {doc_url}")
    except Exception as e:
        # 如果文档上传失败，回滚文物记录
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文档上传失败: {str(e)}"
        )

    # 5. 上传图片并获取 embedding
    image_results = []
    image_urls = [] #minio://artifacts/uuid/xxx.jpeg

    for img in images:
        # 5.1 上传图片到 MinIO
        try:
            # 上传图片，然后返回一个图片的地址
            img_url = await minio_service.upload_file(
                file=img,
                artifact_id=artifact_id_str,
                file_type="image"
            )
            image_urls.append(img_url)
            logger.info(f"Uploaded image: {img_url}")

        except Exception as e:
            logger.error(f"Failed to upload image {img.filename}: {e}")
            continue

    # 6. 批量获取图片的 embedding
    embeddings = []
    if image_urls:
        logger.info(f"Getting embeddings for {len(image_urls)} images...")
        embeddings = await embedding_service.embed_batch(image_urls)

    # 7. 存储图片信息和 embedding 到数据库
    for img_url, embedding in zip(image_urls, embeddings):
        image = await ArtifactImageRepository.create(
            db,
            artifact_id=artifact.id,
            image_url=img_url,
            embedding=embedding
        )

        image_results.append(ImageInfo(
            id=str(image.id),
            artifact_id=artifact_id_str,
            image_url=minio_service.get_public_url(img_url),
            created_at=image.created_at
        ))

    # 8. 提交事务
    await db.commit()

    logger.info(f"Successfully uploaded artifact with {len(image_results)} images")

    return UploadResponse(
        artifact_id=artifact_id_str,
        name=name,
        description=description,
        image_count=len(image_results),
        images=image_results
    )


@router.get("/artifacts", response_model=List[dict])
async def list_artifacts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取文物列表"""
    artifacts = await ArtifactRepository.list_all(db, limit=limit, offset=skip)

    result = []
    for artifact in artifacts:
        artifact_dict = artifact.to_dict()

        # 获取图片数量
        images = await ArtifactImageRepository.get_by_artifact_id(db, artifact.id)
        artifact_dict["image_count"] = len(images)

        # 获取第一张图片作为缩略图
        if images:
            first_image = images[0]
            artifact_dict["thumbnail_url"] = minio_service.get_public_url(first_image.image_url)
        else:
            artifact_dict["thumbnail_url"] = None

        result.append(artifact_dict)

    return result


@router.get("/artifacts/{artifact_id}", response_model=dict)
async def get_artifact(
    artifact_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取文物详情"""
    from uuid import UUID
    try:
        artifact_uuid = UUID(artifact_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid artifact ID format"
        )

    artifact = await ArtifactRepository.get_by_id(db, artifact_uuid)
    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found"
        )

    # 获取图片
    images = await ArtifactImageRepository.get_by_artifact_id(db, artifact_uuid)

    result = artifact.to_dict()
    result["image_count"] = len(images)
    result["images"] = []
    for img in images:
        img_dict = {
            **img.to_dict(),
            "image_url": minio_service.get_public_url(img.image_url)
        }
        # 从 minio URL 中提取文件名 (minio://artifacts/{uuid}/{filename})
        if img.image_url.startswith("minio://artifacts/"):
            filename = img.image_url.split("/")[-1]
            img_dict["filename"] = filename
        result["images"].append(img_dict)

    return result
