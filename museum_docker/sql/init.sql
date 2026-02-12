-- 博物馆智能导览系统 - 数据库初始化脚本

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==================== 文物表 ====================
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),        -- 文物唯一标识
    name VARCHAR(200) NOT NULL,                          -- 文物名称
    description TEXT,                                     -- 文物描述
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- 文物表字段注释
COMMENT ON TABLE artifacts IS '文物信息表';
COMMENT ON COLUMN artifacts.id IS '文物唯一标识';
COMMENT ON COLUMN artifacts.name IS '文物名称';
COMMENT ON COLUMN artifacts.description IS '文物描述';
COMMENT ON COLUMN artifacts.created_at IS '创建时间';
COMMENT ON COLUMN artifacts.updated_at IS '更新时间';

-- 文物索引
CREATE INDEX IF NOT EXISTS idx_artifacts_name ON artifacts(name);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts(created_at DESC);

-- ==================== 文物图片表 ====================
CREATE TABLE IF NOT EXISTS artifact_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),        -- 图片唯一标识
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,  -- 关联文物ID
    image_url VARCHAR(500) NOT NULL,                       -- 图片URL
    vector VECTOR(2048),                                   -- 向量数据（2048维）
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- 文物图片表字段注释
COMMENT ON TABLE artifact_images IS '文物图片表';
COMMENT ON COLUMN artifact_images.id IS '图片唯一标识';
COMMENT ON COLUMN artifact_images.artifact_id IS '关联文物ID';
COMMENT ON COLUMN artifact_images.image_url IS '图片URL';
COMMENT ON COLUMN artifact_images.vector IS '向量数据（2048维）';
COMMENT ON COLUMN artifact_images.created_at IS '创建时间';
COMMENT ON COLUMN artifact_images.updated_at IS '更新时间';

CREATE INDEX IF NOT EXISTS idx_artifact_images_artifact_id ON artifact_images(artifact_id);
-- 向量索引（IVFFlat 索引，支持高维向量）
-- lists=100 聚类数量，建议设置为 rows/1000
-- CREATE INDEX idx_artifact_images_vector ON artifact_images USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);

-- ==================== 对话表 ====================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),        -- 对话唯一标识
    title VARCHAR(200) NOT NULL,                            -- 对话标题
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,  -- 关联文物ID
    message_count INTEGER NOT NULL DEFAULT 0,               -- 消息数量
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- 对话表字段注释
COMMENT ON TABLE conversations IS '对话表';
COMMENT ON COLUMN conversations.id IS '对话唯一标识';
COMMENT ON COLUMN conversations.title IS '对话标题';
COMMENT ON COLUMN conversations.artifact_id IS '关联文物ID';
COMMENT ON COLUMN conversations.message_count IS '消息数量';
COMMENT ON COLUMN conversations.created_at IS '创建时间';
COMMENT ON COLUMN conversations.updated_at IS '更新时间';

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- ==================== 消息表 ====================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),        -- 消息唯一标识
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, -- 关联对话ID
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')), -- 角色：user-用户, assistant-助手, system-系统
    content TEXT,                                         -- 消息内容
    image_data TEXT,                                     -- 图片Base64数据
    image_url VARCHAR(500),                              -- 图片URL
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,  -- 关联文物ID
    relevance_score DECIMAL(5, 4),                       -- 相关性评分(0-1)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 消息表字段注释
COMMENT ON TABLE messages IS '消息表';
COMMENT ON COLUMN messages.id IS '消息唯一标识';
COMMENT ON COLUMN messages.conversation_id IS '关联对话ID';
COMMENT ON COLUMN messages.role IS '角色：user-用户, assistant-助手, system-系统';
COMMENT ON COLUMN messages.content IS '消息内容';
COMMENT ON COLUMN messages.image_data IS '图片Base64数据';
COMMENT ON COLUMN messages.image_url IS '图片URL';
COMMENT ON COLUMN messages.artifact_id IS '关联文物ID';
COMMENT ON COLUMN messages.relevance_score IS '相关性评分(0-1)';
COMMENT ON COLUMN messages.created_at IS '创建时间';

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
