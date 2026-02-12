# ==================== Embedding 服务客户端 ====================
from typing import List, Optional
import httpx
from loguru import logger

from app.config import settings


class EmbeddingService:
    """Embedding 服务客户端"""

    def __init__(self):
        self.base_url = settings.EMBEDDING_SERVICE_URL

    async def embed_text(self, text: str) -> Optional[List[float]]:
        """
        对文本进行 embedding

        Args:
            text: 输入文本

        Returns:
            embedding 向量，失败返回 None
        """
        return await self._embed([text])

    async def embed_image_url(self, image_url: str) -> Optional[List[float]]:
        """
        对图片URL进行 embedding

        Args:
            image_url: 图片URL (支持 minio://, http://, https://)

        Returns:
            embedding 向量，失败返回 None
        """
        return await self._embed([image_url])

    async def embed_batch(self, inputs: List[str]) -> Optional[List[List[float]]]:
        """
        批量进行 embedding（分批处理）

        Args:
            inputs: 输入列表（可以是文本或图片URL）

        Returns:
            embedding 向量列表，失败返回 None
        """
        if not inputs:
            return []

        batch_size = settings.EMBEDDING_BATCH_SIZE
        all_embeddings = []

        # 分批处理
        for i in range(0, len(inputs), batch_size):
            batch = inputs[i:i + batch_size]
            logger.info(f"Processing embedding batch {i // batch_size + 1}: {len(batch)} items")

            batch_result = await self._embed(batch, return_list=True)

            if batch_result is None:
                logger.error(f"Batch {i // batch_size + 1} failed, using None for this batch")
                # 批次失败时，用 None 填充对应位置
                all_embeddings.extend([None] * len(batch))
            else:
                all_embeddings.extend(batch_result)

        return all_embeddings if all_embeddings else None

    async def _embed(
        self,
        inputs: List[str],
        return_list: bool = False
    ) -> Optional[List[float] | List[List[float]]]:
        """
        调用 embedding 服务

        Args:
            inputs: 输入列表
            return_list: 是否返回列表形式

        Returns:
            单个或多个 embedding 向量
        """
        url = f"{self.base_url}/v1/embeddings"

        payload = {
            "input": inputs,
            "model": "qwen3-vl"
        }

        try:
            async with httpx.AsyncClient(timeout=None) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()

                data = response.json()
                embeddings = [item["embedding"] for item in data["data"]]

                if return_list:
                    return embeddings
                else:
                    return embeddings[0] if embeddings else None

        except httpx.TimeoutException:
            logger.error(f"Embedding service timeout: {url}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"Embedding service HTTP error: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Embedding service error: {e}")
            return None

    async def health_check(self) -> bool:
        """检查 embedding 服务是否可用"""
        try:
            url = f"{self.base_url}/health"
            async with httpx.AsyncClient(timeout=None) as client:
                response = await client.get(url)
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Embedding service health check failed: {e}")
            return False


# 全局 Embedding 服务实例
embedding_service = EmbeddingService()
