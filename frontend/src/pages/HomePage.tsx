import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpOutlined } from '@ant-design/icons';
import { ArtifactCarousel } from '@/components/ArtifactCarousel';
import './HomePage.scss';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 监听滚动，显示/隐藏返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const features = [
    {
      icon: '⊞',
      title: '文物列表',
      subtitle: '浏览珍品',
      description: '探索数字馆藏，一览千年珍宝风采',
      action: () => navigate('/artifacts'),
      color: 'var(--cobalt)',
    },
    {
      icon: '↑',
      title: '文物上传',
      subtitle: '数字化存档',
      description: '上传文物资料，建立完整的数字档案',
      action: () => navigate('/upload'),
      color: 'var(--jade)',
    },
    {
      icon: '◉',
      title: '智能导览',
      subtitle: 'AI 讲解',
      description: '拍照识别文物，聆听专业讲解',
      action: () => navigate('/chat'),
      color: 'var(--cinnabar)',
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section ink-wash-bg">
        <div className="hero-bg-pattern"></div>
        <div className="hero-content">
          {/* 竖排标题 */}
          <div className="hero-vertical-title">
            <span className="seal-stamp">博物馆</span>
            <h1 className="vertical-text">智能文物导览系统</h1>
          </div>

          {/* 主内容区 */}
          <div className="hero-main">
            <div className="hero-badge">
              <span className="seal-stamp">数字文博</span>
            </div>
            <h2 className="hero-title">
              <span className="title-line">科技赋能文化</span>
              <span className="title-line title-accent">AI 守护历史</span>
            </h2>
            <p className="hero-description">
              融合人工智能与传统文博，让每一件文物都开口讲述自己的故事
            </p>

            {/* CTA 按钮 */}
            <div className="hero-actions">
              <button
                className="btn btn-primary ripple"
                onClick={() => navigate('/artifacts')}
              >
                <span>探索文物</span>
                <span className="btn-arrow">→</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/chat')}
              >
                <span>开始导览</span>
              </button>
            </div>
          </div>

          {/* 装饰元素 */}
          <div className="hero-decoration">
            <div className="deco-circle deco-1"></div>
            <div className="deco-circle deco-2"></div>
            <div className="deco-line"></div>
          </div>
        </div>
      </section>

      {/* Artifact Carousel - 精品展示 */}
      <section className="carousel-section">
        <div className="carousel-header">
          <span className="section-number">精品</span>
          <h3 className="carousel-section-title">馆藏珍品</h3>
          <p className="carousel-section-subtitle">穿越千年时光，邂逅国宝文物</p>
        </div>
        <ArtifactCarousel />
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-number">02</span>
          <h3 className="section-title">核心功能</h3>
          <p className="section-subtitle">三大核心功能，打造沉浸式文博体验</p>
        </div>

        <div className="features-grid stagger-reveal">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card hover-lift"
              onClick={feature.action}
            >
              <div className="feature-icon" style={{ color: feature.color }}>
                <span className="icon-text">{feature.icon}</span>
                <div className="icon-glow" style={{ background: feature.color }}></div>
              </div>
              <div className="feature-content">
                <span className="feature-subtitle">{feature.subtitle}</span>
                <h4 className="feature-title">{feature.title}</h4>
                <p className="feature-description">{feature.description}</p>
              </div>
              <div className="feature-footer">
                <span className="feature-link">
                  了解更多 <span className="link-arrow">→</span>
                </span>
              </div>
              <div className="feature-bg-decoration"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section paper-texture">
        <div className="info-content">
          <div className="info-text">
            <span className="section-number">03</span>
            <h3 className="info-title">
              <span>以科技之火</span>
              <span className="text-accent">点亮历史之光</span>
            </h3>
            <p className="info-description">
              本系统采用最先进的计算机视觉和自然语言处理技术，
              对文物进行智能识别、分类和讲解。让文物"活"起来，
              让历史"说话"，让每一位参观者都能获得专属的导览体验。
            </p>
            <div className="info-stats">
              <div className="stat-item">
                <span className="stat-number">1000+</span>
                <span className="stat-label">文物数据</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">99.2%</span>
                <span className="stat-label">识别准确率</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">智能服务</span>
              </div>
            </div>
          </div>
          <div className="info-visual">
            <div className="visual-frame classic-border">
              <div className="visual-content">
                <div className="visual-line v1"></div>
                <div className="visual-line v2"></div>
                <div className="visual-line v3"></div>
                <span className="visual-text vertical-text">智慧文博</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-seal">
            <div className="seal-stamp-circle">智能导览</div>
          </div>
          <p className="footer-text">传承文明 · 创新未来</p>
          <p className="footer-copyright">©2026 智能文物导览系统</p>
        </div>
      </footer>

      {/* 返回顶部按钮 */}
      <button
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="返回顶部"
      >
        <ArrowUpOutlined />
        <span className="back-to-top-text">顶部</span>
      </button>
    </div>
  );
};
