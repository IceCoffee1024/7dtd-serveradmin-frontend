interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: number;
  readonly VITE_APP_PUBLIC_BASE_PATH: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEV_BROWSER: string;
  readonly VITE_DEV_OPEN_BROWSER: string;
  readonly VITE_DEV_API_PROXY_TARGET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
