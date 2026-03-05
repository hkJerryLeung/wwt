import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'

const STORAGE_KEY = 'wwt-site-settings'
const SITE_CONFIG_KEY = 'site_settings'

export type SiteLocale = 'zh-TW' | 'en'

export interface SiteSettingsState {
  siteTitle: string
  siteDescription: string
  defaultLocale: SiteLocale
}


const VALID_LOCALES: SiteLocale[] = ['zh-TW', 'en']

function parsePayload(value: unknown): Partial<SiteSettingsState> {
  if (!value || typeof value !== 'object') return {}
  const p = value as Record<string, unknown>
  return {
    siteTitle: typeof p.siteTitle === 'string' ? p.siteTitle : undefined,
    siteDescription: typeof p.siteDescription === 'string' ? p.siteDescription : undefined,
    defaultLocale: typeof p.defaultLocale === 'string' && VALID_LOCALES.includes(p.defaultLocale as SiteLocale)
      ? (p.defaultLocale as SiteLocale)
      : undefined,
  }
}

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  // ── 同步從 localStorage 還原最後儲存值（防止 FOUC）──
  const _cached = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? parsePayload(JSON.parse(raw)) : {}
    } catch { return {} }
  })()

  const isLoaded = ref(false)
  const siteTitle = ref(_cached.siteTitle ?? '')
  const siteDescription = ref(_cached.siteDescription ?? '')
  const defaultLocale = ref<SiteLocale>(_cached.defaultLocale ?? 'zh-TW')

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
      if (parsed.defaultLocale !== undefined) defaultLocale.value = parsed.defaultLocale
      const payload: SiteSettingsState = {
        siteTitle: siteTitle.value,
        siteDescription: siteDescription.value,
        defaultLocale: defaultLocale.value,
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
      defaultLocale: defaultLocale.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    Promise.resolve(
      supabase
        .from('site_config')
        .upsert(
          { key: SITE_CONFIG_KEY, value: payload, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
    ).catch(() => { /* ignore; localStorage already saved */ })
  }

  function reset() {
    siteTitle.value = ''
    siteDescription.value = ''
    defaultLocale.value = 'zh-TW'
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

  /** 前台使用的預設語言 */
  function effectiveDefaultLocale(): SiteLocale {
    return defaultLocale.value || 'zh-TW'
  }

  return {
    isLoaded,
    siteTitle,
    siteDescription,
    defaultLocale,
    save,
    reset,
    hydrateFromServer,
    effectiveSiteTitle,
    effectiveSiteDescription,
    effectiveDefaultLocale,
  }
})
