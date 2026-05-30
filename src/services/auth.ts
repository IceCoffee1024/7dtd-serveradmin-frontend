import type { OAuthTokenResponse } from '~/generated/api/types.gen';
import { oAuthToken } from '~/generated/api/sdk.gen';

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

function toAuthTokenResponse(data: OAuthTokenResponse, fallbackRefreshToken?: string): AuthTokenResponse {
  const refreshToken = data.refresh_token || fallbackRefreshToken;

  if (!data.access_token || !data.token_type || data.expires_in == null || !refreshToken) {
    throw new Error('Invalid authentication response.');
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    refresh_token: refreshToken,
  };
}

/**
 * Sign in
 * @returns Promise resolving to the sign-in response.
 */
export async function signIn(username: string, password: string): Promise<AuthTokenResponse> {
  const { data } = await oAuthToken({
    body: {
      grant_type: 'password',
      username,
      password,
    },
  });

  return toAuthTokenResponse(data);
}

/**
 * Refresh token
 * @returns Promise resolving to the refresh response.
 */
export async function refreshToken(refreshToken: string): Promise<AuthTokenResponse> {
  const { data } = await oAuthToken({
    body: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
  });

  return toAuthTokenResponse(data, refreshToken);
}
