import type { FormRules } from 'element-plus';
import type {
  DiscordIntegrationFeatureSettingsDto,
  DiscordWebhookTargetDto,
} from '~/generated/api/types.gen';
import v from '~/plugins/valibot';
import { generateElementRules } from '~/utils';

/**
 * Complete editable state for the Discord integration settings form.
 */
export interface FormModel {
  isEnabled: boolean;
  webhookUrl: string;
  useProxy: boolean;
  proxyUrl: string;
  proxyUsername: string;
  proxyPassword: string;
  bypassProxyOnLocal: boolean;
  defaultUsername: string;
  defaultAvatarUrl: string;
  webhookTargets: WebhookTargetFormModel[];
  timeoutSeconds: number;
  allowEventAutomationMessages: boolean;
  enableGameChatBridgeToDiscord: boolean;
  gameChatBridgeTargetKey: string;
  gameChatBridgeMessageTemplate: string;
  bridgeWhisperChatToDiscord: boolean;
  enableDiscordToGameBridge: boolean;
  enableBotIntegration: boolean;
  botToken: string;
  botGuildId: string;
  botPublicChannelId: string;
  botAdminChannelId: string;
  enableBotSlashCommands: boolean;
  enableDiscordCommandExecution: boolean;
  discordCommandPrefix: string;
  discordCommandAllowList: string[];
  enableAccountBinding: boolean;
  enableEventAutomationFailureAlerts: boolean;
  eventAutomationFailureAlertTargetKey: string;
  eventAutomationFailureAlertMessage: string;
}

/**
 * Local editor shape for a named webhook target before it is normalized for the backend.
 */
export interface WebhookTargetFormModel {
  key: string;
  displayName: string;
  isEnabled: boolean;
  webhookUrl: string;
}

const schema = v.object({
  isEnabled: v.boolean(),
  webhookUrl: v.string(),
  useProxy: v.boolean(),
  proxyUrl: v.string(),
  proxyUsername: v.pipe(v.string(), v.maxLength(128)),
  proxyPassword: v.pipe(v.string(), v.maxLength(256)),
  bypassProxyOnLocal: v.boolean(),
  defaultUsername: v.pipe(v.string(), v.maxLength(80)),
  defaultAvatarUrl: v.string(),
  timeoutSeconds: v.pipe(v.number(), v.minValue(1), v.maxValue(30)),
  allowEventAutomationMessages: v.boolean(),
  enableGameChatBridgeToDiscord: v.boolean(),
  gameChatBridgeTargetKey: v.string(),
  gameChatBridgeMessageTemplate: v.pipe(v.string(), v.maxLength(1900)),
  bridgeWhisperChatToDiscord: v.boolean(),
  enableDiscordToGameBridge: v.boolean(),
  enableBotIntegration: v.boolean(),
  botToken: v.pipe(v.string(), v.maxLength(256)),
  botGuildId: v.pipe(v.string(), v.maxLength(64)),
  botPublicChannelId: v.pipe(v.string(), v.maxLength(64)),
  botAdminChannelId: v.pipe(v.string(), v.maxLength(64)),
  enableBotSlashCommands: v.boolean(),
  enableDiscordCommandExecution: v.boolean(),
  discordCommandPrefix: v.pipe(v.string(), v.minLength(1), v.maxLength(20)),
  discordCommandAllowList: v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(64))),
  enableAccountBinding: v.boolean(),
  enableEventAutomationFailureAlerts: v.boolean(),
  eventAutomationFailureAlertTargetKey: v.string(),
  eventAutomationFailureAlertMessage: v.string(),
});

export const rules: FormRules = generateElementRules(schema);

/**
 * Creates the client-side defaults used before the backend settings have loaded.
 * @returns A fresh form model with the same baseline values used by the backend feature defaults.
 */
export function buildDefaults(): FormModel {
  return {
    isEnabled: false,
    webhookUrl: '',
    useProxy: false,
    proxyUrl: '',
    proxyUsername: '',
    proxyPassword: '',
    bypassProxyOnLocal: true,
    defaultUsername: '7DTD Server',
    defaultAvatarUrl: '',
    webhookTargets: [
      { key: 'public', displayName: 'Public channel', isEnabled: false, webhookUrl: '' },
      { key: 'admin', displayName: 'Admin channel', isEnabled: false, webhookUrl: '' },
      { key: 'audit', displayName: 'Audit channel', isEnabled: false, webhookUrl: '' },
    ],
    timeoutSeconds: 10,
    allowEventAutomationMessages: true,
    enableGameChatBridgeToDiscord: false,
    gameChatBridgeTargetKey: 'public',
    gameChatBridgeMessageTemplate: '[{chatType}] {playerName}: {message}',
    bridgeWhisperChatToDiscord: false,
    enableDiscordToGameBridge: false,
    enableBotIntegration: false,
    botToken: '',
    botGuildId: '',
    botPublicChannelId: '',
    botAdminChannelId: '',
    enableBotSlashCommands: false,
    enableDiscordCommandExecution: false,
    discordCommandPrefix: '!',
    discordCommandAllowList: ['listplayers', 'saveworld'],
    enableAccountBinding: false,
    enableEventAutomationFailureAlerts: false,
    eventAutomationFailureAlertTargetKey: 'admin',
    eventAutomationFailureAlertMessage: '[7DTD] Automation rule failed: {ruleName} ({triggerType}) - {errorMessage}',
  };
}

/**
 * Converts backend settings into a fully populated form model for editing.
 * @param data - Settings DTO returned by the Discord integration API.
 * @returns A normalized form model with null backend values converted to editable strings.
 */
export function toFormModel(data?: DiscordIntegrationFeatureSettingsDto | null): FormModel {
  return {
    isEnabled: data?.isEnabled ?? false,
    webhookUrl: data?.webhookUrl ?? '',
    useProxy: data?.useProxy ?? false,
    proxyUrl: data?.proxyUrl ?? '',
    proxyUsername: data?.proxyUsername ?? '',
    proxyPassword: data?.proxyPassword ?? '',
    bypassProxyOnLocal: data?.bypassProxyOnLocal ?? true,
    defaultUsername: data?.defaultUsername ?? '7DTD Server',
    defaultAvatarUrl: data?.defaultAvatarUrl ?? '',
    webhookTargets: normalizeWebhookTargets(data?.webhookTargets),
    timeoutSeconds: data?.timeoutSeconds ?? 10,
    allowEventAutomationMessages: data?.allowEventAutomationMessages ?? true,
    enableGameChatBridgeToDiscord: data?.enableGameChatBridgeToDiscord ?? false,
    gameChatBridgeTargetKey: data?.gameChatBridgeTargetKey ?? 'public',
    gameChatBridgeMessageTemplate: data?.gameChatBridgeMessageTemplate ?? '[{chatType}] {playerName}: {message}',
    bridgeWhisperChatToDiscord: data?.bridgeWhisperChatToDiscord ?? false,
    enableDiscordToGameBridge: data?.enableDiscordToGameBridge ?? false,
    enableBotIntegration: data?.enableBotIntegration ?? false,
    botToken: data?.botToken ?? '',
    botGuildId: data?.botGuildId ?? '',
    botPublicChannelId: data?.botPublicChannelId ?? '',
    botAdminChannelId: data?.botAdminChannelId ?? '',
    enableBotSlashCommands: data?.enableBotSlashCommands ?? false,
    enableDiscordCommandExecution: data?.enableDiscordCommandExecution ?? false,
    discordCommandPrefix: data?.discordCommandPrefix ?? '!',
    discordCommandAllowList: (data?.discordCommandAllowList ?? ['listplayers', 'saveworld'])
      .map(item => item.trim())
      .filter(item => item.length > 0),
    enableAccountBinding: data?.enableAccountBinding ?? false,
    enableEventAutomationFailureAlerts: data?.enableEventAutomationFailureAlerts ?? false,
    eventAutomationFailureAlertTargetKey: data?.eventAutomationFailureAlertTargetKey ?? 'admin',
    eventAutomationFailureAlertMessage: data?.eventAutomationFailureAlertMessage
      ?? '[7DTD] Automation rule failed: {ruleName} ({triggerType}) - {errorMessage}',
  };
}

/**
 * Copies one form model into another while preserving Vue's reactive object identity.
 * @param target - Existing reactive form object owned by the page component.
 * @param values - Source values to copy into the target form.
 */
export function applyFormValues(target: FormModel, values: FormModel): void {
  target.isEnabled = values.isEnabled;
  target.webhookUrl = values.webhookUrl;
  target.useProxy = values.useProxy;
  target.proxyUrl = values.proxyUrl;
  target.proxyUsername = values.proxyUsername;
  target.proxyPassword = values.proxyPassword;
  target.bypassProxyOnLocal = values.bypassProxyOnLocal;
  target.defaultUsername = values.defaultUsername;
  target.defaultAvatarUrl = values.defaultAvatarUrl;
  target.webhookTargets = values.webhookTargets.map(webhookTarget => ({ ...webhookTarget }));
  target.timeoutSeconds = values.timeoutSeconds;
  target.allowEventAutomationMessages = values.allowEventAutomationMessages;
  target.enableGameChatBridgeToDiscord = values.enableGameChatBridgeToDiscord;
  target.gameChatBridgeTargetKey = values.gameChatBridgeTargetKey;
  target.gameChatBridgeMessageTemplate = values.gameChatBridgeMessageTemplate;
  target.bridgeWhisperChatToDiscord = values.bridgeWhisperChatToDiscord;
  target.enableDiscordToGameBridge = values.enableDiscordToGameBridge;
  target.enableBotIntegration = values.enableBotIntegration;
  target.botToken = values.botToken;
  target.botGuildId = values.botGuildId;
  target.botPublicChannelId = values.botPublicChannelId;
  target.botAdminChannelId = values.botAdminChannelId;
  target.enableBotSlashCommands = values.enableBotSlashCommands;
  target.enableDiscordCommandExecution = values.enableDiscordCommandExecution;
  target.discordCommandPrefix = values.discordCommandPrefix;
  target.discordCommandAllowList = [...values.discordCommandAllowList];
  target.enableAccountBinding = values.enableAccountBinding;
  target.enableEventAutomationFailureAlerts = values.enableEventAutomationFailureAlerts;
  target.eventAutomationFailureAlertTargetKey = values.eventAutomationFailureAlertTargetKey;
  target.eventAutomationFailureAlertMessage = values.eventAutomationFailureAlertMessage;
}

/**
 * Normalizes webhook target data so the editor always has stable rows to render.
 * @param targets - Backend targets or locally edited targets.
 * @returns Webhook targets with empty values converted to editable defaults.
 */
export function normalizeWebhookTargets(targets?: Array<DiscordWebhookTargetDto | WebhookTargetFormModel> | null): WebhookTargetFormModel[] {
  const source = targets?.length ? targets : buildDefaults().webhookTargets;
  return source.map(webhookTarget => ({
    key: webhookTarget.key ?? '',
    displayName: webhookTarget.displayName ?? '',
    isEnabled: webhookTarget.isEnabled ?? true,
    webhookUrl: webhookTarget.webhookUrl ?? '',
  }));
}

/**
 * Converts edited form state back into the nullable DTO expected by the backend API.
 * @param values - Current Discord settings form values.
 * @returns Payload suitable for the update settings endpoint.
 */
export function toPayload(values: FormModel): DiscordIntegrationFeatureSettingsDto {
  return {
    isEnabled: values.isEnabled,
    webhookUrl: values.webhookUrl.trim() || null,
    useProxy: values.useProxy,
    proxyUrl: values.proxyUrl.trim() || null,
    proxyUsername: values.proxyUsername.trim() || null,
    proxyPassword: values.proxyPassword.trim() || null,
    bypassProxyOnLocal: values.bypassProxyOnLocal,
    defaultUsername: values.defaultUsername.trim() || null,
    defaultAvatarUrl: values.defaultAvatarUrl.trim() || null,
    webhookTargets: values.webhookTargets
      .map(webhookTarget => ({
        key: webhookTarget.key.trim(),
        displayName: webhookTarget.displayName.trim() || webhookTarget.key.trim(),
        isEnabled: webhookTarget.isEnabled,
        webhookUrl: webhookTarget.webhookUrl.trim() || null,
      }))
      .filter(webhookTarget => webhookTarget.key || webhookTarget.webhookUrl),
    timeoutSeconds: Number(values.timeoutSeconds ?? 10),
    allowEventAutomationMessages: values.allowEventAutomationMessages,
    enableGameChatBridgeToDiscord: values.enableGameChatBridgeToDiscord,
    gameChatBridgeTargetKey: values.gameChatBridgeTargetKey.trim() || null,
    gameChatBridgeMessageTemplate: values.gameChatBridgeMessageTemplate.trim() || null,
    bridgeWhisperChatToDiscord: values.bridgeWhisperChatToDiscord,
    enableDiscordToGameBridge: values.enableDiscordToGameBridge,
    enableBotIntegration: values.enableBotIntegration,
    botToken: values.botToken.trim() || null,
    botGuildId: values.botGuildId.trim() || null,
    botPublicChannelId: values.botPublicChannelId.trim() || null,
    botAdminChannelId: values.botAdminChannelId.trim() || null,
    enableBotSlashCommands: values.enableBotSlashCommands,
    enableDiscordCommandExecution: values.enableDiscordCommandExecution,
    discordCommandPrefix: values.discordCommandPrefix.trim() || '!',
    discordCommandAllowList: values.discordCommandAllowList
      .map(item => item.trim())
      .filter(item => item.length > 0),
    enableAccountBinding: values.enableAccountBinding,
    enableEventAutomationFailureAlerts: values.enableEventAutomationFailureAlerts,
    eventAutomationFailureAlertTargetKey: values.eventAutomationFailureAlertTargetKey.trim() || null,
    eventAutomationFailureAlertMessage: values.eventAutomationFailureAlertMessage.trim() || null,
  };
}
