import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'

const STORAGE_KEY = 'wwt-site-settings'
const SITE_CONFIG_KEY = 'site_settings'

export interface SiteSettingsState {
  siteTitle: string
  siteDescription: string
}


function parsePayload(value: unknown): Partial<SiteSettingsState> {
  if (!value || typeof value !== 'object') return {}
  const p = value as Record<string, unknown>
  return {
    siteTitle: typeof p.siteTitle === 'string' ? p.siteTitle : undefined,
    siteDescription: typeof p.siteDescription === 'string' ? p.siteDescription : undefined,
  }
}

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  const isLoaded = ref(false)
  const siteTitle = ref('')
  const siteDescription = ref('')

  /** 從 Supabase 載入設定，供 app 啟動時呼叫以首屏顯示正確內容 */
  async function hydrateFromServer() {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', SITE_CONFIG_KEY)
        .maybeSingle()
      if (error || !data?.value) return
      const parsed = parsePayload(data.value)
      if (parsed.siteTitle !== undefined) siteTitle.value = parsed.siteTitle
      if (parsed.siteDescription !== undefined) siteDescription.value = parsed.siteDescription
      const payload: SiteSettingsState = {
        siteTitle: siteTitle.value,
        siteDescription: siteDescription.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // keep current localStorage / defaults
    } finally {
      isLoaded.value = true
    }
  }

  function save() {
    const payload: SiteSettingsState = {
      siteTitle: siteTitle.value,
      siteDescription: siteDescription.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    try {
      supabase
        .from('site_config')
        .upsert(
          { key: SITE_CONFIG_KEY, value: payload, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        .then(() => { })
    } catch {
      // ignore; localStorage already saved
    }
  }

  function reset() {
    siteTitle.value = ''
    siteDescription.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  /** 前台使用的網站標題（空則用預設） */
  function effectiveSiteTitle(): string {
    const t = siteTitle.value?.trim()
    return t || "WHAT'S THAT"
  }

  /** 前台使用的網站簡介（空則用 i18n 預設） */
  function effectiveSiteDescription(): string {
    return siteDescription.value?.trim() ?? ''
  }

  return {
    isLoaded,
    siteTitle,
    siteDescription,
    save,
    reset,
    hydrateFromServer,
    effectiveSiteTitle,
    effectiveSiteDescription,
  }
})
