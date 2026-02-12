import React from 'react';
import { Spin } from 'antd';
import './Loading.scss';

interface LoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ tip = '加载中...', size = 'large', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <Spin size={size} tip={tip} />
      </div>
    );
  }

  return (
    <div className="loading-container">
      <Spin size={size} tip={tip} />
    </div>
  );
};
