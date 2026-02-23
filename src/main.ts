import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { router, registerDynamicNavRoutes } from './router'
import { i18n } from './plugins/i18n'
import { useFrontendNavStore } from './stores/frontendNav'
import { useSiteSettingsStore } from './stores/siteSettings'
import { useAppearanceStore } from './stores/appearance'
import { useHomepageSettingsStore } from './stores/homepageSettings'
import './styles/main.css'

const app = createApp(App)
const head = createHead()

app.use(createPinia())
// 先從 Supabase 載入選單再註冊動態路由，確保後台修改會永久反映
const navStore = useFrontendNavStore()
await navStore.hydrateFromServer()
registerDynamicNavRoutes()
// 從 Supabase 載入網站設定與外觀，首屏即顯示正確內容
const siteSettingsStore = useSiteSettingsStore()
await siteSettingsStore.hydrateFromServer()
const appearanceStore = useAppearanceStore()
await appearanceStore.hydrateFromServer()
const homepageSettingsStore = useHomepageSettingsStore()
await homepageSettingsStore.hydrateFromServer()
// 預先載入 projects，讓「自家程式」下拉能顯示 App 列表
const { useProjectsStore } = await import('./stores/projects')
const projectsStore = useProjectsStore()
await projectsStore.fetchProjects()

// 在 app mount 前直接套用正確的 document.title 和主題色，避免首屏閃爍
if (typeof document !== 'undefined') {
  document.title = siteSettingsStore.effectiveSiteTitle()
}
appearanceStore.apply()
app.use(router)
app.use(i18n)
app.use(head)

// 等路由完成初始導航再掛載，避免重新整理或直接輸入網址時只顯示頂部 menu、內文不顯示
router.isReady().then(() => {
  app.mount('#app')
})
