<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useAppearanceStore } from '@/stores/appearance'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const { t, localizedPath } = useLocale()
const navStore = useFrontendNavStore()
const appearanceStore = useAppearanceStore()
const siteSettingsStore = useSiteSettingsStore()
const year = new Date().getFullYear()

const footerDescription = computed(() =>
  siteSettingsStore.effectiveSiteDescription() || t('footer.description')
)

const navLinks = computed(() => [
  { key: 'explore', path: navStore.getPathByKey('explore') },
  { key: 'workshop', path: navStore.getPathByKey('workshop') },
  { key: 'showcase', path: navStore.getPathByKey('showcase') },
  { key: 'apps', path: navStore.getPathByKey('apps') },
  { key: 'premium', path: navStore.getPathByKey('premium') },
])
</script>

<template>
  <footer class="bp-line-top bg-bp-deep">
    <div class="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
      <div class="grid grid-cols-1 gap-10 md:grid-cols-4">
        <!-- Brand -->
        <div class="md:col-span-2">
          <img
            :src="appearanceStore.effectiveLogoUrl()"
            :alt="appearanceStore.effectiveSiteName()"
            class="h-8 w-auto max-w-[160px] object-contain opacity-90"
          />
          <p class="mt-3 max-w-md text-sm leading-relaxed text-bp-subtle">
            {{ footerDescription }}
          </p>
        </div>

        <!-- Navigation -->
        <div>
          <h4 class="bp-section-number mb-4">{{ t('footer.navigation') }}</h4>
          <ul class="space-y-2">
            <li v-for="link in navLinks" :key="link.key">
              <router-link
                :to="localizedPath(link.path)"
                class="text-sm text-bp-subtle transition-colors hover:text-bp-accent"
              >
                {{ t(`nav.${link.key}`) }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Connect -->
        <div>
          <h4 class="bp-section-number mb-4">{{ t('footer.connect') }}</h4>
          <ul class="space-y-2">
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-bp-subtle transition-colors hover:text-bp-accent"
              >
                {{ t('footer.github') }}
              </a>
            </li>
            <li>
              <a
                href="https://patreon.com"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-bp-subtle transition-colors hover:text-bp-accent"
              >
                {{ t('footer.patreon') }}
              </a>
            </li>
            <li>
              <a
                href="mailto:hello@hkwwt.com"
                class="text-sm text-bp-subtle transition-colors hover:text-bp-accent"
              >
                {{ t('footer.email') }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-12 flex items-center justify-between border-t border-bp-border pt-6">
        <p class="text-xs text-bp-muted">
          {{ t('footer.copyright', { year }) }}
        </p>
        <div class="flex items-center gap-1">
          <span class="text-xs text-bp-muted">Built with</span>
          <span class="font-blueprint text-xs text-bp-accent">Vue + Supabase</span>
        </div>
      </div>
    </div>
  </footer>
</template>
