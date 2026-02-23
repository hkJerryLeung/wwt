import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { useLocale } from './useLocale'

interface SeoOptions {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function useSeo(options: SeoOptions = {}) {
  const { currentLocale } = useLocale()

  const htmlLang = computed(() =>
    currentLocale.value === 'zh-TW' ? 'zh-Hant' : 'en'
  )

  useHead({
    htmlAttrs: { lang: htmlLang },
    title: options.title ?? '',
    meta: [
      {
        name: 'description',
        content: options.description ?? '',
      },
      { property: 'og:title', content: options.title ?? '' },
      {
        property: 'og:description',
        content: options.description ?? '',
      },
      { property: 'og:image', content: options.image || '' },
      { property: 'og:url', content: options.url || '' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  })
}
