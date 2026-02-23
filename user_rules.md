# 專案規則與約定（永久記錄）

## 導航與「自家程式」

- **自家程式**：為頂部導航中的父選單，**不帶連結**，僅在滑鼠 hover 時顯示下拉子選單。
- **下拉內容**：子項為後台「App 管理」(projects) 中現有的 App，點擊後進入該 App 的產品頁 `/apps/:slug`。
- **無列表頁**：不提供 `/apps` 列表頁；造訪 `/apps` 時會重導向至第一個 App 或首頁。
- **桌面**：父選單以 hover 顯示下拉（mouseenter/mouseleave），觸發區為 `<span>` 不可點擊。
- **手機**：父選單展開時只顯示標題與子項連結，父項本身不導向。

## 選單管理（後台）

- 選單項目支援 **「是否父選單」** 勾選（`isParentMenu`）。
- 勾選為父選單時：該項**不可點、無連結**，僅用於 hover 顯示下拉；路徑欄位僅供子項基底或顯示用。
- 預設「自家程式」(key: `apps`) 為父選單；其下拉子項由 `projects` 表中有名稱的專案動態產生（slug 或由 name 轉成）。

## 資料與儲存

- 選單設定存於 **localStorage** (`wwt-frontend-nav`) 並同步至 **Supabase** `site_config`（key: `frontend_nav`）。
- App 產品頁內容存於 **projects** 表：`slug`、`product_page` (JSONB)，可於後台「App 管理」編輯。

## 技術要點

- 父選單下拉使用 **hover**（非 Headless UI Menu 點擊），以 `dropdownOpen` + mouseenter/leave 控制，leave 延遲約 150ms 避免閃爍。
- 僅 `key === 'apps'` 時下拉有動態子項（來自 `projectsStore.appsWithSlug`）；其他勾選父選單的項目目前顯示「無子項目」，日後可擴充自訂子項。

---
*此檔案為專案永久記錄，供後續開發與 AI 代理參照。*
