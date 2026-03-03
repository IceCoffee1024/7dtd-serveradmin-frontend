import http from '~/utils/http';

// #region Console Commands
/**
 * Sends a console command to the game server, optionally running it on the main thread.
 * @param {string} command Console text to execute.
 * @param {boolean} [inMainThread] Run the command on the primary game thread.
 * @returns {Promise} Execution result notice.
 */
export function executeConsoleCommand(command: string, inMainThread: boolean = true) {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/ExecuteConsoleCommand', {
    command,
    inMainThread,
  });
}
// #endregion

// #region Statistics
/**
 * Retrieves global game server statistics such as player counts and uptime.
 * @returns {Promise<API.GameServer.Stats>} Server stats payload.
 */
export function getStats() {
  return http.get<API.GameServer.Stats>('/GameServer/Stats');
}
// #endregion

// #region Send Message
/**
 * Broadcasts a message to every player on the server with an optional sender name.
 * @param {string} message Text to display globally.
 * @param {string|null} [senderName] Optional sender label shown to players.
 * @returns {Promise} Server response acknowledgment.
 */
export function sendGlobalMessage(message: string, senderName: string | null = null) {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/SendGlobalMessage', { message, senderName });
}
/**
 * Sends a direct private message to a specific player by ID or name.
 * @param {string|number} targetPlayerIdOrName Player identifier or display name.
 * @param {string} message Message text to deliver.
 * @param {string|null} [senderName] Optional sender label shown to the recipient.
 * @returns {Promise} Server response acknowledgment.
 */
export function sendPrivateMessage(targetPlayerIdOrName: string | number, message: string, senderName: string | null = null) {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/SendPrivateMessage', {
    targetPlayerIdOrName: String(targetPlayerIdOrName),
    message,
    senderName,
  });
}
// #endregion

/**
 * Retrieves the list of console commands the current user can run.
 * @returns {Promise} Allowed command metadata.
 */
export function getAllowedCommands() {
  return http.get<API.GameServer.AllowedCommand[]>('/GameServer/AllowedCommands');
}

/**
 * Reads the current game server configuration payload exposed to the frontend.
 * @returns {Promise} Server configuration details.
 */
export function getServerConfig() {
  return http.get<API.GameServer.ServerConfig>('/GameServer/Config');
}

/**
 * Persists updated server configuration data.
 * @param {object} config Configuration object accepted by the server API.
 * @returns {Promise} Confirmation of the update operation.
 */
export function updateServerConfig(config: API.GameServer.ServerConfig) {
  return http.post<unknown>('/GameServer/Config', config);
}

// #region Players
/**
 * Queries the currently online players with optional filters.
 * @param {object} params Query parameters such as pagination or filters.
 * @returns {Promise} Online player list.
 */
export function getOnlinePlayers(params: API.GameServer.OnlinePlayerQuery) {
  return http.get<API.GameServer.PagedDto<API.GameServer.OnlinePlayer>>('/GameServer/OnlinePlayers', { params });
}

/**
 * Retrieves detailed info for a single online player.
 * @param {string} playerId Unique identifier of the player.
 * @returns {Promise} Player record.
 */
export function getOnlinePlayer(playerId: string) {
  return http.get<API.GameServer.OnlinePlayer>(`/GameServer/OnlinePlayers/${playerId}`);
}

/**
 * Lists historical players (offline or recently active) with search controls.
 * @param {object} params Search and pagination filters.
 * @returns {Promise} History player list.
 */
export function getHistoryPlayers(params: API.GameServer.HistoryPlayerQuery) {
  return http.get<API.GameServer.PagedDto<API.GameServer.HistoryPlayer>>('/GameServer/HistoryPlayers', { params });
}

/**
 * Fetches details for a specific historical player record.
 * @param {string} playerId Player identifier from the history table.
 * @returns {Promise} Historical player data.
 */
export function getHistoryPlayer(playerId: string) {
  return http.get<API.GameServer.HistoryPlayer>(`/GameServer/HistoryPlayers/${playerId}`);
}

/**
 * Loads a player's inventory, optionally translated to a language.
 * @param {string} playerId Player identifier.
 * @param {string} language Language code used for localization.
 * @returns {Promise} Inventory payload.
 */
export function getPlayerInventory(playerId: string, language: API.GameServer.Language) {
  return http.get<API.GameServer.Inventory>(`/GameServer/PlayerInventory/${playerId}`, { params: { language } });
}

/**
 * Fetches skill data for a player, with localization controls.
 * @param {string} playerId Player identifier.
 * @param {string} language Language code for skill descriptions.
 * @returns {Promise} Skill set payload.
 */
export function getPlayerSkills(playerId: string, language: API.GameServer.Language) {
  return http.get<API.GameServer.PlayerSkill[]>(`/GameServer/PlayerSkills/${playerId}`, { params: { language } });
}

/**
 * Retrieves comprehensive player metadata such as stats, binds, etc.
 * @param {string} playerId Player identifier.
 * @returns {Promise} Player detail response.
 */
export function getPlayerDetails(playerId: string) {
  return http.get<API.GameServer.PlayerDetails>(`/GameServer/PlayerDetails/${playerId}`);
}
// #endregion

// #region Map
/**
 * Loads metadata about the currently loaded map, including dimensions and generation info.
 * @returns {Promise} Map metadata payload.
 */
export function getMapInfo() {
  return http.get<API.GameServer.MapInfo>('/GameServer/MapInfo');
}

/**
 * Requests a server-side render of the full map (all explored and unexplored tiles).
 * @returns {Promise} Map render job reference.
 */
export function renderFullMap() {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/RenderFullMap');
}

/**
 * Requests a server-side render of only the explored regions of the map.
 * @returns {Promise} Partial map render job reference.
 */
export function renderExploredArea() {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/RenderExploredArea');
}
// #endregion

// #region Locations
/**
 * Searches locations of a specific entity type such as POIs or bases.
 * @param {string} entityType Type filter recognized by the API.
 * @returns {Promise} Location list.
 */
export function getLocations(entityType: API.GameServer.EntityType) {
  return http.get<API.GameServer.EntityBasicInfo[]>('/GameServer/Locations', { params: { entityType } });
}

/**
 * Retrieves a single location record by its unique identifier.
 * @param {number} entityId Location identifier.
 * @returns {Promise} Location details.
 */
export function getLocation(entityId: number) {
  return http.get<API.GameServer.EntityBasicInfo>(`/GameServer/Locations/${entityId}`);
}
// #endregion

// #region Localization
/**
 * Downloads the localization dictionary for a given language.
 * @param {string} language Language code (e.g., en, zh-cn).
 * @returns {Promise} Key/value localization entries.
 */
export function getLocalizationDict(language: API.GameServer.Language) {
  return http.get<API.GameServer.LocalizationDict>('/GameServer/Localization', { params: { language } });
}
/**
 * Looks up a single localization entry by key.
 * @param {string} key Localization key to query.
 * @param {string} language Language code for the translation.
 * @param {boolean} [isCaseInsensitive] Case-insensitive lookup flag.
 * @returns {Promise} Localization entry.
 */
export function getLocalizationByKey(key: string, language: API.GameServer.Language, isCaseInsensitive: boolean = false) {
  return http.get<string>(`/GameServer/Localization/${key}`, { params: { language, caseInsensitive: isCaseInsensitive } });
}
/**
 * Retrieves the list of languages that the server currently supports.
 * @returns {Promise} Supported language codes.
 */
export function getKnownLanguages() {
  return http.get<string>('/GameServer/KnownLanguages');
}
// #endregion

// #region LandClaims
/**
 * Pulls the list of registered land claims on the server.
 * @returns {Promise} Land claim entries with owner info.
 */
export function getLandClaims() {
  return http.get<API.GameServer.LandClaims>('/GameServer/LandClaims');
}
/**
 * Deletes every land claim associated with a player identifier.
 * @param {string} playerId Owner identifier used for cleanup.
 * @returns {Promise} Deletion result.
 */
export function removePlayerLandClaim(playerId: string) {
  return http.delete<API.GameServer.CommandExecutionResult>(`/GameServer/LandClaims/${playerId}`);
}
/**
 * Removes a claim located at the supplied coordinates.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @param {number} z Z coordinate.
 * @returns {Promise} Deletion acknowledgement.
 */
export function removePlayerLandClaimByPosition(x: number, y: number, z: number) {
  return http.delete<API.GameServer.CommandExecutionResult>(`/GameServer/LandClaims`, { data: { x, y, z } });
}
// #endregion

// #region ServerSettings
/**
 * Fetches the runtime server settings such as difficulty and auto-save.
 * @returns {Promise} Server settings payload.
 */
export function getServerSettings() {
  return http.get<API.GameServer.ServerSettings>('/GameServer/ServerSettings');
}

/**
 * Persists server settings modifications.
 * @param {object} settings Edited settings object.
 * @returns {Promise} Update confirmation.
 */
export function updateServerSettings(settings: API.GameServer.ServerSettings) {
  return http.put<unknown>('/GameServer/ServerSettings', settings);
}
// #endregion

// #region Bans
/**
 * Lists currently banned players with optional search filters.
 * @param {object} params Filters such as pagination or status.
 * @returns {Promise} Banned player list.
 */
export function getBannedPlayers(params: API.GameServer.ListQuery = {}) {
  return http.get<API.GameServer.BanEntry[]>('/GameServer/Bans', { params });
}
/**
 * Adds or extends a ban for a specified player.
 * @param {string} playerId Identifier of the player to ban.
 * @param {string} bannedUntil ISO timestamp when the ban expires.
 * @param {string} displayName Name shown in the ban list.
 * @param {string|null} [reason] Optional ban reason presented to the player.
 * @returns {Promise} Ban operation result.
 */
export function banPlayer(playerId: string, bannedUntil: string, displayName: string, reason: string | null = null) {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/Bans', { playerId, bannedUntil, displayName, reason });
}
/**
 * Lifts bans for one or more players.
 * @param {Array<string>} playerIds Identifiers of players to unban.
 * @returns {Promise} Unban acknowledgement.
 */
export function unbanPlayers(playerIds: string[]) {
  return http.delete<API.GameServer.CommandExecutionResult>(`/GameServer/Bans`, { params: { playerIds } });
}
// #endregion

// #region Whitelist
/**
 * Retrieves whitelisted players subject to optional filters.
 * @param {object} params Optional pagination or search filters.
 * @returns {Promise} Whitelist entries.
 */
export function getWhitelistedPlayers(params: API.GameServer.ListQuery = {}) {
  return http.get<API.GameServer.WhitelistEntry[]>('/GameServer/Whitelist', { params });
}
/**
 * Adds a player to the whitelist so they bypass restrictions.
 * @param {string} playerId Identifier of the player.
 * @param {string} displayName Display name for bookkeeping.
 * @returns {Promise} Addition result.
 */
export function addPlayerToWhitelist(playerId: string, displayName: string) {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/Whitelist', { playerId, displayName });
}
/**
 * Removes players from the whitelist.
 * @param {Array<string>} playerIds Identifiers to remove.
 * @returns {Promise} Removal confirmation.
 */
export function removePlayerFromWhitelist(playerIds: string[]) {
  return http.delete<API.GameServer.CommandExecutionResult>(`/GameServer/Whitelist`, { params: { playerIds } });
}
// #endregion

// #region Permissions
/**
 * Lists administrator users with optional filters.
 * @param {object} params Pagination or search filters.
 * @returns {Promise} Admin user list.
 */
export function getAdminUsers(params: API.GameServer.ListQuery = {}) {
  return http.get<API.GameServer.AdminUser[]>('/GameServer/AdminUsers', { params });
}

/**
 * Grants admin access to a player.
 * @param {object} data Admin user payload (playerId, permissions, etc.).
 * @returns {Promise} Creation result.
 */
export function addAdminUser(data: API.GameServer.AdminUser) {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/AdminUsers', data);
}

/**
 * Revokes admin privileges for the specified players.
 * @param {Array<string>} playerIds Identifiers to remove from admins.
 * @returns {Promise} Deletion confirmation.
 */
export function deleteAdminUsers(playerIds: string[]) {
  return http.delete<API.GameServer.CommandExecutionResult>('/GameServer/AdminUsers', { params: { playerIds } });
}

/**
 * Fetches command permission overrides for players or roles.
 * @param {object} params Filtering criteria.
 * @returns {Promise} Command permission list.
 */
export function getCommandPermissions(params: API.GameServer.ListQuery = {}) {
  return http.get<API.GameServer.ListResponse<API.GameServer.CommandPermission>>('/GameServer/CommandPermissions', { params });
}

/**
 * Adds or updates command permissions for a player/role.
 * @param {object} data Permission payload describing commands and rules.
 * @returns {Promise} Creation result.
 */
export function addCommandPermission(data: API.GameServer.CommandPermissionCreate) {
  return http.post<API.GameServer.CommandExecutionResult>('/GameServer/CommandPermissions', data);
}

/**
 * Removes assigned command permissions for the provided players.
 * @param {Array<string>} commands Command names whose permissions should be deleted.
 * @returns {Promise} Deletion confirmation.
 */
export function deleteCommandPermissions(commands: string[]) {
  return http.delete<API.GameServer.CommandExecutionResult>('/GameServer/CommandPermissions', { params: { commands } });
}
// #endregion

// #region AppSettings
/**
 * Retrieves application-specific settings exposed by the API.
 * @returns {Promise} App settings object.
 */
export function getAppSettings() {
  return http.get<API.GameServer.AppSettings>('/AppSettings');
}
/**
 * Updates application settings like theme or notification preferences.
 * @param {object} settings New settings object.
 * @returns {Promise} Update response.
 */
export function updateAppSettings(settings: API.GameServer.AppSettings) {
  return http.put<unknown>('/AppSettings', settings);
}
// #endregion

// #region Mods
/**
 * Lists the managed mods that the server can enable or disable.
 * @returns {Promise} Mod metadata list.
 */
export function getMods() {
  return http.get<API.GameServer.ListResponse<API.GameServer.ModInfo>>('/GameServer/Mods');
}

// export const uploadMod = (formData) => {
//     return http.post('/GameServer/Mods', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//     });
// }

/**
 * Toggles loading state for a mod folder.
 * @param {string} folderName Folder name representing the mod.
 * @returns {Promise} Toggle result.
 */
export function toggleModStatus(folderName: string) {
  return http.put<unknown>(`/GameServer/Mods?folderName=${folderName}`);
}
// #endregion
