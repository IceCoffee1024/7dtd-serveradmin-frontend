import http from '~/utils/http';

/**
 * Loads Economy feature settings.
 */
export function getSettings() {
  return http.get<API.Economy.Settings>('Economy/Settings').json();
}

/**
 * Persists Economy feature settings.
 */
export function updateSettings(settings: API.Economy.Settings) {
  return http.put('Economy/Settings', { json: settings }).then(() => undefined);
}

/**
 * Resets Economy settings to the backend defaults and returns the restored payload.
 */
export function resetSettings() {
  return http.delete<API.Economy.Settings>('Economy/Settings').json();
}

/**
 * Retrieves economy accounts with optional search and pagination.
 */
export function getAccounts(params: API.Economy.AccountQuery = {}) {
  return http.get<API.Economy.Paged<API.Economy.Account>>('Economy/Accounts', { searchParams: { ...params } }).json();
}

/**
 * Retrieves one economy account detail record.
 */
export function getAccount(playerId: string) {
  return http.get<API.Economy.AccountDetail>(`Economy/Accounts/${playerId}`).json();
}

/**
 * Adjusts one economy account balance from the management UI.
 */
export function adjustBalance(playerId: string, payload: API.Economy.AdjustBalanceRequest) {
  return http.post<API.Economy.Transaction>(`Economy/Accounts/${playerId}/Adjust`, { json: payload }).json();
}

/**
 * Freezes or unfreezes one economy account.
 */
export function setAccountFrozen(playerId: string, isFrozen: boolean) {
  return http.post(`Economy/Accounts/${playerId}/Freeze`, { json: { isFrozen } }).then(() => undefined);
}

/**
 * Retrieves leaderboard rows ordered by balance.
 */
export function getLeaderboard(limit?: number) {
  return http.get<API.Economy.LeaderboardItem[]>('Economy/Leaderboard', { searchParams: { limit } }).json();
}

/**
 * Retrieves economy transactions with optional search and pagination.
 */
export function getTransactions(params: API.Economy.TransactionQuery = {}) {
  return http.get<API.Economy.Paged<API.Economy.Transaction>>('EconomyTransactions', { searchParams: { ...params } }).json();
}

/**
 * Retrieves one transaction detail row.
 */
export function getTransaction(id: number) {
  return http.get<API.Economy.Transaction>(`EconomyTransactions/${id}`).json();
}
