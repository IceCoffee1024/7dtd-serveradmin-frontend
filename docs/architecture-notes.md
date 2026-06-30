# 前端结构整理备忘

本文记录当前前端结构、边界约定、请求缓存策略和后续治理优先级。它用于指导后续重构和新增功能，不作为临时沟通记录。

## 当前技术栈

- Vue 3 负责应用和组件模型，入口在 `src/main.ts`，根组件在 `src/App.vue`。
- Vite 负责开发服务器、别名、插件和生产构建，配置在 `vite.config.ts`。
- Element Plus 是主要 UI 组件库，组件和 API 通过 `unplugin-vue-components`、`unplugin-auto-import` 按需引入。
- Pinia 承接本地应用状态，Pinia Colada 承接请求缓存、查询和失效。
- OpenAPI 客户端由 `@hey-api/openapi-ts` 生成，生成目录为 `src/generated/api`。
- UnoCSS、Iconify、vue-i18n、Chart.js、OpenLayers 等作为功能性支撑库使用。

## 启动与插件结构

`src/main.ts` 当前启动顺序为：

1. `setupPinia(app)` 注册 Pinia 和 Pinia Colada。
2. `setupI18n(app)` 注册 i18n。
3. `setupGeneratedApiClient()` 配置生成客户端和请求拦截器。
4. `app.use(router)` 注册路由。
5. `setupAuthEventHandler(router)` 注册鉴权事件处理。
6. `setupElementPlus(app)`、`setupAutoAnimate(app)` 注册 UI 辅助能力。
7. 挂载到 `#app`。

`src/App.vue` 负责全局主题初始化、登录状态驱动的游戏事件连接，以及通过 `el-config-provider` 注入 Element Plus 当前语言。

## Vite 与构建结构

`vite.config.ts` 的关键约定：

- `~/` 指向 `src/`。
- 自动注册 `src/components/*.vue` 和 `src/components/*/index.vue`。
- Element Plus 组件、Element Plus API、Iconify 图标按需引入。
- i18n JSON 通过 `@intlify/unplugin-vue-i18n` 纳入构建。
- 开发环境代理 `/api` 和 `/swagger` 到 `VITE_DEV_API_PROXY_TARGET`。
- 生产构建显式划分 Vue/Router/Pinia/Colada、Element Plus、OpenLayers、i18n、Charts 和其他 vendor 分组。

构建体积和验证流程另见 `docs/frontend-build-analysis.md` 和 `docs/local-validation.md`。

## OpenAPI 生成客户端

`openapi-ts.config.ts` 定义生成策略：

- 输入源优先级为 `OPENAPI_INPUT`、`.env.development` 中的 `OPENAPI_INPUT`、`VITE_OPENAPI_INPUT`，默认指向 `http://7dtdserver.local:8088/swagger/v1/swagger.json`。
- 输出目录是 `src/generated/api`，每次生成会清理目录。
- 使用 `@hey-api/client-fetch`，并启用 `throwOnError: true`。
- 生成 TypeScript 类型、SDK 函数、Valibot 定义，以及 Pinia Colada query/mutation options。
- Pinia Colada query keys 启用 tags，用于后续按领域失效缓存。

生成目录职责：

- `types.gen.ts`：后端 DTO、请求参数和枚举类型。
- `sdk.gen.ts`：低层 SDK 函数，适合简单请求或领域 wrapper 复用。
- `@pinia/colada.gen.ts`：生成的 query/mutation options，适合和 `useQueryCache`、`useQuery` 等缓存能力配合。
- `client.gen.ts`、`client/*`、`core/*`：fetch client、序列化、鉴权、请求和 SSE 基础设施。
- `valibot.gen.ts`：生成的校验定义。

原则：不要手改 `src/generated/api`。接口变化应通过 `pnpm api:gen` 更新生成产物，再由页面、queries 或领域 wrapper 适配。

## 请求与错误处理

全局请求入口是 `src/api/generatedClient.ts`：

- `client.setConfig` 使用 `VITE_OPENAPI_BASE_URL`，默认空字符串，保持同源部署。
- 请求拦截器启动 `nProgress`。
- 非登录接口自动读取用户 token 并写入 `Authorization: Bearer <token>`。
- 所有请求写入 `X-Language`，值来自 locale store。
- 响应拦截器结束 `nProgress`。
- 错误拦截器忽略 `AbortError`，对 400/401/403/404/500 和未知错误展示统一 toast，并在 401/403 时发出鉴权事件。

请求代码的优先路径：

1. 页面优先使用 `src/generated/api/@pinia/colada.gen.ts` 中的生成 query/mutation options。
2. 如果需要 DTO 兜底、空响应处理、下载文件、导出文件、领域转换或兼容旧页面形状，再在 `src/queries/*` 或 `src/api/*` 增加薄适配。
3. 不在页面里重复写通用错误提示、鉴权 header、语言 header 或 base URL 处理。

## Pinia 与请求缓存策略

`src/plugins/pinia.ts` 注册 Pinia Colada，并设置全局 `staleTime: 0`。这表示查询结果默认立即变 stale，页面在需要时应依赖显式失效、重新拉取或组件自己的刷新策略，而不是假设长期缓存有效。

当前缓存相关模式：

- 生成的 Colada query options 自带 query key 和 tags。
- `src/queries/generated.ts` 提供 `invalidateGeneratedQueries(tags)`，通过检查 query key 的 `tags` 批量失效生成查询。
- 领域 queries 如 `src/queries/economy.ts`、`src/queries/backup.ts` 使用领域函数封装 tags 失效、`queryCache.ensure/fetch`、下载或导出。
- 部分组件如 `GameItemSelect` 使用 `queryCache.ensure` 和 `queryCache.fetch` 命令式读取，并用本地 `loadedKey` 避免重复装载选项。
- `MyTable` 本身不感知 Colada，只接收 `fetchData(params)`，由页面或领域查询函数决定是否使用生成 query、SDK 函数或手写 wrapper。

建议约定：

- mutation 成功后优先调用领域级失效函数，例如 `invalidateEconomyQueries()`，而不是在页面内散落 tag 字符串。
- 列表页需要远程分页、排序和搜索时，应把 table 参数转换集中在领域 query/helper 内，不让每个页面手写不同的 Colada key 和失效规则。
- 下载、导出、一次性命令式读取可以继续使用 `queryCache.ensure/fetch` 或 SDK 函数，但应在领域 queries 中命名清楚，不伪装成长期缓存数据。
- 轮询类数据使用明确的页面或表格刷新参数，例如 `autoRefreshInterval`，避免依赖 staleTime 触发隐式刷新。

## 页面、路由与组件边界

目录职责建议保持如下：

- `src/router/index.ts`：路由装配、菜单元信息、locale/auth/title/nProgress 守卫。
- `src/views/<Domain>/...`：业务页面和该业务域私有组件。
- `src/layout/*`：全局布局、菜单、顶部导航、页签和页脚。
- `src/components/*`：跨业务复用组件，保持稳定 props/events/slots，避免直接绑定具体业务接口。
- `src/composables/*`：跨页面复用的组合式逻辑；`src/composables/table/*` 是 MyTable 状态和数据逻辑。
- `src/stores/*`：持久或跨页面共享的应用状态，例如用户、主题、语言、菜单页签、keep-alive。
- `src/queries/*`：领域查询、缓存失效、查询结果转换、导出下载等数据层辅助。
- `src/api/*`：少量手写 SDK wrapper。后续应收敛为领域适配层，不应和 generated SDK 长期并列扩张。
- `src/generated/api/*`：生成客户端和类型，只通过生成命令更新。

页面边界：

- 页面负责组织业务流程、列定义、弹窗状态、按钮动作和领域查询调用。
- 页面私有弹窗、表单模型、展示转换放在对应 `views/<Domain>` 下。
- 可跨业务复用的视觉或交互能力才进入 `src/components` 或 `src/composables`。
- 组件不应直接承担路由守卫、鉴权 header、全局错误提示等全局职责。

路由边界：

- 当前路由以 `/:locale/` 作为主应用路径，子路由承载各业务域。
- `meta.title`、`meta.icon`、`meta.groupLabel` 同时供菜单和标题使用。
- `meta.requiresAuth === false` 表示不需要登录。
- 外部或特殊链接通过 `meta.link` 表达，例如 Swagger。

## MyTable 边界

`src/components/MyTable/index.vue` 是 Element Plus 表格 wrapper，当前公开能力包括：

- 服务端分页、远程排序和搜索。
- 搜索列配置、搜索转换和搜索面板。
- 列显隐切换。
- 选择列、批量动作、行上下文菜单。
- 默认新增、编辑、删除操作和 operation slot。
- 自动列宽估算。
- 当前页 CSV 导出。
- 自动刷新。

相关组合式函数：

- `src/composables/table/useTableQuery.ts` 管理分页、排序、搜索状态和请求参数。
- `src/composables/table/useTableData.ts` 管理 `fetchData` 执行、loading、总数、轮询和 CSV 导出。
- `src/composables/table/useMyTable.ts` 组合 query 和 data，并给 `MyTable` 暴露统一方法。
- `src/components/MyTable/SearchForm.vue` 将列搜索配置转换为 `MyForm` 字段，并负责搜索参数 transform。

维护原则：

- 保持 `MyTable` 的外部 API 稳定，新增能力优先通过 props/slots/composable 扩展，而不是让页面依赖内部状态。
- 表格请求语义不直接写在 `MyTable` 内；`MyTable` 只认识 `fetchData(params)`。
- 搜索转换、分页参数、排序参数应在 `MyTableFetchParams` 内保持统一，领域查询负责转换成后端 API 形状。

## 已知结构风险

### `router/index.ts` 过大

当前 `src/router/index.ts` 约 772 行，同时承担路由表、菜单元信息、locale 守卫、登录守卫、标题更新和 nProgress。继续增长会让新增菜单、移动页面、调整守卫互相影响。

治理方向：

- 按业务域拆分路由模块，例如 dashboard、economy、backup、game-chat、permissions。
- 将 guard 拆到 `src/router/guards/*`，保留 `index.ts` 只做 createRouter 和 guard 注册。
- 菜单元信息保持在 route record 附近，但避免把守卫逻辑夹在大路由表中。

### `MyTable/index.vue` 过大

当前 `src/components/MyTable/index.vue` 约 961 行，仍同时承担渲染、列工具栏、上下文菜单、自动宽度、操作列、分页、导出和样式。虽然搜索表单和核心状态已经部分拆出，但 UI 责任仍集中。

治理方向：

- 先抽出纯 UI 子组件：toolbar、column selector、operation column、pagination/footer、search panel shell。
- 再抽出纯逻辑：auto width、CSV export、row context menu adapter。
- 每一步保持现有 props/events/slots 兼容，避免一次性重写影响所有表格页。

### API wrapper 风格不统一

当前存在三种请求风格：

- 页面或 queries 直接使用 generated Colada options。
- `src/api/rewardPackages.ts` 这类手写 wrapper 包装 `sdk.gen.ts`。
- 领域 queries 使用 `queryCache.ensure/fetch` 实现命令式读取、下载和导出。

风险是同类接口的错误处理、空响应处理、缓存失效和命名位置不一致。

治理方向：

- 默认以 generated Colada options 为主。
- 只有在需要领域转换、文件处理、空响应兜底或兼容旧页面时才写 wrapper。
- wrapper 放置位置统一：缓存/失效/展示转换优先放 `src/queries/<domain>.ts`；纯 SDK 兼容薄层再放 `src/api/<domain>.ts`。
- 避免页面直接散落 `throwOnError`、默认空列表、tag 字符串和下载 Blob 逻辑。

### 表格 Colada 语义分散

`MyTable` 接收 `fetchData(params)`，但分页列表的数据来源由页面自行决定。部分页面可能直接 SDK 请求，部分页面可能使用 generated query options，部分页面可能通过手写 wrapper。这样会造成表格缓存 key、失效标签、分页参数转换和刷新时机分散。

治理方向：

- 为高频领域列表定义标准 fetch adapter，例如 `createTableFetch` 或领域级 `fetchEconomyAccountsTable(params)`。
- 约定后端分页字段、排序字段和搜索 transform 的转换位置。
- mutation 后统一调用领域失效函数，再由表格 reload 或 Colada 失效驱动刷新。
- 对需要实时性的表格明确使用 `autoRefreshInterval`，不要把轮询行为隐藏在 fetchData 内。

### `setupElementPlus` 目前是占位

`src/plugins/elementPlus.ts` 中 `setupElementPlus(app)` 当前只 `void app`，实际 Element Plus 组件按需引入由 Vite 插件完成，语言通过 `currentLanguage` 和 `App.vue` 的 `el-config-provider` 注入。

风险是入口函数名字暗示这里完成了 Element Plus 注册，容易误导后续维护者。

治理方向：

- 要么把函数改名或补充注释，明确它目前只保留 Element Plus 相关初始化入口。
- 要么把 Element Plus 全局能力集中到这里，例如默认 locale 初始化、全局配置或未来需要的 app-level 注册。

### 测试缺口

当前已有若干组件、工具和领域模型测试，但以下结构性区域覆盖不足：

- 路由表和路由守卫：locale 纠正、未登录跳转、`requiresAuth: false`、标题更新。
- 生成客户端拦截器：token header、语言 header、`AbortError` 忽略、401/403 事件。
- `MyTable` 和 `composables/table`：搜索 transform、分页/排序参数、CSV 导出、轮询暂停恢复、空数据和错误路径。
- Colada 失效工具：tags 匹配、领域失效函数、mutation 后刷新约定。
- `setupElementPlus` 与 Element Plus locale 初始化关系。

这些测试不需要一次补齐，但在拆 router、拆 MyTable、收敛 API wrapper 前应优先补关键行为测试，避免重构变成纯手工验证。

## 后续治理优先级

1. 请求和缓存规范先行：明确 generated Colada、`src/queries`、`src/api` 的使用边界，并把领域 tag 失效函数作为默认入口。
2. 路由拆分：先按业务域拆 route records，再拆 guards，降低新增页面和守卫调整的冲突面。
3. MyTable 渐进拆分：先拆 UI 子组件和纯逻辑 composable，保持外部 API 不变。
4. 表格 fetch adapter 收敛：把分页、排序、搜索到后端 query 的转换放到领域 queries，减少页面重复。
5. 处理 `setupElementPlus` 占位：明确其职责，避免入口层误导。
6. 补结构性测试：围绕 router、generated client、table composables、query invalidation 建立最小回归网。
7. 每次结构治理后运行 `pnpm typecheck`、`pnpm test:unit`、`pnpm locale:check`；影响构建或首屏依赖时再运行 `pnpm build:analyze`。
