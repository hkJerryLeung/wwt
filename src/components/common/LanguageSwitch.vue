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
    class="flex h-[32px] w-[32px] items-center justify-center rounded-[3px] bg-white text-[14px] font-bold text-black transition-opacity hover:opacity-80"
    :aria-label="`Switch to ${currentLocale === 'zh-TW' ? 'English' : '中文'}`"
    @click="toggle"
  >
    <span>{{ currentLocale === 'zh-TW' ? 'En' : '中' }}</span>
  </button>
</template>
