<script setup  lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { useI18n } from 'vue-i18n';
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

const appTitle = computed(() => {
  return `${t('common.projectName')} ${import.meta.env.VITE_APP_VERSION}`;
});

const LoginSchema = v.object({
  username: v.pipe(v.string(), v.minLength(1)),
  password: v.pipe(v.string(), v.minLength(6)),
});

const rules: FormRules = generateElementRules(LoginSchema);

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
  <div class="flex-center size-screen bg-base">
    <!-- From Uiverse.io by themrsami -->
    <div class="py-3 relative sm:mx-auto sm:max-w-xl">
      <div class="mx-8 px-4 py-10 border rounded-3xl border-card w-500px shadow-card relative bg-card md:mx-0 sm:p-10">
        <el-form ref="loginFormRef" :model="loginForm" :rules="rules" @submit.prevent="handleLogin">
          <div class="flex items-center justify-center space-x-5">
            <div class="text-2xl tracking-wide font-extrabold flex">
              <span class="text-transparent from-purple-500 to-blue-500 bg-gradient-to-r bg-clip-text">{{ appTitle }}</span>
            </div>
          </div>
          <div class="mt-5">
            <el-form-item prop="username" class="text-sm mb-5 mt-1">
              <label class="text-gray-600 font-semibold pb-1 block" for="username">{{ $t('views.login.username') }}</label>
              <el-input id="username" v-model="loginForm.username" size="large" class="w-full" autofocus />
            </el-form-item>
            <el-form-item prop="password" class="text-sm mb-5 mt-1">
              <label class="text-gray-600 font-semibold pb-1 block" for="password">{{ $t('views.login.password') }}</label>
              <el-input id="password" v-model="loginForm.password" size="large" show-password type="password" class="w-full" />
            </el-form-item>
          </div>
          <div class="mb-4 flex items-center">
            <el-checkbox id="rememberMe" v-model="userInfoStore.isRememberMe" class="!mr-0" />
            <label class="text-xs text-gray-500 font-semibold ml-1 cursor-pointer hover:text-gray-600" for="rememberMe">
              {{ $t('views.login.rememberMe') }}
            </label>
            <a class="text-xs text-gray-500 font-semibold ml-auto underline cursor-pointer hover:text-gray-600" href="#">{{ $t('views.login.forgotPassword') }}</a>
          </div>
          <div class="mt-5">
            <el-button size="large" native-type="submit" plain class="text-base text-white font-semibold px-4 py-2 text-center rounded-lg bg-blue-600 w-full cursor-pointer shadow-md transition duration-200 ease-in hover:text-white focus:outline-none hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-200">
              {{ $t('views.login.submit') }}
            </el-button>
          </div>
          <div class="mt-4 flex items-center justify-between">
            <span class="border-b border-gray-200 w-1/5 dark:border-gray-400 md:w-1/4" />
            <span class="text-xs text-gray-500 uppercase dark:text-gray-400">Or Sign in with</span>
            <span class="border-b border-gray-200 w-1/5 dark:border-gray-400 md:w-1/4" />
          </div>
          <div>
            <el-button size="large" plain class="text-base text-gray-700 text-white font-semibold mt-4 px-20 text-center rounded-lg flex w-full cursor-pointer shadow-md transition duration-200 ease-in items-center justify-center from-[#72A233] to-[#599342] bg-gradient-to-r hover:text-white focus:outline-none hover:bg-green-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-200">
              <img class="w-10" src="../../assets/images/steam-svgrepo-com.svg">
              <span class="ml-2">Sign in with Steam</span>
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>
