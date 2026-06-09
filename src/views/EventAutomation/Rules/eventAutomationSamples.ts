import type { EventAutomationRuleDryRunRequestDto } from '~/generated/api/types.gen';

export type EventAutomationDryRunSampleContext = Omit<EventAutomationRuleDryRunRequestDto, 'rule'>;

export interface EventAutomationDryRunSample {
  key: string;
  nameKey: string;
  descriptionKey: string;
  triggerType: string;
  context: EventAutomationDryRunSampleContext;
}

export const eventAutomationDryRunSamples = [
  {
    key: 'playerJoinedDefault',
    nameKey: 'views.eventAutomation.rules.samples.playerJoinedDefault.name',
    descriptionKey: 'views.eventAutomation.rules.samples.playerJoinedDefault.description',
    triggerType: 'PlayerJoined',
    context: {
      playerId: 'EOS_SAMPLE_JOINED_PLAYER',
      playerName: 'SamplePlayer',
      entityId: 1001,
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'playerLeftDefault',
    nameKey: 'views.eventAutomation.rules.samples.playerLeftDefault.name',
    descriptionKey: 'views.eventAutomation.rules.samples.playerLeftDefault.description',
    triggerType: 'PlayerLeft',
    context: {
      playerId: 'EOS_SAMPLE_LEFT_PLAYER',
      playerName: 'SamplePlayer',
      entityId: 1001,
      gameShuttingDown: false,
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'playerLeftShutdown',
    nameKey: 'views.eventAutomation.rules.samples.playerLeftShutdown.name',
    descriptionKey: 'views.eventAutomation.rules.samples.playerLeftShutdown.description',
    triggerType: 'PlayerLeft',
    context: {
      playerId: 'EOS_SAMPLE_LEFT_PLAYER',
      playerName: 'SamplePlayer',
      entityId: 1001,
      gameShuttingDown: true,
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'playerDiedByZombie',
    nameKey: 'views.eventAutomation.rules.samples.playerDiedByZombie.name',
    descriptionKey: 'views.eventAutomation.rules.samples.playerDiedByZombie.description',
    triggerType: 'PlayerDied',
    context: {
      playerId: 'EOS_SAMPLE_DEAD_PLAYER',
      playerName: 'SamplePlayer',
      entityId: 1001,
      targetEntityId: 2001,
      targetEntityName: 'Zombie',
      entityType: 'Zombie',
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'playerKilledPlayer',
    nameKey: 'views.eventAutomation.rules.samples.playerKilledPlayer.name',
    descriptionKey: 'views.eventAutomation.rules.samples.playerKilledPlayer.description',
    triggerType: 'PlayerKilledPlayer',
    context: {
      playerId: 'EOS_SAMPLE_KILLER_PLAYER',
      playerName: 'KillerPlayer',
      entityId: 1001,
      targetPlayerId: 'EOS_SAMPLE_TARGET_PLAYER',
      targetPlayerName: 'TargetPlayer',
      targetEntityId: 2002,
      targetEntityName: 'TargetPlayer',
      entityType: 'OnlinePlayer',
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'playerKilledZombie',
    nameKey: 'views.eventAutomation.rules.samples.playerKilledZombie.name',
    descriptionKey: 'views.eventAutomation.rules.samples.playerKilledZombie.description',
    triggerType: 'PlayerKilledZombie',
    context: {
      playerId: 'EOS_SAMPLE_HUNTER_PLAYER',
      playerName: 'HunterPlayer',
      entityId: 1001,
      targetEntityId: 2003,
      targetEntityName: 'Zombie',
      entityType: 'Zombie',
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'globalHelpChat',
    nameKey: 'views.eventAutomation.rules.samples.globalHelpChat.name',
    descriptionKey: 'views.eventAutomation.rules.samples.globalHelpChat.description',
    triggerType: 'ChatMessage',
    context: {
      playerId: 'EOS_SAMPLE_CHAT_PLAYER',
      playerName: 'SamplePlayer',
      entityId: 1001,
      chatType: 'Global',
      message: 'help',
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'whisperChat',
    nameKey: 'views.eventAutomation.rules.samples.whisperChat.name',
    descriptionKey: 'views.eventAutomation.rules.samples.whisperChat.description',
    triggerType: 'ChatMessage',
    context: {
      playerId: 'EOS_SAMPLE_CHAT_PLAYER',
      playerName: 'SamplePlayer',
      entityId: 1001,
      chatType: 'Whisper',
      message: 'private help',
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'alliesChat',
    nameKey: 'views.eventAutomation.rules.samples.alliesChat.name',
    descriptionKey: 'views.eventAutomation.rules.samples.alliesChat.description',
    triggerType: 'ChatMessage',
    context: {
      playerId: 'EOS_SAMPLE_CHAT_PLAYER',
      playerName: 'SamplePlayer',
      entityId: 1001,
      chatType: 'Allies',
      message: 'ally message',
      x: 100,
      y: 64,
      z: -100,
    },
  },
  {
    key: 'cronDefault',
    nameKey: 'views.eventAutomation.rules.samples.cronDefault.name',
    descriptionKey: 'views.eventAutomation.rules.samples.cronDefault.description',
    triggerType: 'Cron',
    context: {
      playerId: null,
      playerName: 'System',
      entityId: null,
      chatType: null,
      message: 'Scheduled automation preview',
      cronExpression: '0 0/30 * * * ?',
      timeZoneId: 'Asia/Shanghai',
    },
  },
] satisfies EventAutomationDryRunSample[];

export function getDryRunSamplesByTrigger(triggerType: string): EventAutomationDryRunSample[] {
  return eventAutomationDryRunSamples.filter(sample => sample.triggerType === triggerType);
}

export function getDefaultDryRunSample(triggerType: string): EventAutomationDryRunSample {
  return getDryRunSamplesByTrigger(triggerType)[0] ?? eventAutomationDryRunSamples[0];
}

export function cloneDryRunSampleContext(context: EventAutomationDryRunSampleContext): EventAutomationDryRunSampleContext {
  return JSON.parse(JSON.stringify(context)) as EventAutomationDryRunSampleContext;
}
