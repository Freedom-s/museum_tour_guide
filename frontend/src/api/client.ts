import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// 创建 axios 实例
const createApiClient = (baseURL?: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 可以在这里添加认证 token
      // const token = localStorage.getItem('token');
      // if (token && config.headers) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
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
      // 统一错误处理
      if (error.response) {
        // 服务器返回错误
        console.error('API Error:', error.response.data);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('Network Error:', error.message);
      } else {
        // 请求配置出错
        console.error('Request Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// VL Service API 客户端
export const vlApiClient = createApiClient(
  import.meta.env.VITE_VL_SERVICE_URL || 'http://localhost:8000'
);

// Rerank Service API 客户端
export const rerankApiClient = createApiClient(
  import.meta.env.VITE_RERANK_SERVICE_URL || 'http://localhost:8001'
);

// 默认导出
export default createApiClient();
