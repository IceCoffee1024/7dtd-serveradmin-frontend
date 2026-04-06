import http from '~/utils/http';

// #region Console Commands
/**
 * Sends a console command to the game server, optionally running it on the main thread.
 * @param {string} command Console text to execute.
 * @param {boolean} [inMainThread] Run the command on the primary game thread.
 */
export function executeConsoleCommand(command: string, inMainThread: boolean = true) {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/ExecuteConsoleCommand', {
    json: { command, inMainThread },
  }).json();
}

/**
 * Sends a restart command to the game server.
 * @returns Server response acknowledgment.
 */
export function restartServer() {
  return executeConsoleCommand('ty-RestartServer');
}

/**
 * Sends a shutdown command to the game server.
 * @returns Server response acknowledgment.
 */
export function shutdownServer() {
  return executeConsoleCommand('shutdown');
}
// #endregion

// #region Statistics
/**
 * Retrieves global game server statistics such as player counts and uptime.
 * @returns Server stats payload.
 */
export function getStats() {
  return http.get<API.GameServer.Stats>('GameServer/Stats').json();
}
// #endregion

// #region Send Message
/**
 * Broadcasts a message to every player on the server with an optional sender name.
 * @param {string} message Text to display globally.
 * @param {string|null} [senderName] Optional sender label shown to players.
 * @returns Server response acknowledgment.
 */
export function sendGlobalMessage(message: string, senderName: string | null = null) {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/SendGlobalMessage', {
    json: { message, senderName },
  }).json();
}
/**
 * Sends a direct private message to a specific player by ID or name.
 * @param {string|number} targetPlayerIdOrName Player identifier or display name.
 * @param {string} message Message text to deliver.
 * @param {string|null} [senderName] Optional sender label shown to the recipient.
 * @returns Server response acknowledgment.
 */
export function sendPrivateMessage(targetPlayerIdOrName: string | number, message: string, senderName: string | null = null) {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/SendPrivateMessage', {
    json: {
      targetPlayerIdOrName: String(targetPlayerIdOrName),
      message,
      senderName,
    },
  }).json();
}
// #endregion

/**
 * Retrieves the list of console commands the current user can run.
 * @returns Allowed command metadata.
 */
export function getAllowedCommands() {
  return http.get<API.GameServer.AllowedCommand[]>('GameServer/AllowedCommands').json();
}

/**
 * Reads the current game server configuration payload exposed to the frontend.
 * @returns Server configuration details.
 */
export function getServerConfig() {
  return http.get<API.GameServer.ServerConfig>('GameServer/Config').json();
}

/**
 * Persists updated server configuration data.
 * @param {object} config Configuration object accepted by the server API.
 * @returns Confirmation of the update operation.
 */
export function updateServerConfig(config: API.GameServer.ServerConfig) {
  return http.post<unknown>('GameServer/Config', config).json();
}

// #region Players
/**
 * Queries the currently online players with optional filters.
 * @param {object} params Query parameters such as pagination or filters.
 * @returns Online player list.
 */
export function getOnlinePlayers(params: API.GameServer.OnlinePlayerQuery) {
  return http.get<API.GameServer.Paged<API.GameServer.OnlinePlayer>>('GameServer/OnlinePlayers', { searchParams: { ...params } }).json();
}

/**
 * Retrieves detailed info for a single online player.
 * @param {string} playerId Unique identifier of the player.
 * @returns Player record.
 */
export function getOnlinePlayer(playerId: string) {
  return http.get<API.GameServer.OnlinePlayer>(`GameServer/OnlinePlayers/${playerId}`).json();
}

/**
 * Lists historical players (offline or recently active) with search controls.
 * @param {object} params Search and pagination filters.
 * @returns History player list.
 */
export function getHistoryPlayers(params: API.GameServer.HistoryPlayerQuery) {
  return http.get<API.GameServer.Paged<API.GameServer.HistoryPlayer>>('GameServer/HistoryPlayers', { searchParams: { ...params } }).json();
}

/**
 * Fetches details for a specific historical player record.
 * @param {string} playerId Player identifier from the history table.
 * @returns Historical player data.
 */
export function getHistoryPlayer(playerId: string) {
  return http.get<API.GameServer.HistoryPlayer>(`GameServer/HistoryPlayers/${playerId}`).json();
}

/**
 * Loads a player's inventory, optionally translated to a language.
 * @param {string} playerId Player identifier.
 * @param {string} language Language code used for localization.
 * @returns Inventory payload.
 */
export function getPlayerInventory(playerId: string, language: API.GameServer.Language) {
  return http.get<API.GameServer.Inventory>(`GameServer/PlayerInventory/${playerId}`, { searchParams: { language } }).json();
}

/**
 * Fetches skill data for a player, with localization controls.
 * @param {string} playerId Player identifier.
 * @param {string} language Language code for skill descriptions.
 * @returns Skill set payload.
 */
export function getPlayerSkills(playerId: string, language: API.GameServer.Language) {
  return http.get<API.GameServer.PlayerSkill[]>(`GameServer/PlayerSkills/${playerId}`, { searchParams: { language } }).json();
}

/**
 * Retrieves comprehensive player metadata such as stats, binds, etc.
 * @param {string} playerId Player identifier.
 * @returns Player detail response.
 */
export function getPlayerDetails(playerId: string) {
  return http.get<API.GameServer.PlayerDetails>(`GameServer/PlayerDetails/${playerId}`).json();
}
// #endregion

// #region Map
/**
 * Loads metadata about the currently loaded map, including dimensions and generation info.
 * @returns Map metadata payload.
 */
export function getMapInfo() {
  return http.get<API.GameServer.MapInfo>('GameServer/MapInfo').json();
}

/**
 * Requests a server-side render of the full map (all explored and unexplored tiles).
 * @returns Map render job reference.
 */
export function renderFullMap() {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/RenderFullMap').json();
}

/**
 * Requests a server-side render of only the explored regions of the map.
 * @returns Partial map render job reference.
 */
export function renderExploredArea() {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/RenderExploredArea').json();
}
// #endregion

// #region Locations
/**
 * Searches locations of a specific entity type such as POIs or bases.
 * @param {string} entityType Type filter recognized by the API.
 * @returns Location list.
 */
export function getLocations(entityType: API.GameServer.EntityType) {
  return http.get<API.GameServer.EntityBasicInfo[]>('GameServer/Locations', { searchParams: { entityType } }).json();
}

/**
 * Retrieves a single location record by its unique identifier.
 * @param {number} entityId Location identifier.
 * @returns Location details.
 */
export function getLocation(entityId: number) {
  return http.get<API.GameServer.EntityBasicInfo>(`GameServer/Locations/${entityId}`).json();
}
// #endregion

// #region Localization
/**
 * Downloads the localization dictionary for a given language.
 * @param {string} language Language code (e.g., en, zh-cn).
 * @returns Key/value localization entries.
 */
export function getLocalizationDict(language: API.GameServer.Language) {
  return http.get<API.GameServer.LocalizationDict>('GameServer/Localization', { searchParams: { language } }).json();
}
/**
 * Looks up a single localization entry by key.
 * @param {string} key Localization key to query.
 * @param {string} language Language code for the translation.
 * @param {boolean} [isCaseInsensitive] Case-insensitive lookup flag.
 * @returns Localization entry.
 */
export function getLocalizationByKey(key: string, language: API.GameServer.Language, isCaseInsensitive: boolean = false) {
  return http.get<string>(`GameServer/Localization/${key}`, { searchParams: { language, caseInsensitive: isCaseInsensitive } }).json();
}
/**
 * Retrieves the list of languages that the server currently supports.
 * @returns Supported language codes.
 */
export function getKnownLanguages() {
  return http.get<string>('GameServer/KnownLanguages').json();
}
// #endregion

// #region LandClaims
/**
 * Pulls the list of registered land claims on the server.
 * @returns Land claim entries with owner info.
 */
export function getLandClaims() {
  return http.get<API.GameServer.LandClaims>('GameServer/LandClaims').json();
}
/**
 * Deletes every land claim associated with a player identifier.
 * @param {string} playerId Owner identifier used for cleanup.
 * @returns Deletion result.
 */
export function removePlayerLandClaim(playerId: string) {
  return http.delete<API.GameServer.CommandExecutionResult>(`GameServer/LandClaims/${playerId}`).json();
}
/**
 * Removes a claim located at the supplied coordinates.
 * @param {API.GameServer.Position} position Position object containing x, y, and z coordinates.
 * @returns Deletion acknowledgement.
 */
export function removePlayerLandClaimByPosition(position: API.GameServer.Position) {
  return http.delete<API.GameServer.CommandExecutionResult>(`GameServer/LandClaims`, { json: { x: position.x, y: position.y, z: position.z } }).json();
}
// #endregion

// #region ServerSettings
/**
 * Fetches the runtime server settings such as difficulty and auto-save.
 * @returns Server settings payload.
 */
export function getServerSettings() {
  return http.get<API.GameServer.ServerSettings>('GameServer/ServerSettings').json();
}

/**
 * Persists server settings modifications.
 * @param {object} settings Edited settings object.
 * @returns Update confirmation.
 */
export function updateServerSettings(settings: API.GameServer.ServerSettings) {
  return http.put<unknown>('GameServer/ServerSettings', { json: settings }).json();
}
// #endregion

// #region Bans
/**
 * Lists currently banned players with optional search filters.
 * @param {object} params Filters such as pagination or status.
 * @returns Banned player list.
 */
export function getBannedPlayers(params: API.GameServer.ListQuery = {}) {
  return http.get<API.GameServer.BanEntry[]>('GameServer/Bans', { searchParams: { ...params } }).json();
}
/**
 * Adds or extends a ban for a specified player.
 * @param {string} playerId Identifier of the player to ban.
 * @param {string} bannedUntil ISO timestamp when the ban expires.
 * @param {string} displayName Name shown in the ban list.
 * @param {string|null} [reason] Optional ban reason presented to the player.
 * @returns Ban operation result.
 */
export function banPlayer(playerId: string, bannedUntil: string, displayName: string, reason: string | null = null) {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/Bans', { json: { playerId, bannedUntil, displayName, reason } }).json();
}
/**
 * Lifts bans for one or more players.
 * @param {Array<string>} playerIds Identifiers of players to unban.
 * @returns Unban acknowledgement.
 */
export function unbanPlayers(playerIds: string[]) {
  return http.delete<API.GameServer.CommandExecutionResult>(`GameServer/Bans`, { json: { playerIds } }).json();
}
// #endregion

// #region Whitelist
/**
 * Retrieves whitelisted players subject to optional filters.
 * @param {object} params Optional pagination or search filters.
 * @returns Whitelist entries.
 */
export function getWhitelistedPlayers(params: API.GameServer.ListQuery = {}) {
  return http.get<API.GameServer.WhitelistEntry[]>('GameServer/Whitelist', { searchParams: { ...params } }).json();
}
/**
 * Adds a player to the whitelist so they bypass restrictions.
 * @param {string} playerId Identifier of the player.
 * @param {string} displayName Display name for bookkeeping.
 * @returns Addition result.
 */
export function addPlayerToWhitelist(playerId: string, displayName: string) {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/Whitelist', { json: { playerId, displayName } }).json();
}
/**
 * Removes players from the whitelist.
 * @param {Array<string>} playerIds Identifiers to remove.
 * @returns Removal confirmation.
 */
export function removePlayerFromWhitelist(playerIds: string[]) {
  return http.delete<API.GameServer.CommandExecutionResult>(`GameServer/Whitelist`, { json: playerIds }).json();
}
// #endregion

// #region Permissions
/**
 * Lists administrator users with optional filters.
 * @param {object} params Pagination or search filters.
 * @returns Admin user list.
 */
export function getAdminUsers(params: API.GameServer.ListQuery = {}) {
  return http.get<API.GameServer.AdminUser[]>('GameServer/AdminUsers', { searchParams: { ...params } }).json();
}

/**
 * Grants admin access to a player.
 * @param {object} data Admin user payload (playerId, permissions, etc.).
 * @returns Creation result.
 */
export function addAdminUser(data: API.GameServer.AdminUser) {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/AdminUsers', { json: data }).json();
}

/**
 * Revokes admin privileges for the specified players.
 * @param {Array<string>} playerIds Identifiers to remove from admins.
 * @returns Deletion confirmation.
 */
export function deleteAdminUsers(playerIds: string[]) {
  return http.delete<API.GameServer.CommandExecutionResult>('GameServer/AdminUsers', { json: { playerIds } }).json();
}

/**
 * Fetches command permission overrides for players or roles.
 * @param {object} params Filtering criteria.
 * @returns Command permission list.
 */
export function getCommandPermissions(params: API.GameServer.ListQuery = {}) {
  return http.get<API.GameServer.ListResponse<API.GameServer.CommandPermission>>('GameServer/CommandPermissions', { searchParams: { ...params } }).json();
}

/**
 * Adds or updates command permissions for a player/role.
 * @param {object} data Permission payload describing commands and rules.
 * @returns Creation result.
 */
export function addCommandPermission(data: API.GameServer.CommandPermissionCreate) {
  return http.post<API.GameServer.CommandExecutionResult>('GameServer/CommandPermissions', { json: data }).json();
}

/**
 * Removes assigned command permissions for the provided players.
 * @param {Array<string>} commands Command names whose permissions should be deleted.
 * @returns Deletion confirmation.
 */
export function deleteCommandPermissions(commands: string[]) {
  return http.delete<API.GameServer.CommandExecutionResult>('GameServer/CommandPermissions', { json: { commands } }).json();
}
// #endregion

// #region AppSettings
/**
 * Retrieves application-specific settings exposed by the API.
 * @returns App settings object.
 */
export function getAppSettings() {
  return http.get<API.GameServer.AppSettings>('AppSettings').json();
}
/**
 * Updates application settings like theme or notification preferences.
 * @param {object} settings New settings object.
 * @returns Update response.
 */
export function updateAppSettings(settings: API.GameServer.AppSettings) {
  return http.put<unknown>('AppSettings', { json: settings }).json();
}
// #endregion

// #region Mods
/**
 * Lists the managed mods that the server can enable or disable.
 * @returns Mod metadata list.
 */
export function getMods() {
  return http.get<API.GameServer.ListResponse<API.GameServer.ModInfo>>('GameServer/Mods').json();
}

// export const uploadMod = (formData) => {
//     return http.post('GameServer/Mods', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//     }).json();
// }

/**
 * Toggles loading state for a mod folder.
 * @param {string} folderName Folder name representing the mod.
 * @returns Toggle result.
 */
export function toggleModStatus(folderName: string) {
  return http.put<unknown>(`GameServer/Mods?folderName=${folderName}`).json();
}
// #endregion
