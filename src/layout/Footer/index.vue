<script setup lang="ts">
</script>

<template>
  <div class="footer-shell">
    <div class="footer-shell__content">
      <div class="footer-shell__meta">
        <span class="footer-shell__product">{{ $t('common.projectName') }}</span>
        <span class="footer-shell__divider" />
        <span class="footer-shell__copyright">Copyright MIT © 2026 IceCoffee1024</span>
      </div>

      <a
        href="https://github.com/IceCoffee1024/7dtd-serveradmin-frontend"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-shell__link"
      >
        GitHub
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.footer-shell {
  width: 100%;
  padding: 0 1rem 1rem;
}

.footer-shell__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 52px;
  padding: 0.85rem 1rem;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 68%, white 32%);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-bg-color) 94%, white 6%), var(--el-bg-color)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--colors-primary) 6%, transparent), transparent 34%);
  color: var(--el-text-color-secondary);
  font-size: 0.84rem;
}

.footer-shell__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.footer-shell__product {
  color: var(--el-text-color-primary);
  font-weight: 700;
}

.footer-shell__divider {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--colors-primary) 50%, white 50%);
}

.footer-shell__copyright {
  color: var(--el-text-color-secondary);
}

.footer-shell__link {
  color: var(--colors-primary);
  font-weight: 700;
}

@media (max-width: 768px) {
  .footer-shell__content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
