<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useHomepageSettingsStore } from '@/stores/homepageSettings'

const { t, localizedPath } = useLocale()
const navStore = useFrontendNavStore()
const homepage = useHomepageSettingsStore()

const categories = computed(() => [
  {
    key: 'ai_coding',
    titleKey: 'catAiCoding' as const,
    descKey: 'catAiCodingDesc' as const,
    i18nTitle: 'home.cat_ai_coding',
    i18nDesc: 'home.cat_ai_coding_desc',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />`,
    path: navStore.getPathByKey('workshop'),
    accent: 'text-bp-accent',
  },
  {
    key: 'ai_video',
    titleKey: 'catAiVideo' as const,
    descKey: 'catAiVideoDesc' as const,
    i18nTitle: 'home.cat_ai_video',
    i18nDesc: 'home.cat_ai_video_desc',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />`,
    path: navStore.getPathByKey('workshop'),
    accent: 'text-bp-success',
  },
  {
    key: 'tools',
    titleKey: 'catTools' as const,
    descKey: 'catToolsDesc' as const,
    i18nTitle: 'home.cat_tools',
    i18nDesc: 'home.cat_tools_desc',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />`,
    path: navStore.getPathByKey('lab'),
    accent: 'text-bp-warning',
  },
  {
    key: 'works',
    titleKey: 'catWorks' as const,
    descKey: 'catWorksDesc' as const,
    i18nTitle: 'home.cat_works',
    i18nDesc: 'home.cat_works_desc',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    path: navStore.getPathByKey('showcase'),
    accent: 'text-bp-error',
  },
])

function categoriesTitleText(): string {
  const v = homepage.effective('categoriesTitle')
  return v || t('home.categories_title')
}

function categoriesSubtitleText(): string {
  const v = homepage.effective('categoriesSubtitle')
  return v || t('home.categories_subtitle')
}

function catTitle(cat: (typeof categories.value)[0]): string {
  const v = homepage.effective(cat.titleKey)
  return v || t(cat.i18nTitle)
}

function catDesc(cat: (typeof categories.value)[0]): string {
  const v = homepage.effective(cat.descKey)
  return v || t(cat.i18nDesc)
}
</script>

<template>
  <section class="py-20 sm:py-28">
    <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
      <!-- Section header -->
      <div class="mb-12">
        <span class="bp-section-number mb-3 block">01.</span>
        <h2 class="font-blueprint text-3xl tracking-wide text-bp-white sm:text-4xl">
          {{ categoriesTitleText() }}
        </h2>
        <p class="mt-3 text-bp-subtle">{{ categoriesSubtitleText() }}</p>
      </div>

      <!-- Cards grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <router-link
          v-for="cat in categories"
          :key="cat.key"
          :to="localizedPath(cat.path)"
          class="bp-card group relative p-6 transition-all duration-200"
        >
          <!-- Corner marks -->
          <div class="bp-corner-marks absolute inset-0" />

          <!-- Icon -->
          <div class="mb-4">
            <svg
              class="h-8 w-8 transition-colors"
              :class="cat.accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              v-html="cat.icon"
            />
          </div>

          <!-- Title -->
          <h3 class="mb-2 font-sans text-base font-semibold text-bp-white">
            {{ catTitle(cat) }}
          </h3>

          <!-- Description -->
          <p class="text-sm leading-relaxed text-bp-muted">
            {{ catDesc(cat) }}
          </p>

          <!-- Arrow indicator -->
          <div class="mt-4 flex items-center gap-1 text-xs text-bp-muted transition-colors group-hover:text-bp-accent">
            <span class="font-blueprint">→</span>
          </div>
        </router-link>
      </div>
    </div>
  </section>
</template>
