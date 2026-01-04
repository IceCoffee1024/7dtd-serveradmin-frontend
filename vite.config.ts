import path from 'node:path';
import process from 'node:process';

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import Vue from '@vitejs/plugin-vue';
import Unocss from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  process.env.BROWSER = env.VITE_DEV_BROWSER;
  return {
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
      },
    },

    plugins: [
      Vue(),

      Components({
        // Allow auto load markdown components under `./src/components/`
        extensions: ['vue', 'md'],
        // Allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        resolvers: [
          // Auto register Element Plus components
          ElementPlusResolver(),
          // Auto register icon components
          IconsResolver({
            prefix: 'icon',
            customCollections: [
              'custom',
            ],
          }),
        ],
        dts: 'src/components.d.ts',
        globs: ['./src/components/*.vue', './src/components/*/index.vue'],
      }),

      // https://github.com/antfu/unocss
      // See uno.config.ts for config
      Unocss(),

      AutoImport({
        // Global imports to register
        imports: [
          // presets
          'vue',
          // 'vue-router',
          // 'pinia',
          // '@vueuse/core',
          // 'vue-i18n',
        ],

        // Filepath to generate corresponding .d.ts file
        dts: 'src/auto-imports.d.ts',

        // dirs: ['./src/utils/*'],
        // ignore: ['h'],

        resolvers: [
          // Auto import element APIs
          ElementPlusResolver(),
        ],
      }),

      Icons({
        // https://icones.js.org/
        autoInstall: true,
        compiler: 'vue3',
        customCollections: {
          custom: FileSystemIconLoader('src/assets/svg-icons'),
        },
      }),

      VueI18nPlugin({
        include: [path.resolve(__dirname, './src/locales/**.json')],
      }),
    ],

    ssr: {
      // TODO: workaround until they support native ESM
      noExternal: ['element-plus'],
    },

    base: env.VITE_APP_PUBLIC_BASE_PATH,
    server: {
      open: env.VITE_DEV_OPEN_BROWSER === 'true',
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
  };
});
