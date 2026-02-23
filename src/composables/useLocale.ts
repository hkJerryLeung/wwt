import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types'

export function useLocale() {
  const route = useRoute()
  const router = useRouter()
  const { locale, t } = useI18n()

  const currentLocale = computed<Locale>(() => {
    return (route.params.locale as Locale) || 'zh-TW'
  })

  function localizedPath(path: string): string {
    const loc = currentLocale.value
    if (loc === 'zh-TW') return path
    return `/${loc}${path}`
  }

  function switchLocale(newLocale: Locale) {
    const currentPath = route.path
    const localePrefix = currentLocale.value === 'zh-TW' ? '' : `/${currentLocale.value}`
    const pathWithoutLocale = localePrefix
      ? currentPath.replace(localePrefix, '')
      : currentPath

    locale.value = newLocale
    const newPath = newLocale === 'zh-TW'
      ? pathWithoutLocale || '/'
      : `/${newLocale}${pathWithoutLocale || '/'}`

    router.push(newPath)
  }

  function localizedField<T>(zhValue: T, enValue: T): T {
    return currentLocale.value === 'zh-TW' ? zhValue : enValue
  }

  return {
    currentLocale,
    localizedPath,
    switchLocale,
    localizedField,
    t,
  }
}
