# 富国岛旅行规划网站 开发记录

> 项目位置：`D:\大学\旅游攻略网站\`
> GitHub：`https://github.com/Robertwu523/phuquoc-travel`
> 线上：`https://phuquoc-travel.netlify.app`
> 最后更新：2026-08-13（手机端适配 + 地图/目录取消加入 + Supabase 账号云同步）

---

## 一、项目初始化（2026-08-05）

### 1.1 脚手架
- `npx create-next-app@latest phu-quoc-planner`（Next.js 16.3 + TypeScript + Tailwind v4 + App Router）
- 安装依赖：`react-leaflet leaflet @types/leaflet next-intl zustand`
- 最初在 `C:\Users\ASUS\phu-quoc-planner\`，后迁移到 `D:\大学\旅游攻略网站\`

### 1.2 双语基础（next-intl）
- `i18n/routing.ts`：locales `['zh','en']`，defaultLocale `'zh'`，`localePrefix: 'as-needed'`
- `i18n/request.ts`：getRequestConfig + messages 加载
- `i18n/navigation.ts`：createNavigation（Link/redirect/usePathname/useRouter）
- `proxy.ts`：Next 16 的 middleware 改名为 Proxy，`export const proxy = createMiddleware(routing)`
- `next.config.ts`：`createNextIntlPlugin('./i18n/request.ts')`
- `app/[locale]/layout.tsx`：NextIntlClientProvider + generateStaticParams + generateMetadata
- 翻译文件：`messages/zh.json` + `messages/en.json`（Nav/Hero/Categories/Map/Planner/Flights/Info/Common）

### 1.3 POI 数据
- `data/pois.ts`：14 个富国岛景点（海滩/亲子/自然/出海/夜市/文化）
- 类型：`POI { id, category, name{zh,en}, description{zh,en}, lat, lng, duration }`
- `poiById` Map 用于快速查找

### 1.4 地图组件
- `components/PhuQuocMap.tsx`（`"use client"`）：react-leaflet MapContainer + TileLayer + Marker + Popup + Polyline
- `components/PhuQuocMapClient.tsx`：`dynamic(() => import('./PhuQuocMap'), {ssr:false})`（绕开 SSR）
- **坑1**：Next 16 禁止 Server Component 里用 `ssr:false`，wrapper 必须也是 `"use client"`
- **坑2**：Leaflet 默认 marker 图标在 Next 打包后损坏 → `L.Icon.Default.mergeOptions`
- **坑3**：Zustand selector 返回新数组引用导致无限循环 → `useTripStore(s => s.x) ?? []`（`??` 移到 selector 外）

### 1.5 状态管理（Zustand）
- `lib/store.ts`：`persist` 中间件 + `_hasHydrated` 水合闸门（避免 SSR hydration mismatch）
- persist key：`phu-quoc-trip-v1` → 后升级到 `v2`
- `partialize`：只持久化 `startDate/days/selectedDay/dayAssignments/customPins/hiddenCurated/stopDurations/stopStartTimes`

### 1.6 首版功能
- 地图 + 14 景点标记 + 点击加入行程 + 按天分配 + 直线连接
- 机票跳转（Trip.com / Skyscanner / Google Flights）
- 旅行信息（签证/季节/交通/货币/时区）
- 中英文切换

---

## 二、迁移到 D 盘（2026-08-05）

- 用户要求不占 C 盘 → 迁移到 `D:\大学\旅游攻略网站\`
- tar 流复制（排除 node_modules/.next/.git）
- 新位置 `npm install`（384 包，0 漏洞）
- `.claude/launch.json` 更新 cwd
- C 盘原项目删除

---

## 三、机票方案决策（2026-08-05~06）

### 3.1 Amadeus API 关闭
- 核实：Amadeus Self-Service API **已于 2026-07-17 永久关闭**（PhocusWire + Amadeus 官网确认）
- 无法做页面内实时机票报价

### 3.2 携程 API 调研
- 携程无免费公开价格拉取 API
- 用户提供了高德 Web 服务 key，但**高德对越南数据全空**（只有中国数据）
- 最终方案：**跳转 Trip.com / Skyscanner / Google Flights**（无页面内价格）

### 3.3 deeplinks 库
- `lib/deeplinks.ts`：`googleNavUrl` / `skyscannerUrl`（YYMMDD 格式）/ `tripcomUrl`
- 后扩展支持自定义 origin/dest/cabin/children/infants

---

## 四、地图功能大幅增强（2026-08-06~07）

### 4.1 自定义落点 + 确认面板
- 点击地图空白 → 弹出 `AddPlaceDialog`（**不再直接创建**）
- 联网识别：靠近已收录景点（<1km）自动吸附；否则 BigdataCloud 反向地理编码
- 确认面板：名称（可编辑）+ 分类选择 + 时长 + 评价链接（携程/马蜂窝/小红书/Google）
- `lib/stops.ts`：统一 `MapStop` 类型 + `resolveStop` + `snapToCurated` + `haversineKm`
- `lib/geocode.ts`：`reverseGeocode`（BigdataCloud）+ `reverseGeocodeRich`（Overpass 优先）

### 4.2 景点搜索
- `app/api/search/route.ts`：**Photon**（komoot OSM 搜索引擎），bbox 限定富国岛
- `lib/zhmap.ts`：中文关键词 → 英文映射（70+ 词，如 沙滩→beach、海鲜餐厅→seafood restaurant）
- `components/PoiSidebar.tsx`：搜索框（中文秒搜收录 + 在线 Photon 搜索）+ 分类筛选

### 4.3 真实驾车路线 + 一键导航
- `lib/routing.ts`：OSRM `osrmRoute`（路线+时间+几何）+ `osrmOptimizeTrip`（TSP 优化）
- 地图上画真实道路路线 + 显示总里程/总时间/每段时间
- `lib/nav.ts`：Google Maps 多途经点导航深链

### 4.4 Bug 修复
- 点击删除按钮穿透到地图创建误点 → DropHandler 加 `target.closest('.leaflet-popup')` 等过滤
- 图标缓存（`iconCache`）：改名/改分类不再重建 marker 图标 → 弹窗稳定
- FitBounds 改为只在切换天数时触发（不再每次添加都甩视野）

### 4.5 POI 坐标精确校正
- 通过 Photon/OSM 权威数据交叉验证
- **重大修正**：安泰群岛和 May Rut 岛原来标到经度 104.7（岛东 70km 公海），实际在 104.0
- 星星沙滩：10.19 → 10.05（东南海岸，非岛北）
- 夜市/监狱/鱼露工厂/缆车等全部校正

### 4.6 自定义分类系统
- 分类选择器加"✏️ 自定义"选项
- `lib/categories.ts`：`styleFor(cat)` 兜底（未知分类 → 📍粉色）
- 目录筛选条**动态**：固定 7 类 + 自定义分类自动加入
- 地图弹窗可**编辑已选分类**
- 收录景点也**可删除**（hiddenCurated 列表 + 恢复按钮）
- 目录景点**点击定位**地图（setFlyTo）

---

## 五、子页面架构 + UI 美化（2026-08-06~07）

### 5.1 页面拆分
- 首页 `/`：全屏 hero + bento 卡片网格
- `/map`、`/flights`、`/trip`、`/info` 各自独立
- `/info` 下子页：`/info/documents`、`/info/weather`、`/info/currency`、`/info/resources`
- `/me` 个人中心

### 5.2 PageHero 组件
- 每个子页顶部照片 banner（富国岛实拍照片）
- `components/PageHero.tsx`：image + eyebrow + title + subtitle

### 5.3 富国岛照片
- 从 Pexels 下载 6 张到 `public/images/`
- `phuquoc-sunset.jpg`（1920×1277）、`phuquoc-sea.jpg`（1280×1920 竖图）、`phuquoc-town.jpg`（1280×853）
- `phuquoc-cablecar.jpg`（1800×2700）、`phuquoc-boats.jpg`（1800×2700）、`phuquoc-vinwonders.jpg`（1280×848）

### 5.4 SiteHeader（顶栏）
- 透明浮层导航（首页 hero 上透明，滚动/其它页磨砂实色）
- 最终版：统一 5 项（🗺️地图 → 📋行程 → ✈️机票 → 📘信息 → 👤我的）
- 胶囊容器 + 橙色高亮选中

---

## 六、天气看板（2026-08-06~07）

### 6.1 数据源
- **Open-Meteo**（免费、无 key、国内直连）
- `app/api/weather/route.ts`：合并 forecast + air-quality，10 分钟缓存
- 支持 `?lat=&lng=` 任意坐标查询

### 6.2 功能
- 实时温度大卡（体感/湿度/气压/能见度/风速）
- 空气质量卡（US AQI + PM2.5 + 颜色进度条）
- **Recharts AreaChart** 气温走势（monotone 平滑曲线 + 渐变填充 + CSS 变量配色）
- 日出日落**贝塞尔弧线动画**（太阳从日出处沿弧线移动到当前时刻，easeOutCubic）
- 5 天预报（图标/天气/降雨概率/最高最低温）
- **地图选点**（WeatherMap Leaflet 组件，点击切换天气查询位置）
- **手动刷新**（nocache 跳过缓存）+ **自动 10 分钟轮询**
- **失败重试**（最多 2 次，1.5s 间隔）+ **空气质量降级**（失败不影响主天气）
- UV 指数 + CSS 天气动画（wx-sun/wx-cloud/wx-float，遵守 prefers-reduced-motion）

---

## 七、证件准备指南（2026-08-07~08）

### 7.1 证件详情页（`/info/documents`）
- 目的地选择器（越南默认 + 7 个常用目的地，HK 特区护照视角）
- 必办证件 / 建议办理 / 容易忽略（三层）
- 签证类型对比表 + 费用参考表
- 越南 e-Visa 办理教程（6 步 + 官网 + B站/小红书/YouTube 教程链接）
- 官方源链接（中国领事服务网 / 越南 e-visa 官网 / 香港入境处）

### 7.2 检查清单（顶部高亮）
- **6 类 33 项**（证件与文件/钱与支付/健康与安全/电子与通讯/交通与自驾/衣物与日用品/出发前确认）
- `components/DocChecklist.tsx`：
  - 所有项目（预设+自定义）可**增删改**
  - 点击 ✏️ 行内编辑文字 + 换分类
  - 自定义项可选归入内置分类或新建分类
  - 进度条 + 全部完成庆祝
  - 持久化：全部 items 数组存 localStorage（`phuquoc-doc-checklist-v3`）

---

## 八、货币换算（2026-08-07）

- `app/api/rates/route.ts`：open.er-api.com，HKD 基准，1 小时缓存
- `app/[locale]/info/currency/page.tsx`：
  - xe.com 风格换算器（金额 + 币种选择 + ⇄ 互换）
  - 4 位小数精度
  - 关键汇率卡（HKD/CNY/USD → VND）
  - 常见物价表（自动换算港元+人民币两列）
  - 越南盾使用指南（面额/现金/信用卡/兑换/防坑）

---

## 九、行程规划大改（2026-08-08~13）

### 9.1 TripIt 风格时间线 → 横向甘特图
- 纵向列表 → **横向甘特图**（07:00–23:00，每小时 70px）
- 每天一行，景点 = 彩色色块（宽度 = 时长比例）
- 时间从 09:00 自动排布，间隔 30 分钟

### 9.2 Pointer Events 自由拖拽
- 从 HTML5 Drag（仅排序）升级为 **Pointer Events**
- 按住色块拖到**任意时间点**（15 分钟吸附）
- `setPointerCapture` 锁定指针 + 5px 移动阈值
- Store 加 `stopStartTimes`（显式开始时间）+ `stopDurations`（自定义时长）

### 9.3 悬浮卡片
- `fixed` 定位（不被任何容器截断）
- 200ms 延迟（快速划过不闪）
- 显示时间/时长/坐标 + 评价/导航/删除
- **时长编辑器**（± 按钮，每次 0.25h）

### 9.4 点击空白添加 + 自定义事件
- 点击时间轴空白 → 弹出景点选择器
- 底部**自定义事件表单**（名称 + emoji 选择 + 时长）

### 9.5 旅行记账
- `components/ExpenseTracker.tsx`：
  - 多币种（VND/HKD/USD/CNY）→ 自动换算人民币
  - 预算管控（进度条 + 超支变红）
  - 分类图表（餐饮/交通/住宿/景点/购物/其他）
  - 实时汇率（/api/rates）
  - localStorage 持久化 + markDirty 同步标记

### 9.6 探索功能（已删除）
- 曾加入路线模板（3天海滩/5天深度/7天亲子/4天美食）+ 采用功能
- 用户反馈没用 → 删除 `ExploreSection.tsx` + `routeTemplates.ts`

---

## 十、部署（2026-08-06 首次部署）

### 10.1 GitHub
- `git init` → commit → push
- 仓库：`github.com/Robertwu523/phuquoc-travel`
- Git 身份：`Robertwu523 <wzm523111@outlook.com>`（用 `-c` 参数，不改全局 config）
- **代理推送**：`git -c http.proxy=http://127.0.0.1:7897 push origin main`（本地代理端口 7897）

### 10.2 Netlify
- 从 GitHub 自动部署（Starter 免费版）
- 构建：`npm run build`（Next.js 自动识别）
- 无环境变量（全部免费无 key 服务）
- 域名：`phuquoc-travel.netlify.app`

### 10.3 推送策略
- 用户要求：**一天推一个版本**，不自动推送
- 记忆：`C:\Users\ASUS\.claude\projects\C--Users-ASUS\memory\git-push-policy.md`

---

## 十一、关键 Bug 修复记录

| Bug | 原因 | 修复 |
|---|---|---|
| Zustand 无限循环 | selector 返回新数组引用 | `??` 移到 selector 外 |
| 删除按钮穿透创建误点 | Leaflet 事件冒泡 | DropHandler 加 target.closest 过滤 |
| 弹窗改名不生效 | 每次重建 marker icon | iconCache 按外观缓存 |
| 添加后定位跳走 | FitBounds 每次添加触发 | 改为只在切换天数时触发 |
| 天气获取失败 | Netlify 冷启动 / Overpass 超时 | 自动重试 2 次 + 空气质量降级 |
| 悬浮卡片被截断 | 容器 overflow + CSS hover | 改用 React state + `fixed` 定位 |
| 悬浮卡片不可点击 | `pointer-events-none` | 改为 React 控制的 hover + 延迟 |
| 自定义分类输入消失 | newGroup 改值导致条件 false | 独立 customGroupName state |
| 日期字段 JSON 引号冲突 | 中文字符串含英文引号 | 改用「」书名号 |
| DayColumn `KNOWN_CATS` 重复声明 | 两处定义 | 保留 `as const` 版本 |
| RainViewer 雷达瓦片 404 | 格式/地区不通 | 放弃降雨雷达功能 |
| Nominatim 反向地理编码不可达 | 国内被墙 | 改用 BigdataCloud |

---

## 十二、Claude 会话记录（2026-08-13）

> 以下为 Claude（Sonnet 5）在 2026-08-13 一次会话中完成的工作，按时间顺序记录。

### 12.1 手机端全面适配
> 提交：`a1c2863 Add mobile responsive layout across the site`（已推送）

发现并修复了导致手机端体验崩坏的核心问题（**审计结论：全站响应式 class 其实早就写好了，但一个根本 bug 让它们全部失效**）：

| 问题 | 文件 | 修复 |
|---|---|---|
| **缺少 viewport meta**（致命：手机按 980px 桌面渲染后缩放，所有 `sm:`/`md:`/`lg:` 全失效） | `app/[locale]/layout.tsx` | 加 `export const viewport: Viewport = { width:'device-width', initialScale:1 }`（不设 maximumScale，保留缩放无障碍） |
| 头部桌面导航条 + 移动导航条**同时渲染** | `components/SiteHeader.tsx` | 桌面条加 `hidden md:flex`；外层 `h-16→h-auto md:h-16`；layout 的 `main pt-16→pt-24 md:pt-16` |
| 行程页**悬浮卡片 hover-only**（手机无 hover，无法改时长/导航/删景点） | `app/[locale]/trip/page.tsx` | 加 `justDragged` ref + 块 `onClick` 切换卡片（点开/再点关）；卡片位置 `Math.min` 夹在屏内；空白 track 点击先关卡片；drag 后抑制误开 |
| DocChecklist / ExpenseTracker **编辑/删除按钮 hover-only**（手机看不到） | `DocChecklist.tsx` / `ExpenseTracker.tsx` | 按钮加 `max-md:opacity-100`（≤768px 常显，桌面仍 hover 浮现） |
| 天气逐时 8 列网格在窄屏太挤 | `info/weather/page.tsx` | `grid-cols-8→grid-cols-4 sm:grid-cols-8` |
| 地图加载占位 420px 超短屏 | `PhuQuocMapClient.tsx` | `min-h-[420px]→min-h-[260px] md:min-h-[420px]` |

验证：Browser MCP + `preview_resize` 手机宽度，各页通过。

### 12.2 地图弹窗 / 目录可取消加入行程
> 提交：`3fbef94 Allow removing a curated stop from the map popup`（已推送，含两处微调）

用户反馈：景点"已加入第X天"后按钮变灰 disabled，只能去行程页删，麻烦。

- `components/PhuQuocMap.tsx`（地图弹窗按钮）：去掉 `disabled`，`onClick` 改为**点击切换**（已加入→`removePoiFromDay`，未加入→`addPoiToDay`），与自定义 pin 弹窗逻辑统一
- `components/PoiSidebar.tsx`（左侧目录按钮）：解构 `removePoiFromDay`，同样改点击切换
- 文案微调：两处按钮去掉"· 移除"后缀，只保留"已加入第X天"（点击即取消，无需额外提示），hover 变红暗示可删

### 12.3 Supabase 账号 + 跨设备数据同步（核心新功能）
> ⚠️ **本次改动尚未提交/推送**（等待用户确认推送）

**背景**：原数据全在浏览器 localStorage，换设备即丢失。用户要"注册账号，任何设备登录都能看到自己的数据"。

**决策**：方案 Supabase（Singapore 区域，免费版）；登录方式邮箱密码 + Google（Google 待用户配 OAuth）；合并策略**智能合并**（登录时本地与云端取并集）；同步时机**自动实时同步**（本地改动防抖 1s 上传）。

**数据库（用户已在 Supabase 控制台建好并跑通 SQL）**：
- 表 `public.user_data(user_id uuid, data_key text, payload jsonb, updated_at timestamptz)`，主键 `(user_id, data_key)`
- RLS 已开（每人只能读写自己的行）+ `updated_at` 自动更新触发器

**凭据**：`.env.local`（已 gitignore）：
- `NEXT_PUBLIC_SUPABASE_URL=https://vayorjefssqlpbxmxsdu.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...`

**架构原则**：localStorage 永远是离线真相源，同步引擎在它和云端之间搬运；未登录/断网体验完全不变。

**新增文件**：
- `lib/supabase/client.ts` — `createBrowserClient`（@supabase/ssr）浏览器单例
- `lib/sync.ts` — **同步引擎核心**：`SYNC_KEYS`（6 个 key 注册表）、`markDirty`（标记脏 + 防抖 1s push）、`pushKey`/`pushAll`（upsert）、`pullAndMerge`（智能合并：本地有云端无→推上；云端有本地无→拉下；都有→比时间戳，首登无 meta 视本地为新）、`startSync`/`stopSync`（storage 事件监听）、`isPulling` 防循环
- `components/AuthProvider.tsx` — `useAuth()`：user/loading/syncStatus/lastSyncAt/syncNow/signIn/signUp/signOut/signInWithGoogle；`onAuthStateChange` 监听：登录→`pullAndMerge`+`store.rehydrate()`+启动同步，退出→停同步；`subscribeTripSync()` 订阅 Zustand 变化触发 markDirty
- `components/UserMenu.tsx` — 头部头像下拉（未登录显"登录"按钮，已登录显邮箱首字母 + 我的/退出）
- `app/[locale]/auth/page.tsx` — 登录/注册页（邮箱密码 + Google 按钮）

**修改文件**：
- `app/[locale]/layout.tsx` — 包 `<AuthProvider>`
- `components/SiteHeader.tsx` — 引入 `UserMenu`
- `lib/store.ts` — 加 `subscribeTripSync()`（序列化 partialize 字段做快照对比，变了才 markDirty，动态 import sync 避免循环依赖）
- `FlightPanel/ExpenseTracker/DocChecklist/weather page` — 每处 `setItem` 后加 `markDirty(KEY)`（storage 事件不在本 tab 触发，必须显式调）
- `app/[locale]/me/page.tsx` — 加账号卡片（未登录推登录 / 已登录显邮箱+同步状态徽章+立即同步+退出）；`exportData`/`clearAllData` 改用共享 `SYNC_KEYS` 常量；底部说明按登录态动态

**Next 16 关键适配**：Middleware 已改名 `proxy.ts`（跑 next-intl），官方文档明说 proxy "not intended for full session management"，故**不在 proxy 刷 Supabase session**，改纯客户端（@supabase/ssr cookie 存储，session 只在 client 读写），契合现有全 client 架构。

**验证**：编译无错；Supabase 往返通（注册请求正确验证邮箱格式）；账号卡片/同步状态正确显示。**待真账号实测**：Supabase 默认开邮箱确认（`confirmation_sent_at`），用户需在 `Authentication→Providers→Email` 关掉 "Confirm email" 方便测试；Google OAuth 需用户在 `Providers→Google` 启用 + Google Cloud 建 OAuth client 填 redirect URL。

**已知限制**：邮箱确认开启时注册需收信点链接；Google 登录按钮已就绪但需用户配 OAuth client 才激活。

---

## 十三、当前文件结构

```
D:\大学\旅游攻略网站\
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              ← 全局布局 + SiteHeader + LanguageSwitcher
│   │   ├── page.tsx                ← 首页（hero + 进入按钮）
│   │   ├── map/page.tsx            ← MapWorkspace
│   │   ├── trip/page.tsx           ← 行程（甘特图 + 记账 Tab）
│   │   ├── flights/page.tsx        ← FlightPanel
│   │   ├── info/
│   │   │   ├── page.tsx            ← InfoSection（5 卡片）
│   │   │   ├── documents/page.tsx  ← 证件清单
│   │   │   ├── weather/page.tsx    ← 天气看板
│   │   │   ├── currency/page.tsx   ← 货币换算
│   │   │   └── resources/page.tsx  ← 旅行工具
│   │   ├── me/page.tsx             ← 个人中心（含账号卡片 + 同步状态）
│   │   └── auth/page.tsx           ← 登录/注册页（邮箱 + Google）
│   ├── api/
│   │   ├── weather/route.ts        ← Open-Meteo 代理
│   │   ├── search/route.ts         ← Photon 搜索代理
│   │   ├── place/route.ts          ← Overpass 地点识别
│   │   └── rates/route.ts          ← 汇率代理
│   └── globals.css                 ← Tailwind v4 + Leaflet 样式 + 天气动画
├── components/
│   ├── SiteHeader.tsx              ← 顶栏（5 项统一导航）
│   ├── LanguageSwitcher.tsx
│   ├── PhuQuocMap.tsx              ← Leaflet 地图（落点+路线+搜索+导航）
│   ├── PhuQuocMapClient.tsx        ← dynamic ssr:false wrapper
│   ├── MapWorkspace.tsx            ← 地图页布局（目录+地图+日期选择）
│   ├── PoiSidebar.tsx              ← 景点目录（搜索+分类+点击定位）
│   ├── AddPlaceDialog.tsx          ← 落点确认面板
│   ├── DayTimeline.tsx             ← 单日时间线组件（旧版，行程页内联了新版）
│   ├── FlightPanel.tsx             ← 机票搜索（携程风格 + 手动航班）
│   ├── InfoSection.tsx             ← 信息卡片（证件/天气/货币/工具/时区）
│   ├── PageHero.tsx                ← 子页顶部照片 banner
│   ├── DocChecklist.tsx            ← 证件检查清单（增删改 + 自定义分类）
│   ├── ExpenseTracker.tsx          ← 旅行记账（多币种 + 预算）
│   ├── WeatherMap.tsx              ← 天气页地图选点
│   ├── AuthProvider.tsx            ← 账号上下文 + useAuth + 同步编排
│   ├── UserMenu.tsx                ← 头部头像下拉（登录/退出）
│   └── CustomEventForm             ← 行程页内联的自定义事件表单
├── data/
│   ├── pois.ts                     ← 14 个收录景点（坐标已校正）
│   └── documents.ts                ← 证件/清单/费用/教程数据
├── lib/
│   ├── store.ts                    ← Zustand store（v2 persist）
│   ├── stops.ts                    ← MapStop 类型 + resolveStop + snapToCurated
│   ├── categories.ts               ← 分类样式 + styleFor 兜底
│   ├── deeplinks.ts                ← 机票/导航深链构造
│   ├── routing.ts                  ← OSRM 路线 + TSP 优化
│   ├── geocode.ts                  ← BigdataCloud/Overpass 反向地理编码
│   ├── reviews.ts                  ← 评价平台深链
│   ├── nav.ts                      ← Google Maps 导航深链
│   ├── weatherCodes.ts             ← WMO 天气代码 → emoji/文字
│   ├── zhmap.ts                    ← 中文 → 英文关键词映射
│   ├── sync.ts                     ← 云同步引擎（markDirty/pullAndMerge/push）
│   └── supabase/client.ts          ← Supabase 浏览器单例（@supabase/ssr）
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── navigation.ts
├── messages/
│   ├── zh.json
│   └── en.json
├── proxy.ts                        ← next-intl Proxy（Next 16 middleware）
├── next.config.ts
├── tsconfig.json
├── package.json
└── public/images/                  ← 6 张富国岛照片
```

---

## 十四、技术要点速查

### Next.js 16 特殊之处
- Middleware → **Proxy**（`proxy.ts`，`export const proxy`）
- `LayoutProps<'/[locale]'>` / `PageProps<'/[locale]'>`（全局类型助手）
- `ssr:false` 的 `dynamic()` **只能在 Client Component 中调用**

### 国内可用服务
| 服务 | 可用 | 不可用 |
|---|---|---|
| ArcGIS 瓦片 | ✅ | |
| Open-Meteo 天气 | ✅ | |
| OSRM 路线 | ✅ | |
| BigdataCloud 地理编码 | ✅ | |
| Photon 搜索 | ✅ | |
| Overpass 地点识别 | ✅（偶有超时） | |
| open.er-api.com 汇率 | ✅ | |
| Pexels 图片 CDN | ✅ | |
| OSM 街道瓦片 | | ❌ 需翻墙 |
| Nominatim | | ❌ 被墙 |
| Wikipedia | | ❌ 被墙 |
| RainViewer 雷达 | | ❌ 404 |

### Git 推送
```bash
# 本地代理 7897
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main
```

### 本地开发
```bash
cd D:\大学\旅游攻略网站
npm run dev          # http://localhost:3000
npm run build        # 生产构建验证
npx tsc --noEmit     # 类型检查
```

---

## 十五、待办 / 后续优化方向

- [ ] 甘特图色块**拖拽调时长**（拖右边缘改 duration）
- [ ] 跨天拖拽（从一个天拖到另一个天）
- [ ] 冲突预警（某天 > 16h 红色警示）
- [ ] 行程模板（空白预设：一日游/周末/深度游）
- [ ] 地图视图 ↔ 时间轴视图双视图切换
- [ ] 导出行程为文本时刻表（剪贴板）
- [ ] 撤销/重做栈（Ctrl+Z）
- [x] ~~账号同步机制完善（AuthProvider 的后端 API 对接）~~ → 已用 Supabase 实现（12.3）
- [x] ~~移动端甘特图优化（触摸拖拽）~~ → 手机适配已完成（12.1，含触摸拖拽 + 点击卡片）
- [ ] Google OAuth 配置激活（需用户在 Supabase + Google Cloud 建 OAuth client）
- [ ] 同步冲突更细粒度处理（当前 last-write-wins，个人项目够用）
- [ ] 更多富国岛照片/景点补充

---

## 十六、开发日志维护约定

**每次 Claude 修改后，必须在 `handoff.md` 追加/更新本文件的修改记录**（用户 2026-08-13 明确要求）。新增功能写在第十二章（Claude 会话记录）下追加小节，或在相应章节更新。目的：一眼看清"干过什么"，便于交接和回溯。
