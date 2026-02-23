<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useHomepageSettingsStore } from '@/stores/homepageSettings'

const { t, localizedPath } = useLocale()
const navStore = useFrontendNavStore()
const homepage = useHomepageSettingsStore()

function heroText(key: 'heroGreeting' | 'heroName' | 'heroTagline' | 'heroDescription' | 'heroCtaExplore' | 'heroCtaPatreon', i18nKey: string): string {
  const v = homepage.effective(key)
  return v || t(i18nKey)
}
</script>

<template>
  <section class="relative overflow-hidden py-24 sm:py-32 lg:py-40">
    <!-- Blueprint decorative lines -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-20 left-10 w-32 border-t border-dashed border-bp-border-strong opacity-40" />
      <div class="absolute top-20 left-10 h-32 border-l border-dashed border-bp-border-strong opacity-40" />
      <div class="absolute bottom-20 right-10 w-32 border-b border-dashed border-bp-border-strong opacity-40" />
      <div class="absolute bottom-20 right-10 h-32 border-r border-dashed border-bp-border-strong opacity-40" />
    </div>

    <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
      <div class="relative">
        <!-- Section number -->
        <span class="bp-section-number mb-6 block">00. {{ heroText('heroGreeting', 'hero.greeting') }}</span>

        <!-- Main heading -->
        <h1 class="font-blueprint text-5xl leading-tight tracking-wide text-bp-white sm:text-6xl lg:text-7xl">
          {{ heroText('heroName', 'hero.name') }}
          <span class="block text-bp-accent">{{ heroText('heroTagline', 'hero.tagline') }}</span>
        </h1>

        <!-- Description -->
        <p class="mt-6 max-w-2xl text-base leading-relaxed text-bp-subtle sm:text-lg">
          {{ heroText('heroDescription', 'hero.description') }}
        </p>

        <!-- CTAs -->
        <div class="mt-10 flex flex-wrap gap-4">
          <router-link :to="localizedPath(navStore.getPathByKey('workshop'))" class="bp-btn-primary">
            {{ heroText('heroCtaExplore', 'hero.cta_explore') }}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </router-link>
          <router-link :to="localizedPath(navStore.getPathByKey('premium'))" class="bp-btn-accent">
            {{ heroText('heroCtaPatreon', 'hero.cta_patreon') }}
          </router-link>
        </div>

        <!-- Decorative measurement line -->
        <div class="mt-16 flex items-center gap-3 text-bp-muted">
          <div class="h-px flex-1 bg-bp-border" />
          <span class="font-blueprint text-xs">/// scroll to explore ///</span>
          <div class="h-px flex-1 bg-bp-border" />
        </div>
      </div>
    </div>
  </section>
</template>
