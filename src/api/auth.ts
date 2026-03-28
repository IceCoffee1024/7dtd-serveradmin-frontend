import http from '~/utils/http';

export const AUTH_PATH = 'oauth/token';

/**
 * Sign in
 * @returns Promise resolving to the sign-in response.
 */
export function signIn(username: string, password: string) {
  return http.post<API.Auth.SignInResponse>(AUTH_PATH, {
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
    }),
  }).json();
}

/**
 * Refresh token
 * @returns Promise resolving to the refresh response.
 */
export function refreshToken(refreshToken: string) {
  return http.post<API.Auth.SignInResponse>(AUTH_PATH, {
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  }).json();
}
