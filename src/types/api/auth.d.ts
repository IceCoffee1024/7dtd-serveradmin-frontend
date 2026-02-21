declare namespace API {
  namespace Auth {
    interface SignInResponse {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
    }
  }
}
