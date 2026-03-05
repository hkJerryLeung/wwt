import { createI18n } from 'vue-i18n'
import zhTW from '@/i18n/zh-TW.json'
import en from '@/i18n/en.json'

function getStoredLocale(): 'zh-TW' | 'en' {
  try {
    const raw = localStorage.getItem('wwt-site-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.defaultLocale === 'en') return 'en'
    }
  } catch { /* ignore */ }
  return 'zh-TW'
}

export const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'en',
  messages: {
    'zh-TW': zhTW,
    en,
  },
})
