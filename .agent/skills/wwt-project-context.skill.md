---
name: wwt-project-context
description: |
  WWT 專案背景與前後台同步規範。每次修改功能時必須讀取此 Skill，確保前台（Vue 頁面/元件）
  與後台（Supabase 資料庫 + Admin CMS）完整同步，不遺漏任何一端。
license: MIT
compatibility: Antigravity / Claude Code / Cursor
metadata:
  author: kapoleung
  version: "1.0"
  category: project-context
---

# WWT Project Context & Frontend-Backend Sync Skill

> **用途**：記錄 WWT 專案架構全貌，並在每次新增/修改功能時，確保**前台與後台同步更新**。

---

## 1. 專案概覽

| 項目 | 內容 |
|------|------|
| **名稱** | WWT — AI-Powered Creative Workshop |
| **定位** | 雙語（中/英）個人網站，分享 AI Coding、AI 影片製作技巧、專業影視製作經驗 |
| **前端** | Vue 3 + TypeScript + Vite + Tailwind CSS v4 |
| **UI 庫** | Element Plus + Headless UI |
| **狀態管理** | Pinia |
| **路由** | Vue Router 4（支援 `/:locale(zh-TW｜en)?` 前綴） |
| **i18n** | vue-i18n 11（翻譯檔在 `src/i18n/`） |
| **編輯器** | TipTap（Notion-like block editor） |
| **後端** | Supabase（PostgreSQL + Auth + Storage） |
| **部署** | Vercel |
| **設計風格** | Blueprint S35 — 暗色藍圖背景、白色線條裝飾、銳利幾何邊角、Architects Daughter 手寫字體 |

---

## 2. 資料庫結構（Supabase PostgreSQL）

### 核心表

| 表名 | 用途 | 主要欄位 |
|------|------|----------|
| `posts` | 文章（Workshop）| `title_zh/en`, `slug`, `content_zh/en` (JSONB), `excerpt_zh/en`, `skill_topic_id`, `tags`, `featured_image`, `status`, `is_premium`, `published_at` |
| `categories` | 文章分類 | `name_zh/en`, `slug`, `sort_order` |
| `works` | 作品集（Showcase）| `title_zh/en`, `description_zh/en`, `category` (ad/brand/event/other), `video_url`, `thumbnail`, `client`, `tags`, `sort_order` |
| `projects` | 自家程式（Lab/Apps）| `name`, `slug`, `description_zh/en`, `url`, `screenshot`, `tech_stack[]`, `product_page` (JSONB), `sort_order` |
| `media` | 媒體庫 | `url`, `filename`, `type`, `size` |
| `site_config` | 站台設定（Key-Value JSONB）| `key` (PK), `value` (JSONB), `updated_at` |

### 3-Tier Skill 分類

| 表名 | 用途 |
|------|------|
| `skill_main_categories` | 主分類（Logic / Code / Motion）|
| `skill_sub_categories` | 子分類（main_id → FK）|
| `skill_topics` | 主題（sub_id → FK）|

### site_config 已用 Keys

| Key | 儲存內容 | 對應 Store |
|-----|---------|-----------|
| `appearance` | 主題色、Logo、網格風格、背景 | `appearance.ts` |
| `frontend_nav` | 選單項目陣列 | `frontendNav.ts` |
| `homepage` | 首頁文案（Hero、分類、CTA）| `homepageSettings.ts` |
| `site_settings` | 網站標題、簡介 | `siteSettings.ts` |

### SQL 遷移歷史

```
supabase/migrations/
├── 001_initial_schema.sql        # posts, categories, works, projects, media + RLS
├── 002_storage_media.sql         # Storage bucket 設定
├── 003_skills_categories.sql     # 3-tier skill 分類 + posts.skill_topic_id
├── 004_site_config.sql           # site_config 表
└── 005_projects_slug_product_page.sql  # projects.slug + projects.product_page
```

---

## 3. Pinia Stores（前端狀態）

### Config 類型 Stores（site_config 驅動）

這類 Store 使用 `hydrateFromServer()` → Supabase `site_config` → localStorage 快取的模式：

| Store 檔案 | site_config Key | 用途 |
|-----------|----------------|------|
| `stores/appearance.ts` | `appearance` | 主題外觀（accent color, logo, 背景風格）|
| `stores/frontendNav.ts` | `frontend_nav` | 前台導航選單項目 |
| `stores/homepageSettings.ts` | `homepage` | 首頁自訂文案 |
| `stores/siteSettings.ts` | `site_settings` | 網站標題與描述 |

**同步模式**：
```
啟動時 → hydrateFromServer() → Supabase 讀 → 更新 Pinia state → 寫 localStorage
後台儲存 → save() → 寫 localStorage → upsert Supabase site_config
```

### CRUD 類型 Stores（直接操作表）

| Store 檔案 | Supabase 表 | 用途 |
|-----------|------------|------|
| `stores/posts.ts` | `posts` | 文章 CRUD + 分類、按 slug 讀取 |
| `stores/works.ts` | `works` | 作品 CRUD |
| `stores/projects.ts` | `projects` | 專案 CRUD + `appsWithSlug` 計算屬性 |
| `stores/auth.ts` | Supabase Auth | 登入/登出、session 管理 |

---

## 4. 頁面結構

### 前台（公開頁面）

| 路由 | 頁面 | 說明 |
|------|------|------|
| `/` | `pages/index.vue` | 首頁（Hero + 分類卡片 + CTA）|
| `/workshop` | `pages/workshop/index.vue` | 文章列表 |
| `/workshop/:slug` | `pages/workshop/[slug].vue` | 文章詳情 |
| `/lab` | `pages/lab/index.vue` | 專案展示 |
| `/showcase` | `pages/showcase/index.vue` | 作品集 |
| `/apps/:slug` | `pages/apps/[slug].vue` | 單一 App 產品頁 |
| `/premium` | `pages/premium/index.vue` | 會員頁 |

### 後台（Admin CMS）

| 路由 | 頁面 | 管理範圍 |
|------|------|---------|
| `/admin/login` | `admin/login.vue` | 登入 |
| `/admin` | `admin/dashboard.vue` | 儀表板 |
| `/admin/appearance` | `admin/appearance.vue` | 外觀主題設定 |
| `/admin/homepage` | `admin/homepage.vue` | 首頁文案 |
| `/admin/menu` | `admin/menu/index.vue` | 導航選單管理 |
| `/admin/skills` | `admin/skills/index.vue` | 技能分類管理 |
| `/admin/works` | `admin/works/index.vue` | 作品集管理 |
| `/admin/projects` | `admin/projects/index.vue` | 自家程式管理 |
| `/admin/media` | `admin/media.vue` | 媒體庫管理 |
| `/admin/settings` | `admin/settings.vue` | 網站基本設定 |

---

## 5. 前後台同步檢查清單 ✅

> [!CAUTION]
> **每次新增或修改功能時，必須逐項確認以下清單，確保前台與後台完整同步。**

### 新增資料欄位時

- [ ] **Supabase 遷移**：在 `supabase/migrations/` 建立新的 `.sql` 遷移檔
- [ ] **TypeScript 型別**：在 `src/types/index.ts` 更新對應 interface
- [ ] **Pinia Store**：更新對應 store 的 state / fetch / save 方法
- [ ] **後台 Admin 頁面**：在對應 admin 頁面加入編輯欄位
- [ ] **前台顯示元件**：在對應前台頁面/元件顯示新欄位
- [ ] **i18n 翻譯**：在 `src/i18n/` 中英文翻譯檔都更新

### 新增 site_config 設定時

- [ ] **Supabase**：確認 `site_config` 表的 Key 命名
- [ ] **Store**：建立對應 store，實作 `hydrateFromServer()` + `save()` 雙向同步
- [ ] **localStorage Key**：使用 `wwt-<feature>` 命名慣例
- [ ] **Admin 頁面**：建立/更新後台管理介面
- [ ] **前台消費端**：在前台用 `effective*()` 方法取值（有值則用、無值走 i18n fallback）
- [ ] **App.vue 啟動載入**：在 `main.ts` 的啟動流程加入 `hydrateFromServer()` 呼叫

### 新增 CRUD 資料表時

- [ ] **Supabase 遷移**：建表 + 設 RLS 策略（public read + authenticated full）
- [ ] **TypeScript Interface**：在 `types/index.ts` 定義
- [ ] **Pinia Store**：建立 CRUD store（fetch / save / delete）
- [ ] **後台 Admin 路由**：在 `router/index.ts` admin children 新增
- [ ] **後台 Admin 頁面**：建立管理頁面（列表 + 編輯表單）
- [ ] **前台路由**：在 `router/index.ts` locale children 新增
- [ ] **前台頁面**：建立展示頁面

### 新增導航項目時

- [ ] **Store**：在 `frontendNav.ts` 的 `defaultItems` 新增
- [ ] **Router**：在 `router/index.ts` 的 routes 和 `keyToRouteConfig` 新增
- [ ] **i18n**：在翻譯檔加上 `nav.*` label
- [ ] **前台頁面**：建立對應頁面元件

### 修改現有功能時

- [ ] **前台頁面**是否需要對應改動？
- [ ] **後台 Admin 頁面**是否需要對應改動？
- [ ] **Store**是否需要更新 state / 方法？
- [ ] **TypeScript 型別**是否需要更新？
- [ ] **SQL Schema**是否需要更新？
- [ ] **i18n 翻譯**是否需要更新？

---

## 6. 命名慣例

| 類型 | 慣例 | 範例 |
|------|------|------|
| localStorage Key | `wwt-<feature>` | `wwt-appearance`, `wwt-frontend-nav` |
| site_config Key | `<feature>` (snake_case) | `appearance`, `frontend_nav`, `site_settings` |
| 路由 name | `<section>` 或 `admin-<section>` | `workshop`, `admin-appearance` |
| Store 名稱 | camelCase | `useAppearanceStore`, `usePostsStore` |
| 遷移檔命名 | `NNN_description.sql` | `006_new_feature.sql` |
| 翻譯 Key | dot notation | `nav.workshop`, `hero.greeting` |
| 元件目錄 | 功能分群 | `components/home/`, `components/editor/` |

---

## 7. 關鍵設計決策

1. **雙語 JSONB 內容**：文章的 `content_zh/en` 使用 TipTap 的 JSON 格式存於 JSONB
2. **自家程式下拉**：導航中 `key === 'apps'` 的項目為 hover 顯示的父選單，子項由 `projects` 表動態產生
3. **Config vs CRUD**：站台外觀/選單/首頁文案用 `site_config` Key-Value；文章/作品/專案用獨立 CRUD 表
4. **Hydrate 優先**：App 啟動時直接從 Supabase 讀取最新設定（不依賴 localStorage 舊資料）
5. **RLS 策略統一**：公開資料 → anon SELECT；管理操作 → authenticated ALL

---

**原則**：任何修改都應該問自己——「前台有顯示嗎？後台能管理嗎？資料庫有對應嗎？型別有更新嗎？翻譯有加嗎？」——五個都確認才算完成。
