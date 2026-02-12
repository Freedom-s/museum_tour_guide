import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Empty, Image, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getArtifacts, getArtifact } from '@/api/artifacts';
import type { Artifact, ArtifactDetail } from '@/types/api';
import ReactMarkdown from 'react-markdown';
import './ArtifactList.scss';

export const ArtifactList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // 详情缓存，避免重复请求
  const detailCacheRef = useRef<Map<string, ArtifactDetail>>(new Map());

  useEffect(() => {
    loadArtifacts();
  }, []);

  const loadArtifacts = async (skip = 0) => {
    if (skip === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await getArtifacts(skip, 100);
      if (skip === 0) {
        setArtifacts(data);
        setHasMore(data.length === 100);
      } else {
        setArtifacts(prev => [...prev, ...data]);
        setHasMore(data.length === 100);
      }
    } catch (error: any) {
      console.error('Failed to load artifacts:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || '加载文物列表失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    loadArtifacts(artifacts.length);
  };

  // 统一的加载详情函数
  const loadArtifactDetail = async (artifact: Artifact) => {
    setLoadingDetail(true);
    setModalVisible(true);

    try {
      // 先检查缓存
      const cached = detailCacheRef.current.get(artifact.id);
      if (cached) {
        setSelectedArtifact(cached);
        setLoadingDetail(false);
        return;
      }

      // 获取文物详情（包含图片）
      const detail = await getArtifact(artifact.id);
      // 缓存详情
      detailCacheRef.current.set(artifact.id, detail);
      setSelectedArtifact(detail);
    } catch (error: any) {
      console.error('Failed to load artifact detail:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || '加载文物详情失败';
      message.error(errorMsg);
      // 如果详情加载失败，至少显示基本信息
      setSelectedArtifact({
        ...artifact,
        images: [],
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = (artifact: Artifact, e: React.MouseEvent) => {
    e.stopPropagation();
    loadArtifactDetail(artifact);
  };

  const handleCardClick = (artifact: Artifact) => {
    loadArtifactDetail(artifact);
  };

  // 关闭弹窗时清除状态，避免内存占用
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    // 延迟清除 selectedArtifact，等待 Modal 动画完成
    setTimeout(() => {
      setSelectedArtifact(null);
    }, 300);
  }, []);

  return (
    <div className="artifact-list-page">
      {/* 页面头部 */}
      <header className="page-header">
        <div className="header-decoration">
          <span className="section-number">馆藏珍品</span>
        </div>
        <h1 className="page-title">文物列表</h1>
        <p className="page-subtitle">探索千年文明瑰宝，感受中华历史魅力</p>
        <div className="header-visual">
          <div className="visual-line"></div>
          <div className="visual-seal">藏</div>
        </div>
      </header>

      {/* 文物内容 */}
      <div className="artifact-content">
        {loading ? (
          <div className="loading-state">
            <div className="page-loading-ripple">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>加载中...</p>
          </div>
        ) : artifacts.length === 0 ? (
          <Empty
            description="暂无文物数据，请先上传文物"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {/* ↓↓↓↓ 修改处：添加包裹 div 解决 JSX 多根节点问题 ↓↓↓↓ */}
            <div className="artifact-grid">
              {artifacts.map((artifact, index) => (
                <div
                  key={artifact.id}
                  className="artifact-card hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleCardClick(artifact)}
                >
                  {/* 图片区域 */}
                  <div className="card-image-wrapper">
                    {artifact.thumbnail_url ? (
                      <img
                        src={artifact.thumbnail_url}
                        alt={artifact.name}
                        className="card-thumbnail"
                      />
                    ) : (
                      <div className="card-image-placeholder">
                        <span className="placeholder-icon">{artifact.name[0] || '文'}</span>
                      </div>
                    )}
                    <div className="card-overlay">
                      <button
                        className="view-btn"
                        onClick={(e) => handleViewDetail(artifact, e)}
                      >
                        <EyeOutlined />
                        <span>查看详情</span>
                      </button>
                    </div>
                  </div>

                  {/* 内容区域 */}
                  <div className="card-content">
                    <h3 className="card-title">{artifact.name}</h3>
                    <p className="card-description">
                      {artifact.description
                        ? artifact.description.slice(0, 60) + '...'
                        : '暂无描述'}
                    </p>
                    <div className="card-footer">
                      {artifact.image_count !== undefined && (
                        <span className="image-count">{artifact.image_count} 张图片</span>
                      )}
                      <span className="view-text">点击查看详情 →</span>
                    </div>
                  </div>

                  {/* 背景装饰 */}
                  <div className="card-decoration">
                    <span className="deco-text">{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 加载更多按钮 */}
            {!loading && hasMore && artifacts.length > 0 && (
              <div className="load-more-wrapper">
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>加载中...</span>
                    </>
                  ) : (
                    <>
                      <span>加载更多</span>
                      <span className="load-more-arrow">↓</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 没有更多数据时的提示 */}
            {!loading && !hasMore && artifacts.length > 0 && (
              <div className="no-more-text">
                <span>已加载全部文物</span>
              </div>
            )}
            {/* ↑↑↑ 修改处：添加包裹 div 结束标签 ↑↑↑↑ */}
          </>
        )}
      </div>

      {/* 详情弹窗 */}
      <Modal
        open={modalVisible}
        title={null}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        className="artifact-detail-modal"
        centered
        destroyOnClose
        closeIcon={<span className="modal-close">×</span>}
      >
        {loadingDetail ? (
          <div className="detail-loading">
            <div className="loading-animation">
              <div className="loading-ripple">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <p className="loading-text">加载详情中...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : selectedArtifact ? (
          <div className="detail-content">
            {/* 标题区 */}
            <div className="detail-header">
              <span className="detail-seal">珍品</span>
              <h2 className="detail-title">{selectedArtifact.name}</h2>
            </div>

            {/* 图片区 - 使用 Image.PreviewGroup 支持预览 */}
            {selectedArtifact.images && selectedArtifact.images.length > 0 && (
              <div className="detail-images">
                <div className="detail-image-header">
                  <span className="detail-image-count">共 {selectedArtifact.images.length} 张图片</span>
                </div>
                <Image.PreviewGroup>
                  {selectedArtifact.images.map((img) => (
                    <div key={img.id} className="detail-image-item">
                      <Image
                        src={img.image_url}
                        alt={selectedArtifact.name}
                        width={140}
                        height={140}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                      {img.filename && (
                        <span className="image-filename">{img.filename}</span>
                      )}
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
            )}

            {/* 描述区 */}
            {selectedArtifact.description && (
              <div className="detail-description">
                <h4 className="detail-section-title">文物介绍</h4>
                <ReactMarkdown>{selectedArtifact.description}</ReactMarkdown>
              </div>
            )}

            {/* 元数据 */}
            {selectedArtifact.created_at && (
              <div className="detail-meta">
                <span className="meta-label">收录时间</span>
                <span className="meta-value">
                  {new Date(selectedArtifact.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
