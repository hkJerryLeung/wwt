import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { supabase } from '@/plugins/supabase'

const STORAGE_KEY = 'wwt-premium-settings'
const SITE_CONFIG_KEY = 'premium'

export interface PremiumSettingsState {
    heroSubtitle: string
    heroTitle: string
    heroDescription: string
    heroPrice: string
    heroPriceUnit: string
    heroBadge: string
    heroTag1: string
    heroTag2: string
    heroTag3: string
    heroTag4: string
    heroQuote: string
    heroButtonText: string
    heroBgImage: string
    // 簡介區
    introHeadline: string
    introDescription: string
    introMediaUrl: string
    // 目標對象區
    audienceTitle: string
    audience1Title: string
    audience1Desc: string
    audience2Title: string
    audience2Desc: string
    audience3Title: string
    audience3Desc: string
    audience4Title: string
    audience4Desc: string
}

const defaultState: PremiumSettingsState = {
    heroSubtitle: '',
    heroTitle: '',
    heroDescription: '',
    heroPrice: '',
    heroPriceUnit: '',
    heroBadge: '',
    heroTag1: '',
    heroTag2: '',
    heroTag3: '',
    heroTag4: '',
    heroQuote: '',
    heroButtonText: '',
    heroBgImage: '',
    // 簡介區
    introHeadline: '',
    introDescription: '',
    introMediaUrl: '',
    // 目標對象區
    audienceTitle: '',
    audience1Title: '',
    audience1Desc: '',
    audience2Title: '',
    audience2Desc: '',
    audience3Title: '',
    audience3Desc: '',
    audience4Title: '',
    audience4Desc: '',
}

const keys = Object.keys(defaultState) as (keyof PremiumSettingsState)[]

function parsePayload(value: unknown): Partial<PremiumSettingsState> {
    if (!value || typeof value !== 'object') return {}
    const p = value as Record<string, unknown>
    const out: Partial<PremiumSettingsState> = {}
    keys.forEach((k) => {
        if (typeof p[k] === 'string') out[k] = p[k] as string
    })
    return out
}

function getPayload(state: PremiumSettingsState): PremiumSettingsState {
    return { ...state }
}

export const usePremiumSettingsStore = defineStore('premiumSettings', () => {
    // ── 同步從 localStorage 還原最後儲存值（防止 FOUC）──
    const _cached = (() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            return raw ? parsePayload(JSON.parse(raw)) : {}
        } catch { return {} }
    })()

    const isLoaded = ref(false)
    const heroSubtitle = ref(_cached.heroSubtitle ?? '')
    const heroTitle = ref(_cached.heroTitle ?? '')
    const heroDescription = ref(_cached.heroDescription ?? '')
    const heroPrice = ref(_cached.heroPrice ?? '')
    const heroPriceUnit = ref(_cached.heroPriceUnit ?? '')
    const heroBadge = ref(_cached.heroBadge ?? '')
    const heroTag1 = ref(_cached.heroTag1 ?? '')
    const heroTag2 = ref(_cached.heroTag2 ?? '')
    const heroTag3 = ref(_cached.heroTag3 ?? '')
    const heroTag4 = ref(_cached.heroTag4 ?? '')
    const heroQuote = ref(_cached.heroQuote ?? '')
    const heroButtonText = ref(_cached.heroButtonText ?? '')
    const heroBgImage = ref(_cached.heroBgImage ?? '')
    // 簡介區
    const introHeadline = ref(_cached.introHeadline ?? '')
    const introDescription = ref(_cached.introDescription ?? '')
    const introMediaUrl = ref(_cached.introMediaUrl ?? '')
    // 目標對象區
    const audienceTitle = ref(_cached.audienceTitle ?? '')
    const audience1Title = ref(_cached.audience1Title ?? '')
    const audience1Desc = ref(_cached.audience1Desc ?? '')
    const audience2Title = ref(_cached.audience2Title ?? '')
    const audience2Desc = ref(_cached.audience2Desc ?? '')
    const audience3Title = ref(_cached.audience3Title ?? '')
    const audience3Desc = ref(_cached.audience3Desc ?? '')
    const audience4Title = ref(_cached.audience4Title ?? '')
    const audience4Desc = ref(_cached.audience4Desc ?? '')

    const refMap: Record<keyof PremiumSettingsState, Ref<string>> = {
        heroSubtitle,
        heroTitle,
        heroDescription,
        heroPrice,
        heroPriceUnit,
        heroBadge,
        heroTag1,
        heroTag2,
        heroTag3,
        heroTag4,
        heroQuote,
        heroButtonText,
        heroBgImage,
        introHeadline,
        introDescription,
        introMediaUrl,
        audienceTitle,
        audience1Title,
        audience1Desc,
        audience2Title,
        audience2Desc,
        audience3Title,
        audience3Desc,
        audience4Title,
        audience4Desc,
    }

    function _snapshot(): PremiumSettingsState {
        const out = {} as PremiumSettingsState
        keys.forEach((k) => { out[k] = refMap[k].value })
        return out
    }

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
                if (v !== undefined) refMap[k].value = v
            })
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_snapshot()))
        } catch {
            // keep current localStorage / defaults
        } finally {
            isLoaded.value = true
        }
    }

    function save() {
        const payload = getPayload(_snapshot())
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
        keys.forEach((k) => { refMap[k].value = '' })
        localStorage.removeItem(STORAGE_KEY)
    }

    /** 前台顯示用：有設定則回傳 trimmed，否則空字串（元件用 fallback） */
    function effective(key: keyof PremiumSettingsState): string {
        const v = refMap[key].value
        return typeof v === 'string' ? v.trim() : ''
    }

    return {
        isLoaded,
        heroSubtitle,
        heroTitle,
        heroDescription,
        heroPrice,
        heroPriceUnit,
        heroBadge,
        heroTag1,
        heroTag2,
        heroTag3,
        heroTag4,
        heroQuote,
        heroButtonText,
        heroBgImage,
        introHeadline,
        introDescription,
        introMediaUrl,
        audienceTitle,
        audience1Title,
        audience1Desc,
        audience2Title,
        audience2Desc,
        audience3Title,
        audience3Desc,
        audience4Title,
        audience4Desc,
        save,
        reset,
        hydrateFromServer,
        effective,
    }
})
