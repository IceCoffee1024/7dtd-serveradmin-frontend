import ky from 'ky';
import { AUTH_PATH } from '~/api/auth';
import { usePopup } from '~/composables/usePopup';
import { i18n } from '~/plugins/i18n';
import emitter, { EVENT_TYPES } from '~/plugins/mitt';
import nProgress from '~/plugins/nprogress';
import { useUserInfoStore } from '~/stores/userInfo';

interface ErrorResponse {
  message?: string;
  error?: string;
}

const http = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT,
  retry: 0,
  hooks: {
    beforeRequest: [
      async (request) => {
        nProgress.start();

        if (!request.url.endsWith(AUTH_PATH)) {
          const userInfoStore = useUserInfoStore();
          const token = await userInfoStore.getAccessToken();
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      () => {
        nProgress.done();
      },
    ],
    beforeError: [
      async (error) => {
        nProgress.done();

        let data: ErrorResponse | null = null;

        const { response } = error;
        if (response) {
          data = await response.json<ErrorResponse>();
        }

        const { toast } = usePopup();
        const { t } = i18n.global;

        switch (response.status) {
          case 401:
          {
            toast({
              text: t('utils.http.401'),
              type: 'warning',
            });
            emitter.emit(EVENT_TYPES.AUTH.UNAUTHORIZED, { source: 'http' });
            break;
          }
          case 403:
          {
            toast({
              text: t('utils.http.403'),
              type: 'warning',
            });
            emitter.emit(EVENT_TYPES.AUTH.FORBIDDEN, { source: 'http' });
            break;
          }
          case 404:
            toast({
              text: t('utils.http.404'),
              type: 'warning',
            });
            break;
          case 400:
            toast({
              text: data?.message || data?.error || t('utils.http.400'),
              type: 'error',
            });
            break;
          case 500:
            toast({
              text: data?.message || data?.error || t('utils.http.500'),
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
