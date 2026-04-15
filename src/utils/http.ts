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
}

interface HttpErrorWithData extends Error {
  response: Response;
  data?: ErrorResponse;
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
      ({ error }) => {
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
        const data = httpError.data;
        const { response } = httpError;

        if (!response) {
          toast({
            text: t('errors.http.serverError'),
            type: 'error',
          });

          return error;
        }

        switch (response.status) {
          case 401:
          {
            toast({
              text: t('errors.http.unauthorized'),
              type: 'warning',
            });
            emitter.emit(EVENT_TYPES.AUTH.UNAUTHORIZED, { source: 'http' });
            break;
          }
          case 403:
          {
            toast({
              text: t('errors.http.forbidden'),
              type: 'warning',
            });
            emitter.emit(EVENT_TYPES.AUTH.FORBIDDEN, { source: 'http' });
            break;
          }
          case 404:
            toast({
              text: t('errors.http.notFound'),
              type: 'warning',
            });
            break;
          case 400:
            toast({
              text: `${t('errors.http.badRequest')}: ${data?.message || data?.error}`,
              type: 'error',
            });
            break;
          case 500:
            toast({
              text: `${t('errors.http.serverError')}: ${data?.message || data?.error}`,
              type: 'error',
            });
            break;
          default:
            toast({
              text: `${t('errors.http.serverError')}: ${data?.message || data?.error || response.status}`,
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
