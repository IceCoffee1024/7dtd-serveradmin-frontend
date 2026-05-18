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
 * Hard-deletes an economy account. Transaction history is preserved on the backend.
 */
export function deleteAccount(playerId: string) {
  return http.delete(`Economy/Accounts/${playerId}`).then(() => undefined);
}

/**
 * Applies a signed balance adjustment to multiple accounts in one operation.
 * scope: 'AllOnline' targets currently connected players; 'AllAccounts' targets all rows.
 */
export function batchAdjust(payload: API.Economy.BatchAdjustRequest) {
  return http.post<API.Economy.BatchAdjustResult>('Economy/Accounts/BatchAdjust', { json: payload }).json();
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

// ─── Shop ─────────────────────────────────────────────────────────────────────

/**
 * Retrieves shop items with optional filtering and pagination.
 */
export function getShopItems(params: API.Economy.ShopItemQuery = {}) {
  return http.get<API.Economy.Paged<API.Economy.ShopItem>>('EconomyShop/Items', { searchParams: { ...params } }).json();
}

/**
 * Retrieves one shop item by ID.
 */
export function getShopItem(id: number) {
  return http.get<API.Economy.ShopItem>(`EconomyShop/Items/${id}`).json();
}

/**
 * Creates a new shop item.
 */
export function createShopItem(payload: API.Economy.UpsertShopItemRequest) {
  return http.post<API.Economy.ShopItem>('EconomyShop/Items', { json: payload }).json();
}

/**
 * Replaces an existing shop item.
 */
export function updateShopItem(id: number, payload: API.Economy.UpsertShopItemRequest) {
  return http.put(`EconomyShop/Items/${id}`, { json: payload }).then(() => undefined);
}

/**
 * Deletes a shop item by ID.
 */
export function deleteShopItem(id: number) {
  return http.delete(`EconomyShop/Items/${id}`).then(() => undefined);
}

// ─── Redeem Codes ─────────────────────────────────────────────────────────────

/**
 * Retrieves redeem codes with optional filtering and pagination.
 */
export function getRedeemCodes(params: API.Economy.RedeemCodeQuery = {}) {
  return http.get<API.Economy.Paged<API.Economy.RedeemCode>>('EconomyRedeemCodes', { searchParams: { ...params } }).json();
}

/**
 * Creates a new redeem code.
 */
export function createRedeemCode(payload: API.Economy.CreateRedeemCodeRequest) {
  return http.post<API.Economy.RedeemCode>('EconomyRedeemCodes', { json: payload }).json();
}

/**
 * Deletes a redeem code and all its redemption records.
 */
export function deleteRedeemCode(id: number) {
  return http.delete(`EconomyRedeemCodes/${id}`).then(() => undefined);
}

/**
 * Retrieves all redemption records for a specific redeem code.
 */
export function getCodeRedemptions(id: number) {
  return http.get<API.Economy.CodeRedemption[]>(`EconomyRedeemCodes/${id}/Redemptions`).json();
}
