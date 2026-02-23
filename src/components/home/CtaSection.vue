<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useHomepageSettingsStore } from '@/stores/homepageSettings'

const { t, localizedPath } = useLocale()
const navStore = useFrontendNavStore()
const homepage = useHomepageSettingsStore()

function ctaText(key: 'ctaTitle' | 'ctaDescription' | 'ctaButton', i18nKey: string): string {
  const v = homepage.effective(key)
  return v || t(i18nKey)
}
</script>

<template>
  <section class="py-20 sm:py-28">
    <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
      <div class="relative border border-bp-border-strong bg-bp-surface p-10 sm:p-16 text-center">
        <!-- Corner decorations -->
        <div class="bp-corner-marks absolute inset-0" />

        <!-- Blueprint measurement marks -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
          <span class="bg-bp-primary px-3 font-blueprint text-[10px] tracking-widest text-bp-muted">
            03. PREMIUM
          </span>
        </div>

        <h2 class="font-blueprint text-2xl tracking-wide text-bp-white sm:text-3xl">
          {{ ctaText('ctaTitle', 'home.cta_title') }}
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-bp-subtle">
          {{ ctaText('ctaDescription', 'home.cta_description') }}
        </p>
        <div class="mt-8">
          <router-link :to="localizedPath(navStore.getPathByKey('premium'))" class="bp-btn-accent">
            {{ ctaText('ctaButton', 'home.cta_button') }}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>
