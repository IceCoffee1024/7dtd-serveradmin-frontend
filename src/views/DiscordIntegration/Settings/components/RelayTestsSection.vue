<script setup lang="ts">
import type {
  DiscordChatRelayResultDto,
  DiscordCommandExecuteResultDto,
} from '~/generated/api/types.gen';
import { useI18n } from 'vue-i18n';
import { usePopup } from '~/composables';
import {
  discordIntegrationExecuteDiscordCommand,
  discordIntegrationRelayDiscordChat,
} from '~/generated/api/sdk.gen';

const { t } = useI18n();
const { confirm, toast } = usePopup();

const isCommandTesting = ref(false);
const isChatRelayTesting = ref(false);
const commandTestForm = reactive({
  commandText: '!listplayers',
  discordUserId: '',
  discordUsername: 'Discord Admin',
  inMainThread: false,
});
const chatRelayTestForm = reactive({
  message: 'Hello from Discord',
  discordUserId: '',
  discordUsername: 'Discord User',
});
const commandTestResult = ref<DiscordCommandExecuteResultDto | null>(null);
const chatRelayTestResult = ref<DiscordChatRelayResultDto | null>(null);

function showCommandTestResult(result: DiscordCommandExecuteResultDto | undefined) {
  commandTestResult.value = result ?? null;
  toast({
    type: result?.succeeded ? 'success' : 'error',
    text: result?.message || t('views.discordIntegration.settings.messages.commandTestFailed'),
  });
}

function showChatRelayTestResult(result: DiscordChatRelayResultDto | undefined) {
  chatRelayTestResult.value = result ?? null;
  toast({
    type: result?.succeeded ? 'success' : 'error',
    text: result?.message || t('views.discordIntegration.settings.messages.chatRelayTestFailed'),
  });
}

async function onTestDiscordCommand() {
  if (!commandTestForm.commandText.trim())
    return;

  const confirmed = await confirm({
    type: 'warning',
    text: t('views.discordIntegration.settings.messages.commandTestConfirm'),
  });
  if (!confirmed)
    return;

  try {
    isCommandTesting.value = true;
    const { data } = await discordIntegrationExecuteDiscordCommand({
      body: {
        commandText: commandTestForm.commandText.trim(),
        discordUserId: commandTestForm.discordUserId.trim() || null,
        discordUsername: commandTestForm.discordUsername.trim() || null,
        inMainThread: commandTestForm.inMainThread,
      },
      throwOnError: true,
    });
    showCommandTestResult(data);
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isCommandTesting.value = false;
  }
}

async function onTestDiscordChatRelay() {
  if (!chatRelayTestForm.message.trim())
    return;

  try {
    isChatRelayTesting.value = true;
    const { data } = await discordIntegrationRelayDiscordChat({
      body: {
        message: chatRelayTestForm.message.trim(),
        discordUserId: chatRelayTestForm.discordUserId.trim() || null,
        discordUsername: chatRelayTestForm.discordUsername.trim() || null,
      },
      throwOnError: true,
    });
    showChatRelayTestResult(data);
  }
  catch (error) {
    console.error(error);
  }
  finally {
    isChatRelayTesting.value = false;
  }
}
</script>

<template>
  <section class="discord-settings__section">
    <div class="discord-settings__section-header">
      <div>
        <h3>{{ t('views.discordIntegration.settings.sections.relayTests') }}</h3>
        <p>{{ t('views.discordIntegration.settings.sections.relayTestsDescription') }}</p>
      </div>
    </div>
    <div class="discord-settings__test-grid">
      <div class="discord-settings__test-panel">
        <h4>{{ t('views.discordIntegration.settings.sections.commandRelayTest') }}</h4>
        <el-input v-model="commandTestForm.commandText" clearable />
        <el-input v-model="commandTestForm.discordUserId" clearable :placeholder="t('views.discordIntegration.settings.fields.discordUserId')" />
        <el-input v-model="commandTestForm.discordUsername" clearable :placeholder="t('views.discordIntegration.settings.fields.discordUsername')" />
        <el-checkbox v-model="commandTestForm.inMainThread">
          {{ t('views.discordIntegration.settings.fields.inMainThread') }}
        </el-checkbox>
        <el-button type="warning" :loading="isCommandTesting" @click="onTestDiscordCommand">
          {{ t('views.discordIntegration.settings.actions.testCommandRelay') }}
        </el-button>
        <pre v-if="commandTestResult" class="discord-settings__result">{{ JSON.stringify(commandTestResult, null, 2) }}</pre>
      </div>

      <div class="discord-settings__test-panel">
        <h4>{{ t('views.discordIntegration.settings.sections.chatRelayTest') }}</h4>
        <el-input v-model="chatRelayTestForm.message" clearable />
        <el-input v-model="chatRelayTestForm.discordUserId" clearable :placeholder="t('views.discordIntegration.settings.fields.discordUserId')" />
        <el-input v-model="chatRelayTestForm.discordUsername" clearable :placeholder="t('views.discordIntegration.settings.fields.discordUsername')" />
        <el-button type="primary" :loading="isChatRelayTesting" @click="onTestDiscordChatRelay">
          {{ t('views.discordIntegration.settings.actions.testChatRelay') }}
        </el-button>
        <pre v-if="chatRelayTestResult" class="discord-settings__result">{{ JSON.stringify(chatRelayTestResult, null, 2) }}</pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.discord-settings__test-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.discord-settings__test-panel {
  display: grid;
  gap: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-bg-color);

  h4 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 20px;
  }
}

.discord-settings__result {
  overflow: auto;
  max-height: 220px;
  margin: 0;
  border-radius: 6px;
  padding: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 768px) {
  .discord-settings__test-grid {
    grid-template-columns: 1fr;
  }
}
</style>
