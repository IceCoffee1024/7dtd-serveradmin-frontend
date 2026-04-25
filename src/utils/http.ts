import ky, { isHTTPError } from 'ky';
import { AUTH_PATH } from '~/api/auth';
import { usePopup } from '~/composables/usePopup';
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
  /** Field-level validation errors from the backend ProblemDetails `errors` extension. */
  errors?: Record<string, string[]>;
}

interface HttpErrorWithData extends Error {
  response: Response;
  data?: ErrorResponse;
}

async function parseErrorResponse(response: Response): Promise<ErrorResponse | undefined> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json') === false && contentType.includes('application/problem+json') === false) {
    const text = await response.clone().text();
    if (!text) {
      return undefined;
    }

    return {
      detail: text,
      message: text,
      status: response.status,
      traceId: response.headers.get('X-Request-ID') || undefined,
    };
  }

  try {
    const data = await response.clone().json();
    return {
      ...data,
      status: data.status ?? response.status,
      traceId: data.traceId ?? response.headers.get('X-Request-ID') ?? undefined,
    };
  }
  catch {
    return {
      status: response.status,
      traceId: response.headers.get('X-Request-ID') || undefined,
    };
  }
}

function getErrorMessage(data?: ErrorResponse): string | undefined {
  const detail = data?.detail?.trim();
  const title = data?.title?.trim();
  const message = data?.message?.trim();
  const error = data?.error?.trim();

  // When field-level errors exist, append them so the user can see which fields failed.
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

const http = ky.create({
  prefix: import.meta.env.VITE_API_BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT,
  retry: 0,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        nProgress.start();

        if (!request.url.endsWith(AUTH_PATH)) {
          const userInfoStore = useUserInfoStore();
          const token = await userInfoStore.getAccessToken();
          request.headers.set('Authorization', `Bearer ${token}`);
        }

        const localeStore = useLocaleStore();
        request.headers.set('X-Language', localeStore.languageEnglishName);
      },
    ],
    afterResponse: [
      () => {
        nProgress.done();
      },
    ],
    beforeError: [
      async ({ error }) => {
        nProgress.done();

        const { toast } = usePopup();
        const { t } = i18n.global;

        if (isHTTPError(error) === false) {
          toast({
            text: t('errors.http.serverError'),
            type: 'error',
          });

          return error;
        }

        const httpError = error as HttpErrorWithData;
        const { response } = httpError;

        if (!response) {
          toast({
            text: t('errors.http.serverError'),
            type: 'error',
          });

          return error;
        }

        const data = httpError.data ?? await parseErrorResponse(response);
        httpError.data = data;
        const serverMessage = getErrorMessage(data);

        switch (response.status) {
          case 401:
          {
            toast({
              text: appendTraceId(serverMessage || t('errors.http.unauthorized'), data),
              type: 'warning',
            });
            emitter.emit(EVENT_TYPES.AUTH.UNAUTHORIZED, { source: 'http' });
            break;
          }
          case 403:
          {
            toast({
              text: appendTraceId(serverMessage || t('errors.http.forbidden'), data),
              type: 'warning',
            });
            emitter.emit(EVENT_TYPES.AUTH.FORBIDDEN, { source: 'http' });
            break;
          }
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
              text: appendTraceId(serverMessage || `${t('errors.http.serverError')}: ${data?.status || response.status}`, data),
              type: 'error',
            });
            break;
        }

        return error;
      },
    ],
  },
});

export default http;
