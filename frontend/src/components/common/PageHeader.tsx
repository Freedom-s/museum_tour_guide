import React from 'react';
import { Typography } from 'antd';
import './PageHeader.scss';

const { Title, Paragraph } = Typography;

interface PageHeaderProps {
  title: string;
  description?: string;
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, extra }) => {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div>
          <Title level={2}>{title}</Title>
          {description && <Paragraph>{description}</Paragraph>}
        </div>
        {extra && <div className="page-header-extra">{extra}</div>}
      </div>
    </div>
  );
};
