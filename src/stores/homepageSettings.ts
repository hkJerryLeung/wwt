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
  const isLoaded = ref(false)
  const heroGreeting = ref('')
  const heroName = ref('')
  const heroTagline = ref('')
  const heroDescription = ref('')
  const heroCtaExplore = ref('')
  const heroCtaPatreon = ref('')
  const categoriesTitle = ref('')
  const categoriesSubtitle = ref('')
  const catAiCoding = ref('')
  const catAiCodingDesc = ref('')
  const catAiVideo = ref('')
  const catAiVideoDesc = ref('')
  const catTools = ref('')
  const catToolsDesc = ref('')
  const catWorks = ref('')
  const catWorksDesc = ref('')
  const ctaTitle = ref('')
  const ctaDescription = ref('')
  const ctaButton = ref('')

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
