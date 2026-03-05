import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { router } from './router'
import { i18n } from './plugins/i18n'
import './styles/main.css'

// Supabase's internal navigator lock throws AbortError during Vite HMR
// when the module is re-evaluated. Suppress it.
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError') {
    event.preventDefault()
  }
})

const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(head)

// ── Mount the app IMMEDIATELY ──
// See docs/supabase-cross-browser.md §6.
// The app must mount before any async work to avoid a blank screen if
// any promise hangs (e.g. Supabase auth in non-Chrome browsers).
// Stores will reactively update the UI as data arrives.
router.isReady().then(() => {
  app.mount('#app')
})

// ── Hydrate stores in the background ──
// Dynamic routes are already registered synchronously from localStorage
// in router/index.ts (see docs/supabase-cross-browser.md §5).
async function hydrateStores() {
  try {
    const { useFrontendNavStore } = await import('./stores/frontendNav')
    const navStore = useFrontendNavStore()
    await navStore.hydrateFromServer()

    const [
      { useSiteSettingsStore },
      { useAppearanceStore },
      { useHomepageSettingsStore },
    ] = await Promise.all([
      import('./stores/siteSettings'),
      import('./stores/appearance'),
      import('./stores/homepageSettings'),
    ])

    const siteSettingsStore = useSiteSettingsStore()
    const appearanceStore = useAppearanceStore()
    const homepageSettingsStore = useHomepageSettingsStore()

    await Promise.all([
      siteSettingsStore.hydrateFromServer(),
      appearanceStore.hydrateFromServer(),
      homepageSettingsStore.hydrateFromServer(),
    ])

    if (typeof document !== 'undefined') {
      document.title = siteSettingsStore.effectiveSiteTitle()
    }
    appearanceStore.apply()

    const { useProjectsStore } = await import('./stores/projects')
    const projectsStore = useProjectsStore()
    await projectsStore.fetchProjects()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      // HMR-related, harmless
    } else {
      console.error('[WWT] Store hydration error:', e)
    }
  }
}

async function initAuth() {
  try {
    const { useAuthStore } = await import('./stores/auth')
    const authStore = useAuthStore()
    await authStore.initialize()
  } catch (e) {
    if (!(e instanceof DOMException && e.name === 'AbortError')) {
      console.error('[WWT] Auth init error:', e)
    }
  }
}

// Fire both in parallel — neither blocks the app from rendering
hydrateStores()
initAuth()
