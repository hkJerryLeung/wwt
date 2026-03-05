import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types'
import { useSiteSettingsStore } from '@/stores/siteSettings'

export function useLocale() {
  const route = useRoute()
  const router = useRouter()
  const siteSettings = useSiteSettingsStore()
  const { locale, t } = useI18n()

  const defaultLocale = computed<Locale>(() => siteSettings.effectiveDefaultLocale())

  const currentLocale = computed<Locale>(() => {
    return (route.params.locale as Locale) || defaultLocale.value
  })

  function localizedPath(path: string): string {
    const loc = currentLocale.value
    if (loc === defaultLocale.value) return path
    return `/${loc}${path}`
  }

  function switchLocale(newLocale: Locale) {
    const currentPath = route.path
    const localePrefix = currentLocale.value === defaultLocale.value ? '' : `/${currentLocale.value}`
    const pathWithoutLocale = localePrefix
      ? currentPath.replace(localePrefix, '')
      : currentPath

    locale.value = newLocale
    const newPath = newLocale === defaultLocale.value
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
