import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'

const STORAGE_KEY = 'wwt-appearance'
const SITE_CONFIG_KEY = 'appearance'

const DEFAULT_ACCENT = '#990011'
const DEFAULT_ACCENT_BRIGHT = '#c60118'

export type GridStyle = 'none' | 'normal' | 'dense'
export type BackgroundType = 'grid' | 'solid' | 'image'

export interface AppearanceState {
  accentColor: string
  logoUrl: string
  siteName: string
  gridStyle: GridStyle
  backgroundType: BackgroundType
  backgroundColor: string
  backgroundImageUrl: string
}


function parsePayload(value: unknown): Partial<AppearanceState> {
  if (!value || typeof value !== 'object') return {}
  const p = value as Record<string, unknown>
  const grid = p.gridStyle as string
  const validGrid = grid === 'none' || grid === 'normal' || grid === 'dense' ? grid : undefined
  const bgType = p.backgroundType as string
  const validBgType = bgType === 'grid' || bgType === 'solid' || bgType === 'image' ? bgType : undefined
  return {
    accentColor: typeof p.accentColor === 'string' ? p.accentColor : undefined,
    logoUrl: typeof p.logoUrl === 'string' ? p.logoUrl : undefined,
    siteName: typeof p.siteName === 'string' ? p.siteName : undefined,
    gridStyle: validGrid,
    backgroundType: validBgType,
    backgroundColor: typeof p.backgroundColor === 'string' ? p.backgroundColor : undefined,
    backgroundImageUrl: typeof p.backgroundImageUrl === 'string' ? p.backgroundImageUrl : undefined,
  }
}

/** 將 hex 調亮約 1.3 倍（用於 accent-bright） */
function brightenHex(hex: string, factor = 1.3): string {
  const m = hex.replace(/^#/, '').match(/.{2}/g)
  if (!m || m.length !== 3) return DEFAULT_ACCENT_BRIGHT
  const r = Math.min(255, Math.round(parseInt(m[0] ?? '0', 16) * factor))
  const g = Math.min(255, Math.round(parseInt(m[1] ?? '0', 16) * factor))
  const b = Math.min(255, Math.round(parseInt(m[2] ?? '0', 16) * factor))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function applyAccentToDocument(accent: string) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--color-bp-accent', accent)
  root.style.setProperty('--color-bp-accent-bright', brightenHex(accent))
}

export const useAppearanceStore = defineStore('appearance', () => {
  const isLoaded = ref(false)
  const accentColor = ref('')
  const logoUrl = ref('')
  const siteName = ref('')
  const gridStyle = ref<GridStyle>('normal')
  const backgroundType = ref<BackgroundType>('grid')
  const backgroundColor = ref('')
  const backgroundImageUrl = ref('')

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
      if (parsed.accentColor !== undefined) accentColor.value = parsed.accentColor
      if (parsed.logoUrl !== undefined) logoUrl.value = parsed.logoUrl
      if (parsed.siteName !== undefined) siteName.value = parsed.siteName
      if (parsed.gridStyle !== undefined) gridStyle.value = parsed.gridStyle
      if (parsed.backgroundType !== undefined) backgroundType.value = parsed.backgroundType
      if (parsed.backgroundColor !== undefined) backgroundColor.value = parsed.backgroundColor
      if (parsed.backgroundImageUrl !== undefined) backgroundImageUrl.value = parsed.backgroundImageUrl
      const payload: AppearanceState = {
        accentColor: accentColor.value,
        logoUrl: logoUrl.value,
        siteName: siteName.value,
        gridStyle: gridStyle.value,
        backgroundType: backgroundType.value,
        backgroundColor: backgroundColor.value,
        backgroundImageUrl: backgroundImageUrl.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      apply()
    } catch {
      // keep current localStorage / defaults
    } finally {
      isLoaded.value = true
    }
  }

  function save() {
    const payload: AppearanceState = {
      accentColor: accentColor.value,
      logoUrl: logoUrl.value,
      siteName: siteName.value,
      gridStyle: gridStyle.value,
      backgroundType: backgroundType.value,
      backgroundColor: backgroundColor.value,
      backgroundImageUrl: backgroundImageUrl.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    apply()
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

  function apply() {
    const accent = accentColor.value || DEFAULT_ACCENT
    applyAccentToDocument(accent)
  }

  function reset() {
    accentColor.value = ''
    logoUrl.value = ''
    siteName.value = ''
    gridStyle.value = 'normal'
    backgroundType.value = 'grid'
    backgroundColor.value = ''
    backgroundImageUrl.value = ''
    localStorage.removeItem(STORAGE_KEY)
    applyAccentToDocument(DEFAULT_ACCENT)
  }

  /** 前台背景：網格時回傳對應 class，否則空字串 */
  function effectiveBackgroundClass(): string {
    if (backgroundType.value !== 'grid') return ''
    if (gridStyle.value === 'none') return ''
    if (gridStyle.value === 'dense') return 'bp-grid-bg-dense'
    return 'bp-grid-bg'
  }

  /** 前台背景：純色或圖片時回傳 style 物件 */
  function effectiveBackgroundStyle(): Record<string, string> {
    if (backgroundType.value === 'solid') {
      const color = backgroundColor.value?.trim() || '#101010'
      return { backgroundColor: color }
    }
    if (backgroundType.value === 'image' && backgroundImageUrl.value?.trim()) {
      const url = backgroundImageUrl.value.trim()
      return {
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    }
    return {}
  }

  /** 前台實際使用的 Logo URL（空則用預設） */
  function effectiveLogoUrl(): string {
    const u = logoUrl.value?.trim()
    return u || '/logo.png'
  }

  /** 前台實際使用的網站名稱（空則用預設 alt） */
  function effectiveSiteName(): string {
    const n = siteName.value?.trim()
    return n || "WHAT'S THAT"
  }

  // 進入頁面時套用已儲存的主題
  apply()

  return {
    isLoaded,
    accentColor,
    logoUrl,
    siteName,
    gridStyle,
    backgroundType,
    backgroundColor,
    backgroundImageUrl,
    save,
    apply,
    reset,
    hydrateFromServer,
    effectiveLogoUrl,
    effectiveSiteName,
    effectiveBackgroundClass,
    effectiveBackgroundStyle,
  }
})
