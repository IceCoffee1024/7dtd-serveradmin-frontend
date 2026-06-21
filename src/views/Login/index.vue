<script setup  lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import steamIcon from '~/assets/images/steam-svgrepo-com.svg';
import { usePopup } from '~/composables/usePopup.ts';
import { disposeAllStores } from '~/plugins/pinia';
import v from '~/plugins/valibot';
import { useUserInfoStore } from '~/stores/userInfo';
import { generateElementRules } from '~/utils';

defineOptions({ name: 'Login' });

disposeAllStores();

const userInfoStore = useUserInfoStore();

const { t } = useI18n();
const { toast } = usePopup();
const route = useRoute();

const steamLoginUrl = computed(() => {
  const redirect = route.query.redirect?.toString() ?? '/';
  const returnTo = `${window.location.origin}/api/oauth/steam/return?redirect=${encodeURIComponent(redirect)}`;
  const encoded = encodeURIComponent(returnTo);
  return `https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.mode=checkid_setup&openid.return_to=${encoded}&openid.realm=${encoded}&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select`;
});

const appTitle = computed(() => {
  return `${t('common.projectName')} ${import.meta.env.VITE_APP_VERSION}`;
});

const LoginSchema = v.object({
  username: v.pipe(v.string(), v.minLength(1)),
  password: v.pipe(v.string(), v.minLength(6)),
});

const rules: FormRules = generateElementRules(LoginSchema);

const forgotPasswordConfigPath = 'Mods/ServerAdmin/Config/appsettings.json';
const forgotPasswordUserField = 'UserName';
const forgotPasswordPasswordField = 'Password';

const loginForm = reactive({
  username: '',
  password: '',
});
const loginFormRef = ref<FormInstance>();

async function handleLogin() {
  const formEl = loginFormRef.value;
  if (!formEl)
    return;
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        await userInfoStore.signIn(loginForm.username, loginForm.password);
        toast({
          title: t('views.login.successTitle'),
          text: t('views.login.successMessage'),
          type: 'success',
        });
      }
      catch (error) {
        toast({
          title: t('views.login.failedTitle'),
          text: t('views.login.failedMessage'),
          type: 'error',
        });
        console.error('Login failed:', error);
      }
    }
  });
}
</script>

<template>
  <div class="px-4 py-6 flex-center min-h-screen w-full bg-base">
    <!-- From Uiverse.io by themrsami -->
    <div class="max-w-500px w-full relative">
      <div class="px-4 py-8 border rounded-3xl border-card w-full shadow-card relative bg-card sm:p-10">
        <el-form ref="loginFormRef" :model="loginForm" :rules="rules" @submit.prevent="handleLogin">
          <div class="flex min-w-0 items-center justify-center">
            <div class="text-2xl tracking-wide font-extrabold text-center min-w-0">
              <span class="text-transparent break-words from-purple-500 to-blue-500 bg-gradient-to-r bg-clip-text">{{ appTitle }}</span>
            </div>
          </div>
          <div class="mt-5">
            <el-form-item prop="username" class="text-sm mb-5 mt-1">
              <label class="text-gray-600 font-semibold pb-1 block dark:text-gray-300" for="username">{{ $t('views.login.username') }}</label>
              <el-input id="username" v-model="loginForm.username" size="large" class="w-full" autofocus />
            </el-form-item>
            <el-form-item prop="password" class="text-sm mb-5 mt-1">
              <label class="text-gray-600 font-semibold pb-1 block dark:text-gray-300" for="password">{{ $t('views.login.password') }}</label>
              <el-input id="password" v-model="loginForm.password" size="large" show-password type="password" class="w-full" />
            </el-form-item>
          </div>
          <div class="mb-4 flex items-center">
            <el-checkbox id="rememberMe" v-model="userInfoStore.isRememberMe" class="!mr-0" />
            <label class="text-xs text-gray-500 font-semibold ml-1 cursor-pointer dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" for="rememberMe">
              {{ $t('views.login.rememberMe') }}
            </label>
            <el-popover placement="top-end" trigger="click" :width="320">
              <div class="text-xs text-gray-500 leading-5 dark:text-gray-300">
                <p class="text-sm text-gray-700 font-semibold dark:text-gray-100">
                  {{ $t('views.login.forgotPasswordHelpTitle') }}
                </p>
                <p class="mt-2">
                  {{ $t('views.login.forgotPasswordHelpUnavailable') }}
                </p>
                <p class="mt-2">
                  {{ $t('views.login.forgotPasswordHelpPathLabel') }}
                </p>
                <p class="text-[11px] text-gray-700 font-mono mt-1 px-2 py-1 rounded-md bg-gray-100 break-all dark:text-gray-200 dark:bg-gray-800">
                  {{ forgotPasswordConfigPath }}
                </p>
                <p class="mt-2">
                  {{ $t('views.login.forgotPasswordHelpFieldsLabel', { usernameField: forgotPasswordUserField, passwordField: forgotPasswordPasswordField }) }}
                </p>
                <p class="mt-2">
                  {{ $t('views.login.forgotPasswordHelpRestartHint') }}
                </p>
              </div>
              <template #reference>
                <button
                  type="button"
                  class="text-xs text-gray-500 font-semibold ml-auto p-0 border-none bg-transparent underline cursor-pointer dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {{ $t('views.login.forgotPassword') }}
                </button>
              </template>
            </el-popover>
          </div>
          <div class="mt-5">
            <el-button type="primary" size="large" native-type="submit" class="text-base font-semibold w-full shadow-md">
              {{ $t('views.login.submit') }}
            </el-button>
          </div>
          <div class="mt-4 flex gap-3 items-center justify-between">
            <span class="border-b border-gray-200 w-1/5 dark:border-gray-400 md:w-1/4" />
            <span class="text-xs text-gray-500 text-center uppercase dark:text-gray-400">Or Sign in with</span>
            <span class="border-b border-gray-200 w-1/5 dark:border-gray-400 md:w-1/4" />
          </div>
          <div>
            <a
              :href="steamLoginUrl"
              class="text-white font-semibold mt-4 rounded-lg border-none no-underline flex h-11 w-full cursor-pointer shadow-md transition duration-200 ease-in items-center justify-center from-[#72A233] to-[#599342] bg-gradient-to-r hover:opacity-90"
            >
              <img class="w-8" :src="steamIcon">
              <span class="text-base ml-2 break-words">Sign in with Steam</span>
            </a>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>
