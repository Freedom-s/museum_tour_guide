import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Backend API 客户端
 * 用于连接博物馆后端服务
 */
const createBackendClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response) {
        console.error('Backend API Error:', error.response.data);
      } else if (error.request) {
        console.error('Network Error:', error.message);
      } else {
        console.error('Request Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const backendClient = createBackendClient();

/**
 * 健康检查
 */
export const healthCheck = async () => {
  const response = await backendClient.get('/health');
  return response.data;
};
