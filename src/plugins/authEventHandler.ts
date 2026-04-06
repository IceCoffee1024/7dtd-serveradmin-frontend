import type { Router } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';
import { useUserInfoStore } from '~/stores/userInfo';
import emitter, { EVENT_TYPES } from './mitt';

const AUTH_EVENT_DEBOUNCE_MS = 120;
const AUTH_HANDLER_COOLDOWN_MS = 500;
const LOGIN_ROUTE_RE = /^\/login(?:$|\?)/;
const FORBIDDEN_ROUTE_RE = /^\/403(?:$|\?)/;

let isHandlingUnauthorized = false;
let isHandlingForbidden = false;

function isLoginRoute(path: string): boolean {
  return LOGIN_ROUTE_RE.test(path);
}

function isForbiddenRoute(path: string): boolean {
  return FORBIDDEN_ROUTE_RE.test(path);
}

function sanitizeRedirect(redirect: string): string {
  if (!redirect) {
    return '/';
  }

  if (redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }

  return '/';
}

async function withSingleFlight(options: {
  inProgress: () => boolean;
  setInProgress: (value: boolean) => void;
  task: () => Promise<void>;
}): Promise<void> {
  if (options.inProgress()) {
    return;
  }

  options.setInProgress(true);

  try {
    await options.task();
  }
  finally {
    setTimeout(() => {
      options.setInProgress(false);
    }, AUTH_HANDLER_COOLDOWN_MS);
  }
}

/**
 * Registers global auth event handlers for 401/403 responses.
 * @param router - The application router instance used for idempotent redirects.
 * @returns A cleanup function that unregisters listeners.
 */
export function setupAuthEventHandler(router: Router): () => void {
  const handleUnauthorized = useDebounceFn(() => {
    void withSingleFlight({
      inProgress: () => isHandlingUnauthorized,
      setInProgress: (value) => {
        isHandlingUnauthorized = value;
      },
      task: async () => {
        const currentPath = router.currentRoute.value.fullPath;
        const userInfoStore = useUserInfoStore();

        await userInfoStore.signOut(false);

        const redirect = sanitizeRedirect(currentPath);
        const loginTarget = `/login?redirect=${encodeURIComponent(redirect)}`;

        if (!isLoginRoute(router.currentRoute.value.fullPath)) {
          await router.replace(loginTarget);
        }
      },
    });
  }, AUTH_EVENT_DEBOUNCE_MS, { maxWait: AUTH_EVENT_DEBOUNCE_MS * 2 });

  const handleForbidden = useDebounceFn(() => {
    void withSingleFlight({
      inProgress: () => isHandlingForbidden,
      setInProgress: (value) => {
        isHandlingForbidden = value;
      },
      task: async () => {
        const currentPath = router.currentRoute.value.fullPath;

        if (!isForbiddenRoute(currentPath)) {
          await router.replace('/403');
        }
      },
    });
  }, AUTH_EVENT_DEBOUNCE_MS, { maxWait: AUTH_EVENT_DEBOUNCE_MS * 2 });

  emitter.on(EVENT_TYPES.AUTH.UNAUTHORIZED, handleUnauthorized);
  emitter.on(EVENT_TYPES.AUTH.FORBIDDEN, handleForbidden);

  return () => {
    emitter.off(EVENT_TYPES.AUTH.UNAUTHORIZED, handleUnauthorized);
    emitter.off(EVENT_TYPES.AUTH.FORBIDDEN, handleForbidden);
  };
}
