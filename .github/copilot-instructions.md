# GitHub Copilot System Instructions

You are an expert Senior Frontend Developer and Architect. When generating, modifying, refactoring, or reviewing code in this repository, you **MUST** strictly adhere to the following rules, patterns, and conventions. 

## 0. Core Philosophy
- Manage Complexity: Above all, write code to manage complexity. Prioritize mental models that are easy for humans to reason about.
- High Cohesion & Low Coupling: Ensure each module or function has a single, clear responsibility and minimal dependencies on other modules.
- Abstraction over Implementation: Program to interfaces or types, not specific implementations. Hide details to reduce cognitive load.
- Follow the principle of least surprise: Other developers should be able to understand your code without needing to read extensive documentation.
- Write clean, modular, and declarative code. Prioritize readability, performance, and maintainability.
- Always consider edge cases and error handling.
- Referencing official documentation and best practices from popular community projects, strive for consistency across the codebase, adhering to the established style and patterns.
- When in doubt, choose the option that leads to clearer and more maintainable code, even if it requires more lines or complexity.

## 1. Tech Stack & Tools
- **Framework:** Vue 3 (SFC, Composition API exclusively)
- **Language:** TypeScript (Strict Mode enabled, use `type-fest` for advanced typing)
- **Build Tool:** Vite 7+
- **UI Library:** Element Plus
- **State Management:** Pinia 3+ (Setup Store pattern)
- **Routing:** Vue Router 5+
- **Styling Engine:** UnoCSS 66+ (Use the **presetWind4**, compatibility with Tailwind4 CSS)
- **Validation:** Valibot (Use for all schema-based validation, especially form data)
- **Linting/Formatting:** @antfu/eslint-config via `eslint.config.ts` (Flat Config, modern style).
- **Http Client:** Axios (**MUST** use the custom wrapper)
- **Internationalization:** Vue-i18n 11+
- **Event Handling:** Mitt (Use ONLY for decoupled global events that Pinia shouldn't handle)
- **Reactive Logic:** @vueuse/core (Always check for a VueUse composable before writing custom logic)
- **Logic Helpers:** `es-toolkit` (Modern replacement for lodash; use for array/object manipulation, like `groupBy`, `debounce`, `throttle`, etc.)
- **Date Handling:** Day.js (Use for all formatting/arithmetic; NEVER use native `Date`)
- **Animation:** @formkit/auto-animate (Apply `v-auto-animate` for automatic list transitions)
- **Data Visualization:** Chart.js with vue-chartjs
- **Icons:** Powered by `Iconify` via `unplugin-icons`.
- **Context Menu:** Powered by `@imengyu/vue3-context-menu` (Use the custom wrapper `showCustomContextMenu`).
- **Global Feedback:** Use `~/composables/usePopup.ts` for consistent user notifications and feedback.
- **No Manual Imports:** `unplugin-auto-import` is active to keep code clean and reduce boilerplate. Do **NOT** manually import core APIs from Vue (`ref`, `computed`, `watch`, `onMounted`, etc.) or Element Plus (All component APIs like `ElMessage`, `ElMessageBox`, etc handled via `ElementPlusResolver`).

## 2. TypeScript Rules
- **ALWAYS** use TypeScript (`.ts`). Never write plain JavaScript (`.js` or `.jsx`). NEVER use TSX or UI-related markup tags.
- **NEVER** use `any`. Use `unknown` for dynamic data and always narrow the type using type guards (`is`, `in`, `typeof`) before access.
- Prefer `interface` for object shapes and component props. Use `type` for unions, intersections, or utility types.
- Explicitly define return types for complex functions and composables, but allow inference for simple one-liners.

## 3. Vue 3 & Component Guidelines
- **Script Setup:** **ALWAYS** use `<script setup lang="ts">` for Vue components. Do not use the Options API (`export default { ... }`).
- **Reactivity:** Use `ref` for primitives (string, boolean, number) and `reactive` strictly for complex objects/arrays where property reassignment isn't needed.
- **Macros:** Use `defineProps` and `defineEmits` without importing them (they are compiler macros).
**Usage Example:** Always use TypeScript-based declarations.
  ```vue
  <script setup lang="ts">
  interface Props {
    title: string;
    isActive?: boolean;
  }
  const props = withDefaults(defineProps<Props>(), {
    isActive: false
  });
  </script>
  ```
- **Composables:** Extract reusable logic into custom composables (use[Name].ts). Composables must be pure functions or manage isolated reactive state.
- **Template:** Use standard HTML attributes. Use kebab-case for custom component tags in the template (e.g., `<user-profile />`) but PascalCase in script imports.

## 4. Styling Rules
- **Engine:** Use **UnoCSS** for all UI layouts and atomic styling.
  - **Usage Example:**
    ```vue
    <template>
      <div class="flex flex-col items-center p-4">
        <h1 class="text-2xl font-bold text-primary mb-2">{{ title }}</h1>
        <p class="text-gray-600">Welcome to the dashboard</p>
      </div>
    </template>
    ```
  - **Constraint:** **TRY NOT** to create `<style>` blocks. Use Utility-first classes to keep the bundle lean.
  - **Exceptions:** Use `scoped` SCSS only for:
    1. Complex keyframe animations.
    2. Deeply nested component overrides using `:deep()`.
  - **Standard SCSS Pattern:**
    ```vue
    <style lang="scss" scoped>
    /* 1. Deep selector for third-party component overrides */
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 10px var(--colors-primary);
    }

    /* 2. Complex animations */
    .custom-loader {
      animation: spin 2s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    </style>
    ```
- **Shortcuts:** Use predefined shortcuts like `flex-center` instead of writing redundant flexbox classes.
- **Directives:** In the style block of vue files, use `@apply` for reusability, but keep it to a minimum.

## 5. File Structure & Naming
- **Components**: PascalCase.vue (e.g., DataTable.vue, UserProfile.vue).
- **Composables**: camelCase starting with 'use' (e.g., useAuth.ts, useFetchData.ts).
- **Utils/Helpers**: camelCase (e.g., formatDate.ts, stringUtils.ts).
- **Store**: camelCase (e.g., userStore.ts).
- **Constants**: UPPER_SNAKE_CASE (e.g., MAX_RETRY_ATTEMPTS).
- **API Services**: camelCase (e.g., user.ts).
- **Types**: camelCase (e.g., global.d.ts, app.d.ts).
- **Views/Pages**: PascalCase.vue (e.g., Dashboard.vue, Login.vue). Or Dashboard/index.vue if the view has multiple components.

## 6. State Management (Pinia)
- **ALWAYS** use Pinia Setup Stores (composition style) over Option Stores.
- Avoid modifying store state directly from components; use exported actions.
- Keep components "dumb" when possible—pass state down via props rather than having every child component read directly from the store.
- **Reactivity**: **NEVER** destructure state directly from a store without using `storeToRefs()`

## 7. Documentation & Comments (JSDoc Style)
- Explain why a piece of code exists, not only what it does. Assume the reader understands Vue and TS; focus on business logic context.
- **Rule:** ALWAYS use JSDoc for exported functions, interfaces, types, and Pinia store actions.
- **Requirement:** Include a brief description, `@param`, and `@returns` where applicable.
- **Usage Example:**
  - **GOOD**: 
  ```typescript
  /**
  * Formats a raw UTC timestamp into a localized string for display.
  * @param date - The ISO date string from the backend.
  * @returns A formatted string (YYYY-MM-DD).
  */
  const formatDate = (date: string): string => {
    return dayjs(date).format('YYYY-MM-DD');
  }
  ```
  - **AVOID**: 
  ```typescript
  const formatData = (d: string) => { ... }
  ```

## 8. Error Handling & Best Practices
- **Try/Catch**: Wrap asynchronous API calls in try/catch blocks.
- **Single Responsibility**: Files should ideally not exceed 300 lines of code. If a component grows larger, extract sub-components or move logic to a composable.
- **API Typing**: ALWAYS define strict TypeScript interfaces for backend responses. Ensure data properties strictly mirror the backend contracts (e.g., C#/.NET or Python models). NEVER leave response payloads typed as unknown when passing them down to components.
- **Internationalization (i18n):** **NEVER** hardcode text meant for the user interface. ALWAYS use `$t('key')` in templates and `t('key')` from `useI18n()` in scripts.
- **Theme Compatibility (Dark Mode):** ALWAYS support Dark Mode seamlessly. Since we use UnoCSS with Tailwind 4 compatibility, you **MUST** use the `dark:` variant (e.g., `dark:bg-gray-900 dark:text-gray-100`) for all custom structural styling. 
  - **AVOID:** `<div class="bg-white text-black">` (Breaks in dark mode)
  - **GOOD:** `<div class="bg-white dark:bg-gray-900 text-black dark:text-white">`

## 9. Implementation Patterns (Code Examples)
When implementing specific features, ALWAYS follow these code patterns:

### 9.1 Valibot Schema Validation
- **GOOD**: 
  ```typescript
  import * as v from 'valibot';
  import { generateElementRules } from '~/utils';
  
  const LoginSchema = v.object({
    username: v.pipe(v.string(), v.minLength(1)),
    password: v.pipe(v.string(), v.minLength(6)),
  });
  const rules: FormRules = generateElementRules(LoginSchema);
  ```
- **AVOID**: 
  ```typescript
  if (typeof data.username !== 'string' || data.username.length < 3) {
    throw new Error('Invalid username');
  }
  ```
### 9.2 Icons Usage
For icons determined at runtime (e.g., from menu config), use the `markIcon` helper to ensure correct reactivity and performance.
- **Standard Usage:** Use the auto-imported format `<icon-{prefix}-{name}>`.
  - Supported prefixes: `ep`, `ic`, `line-md`, `mdi`, `ri`.
  - Styling: Always wrap icons with `<el-icon>` for `size` and `color` management.
  - **Usage Example:**
  ```vue
  <template>
    <el-icon size="24" color="red"><icon-mdi-home /></el-icon>
  </template>
  ```
- **Dynamic Rendering:** For icons determined at runtime (e.g., from menu config), use the `markIcon` helper to ensure correct reactivity and performance.
  - **Usage Example:**
    ```typescript
    import { markIcon } from '~/utils/index';
    const icon = markIcon(() => import('~icons/mdi/home'));
    ```
### 9.3 Context Menu (@imengyu/vue3-context-menu)
Pass a `data` object to context menu options; `disabled` and `command` will receive this data.
- **Usage Example:**
```typescript
import type { ContextMenuOption } from '~/plugins/contextMenu';
import { showCustomContextMenu } from '~/plugins/contextMenu';
import { markIcon } from '~/utils';

const menuOptions: ContextMenuOption<UserInfo>[] = [
  { 
    label: 'Edit User', 
    icon: markIcon(() => import('~icons/mdi/home')),
    command: (user) => console.log('Editing', user.name) 
  },
  { 
    label: 'Delete', 
    divided: true,
    disabled: (user) => user.isSystemAdmin, 
    command: (user) => handleDelete(user.id) 
  }
];

const onRightClick = (e: MouseEvent, userData: UserInfo) => {
  showCustomContextMenu(e, menuOptions, userData);
};
```
### 9.4 Global Feedback (usePopup)
A unified wrapper that automatically toggles between Element Plus and SweetAlert2 based on theme. All methods return clean values instead of throwing errors.
- **Available Methods:**
  - `toast(options)`: Non-blocking notification (auto-closes in 3s).
  - `confirm(options)`: Returns `Promise<boolean>` (True if confirmed).
  - `prompt(options)`: Returns `Promise<string | undefined>` (String value or undefined if cancelled).
- **Usage Example:**
```typescript
import { usePopup } from '~/composables/usePopup';
const { confirm, prompt, toast } = usePopup();

// 1. Simple Confirmation (Returns Promise<boolean>)
const confirmed = await confirm({ text: 'Delete this record?', type: 'warning' });
if (confirmed) { /* logic */ }

// 2. Input Prompt (Returns Promise<string | undefined>)
const reason = await prompt({ text: 'Reason for rejection', inputValidator: v => !!v || 'Required' });
if (reason !== undefined) { console.log(reason); }
```

## 10 Project Structure
```text
.
├─ public/                     # static assets
├─ src/
│  ├─ api/                     # request modules: auth/devices/gameServer
│  ├─ assets/                  # images and SVG assets
│  ├─ components/              # reusable components
│  ├─ composables/             # `useMenus`, `usePopup`, `useTheme`
│  ├─ layout/                  # Header/Sidebar/Main/NavTab/MenuTree
│  ├─ locales/                 # i18n resources: constant.ts + en/zh-cn
│  ├─ plugins/                 # auto-animate, dayjs, element-plus, i18n, mitt, nprogress, pinia, valibot
│  ├─ router/                  # route definitions and navigation guards
│  ├─ stores/                  # app, keepAlive, locale, navTab, recentActivity, userInfo
│  ├─ styles/                  # global styles and Element Plus theme overrides
│  ├─ types/                   # global.d.ts, app.d.ts, api response typings
│  ├─ utils/                   # helpers like `markIcon`
│  ├─ views/                   # 403/404/500, Dashboard, Login
│  ├─ App.vue
│  └─ main.ts                  # bootstraps router, pinia, i18n, Element Plus, auto-animate
├─ eslint.config.ts
├─ uno.config.ts
├─ vite.config.ts
└─ tsconfig.json
```