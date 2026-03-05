import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'

const STORAGE_KEY = 'wwt-homepage-settings'
const SITE_CONFIG_KEY = 'homepage'

export interface HomepageSettingsState {
  heroGreeting: string
  heroName: string
  heroTagline: string
  heroDescription: string
  heroCtaExplore: string
  heroCtaPatreon: string
  categoriesTitle: string
  categoriesSubtitle: string
  catAiCoding: string
  catAiCodingDesc: string
  catAiVideo: string
  catAiVideoDesc: string
  catTools: string
  catToolsDesc: string
  catWorks: string
  catWorksDesc: string
  ctaTitle: string
  ctaDescription: string
  ctaButton: string
}

const defaultState: HomepageSettingsState = {
  heroGreeting: '',
  heroName: '',
  heroTagline: '',
  heroDescription: '',
  heroCtaExplore: '',
  heroCtaPatreon: '',
  categoriesTitle: '',
  categoriesSubtitle: '',
  catAiCoding: '',
  catAiCodingDesc: '',
  catAiVideo: '',
  catAiVideoDesc: '',
  catTools: '',
  catToolsDesc: '',
  catWorks: '',
  catWorksDesc: '',
  ctaTitle: '',
  ctaDescription: '',
  ctaButton: '',
}

const keys = Object.keys(defaultState) as (keyof HomepageSettingsState)[]


function parsePayload(value: unknown): Partial<HomepageSettingsState> {
  if (!value || typeof value !== 'object') return {}
  const p = value as Record<string, unknown>
  const out: Partial<HomepageSettingsState> = {}
  keys.forEach((k) => {
    if (typeof p[k] === 'string') out[k] = p[k] as string
  })
  return out
}

function getPayload(state: HomepageSettingsState): HomepageSettingsState {
  return { ...state }
}

export const useHomepageSettingsStore = defineStore('homepageSettings', () => {
  // ── 同步從 localStorage 還原最後儲存值（防止 FOUC）──
  const _cached = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? parsePayload(JSON.parse(raw)) : {}
    } catch { return {} }
  })()

  const isLoaded = ref(false)
  const heroGreeting = ref(_cached.heroGreeting ?? '')
  const heroName = ref(_cached.heroName ?? '')
  const heroTagline = ref(_cached.heroTagline ?? '')
  const heroDescription = ref(_cached.heroDescription ?? '')
  const heroCtaExplore = ref(_cached.heroCtaExplore ?? '')
  const heroCtaPatreon = ref(_cached.heroCtaPatreon ?? '')
  const categoriesTitle = ref(_cached.categoriesTitle ?? '')
  const categoriesSubtitle = ref(_cached.categoriesSubtitle ?? '')
  const catAiCoding = ref(_cached.catAiCoding ?? '')
  const catAiCodingDesc = ref(_cached.catAiCodingDesc ?? '')
  const catAiVideo = ref(_cached.catAiVideo ?? '')
  const catAiVideoDesc = ref(_cached.catAiVideoDesc ?? '')
  const catTools = ref(_cached.catTools ?? '')
  const catToolsDesc = ref(_cached.catToolsDesc ?? '')
  const catWorks = ref(_cached.catWorks ?? '')
  const catWorksDesc = ref(_cached.catWorksDesc ?? '')
  const ctaTitle = ref(_cached.ctaTitle ?? '')
  const ctaDescription = ref(_cached.ctaDescription ?? '')
  const ctaButton = ref(_cached.ctaButton ?? '')

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
      keys.forEach((k) => {
        const v = parsed[k]
        if (v !== undefined) {
          const refMap = {
            heroGreeting,
            heroName,
            heroTagline,
            heroDescription,
            heroCtaExplore,
            heroCtaPatreon,
            categoriesTitle,
            categoriesSubtitle,
            catAiCoding,
            catAiCodingDesc,
            catAiVideo,
            catAiVideoDesc,
            catTools,
            catToolsDesc,
            catWorks,
            catWorksDesc,
            ctaTitle,
            ctaDescription,
            ctaButton,
          }
          refMap[k].value = v
        }
      })
      const payload = getPayload({
        heroGreeting: heroGreeting.value,
        heroName: heroName.value,
        heroTagline: heroTagline.value,
        heroDescription: heroDescription.value,
        heroCtaExplore: heroCtaExplore.value,
        heroCtaPatreon: heroCtaPatreon.value,
        categoriesTitle: categoriesTitle.value,
        categoriesSubtitle: categoriesSubtitle.value,
        catAiCoding: catAiCoding.value,
        catAiCodingDesc: catAiCodingDesc.value,
        catAiVideo: catAiVideo.value,
        catAiVideoDesc: catAiVideoDesc.value,
        catTools: catTools.value,
        catToolsDesc: catToolsDesc.value,
        catWorks: catWorks.value,
        catWorksDesc: catWorksDesc.value,
        ctaTitle: ctaTitle.value,
        ctaDescription: ctaDescription.value,
        ctaButton: ctaButton.value,
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // keep current localStorage / defaults
    } finally {
      isLoaded.value = true
    }
  }

  function save() {
    const payload = getPayload({
      heroGreeting: heroGreeting.value,
      heroName: heroName.value,
      heroTagline: heroTagline.value,
      heroDescription: heroDescription.value,
      heroCtaExplore: heroCtaExplore.value,
      heroCtaPatreon: heroCtaPatreon.value,
      categoriesTitle: categoriesTitle.value,
      categoriesSubtitle: categoriesSubtitle.value,
      catAiCoding: catAiCoding.value,
      catAiCodingDesc: catAiCodingDesc.value,
      catAiVideo: catAiVideo.value,
      catAiVideoDesc: catAiVideoDesc.value,
      catTools: catTools.value,
      catToolsDesc: catToolsDesc.value,
      catWorks: catWorks.value,
      catWorksDesc: catWorksDesc.value,
      ctaTitle: ctaTitle.value,
      ctaDescription: ctaDescription.value,
      ctaButton: ctaButton.value,
    })
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
    keys.forEach((k) => {
      const refMap = {
        heroGreeting,
        heroName,
        heroTagline,
        heroDescription,
        heroCtaExplore,
        heroCtaPatreon,
        categoriesTitle,
        categoriesSubtitle,
        catAiCoding,
        catAiCodingDesc,
        catAiVideo,
        catAiVideoDesc,
        catTools,
        catToolsDesc,
        catWorks,
        catWorksDesc,
        ctaTitle,
        ctaDescription,
        ctaButton,
      }
      refMap[k].value = ''
    })
    localStorage.removeItem(STORAGE_KEY)
  }

  /** 前台顯示用：有設定則回傳 trimmed，否則空字串（元件用 i18n fallback） */
  function effective(key: keyof HomepageSettingsState): string {
    const refMap = {
      heroGreeting,
      heroName,
      heroTagline,
      heroDescription,
      heroCtaExplore,
      heroCtaPatreon,
      categoriesTitle,
      categoriesSubtitle,
      catAiCoding,
      catAiCodingDesc,
      catAiVideo,
      catAiVideoDesc,
      catTools,
      catToolsDesc,
      catWorks,
      catWorksDesc,
      ctaTitle,
      ctaDescription,
      ctaButton,
    }
    const v = refMap[key].value
    return typeof v === 'string' ? v.trim() : ''
  }

  return {
    isLoaded,
    heroGreeting,
    heroName,
    heroTagline,
    heroDescription,
    heroCtaExplore,
    heroCtaPatreon,
    categoriesTitle,
    categoriesSubtitle,
    catAiCoding,
    catAiCodingDesc,
    catAiVideo,
    catAiVideoDesc,
    catTools,
    catToolsDesc,
    catWorks,
    catWorksDesc,
    ctaTitle,
    ctaDescription,
    ctaButton,
    save,
    reset,
    hydrateFromServer,
    effective,
  }
})
