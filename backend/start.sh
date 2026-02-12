#!/bin/bash
# ==================== Backend Start Script ====================

cd "$(dirname "$0")"

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 启动服务
python main.py
