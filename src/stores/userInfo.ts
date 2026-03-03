import { useStorage } from '@vueuse/core';
import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import * as authApi from '~/api/auth';

export const useUserInfoStore = defineStore('userInfo', () => {
  const keyPrefix = 'userInfo.';

  // 1. Initialize "remember me" status, prioritizing existing configuration.
  const isRememberMeKey = `${keyPrefix}isRememberMe`;
  const initialIsRememberMe = localStorage.getItem(isRememberMeKey) === 'true' || sessionStorage.getItem(isRememberMeKey) === 'true';

  // Store the "remember me" preference itself only in localStorage.
  const isRememberMe = useStorage(isRememberMeKey, initialIsRememberMe, localStorage);

  // 2. Core optimization: Create a dynamic Storage wrapper.
  // This avoids recreating useStorage instances and prevents memory leaks or reactivity loss.
  const dynamicStorage: Storage = {
    getItem: (key) => {
      return isRememberMe.value ? localStorage.getItem(key) : sessionStorage.getItem(key);
    },
    setItem: (key, value) => {
      if (isRememberMe.value) {
        localStorage.setItem(key, value);
      }
      else {
        sessionStorage.setItem(key, value);
      }
    },
    removeItem: (key) => {
      // Clear from both storages for safety during removal.
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    },
    // Complete other properties required by the Storage interface.
    length: 0,
    clear: () => {},
    key: () => null,
  };

  // 3. Combine scattered token data into a single object for unified management.
  const authData = useStorage(`${keyPrefix}auth_data`, {
    username: '',
    accessToken: '',
    expiresAt: '',
    refreshToken: '',
  }, dynamicStorage);

  // Watch for the "remember me" toggle to migrate data automatically between storages.
  watch(isRememberMe, (newVal) => {
    const from = newVal ? sessionStorage : localStorage;
    const to = newVal ? localStorage : sessionStorage;
    const authKey = `${keyPrefix}auth_data`;

    const v = from.getItem(authKey);
    if (v !== null) {
      to.setItem(authKey, v);
      from.removeItem(authKey);
    }
  });

  // Computed properties for easy backward-compatible access.
  const username = computed({
    get: () => authData.value.username,
    set: val => authData.value.username = val,
  });
  const accessToken = computed(() => authData.value.accessToken);

  // Initialize route and router at the top level of the store setup as requested.
  const route = useRoute();
  const router = useRouter();

  const signIn = async (_username: string, _password: string) => {
    const data = await authApi.signIn(_username, _password);

    // Update all authentication states at once.
    authData.value = {
      username: _username,
      accessToken: data.access_token,
      expiresAt: dayjs().add(data.expires_in, 'second').toISOString(),
      refreshToken: data.refresh_token,
    };

    // Sanitize redirect to prevent open redirect vulnerabilities.
    const rawRedirect = route?.query?.redirect?.toString() || '/';
    const sanitizeRedirect = (r: string) => {
      if (!r)
        return '/';
      // Only allow internal paths that start with a single '/'.
      // Reject protocol-relative ('//') and any absolute/external URLs.
      if (r.startsWith('/') && !r.startsWith('//')) {
        return r;
      }
      return '/';
    };

    router.push(sanitizeRedirect(rawRedirect));
  };

  /**
   * Clears current authentication data and optionally navigates to login page.
   * @param shouldNavigate - Whether to redirect to login route after clearing auth state.
   * @returns Promise that resolves when sign-out state reset is completed.
   */
  const signOut = async (shouldNavigate = true) => {
    // Resetting to initial values will automatically trigger dynamicStorage.removeItem via VueUse.
    authData.value = {
      username: '',
      accessToken: '',
      expiresAt: '',
      refreshToken: '',
    };

    if (shouldNavigate) {
      router.push('/login');
    }
  };

  const refresh = async () => {
    const data = await authApi.refreshToken(authData.value.refreshToken);
    authData.value.accessToken = data.access_token;
    authData.value.expiresAt = dayjs().add(data.expires_in, 'second').toISOString();
    authData.value.refreshToken = data.refresh_token;
  };

  const isLoggedIn = async () => {
    try {
      if (!authData.value.accessToken) {
        return false;
      }

      if (dayjs().isAfter(dayjs(authData.value.expiresAt))) {
        await refresh();
      }

      return true;
    }
    catch {
      return false;
    }
  };

  const signInByToken = (_username: string, _accessToken: string, _expiresIn: number, _refreshToken: string) => {
    authData.value = {
      username: _username,
      accessToken: _accessToken,
      expiresAt: dayjs().add(_expiresIn, 'second').toISOString(),
      refreshToken: _refreshToken,
    };
  };

  const getAccessToken = async () => {
    if (dayjs().isAfter(dayjs(authData.value.expiresAt))) {
      await refresh();
    }
    return authData.value.accessToken;
  };

  return {
    isRememberMe,
    authData,
    username,
    accessToken,
    signIn,
    signOut,
    isLoggedIn,
    signInByToken,
    getAccessToken,
  };
});
