import process from 'node:process';
import { defineConfig } from '@hey-api/openapi-ts';
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
const input = process.env.OPENAPI_INPUT
  || env.OPENAPI_INPUT
  || process.env.VITE_OPENAPI_INPUT
  || env.VITE_OPENAPI_INPUT
  || 'http://7dtdserver.local:8088/swagger/v1/swagger.json';

export default defineConfig({
  input,
  output: {
    path: 'src/generated/api',
    clean: true,
    entryFile: false,
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      throwOnError: true,
    },
    '@hey-api/typescript',
    '@hey-api/sdk',
    {
      name: 'valibot',
      definitions: true,
      requests: {
        shouldExtract: true,
      },
      responses: false,
    },
    {
      name: '@pinia/colada',
      mutationOptions: true,
      queryOptions: true,
      queryKeys: {
        tags: true,
      },
    },
  ],
});
