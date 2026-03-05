<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import TheNavbar from '@/components/layout/TheNavbar.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
import { useAppearanceStore } from '@/stores/appearance'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const appearanceStore = useAppearanceStore()
const siteSettingsStore = useSiteSettingsStore()
const backgroundClass = computed(() => appearanceStore.effectiveBackgroundClass())
const backgroundStyle = computed(() => appearanceStore.effectiveBackgroundStyle())

// Projects 由 main.ts hydrateStores 與 TheNavbar 負責載入，不在此重複呼叫

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.title = siteSettingsStore.effectiveSiteTitle()
  }
})
</script>

<template>
  <div
    class="flex min-h-screen flex-col"
    :class="backgroundClass"
    :style="Object.keys(backgroundStyle).length ? backgroundStyle : undefined"
  >
    <TheNavbar />
    <main class="flex-1 pt-[98px]">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>
