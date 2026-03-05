# WWT — 開發路線圖 (RoadMap)

> 最後更新：2026-03-02

---

## Phase 1 — 核心基礎 ✅

- [x] Vue 3 + TypeScript + Vite + Tailwind CSS v4 專案初始化
- [x] Blueprint S35 設計系統（暗色藍圖背景、白色線條裝飾、銳利幾何邊角）
- [x] Supabase 後端整合（PostgreSQL + Auth + Storage）
- [x] Vue Router 4 i18n 路由（`/:locale(zh-TW|en)?` 前綴）
- [x] Pinia 狀態管理
- [x] vue-i18n 11 雙語支援（zh-TW / en）
- [x] Vercel 部署

---

## Phase 2 — CMS 後台 ✅

- [x] Admin 登入與權限控管（`profiles.is_admin` + route guard）
- [x] Dashboard 儀表板
- [x] TipTap Notion-like 編輯器（Slash commands、圖片上傳、程式碼區塊、影片嵌入）
- [x] 文章管理（CRUD + 雙語 JSONB 內容 + 技能分類）
- [x] 作品集管理（CRUD + 分類 ad/brand/event/other）
- [x] 專案/App 管理（CRUD + slug + product_page JSONB）
- [x] 媒體庫管理（上傳至 Supabase Storage）
- [x] 導航選單管理（localStorage + Supabase `site_config` 雙向同步）
- [x] 外觀主題設定（accent color、Logo、背景風格）
- [x] 首頁文案設定（Hero 區塊、分類卡片、CTA 區塊）
- [x] 網站基本設定（標題、描述）
- [x] 技能分類管理（3-tier: main → sub → topic）

---

## Phase 3 — 前台頁面 ✅

- [x] 首頁（CohesionHero + CategoryCards + FeaturedPosts + MotionWorks + ExclusivePrograms + StatsBar + CtaSection）
- [x] Workshop 文章列表 + 文章詳情頁（`/workshop/:slug`）
- [x] Lab 專案展示頁
- [x] Showcase 作品集頁
- [x] Premium 會員頁（Stripe 整合）
- [x] App 產品頁（`/apps/:slug`）+ `/apps` 重導向
- [x] TheNavbar 導航列（hover 下拉、手機漢堡選單、父選單機制）
- [x] TheFooter 頁尾
- [x] LanguageSwitch 語言切換
- [x] ArticleActions 文章操作

---

## Phase 4 — 認證系統 ✅

- [x] 用戶註冊頁（Email + 密碼）
- [x] 用戶登入頁（Email + Google OAuth）
- [x] OAuth callback 處理
- [x] Auth Store（session 管理、is_admin 權限）

---

## Phase 5 — 進階功能 ✅

- [x] 動態路由註冊（後台自訂路徑，如 `/workshop` → `/ai`）
- [x] GSAP 動畫 + ScrollReveal 效果
- [x] Hero 區塊支援影片 URL + 可點擊連結
- [x] SEO 支援（`@unhead/vue`）
- [x] 自動翻譯 composable（`useAutoTranslate`）
- [x] Vitest 單元測試框架 + coverage

---

## Phase 6 — 待開發 🔲

- [ ] 搜尋功能（全站搜尋文章、作品、專案）
- [ ] 評論系統
- [ ] 文章標籤篩選
- [ ] 用戶個人檔案頁
- [ ] 付費內容存取控制（Premium 文章 gate）
- [ ] 電子報訂閱
- [ ] 網站分析 Dashboard
- [ ] 深色/淺色主題切換（用戶偏好）
- [ ] PWA 支援
- [ ] 無障礙（a11y）優化