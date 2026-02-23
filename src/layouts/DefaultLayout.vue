<script setup lang="ts">
import { computed, watchEffect, onMounted } from 'vue'
import TheNavbar from '@/components/layout/TheNavbar.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
import { useAppearanceStore } from '@/stores/appearance'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { useProjectsStore } from '@/stores/projects'

const appearanceStore = useAppearanceStore()
const siteSettingsStore = useSiteSettingsStore()
const projectsStore = useProjectsStore()
const backgroundClass = computed(() => appearanceStore.effectiveBackgroundClass())
const backgroundStyle = computed(() => appearanceStore.effectiveBackgroundStyle())

onMounted(() => {
  projectsStore.fetchProjects()
})

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
    <main class="flex-1 pt-16">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>
