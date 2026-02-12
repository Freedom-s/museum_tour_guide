import React, { useState, useEffect } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { artifactsApi } from '@/api/artifacts';
import type { Artifact } from '@/types/api';
import './ArtifactCarousel.scss';

export const ArtifactCarousel: React.FC = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // 限制轮播数量，避免文物过多时轮播太长
  const MAX_CAROUSEL_ITEMS = 6;

  useEffect(() => {
    artifactsApi.getArtifacts().then(data => {
      setArtifacts(data.slice(0, MAX_CAROUSEL_ITEMS));
    });
  }, []);

  useEffect(() => {
    if (artifacts.length <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, artifacts.length]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % artifacts.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + artifacts.length) % artifacts.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  if (artifacts.length === 0) {
    return null;
  }

  const currentArtifact = artifacts[currentIndex];

  return (
    <div className="artifact-carousel">
      <div className="carousel-container">
        {/* 左右切换按钮 */}
        <button className="carousel-nav prev" onClick={prevSlide}>
          <LeftOutlined />
        </button>
        <button className="carousel-nav next" onClick={nextSlide}>
          <RightOutlined />
        </button>

        {/* 轮播内容 */}
        <div className="carousel-track">
          <div
            className={`carousel-slide ${isTransitioning ? 'transitioning' : ''}`}
            key={currentArtifact.id}
          >
            <div className="slide-content">
              {/* 图片区域 */}
              <div className="slide-image-wrapper">
                <div className="slide-frame classic-border">
                  <img
                    src={currentArtifact.thumbnail_url || '/placeholder.jpg'}
                    alt={currentArtifact.name}
                    className="slide-image"
                  />
                  <div className="image-overlay">
                    <div className="overlay-pattern"></div>
                  </div>
                </div>
                {/* 印章装饰 */}
                <div className="slide-seal">
                  <div className="seal-inner">珍品</div>
                </div>
              </div>

              {/* 文字信息区域 */}
              <div className="slide-info">
                <div className="info-decoration">
                  <span className="deco-line"></span>
                  <span className="deco-text">馆藏精品</span>
                  <span className="deco-line"></span>
                </div>
                <h3 className="slide-title">{currentArtifact.name}</h3>
                <p className="slide-description">
                  {currentArtifact.description?.slice(0, 80)}...
                </p>
                <div className="slide-meta">
                  <span className="meta-item">
                    <span className="meta-label">编号</span>
                    <span className="meta-value">No.{String(currentIndex + 1).padStart(3, '0')}</span>
                  </span>
                  <span className="meta-divider">|</span>
                  <span className="meta-item">
                    <span className="meta-label">图片</span>
                    <span className="meta-value">{currentArtifact.image_count || 0} 张</span>
                  </span>
                </div>
                <button className="slide-btn hover-lift">
                  <span>查看详情</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>

            {/* 背景装饰 */}
            <div className="slide-bg-decoration">
              <div className="bg-circle bg-c1"></div>
              <div className="bg-circle bg-c2"></div>
              <div className="bg-circle bg-c3"></div>
            </div>
          </div>
        </div>

        {/* 指示器 */}
        <div className="carousel-indicators">
          {artifacts.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              <span className="indicator-dot"></span>
            </button>
          ))}
        </div>

        {/* 进度条 */}
        <div className="carousel-progress">
          <div
            className="progress-bar"
            style={{
              animation: 'none',
              transformOrigin: 'left',
              transition: 'transform 5s linear',
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
