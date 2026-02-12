import React from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface ErrorDisplayProps {
  message: string;
  description?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  description,
  onRetry,
  showRetry = true,
}) => {
  return (
    <div className="error-display">
      <Alert
        message={message}
        description={description}
        type="error"
        showIcon
        action={
          showRetry && onRetry ? (
            <Button size="small" danger onClick={onRetry}>
              <ReloadOutlined /> 重试
            </Button>
          ) : undefined
        }
      />
    </div>
  );
};
