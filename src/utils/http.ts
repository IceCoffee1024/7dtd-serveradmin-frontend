import axios from 'axios';
import qs from 'qs';
import { authUrl } from '~/api/auth';
import { usePopup } from '~/composables/usePopup';
import { i18n } from '~/plugins/i18n';
import emitter, { EVENT_TYPES } from '~/plugins/mitt';
import nProgress from '~/plugins/nprogress';
import { useUserInfoStore } from '~/stores/userInfo';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT,
  paramsSerializer: {
    serialize: (params) => {
      return qs.stringify(params, { arrayFormat: 'repeat' });
    },
  },
});

service.interceptors.request.use(
  async (config) => {
    nProgress.start();

    if (config.url !== authUrl) {
      const userInfoStore = useUserInfoStore();
      const token = await userInfoStore.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response) => {
    nProgress.done();
    return response.data;
  },
  async (error) => {
    nProgress.done();

    if (!error.response) {
      console.error(error);
      return Promise.reject(error);
    }

    const data = error.response.data;
    const { toast } = usePopup();
    const { t } = i18n.global;

    switch (error.response.status) {
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
          text: data.message || data.error || t('utils.http.400'),
          type: 'error',
        });
        break;
      case 500:
        toast({
          text: data.message || data.error || t('utils.http.500'),
          type: 'error',
        });
        break;
      default:
        console.error(error);
        break;
    }

    return Promise.reject(error);
  },
);

export default service;
