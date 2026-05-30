interface ImportMetaEnv {
  readonly VITE_OPENAPI_BASE_URL?: string;
  readonly VITE_APP_PUBLIC_BASE_PATH: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEV_API_PROXY_TARGET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
