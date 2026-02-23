<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import type { Locale } from '@/types'

const { currentLocale, switchLocale } = useLocale()

function toggle() {
  const next: Locale = currentLocale.value === 'zh-TW' ? 'en' : 'zh-TW'
  switchLocale(next)
}
</script>

<template>
  <button
    class="flex h-8 items-center gap-1 border border-bp-border px-2.5 text-xs text-bp-subtle transition-colors hover:border-bp-border-strong hover:text-bp-white"
    :aria-label="`Switch to ${currentLocale === 'zh-TW' ? 'English' : '中文'}`"
    @click="toggle"
  >
    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.8 3.9 6.3 4 10-.1 3.7-1.5 7.2-4 10-2.5-2.8-3.9-6.3-4-10 .1-3.7 1.5-7.2 4-10z" />
    </svg>
    <span>{{ currentLocale === 'zh-TW' ? 'EN' : '中' }}</span>
  </button>
</template>
