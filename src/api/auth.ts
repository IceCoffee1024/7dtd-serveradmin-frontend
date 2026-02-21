import http from '~/utils/http';

export const authUrl = '/oauth/token';

/**
 * Sign in
 * @returns Promise resolving to the sign-in response.
 */
export function signIn(username: string, password: string) {
  return http.post<API.Auth.SignInResponse>(authUrl, { grant_type: 'password', username, password }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
}

/**
 * Refresh token
 * @returns Promise resolving to the refresh response.
 */
export function refreshToken(refreshToken: string) {
  return http.post<API.Auth.SignInResponse>(authUrl, { grant_type: 'refresh_token', refresh_token: refreshToken }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
}
