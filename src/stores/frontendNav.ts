import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/plugins/supabase'

const STORAGE_KEY = 'wwt-frontend-nav'
const SITE_CONFIG_KEY_NAV = 'frontend_nav'

export interface FrontendNavItem {
  id: string
  key: string
  path: string
  labelKey: string
  /** i18n key 用於頁面簡介預設文案（如 lab.subtitle） */
  subtitleKey?: string
  /** 單一自訂名稱（舊版，兩語系共用） */
  customLabel?: string
  /** 中文選單名稱（後台設定） */
  customLabelZh?: string
  /** 英文選單名稱（後台設定） */
  customLabelEn?: string
  /** 中文頁面簡介（後台設定） */
  customSubtitleZh?: string
  /** 英文頁面簡介（後台設定） */
  customSubtitleEn?: string
  /** 是否父選單：勾選時此項不帶連結，僅 hover 顯示下拉子選單 */
  isParentMenu?: boolean
  order: number
  hidden: boolean
}

/** 自家程式：下拉選單，主連結到 /apps，子項為各 App */
const defaultItems: FrontendNavItem[] = [
  { id: 'explore', key: 'explore', path: '/', labelKey: 'nav.explore', order: 0, hidden: false },
  { id: 'workshop', key: 'workshop', path: '/workshop', labelKey: 'nav.workshop', subtitleKey: 'workshop.subtitle', order: 1, hidden: false },
  { id: 'showcase', key: 'showcase', path: '/showcase', labelKey: 'nav.showcase', subtitleKey: 'showcase.subtitle', order: 2, hidden: false },
  { id: 'apps', key: 'apps', path: '/apps', labelKey: 'nav.apps', subtitleKey: 'apps.subtitle', order: 3, hidden: false, isParentMenu: true },
  { id: 'premium', key: 'premium', path: '/premium', labelKey: 'nav.premium', subtitleKey: 'premium.subtitle', order: 4, hidden: false },
]

function mergeParsedItems(parsed: unknown): FrontendNavItem[] {
  if (!Array.isArray(parsed) || parsed.length === 0) return defaultItems.map((item) => ({ ...item }))
  const byId = new Map<string, FrontendNavItem>()
  parsed.forEach((item: Record<string, unknown>) => {
    const base = defaultItems.find((d) => d.id === item.id)
    const merged: FrontendNavItem = base
      ? {
        ...base,
        ...item,
        id: (item.id as string) ?? base.id,
        key: (item.key as string) ?? base.key,
        path: (((item.path as string) ?? base.path) ?? '/').trim() || '/',
        isParentMenu: item.isParentMenu !== undefined ? Boolean(item.isParentMenu) : base.isParentMenu,
      } as FrontendNavItem
      : {
        id: (item.id as string) ?? '',
        key: (item.key as string) ?? (item.id as string) ?? '',
        path: ((item.path as string) || '/').trim() || '/',
        labelKey: (item.labelKey as string) || '',
        customLabel: item.customLabel as string | undefined,
        customLabelZh: item.customLabelZh as string | undefined,
        customLabelEn: item.customLabelEn as string | undefined,
        customSubtitleZh: item.customSubtitleZh as string | undefined,
        customSubtitleEn: item.customSubtitleEn as string | undefined,
        subtitleKey: item.subtitleKey as string | undefined,
        isParentMenu: Boolean(item.isParentMenu),
        order: Number(item.order) ?? 0,
        hidden: Boolean(item.hidden),
      }
    byId.set(merged.id, merged)
  })
  return Array.from(byId.values()).sort((a, b) => a.order - b.order)
}


function saveToStorage(items: FrontendNavItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

async function saveToSupabase(items: FrontendNavItem[]) {
  try {
    await supabase
      .from('site_config')
      .upsert(
        { key: SITE_CONFIG_KEY_NAV, value: items, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
  } catch {
    // ignore; localStorage already saved
  }
}

export const useFrontendNavStore = defineStore('frontendNav', () => {
  const isLoaded = ref(false)
  const items = ref<FrontendNavItem[]>([])

  const visibleItems = computed(() =>
    items.value.filter((i) => !i.hidden).sort((a, b) => a.order - b.order)
  )

  /** 依 key 取得後台設定的路徑（供站內連結使用，路徑跟隨後台） */
  function getPathByKey(key: string): string {
    const item = items.value.find((i) => i.key === key || i.id === key)
    return item?.path ?? defaultItems.find((d) => d.key === key)?.path ?? '/'
  }

  /** 依 key 取得選單項目（供頁面標題／簡介顯示） */
  function getItemByKey(key: string): FrontendNavItem | undefined {
    const item = items.value.find((i) => i.key === key || i.id === key)
    if (item) return item
    return defaultItems.find((d) => d.key === key)
  }

  function persist() {
    saveToStorage(items.value)
    saveToSupabase(items.value)
  }

  /** 從 Supabase 載入選單並寫入 localStorage，供 app 啟動時呼叫以永久儲存同步 */
  async function hydrateFromServer() {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', SITE_CONFIG_KEY_NAV)
        .maybeSingle()
      if (error || !data?.value) {
        // 若 Supabase 無資料，使用 defaultItems 作為 fallback
        items.value = defaultItems.map((item) => ({ ...item }))
        return
      }
      const parsed = data.value as unknown
      const merged = mergeParsedItems(parsed)
      items.value = merged
      saveToStorage(merged)
    } catch {
      // fallback to defaults if Supabase fails
      items.value = defaultItems.map((item) => ({ ...item }))
    } finally {
      isLoaded.value = true
    }
  }

  function updateLabel(id: string, customLabel: string | undefined) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.customLabel = customLabel || undefined
      persist()
    }
  }

  function updateLabelZh(id: string, value: string | undefined) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.customLabelZh = value?.trim() || undefined
      persist()
    }
  }

  function updateLabelEn(id: string, value: string | undefined) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.customLabelEn = value?.trim() || undefined
      persist()
    }
  }

  function updateSubtitleZh(id: string, value: string | undefined) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.customSubtitleZh = value?.trim() || undefined
      persist()
    }
  }

  function updateSubtitleEn(id: string, value: string | undefined) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.customSubtitleEn = value?.trim() || undefined
      persist()
    }
  }

  function updatePath(id: string, path: string) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.path = path?.trim() || '/'
      persist()
    }
  }

  function updateIsParentMenu(id: string, isParentMenu: boolean) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.isParentMenu = isParentMenu
      persist()
    }
  }

  function moveUp(id: string) {
    const byOrder = [...items.value].sort((a, b) => a.order - b.order)
    const itemIdx = byOrder.findIndex((i) => i.id === id)
    const prev = byOrder[itemIdx - 1]
    const curr = byOrder[itemIdx]
    if (itemIdx <= 0 || !prev || !curr) return
      ;[prev.order, curr.order] = [curr.order, prev.order]
    byOrder.forEach((i) => {
      const found = items.value.find((x) => x.id === i.id)
      if (found) found.order = i.order
    })
    persist()
  }

  function moveDown(id: string) {
    const byOrder = [...items.value].sort((a, b) => a.order - b.order)
    const itemIdx = byOrder.findIndex((i) => i.id === id)
    const curr = byOrder[itemIdx]
    const next = byOrder[itemIdx + 1]
    if (itemIdx < 0 || itemIdx >= byOrder.length - 1 || !curr || !next) return
      ;[curr.order, next.order] = [next.order, curr.order]
    byOrder.forEach((i) => {
      const found = items.value.find((x) => x.id === i.id)
      if (found) found.order = i.order
    })
    persist()
  }

  function setHidden(id: string, hidden: boolean) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.hidden = hidden
      persist()
    }
  }

  function remove(id: string) {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    items.value.splice(idx, 1)
    persist()
  }

  function add(item: {
    key: string
    path: string
    customLabel?: string
    customLabelZh?: string
    customLabelEn?: string
    customSubtitleZh?: string
    customSubtitleEn?: string
  }) {
    const maxOrder = Math.max(-1, ...items.value.map((i) => i.order))
    const id = item.key.startsWith('custom-') ? item.key : `custom-${Date.now()}`
    const newItem: FrontendNavItem = {
      id,
      key: item.key,
      path: item.path || '/',
      labelKey: '',
      customLabel: item.customLabel ?? '',
      customLabelZh: item.customLabelZh,
      customLabelEn: item.customLabelEn,
      customSubtitleZh: item.customSubtitleZh,
      customSubtitleEn: item.customSubtitleEn,
      isParentMenu: false,
      order: maxOrder + 1,
      hidden: false,
    }
    items.value.push(newItem)
    persist()
  }

  function resetToDefaults() {
    items.value = defaultItems.map((i) => ({ ...i }))
    persist()
  }

  return {
    isLoaded,
    items: computed(() => [...items.value].sort((a, b) => a.order - b.order)),
    visibleItems,
    getPathByKey,
    getItemByKey,
    hydrateFromServer,
    updateLabel,
    updateLabelZh,
    updateLabelEn,
    updateSubtitleZh,
    updateSubtitleEn,
    updatePath,
    updateIsParentMenu,
    moveUp,
    moveDown,
    setHidden,
    remove,
    add,
    resetToDefaults,
  }
})
