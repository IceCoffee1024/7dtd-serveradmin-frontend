import { usePopup } from '~/composables/usePopup';
import { AUTH_PATH } from '~/constants/auth';
import { client } from '~/generated/api/client.gen';
import { i18n } from '~/plugins/i18n';
import emitter, { EVENT_TYPES } from '~/plugins/mitt';
import nProgress from '~/plugins/nprogress';
import { useLocaleStore } from '~/stores/locale';
import { useUserInfoStore } from '~/stores/userInfo';

interface ErrorResponse {
  message?: string;
  error?: string;
  title?: string;
  detail?: string;
  status?: number;
  traceId?: string;
  errors?: Record<string, string[]>;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(data?: ErrorResponse): string | undefined {
  const detail = data?.detail?.trim();
  const title = data?.title?.trim();
  const message = data?.message?.trim();
  const error = data?.error?.trim();
  const fieldErrors = data?.errors;
  const fieldErrorSuffix = fieldErrors && Object.keys(fieldErrors).length > 0
    ? ` (${Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ')})`
    : '';

  if (detail) {
    const base = title && title !== detail ? `${title}: ${detail}` : detail;
    return `${base}${fieldErrorSuffix}`;
  }

  const base = title || message || error;
  return base ? `${base}${fieldErrorSuffix}` : undefined;
}

function appendTraceId(message: string, data?: ErrorResponse): string {
  return data?.traceId ? `${message} (traceId: ${data.traceId})` : message;
}

function normalizeError(error: unknown, response?: Response): ErrorResponse {
  if (isErrorResponse(error)) {
    return {
      ...error,
      status: error.status ?? response?.status,
      traceId: error.traceId ?? response?.headers.get('X-Request-ID') ?? undefined,
    };
  }

  if (typeof error === 'string') {
    return {
      detail: error,
      message: error,
      status: response?.status,
      traceId: response?.headers.get('X-Request-ID') ?? undefined,
    };
  }

  return {
    status: response?.status,
    traceId: response?.headers.get('X-Request-ID') ?? undefined,
  };
}

function shouldSkipAuth(request: Request): boolean {
  return request.url.endsWith(AUTH_PATH) || request.url.endsWith(`/api/${AUTH_PATH}`);
}

export function setupGeneratedApiClient() {
  // Generated SDK URLs already include `/api`, so the base URL should stay empty
  // for same-origin deployments and only point to an origin when cross-host is needed.
  client.setConfig({
    baseUrl: import.meta.env.VITE_OPENAPI_BASE_URL || '',
  });

  client.interceptors.request.use(async (request) => {
    nProgress.start();

    if (!shouldSkipAuth(request)) {
      const userInfoStore = useUserInfoStore();
      const token = await userInfoStore.getAccessToken();
      request.headers.set('Authorization', `Bearer ${token}`);
    }

    const localeStore = useLocaleStore();
    request.headers.set('X-Language', localeStore.languageEnglishName);

    return request;
  });

  client.interceptors.response.use((response) => {
    nProgress.done();
    return response;
  });

  client.interceptors.error.use((error, response) => {
    nProgress.done();

    const data = normalizeError(error, response);
    const serverMessage = getErrorMessage(data);
    const { toast } = usePopup();
    const { t } = i18n.global;
    const status = response?.status ?? data.status;

    switch (status) {
      case 401:
        toast({
          text: appendTraceId(serverMessage || t('errors.http.unauthorized'), data),
          type: 'warning',
        });
        emitter.emit(EVENT_TYPES.AUTH.UNAUTHORIZED, { source: 'http' });
        break;
      case 403:
        toast({
          text: appendTraceId(serverMessage || t('errors.http.forbidden'), data),
          type: 'warning',
        });
        emitter.emit(EVENT_TYPES.AUTH.FORBIDDEN, { source: 'http' });
        break;
      case 404:
        toast({
          text: appendTraceId(serverMessage || t('errors.http.notFound'), data),
          type: 'warning',
        });
        break;
      case 400:
        toast({
          text: appendTraceId(serverMessage || t('errors.http.badRequest'), data),
          type: 'error',
        });
        break;
      case 500:
        toast({
          text: appendTraceId(serverMessage || t('errors.http.serverError'), data),
          type: 'error',
        });
        break;
      default:
        toast({
          text: appendTraceId(serverMessage || `${t('errors.http.serverError')}: ${status || 'unknown'}`, data),
          type: 'error',
        });
        break;
    }

    return error;
  });
}
