<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const props = defineProps<Props>();

type ExceptionType = 403 | 404 | 500;

interface Props {
  /**
   * Exception type
   *
   * - 403: no permission
   * - 404: not found
   * - 500: service error
   */
  type: ExceptionType;
  /** Optional detail message shown below the icon, e.g. the reason from a Steam OAuth rejection. */
  message?: string;
}

const { t } = useI18n();

const fallbackTitleMap: Record<ExceptionType, string> = {
  403: 'errors.http.forbidden',
  404: 'errors.http.notFound',
  500: 'errors.http.serverError',
};

const title = computed(() => t(fallbackTitleMap[props.type]));
const description = computed(() => props.message || title.value);
</script>

<template>
  <div class="exception-page">
    <el-icon class="exception-page__icon text-primary">
      <icon-custom-no-permission v-if="type === 403" />
      <icon-custom-not-found v-else-if="type === 404" />
      <icon-custom-service-error v-else-if="type === 500" />
    </el-icon>
    <div class="exception-page__content">
      <span class="exception-page__code">{{ type }}</span>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
    <router-link to="/">
      <el-button type="primary" size="large">
        {{ $t('common.backToHome') }}
      </el-button>
    </router-link>
  </div>
</template>

<style scoped>
.exception-page {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 18px;
  min-height: min(520px, calc(100vh - 160px));
  width: 100%;
  padding: 32px 16px;
  overflow: hidden;
  box-sizing: border-box;
  text-align: center;
}

.exception-page__icon {
  width: clamp(160px, 32vw, 320px);
  height: clamp(160px, 32vw, 320px);
}

.exception-page__content {
  display: grid;
  gap: 8px;
  max-width: 640px;
  min-width: 0;
}

.exception-page__code {
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.exception-page__content h1 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 26px;
  line-height: 34px;
}

.exception-page__content p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 22px;
  overflow-wrap: anywhere;
}
</style>
