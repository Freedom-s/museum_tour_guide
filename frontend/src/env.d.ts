/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_VL_SERVICE_URL: string;
  readonly VITE_RERANK_SERVICE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_MAX_IMAGE_SIZE: string;
  readonly VITE_MAX_DOC_SIZE: string;
  readonly VITE_MAX_IMAGE_COUNT: string;
}
