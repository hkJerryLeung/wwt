import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useLocale } from '@/composables/useLocale'

/**
 * 依後台選單設定回傳當前頁的標題與簡介（跟隨後台設定的中英文名稱與簡介）。
 * @param pageKey 選單 key，如 'lab' | 'workshop' | 'showcase' | 'premium'
 */
export function usePageHeading(pageKey: string) {
  const navStore = useFrontendNavStore()
  const { currentLocale } = useLocale()
  const { t } = useI18n()

  const item = computed(() => navStore.getItemByKey(pageKey))

  const title = computed(() => {
    const i = item.value
    if (!i) return ''
    const zh = i.customLabelZh?.trim() ?? i.customLabel?.trim()
    const en = i.customLabelEn?.trim() ?? i.customLabel?.trim()
    if (currentLocale.value === 'zh-TW') return zh || t(i.labelKey)
    return en || t(i.labelKey)
  })

  const subtitle = computed(() => {
    const i = item.value
    if (!i) return ''
    const zh = i.customSubtitleZh?.trim()
    const en = i.customSubtitleEn?.trim()
    if (currentLocale.value === 'zh-TW') return zh ?? (i.subtitleKey ? t(i.subtitleKey) : '')
    return en ?? (i.subtitleKey ? t(i.subtitleKey) : '')
  })

  return { title, subtitle }
}
