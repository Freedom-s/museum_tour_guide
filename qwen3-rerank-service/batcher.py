import asyncio
import time
from typing import Dict, Any, List
from model_engine import Qwen3VLReranker

class DynamicBatcher:
    def __init__(self, model_path: str, max_batch_size: int = 1, max_wait_time: float = 0.1):
        # max_batch_size 设为 1，因为一个 Rerank 请求内部已经包含多个 Doc，显存压力大
        self.model = Qwen3VLReranker(model_name_or_path=model_path)
        self.queue = asyncio.Queue()
        self.processing = False
        asyncio.create_task(self.process_loop())

    async def rerank(self, input_data: Dict[str, Any]) -> List[float]:
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        await self.queue.put((input_data, future))
        return await future

    async def process_loop(self):
        while True:
            # 简单逻辑：每次只取一个请求进行处理
            # 因为 Rerank 的 documents 列表可能很大，合并多个请求容易 OOM
            item = await self.queue.get()
            input_data, future = item
            
            try:
                loop = asyncio.get_running_loop()
                # 扔到线程池运行
                scores = await loop.run_in_executor(
                    None, 
                    lambda: self.model.process(input_data)
                )
                if not future.done():
                    future.set_result(scores)
            except Exception as e:
                if not future.done():
                    future.set_exception(e)