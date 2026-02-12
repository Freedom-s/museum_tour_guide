# ==================== 数据库模型和连接 ====================
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, DECIMAL, CheckConstraint, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from pgvector.sqlalchemy import Vector
from loguru import logger

from app.config import settings


# ==================== 数据库引擎 ====================
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# ==================== Base 类 ====================
class Base(DeclarativeBase):
    """所有模型的基类"""
    pass


# ==================== 数据库模型 ====================
class Artifact(Base):
    """文物表"""
    __tablename__ = "artifacts"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 关系
    images = relationship("ArtifactImage", back_populates="artifact", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class ArtifactImage(Base):
    """文物图片表"""
    __tablename__ = "artifact_images"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    artifact_id = Column(PG_UUID(as_uuid=True), ForeignKey("artifacts.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    vector = Column(Vector(2048))  # 2048维向量
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 关系
    artifact = relationship("Artifact", back_populates="images")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "artifact_id": str(self.artifact_id),
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Conversation(Base):
    """对话表"""
    __tablename__ = "conversations"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(200), nullable=False)
    artifact_id = Column(PG_UUID(as_uuid=True), ForeignKey("artifacts.id", ondelete="SET NULL"))
    message_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "artifact_id": str(self.artifact_id) if self.artifact_id else None,
            "message_count": self.message_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Message(Base):
    """消息表"""
    __tablename__ = "messages"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    conversation_id = Column(PG_UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), CheckConstraint("role IN ('user', 'assistant', 'system')"), nullable=False)
    content = Column(Text)
    image_data = Column(Text)
    image_url = Column(String(500))
    artifact_id = Column(PG_UUID(as_uuid=True), ForeignKey("artifacts.id", ondelete="SET NULL"))
    relevance_score = Column(DECIMAL(5, 4))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "conversation_id": str(self.conversation_id),
            "role": self.role,
            "content": self.content,
            "image_url": self.image_url,
            "artifact_id": str(self.artifact_id) if self.artifact_id else None,
            "relevance_score": float(self.relevance_score) if self.relevance_score else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ==================== 数据库操作函数 ====================
async def get_db() -> AsyncSession:
    """获取数据库会话"""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """初始化数据库（创建表等）"""
    async with engine.begin() as conn:
        # 在生产环境中，建议使用 Alembic 进行数据库迁移
        # 这里仅用于开发环境的快速初始化
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized")


# ==================== 仓库类 ====================
class ArtifactRepository:
    """文物数据仓库"""

    @staticmethod
    async def create(session: AsyncSession, name: str, description: Optional[str] = None) -> Artifact:
        """创建文物"""
        artifact = Artifact(name=name, description=description)
        session.add(artifact)
        await session.flush()
        await session.refresh(artifact)
        return artifact

    @staticmethod
    async def get_by_id(session: AsyncSession, artifact_id: UUID) -> Optional[Artifact]:
        """根据ID获取文物"""
        result = await session.execute(
            select(Artifact).where(Artifact.id == artifact_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_all(session: AsyncSession, limit: int = 100, offset: int = 0) -> list[Artifact]:
        """获取文物列表"""
        result = await session.execute(
            select(Artifact).order_by(Artifact.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update(session: AsyncSession, artifact_id: UUID, **kwargs) -> Optional[Artifact]:
        """更新文物信息"""
        artifact = await ArtifactRepository.get_by_id(session, artifact_id)
        if artifact:
            for key, value in kwargs.items():
                if hasattr(artifact, key):
                    setattr(artifact, key, value)
            await session.flush()
            await session.refresh(artifact)
        return artifact


class ArtifactImageRepository:
    """文物图片数据仓库"""

    @staticmethod
    async def create(
        session: AsyncSession,
        artifact_id: UUID,
        image_url: str,
        embedding: Optional[list[float]] = None
    ) -> ArtifactImage:
        """创建文物图片"""
        image = ArtifactImage(
            artifact_id=artifact_id,
            image_url=image_url,
            vector=embedding
        )
        session.add(image)
        await session.flush()
        await session.refresh(image)
        return image

    @staticmethod
    async def create_many(
        session: AsyncSession,
        artifact_id: UUID,
        image_urls: list[tuple[str, Optional[list[float]]]]
    ) -> list[ArtifactImage]:
        """批量创建文物图片
        Args:
            session: 数据库会话
            artifact_id: 文物ID
            image_urls: [(image_url, embedding), ...] 列表
        """
        images = []
        for image_url, embedding in image_urls:
            image = ArtifactImage(
                artifact_id=artifact_id,
                image_url=image_url,
                vector=embedding
            )
            session.add(image)
            images.append(image)

        await session.flush()
        for image in images:
            await session.refresh(image)
        return images

    @staticmethod
    async def get_by_artifact_id(session: AsyncSession, artifact_id: UUID) -> list[ArtifactImage]:
        """获取文物的所有图片"""
        result = await session.execute(
            select(ArtifactImage).where(ArtifactImage.artifact_id == artifact_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def search_by_vector(
        session: AsyncSession,
        embedding: list[float],
        limit: int = 10,
        threshold: float = 0.7
    ) -> list[tuple[ArtifactImage, float]]:
        """通过向量搜索相似图片 (余弦相似度)
        Args:
            session: 数据库会话
            embedding: 查询向量
            limit: 返回结果数量
            threshold: 相似度阈值 (0-1)
        Returns:
            [(ArtifactImage, similarity_score), ...]
        """
        # pgvector 使用 cosine_distance 操作符计算余弦距离
        # 距离越小越相似，所以我们要找距离 < (1 - threshold) 的结果
        max_distance = 1 - threshold

        from sqlalchemy import select, func, text
        from sqlalchemy.sql import column

        # 使用 text() 来处理 pgvector 的操作符
        result = await session.execute(
            select(ArtifactImage).where(
                text(f"vector <=> %s < {max_distance}")
            ).order_by(
                text(f"vector <=> %s")
            ).limit(limit),
            {"embedding": embedding}
        )

        images = list(result.scalars().all())
        # 计算相似度 (需要单独计算)
        return [(img, 0.0) for img in images]
