<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useFrontendNavStore } from '@/stores/frontendNav'
import { useAppearanceStore } from '@/stores/appearance'

const { t, localizedPath } = useLocale()
const navStore = useFrontendNavStore()
const appearanceStore = useAppearanceStore()
const year = new Date().getFullYear()

const brandName = computed(() => appearanceStore.effectiveSiteName())

const navLinks = computed(() => [
  { key: 'explore', path: navStore.getPathByKey('explore') },
  { key: 'workshop', path: navStore.getPathByKey('workshop') },
  { key: 'showcase', path: navStore.getPathByKey('showcase') },
  { key: 'apps', path: navStore.getPathByKey('apps') },
  { key: 'premium', path: navStore.getPathByKey('premium') },
])

const socialLinks = [
  { label: 'instagram', url: 'https://www.instagram.com/hkwwt' },
  { label: 'x_twitter', url: 'https://x.com/hkwwt' },
  { label: 'youtube', url: 'https://www.youtube.com/@hkwwt' },
]
</script>

<template>
  <footer class="bp-line-top bg-bp-deep">
    <div class="mx-auto max-w-[1800px] px-6 pb-16 pt-20 sm:px-8 md:px-10">

      <!-- ═══ Top: Tagline + Email ═══ -->
      <div class="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <h2 class="footer-tagline max-w-lg whitespace-pre-line text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          {{ t('footer.tagline') }}
        </h2>
        <a
          :href="`mailto:${t('footer.contact_email')}`"
          class="self-start text-lg font-medium text-white transition-colors hover:text-bp-accent sm:text-xl md:self-auto md:text-2xl"
        >
          {{ t('footer.contact_email') }}
        </a>
      </div>

      <!-- ═══ Middle: Legal links (left) + Nav columns (right) ═══ -->
      <div class="mt-16 flex flex-col gap-12 md:mt-24 md:flex-row md:items-end md:justify-between">
        <!-- Legal links — bottom-left -->
        <div class="flex gap-6 text-sm text-bp-muted md:order-1">
          <a href="#" class="underline-offset-4 transition-colors hover:text-white hover:underline">
            {{ t('footer.privacy') }}
          </a>
          <a href="#" class="underline-offset-4 transition-colors hover:text-white hover:underline">
            {{ t('footer.terms') }}
          </a>
        </div>

        <!-- Navigation columns — right side -->
        <div class="flex gap-16 md:order-2">
          <!-- Pages column -->
          <div>
            <h4 class="mb-4 text-xs font-semibold uppercase tracking-widest text-bp-muted">
              {{ t('footer.pages') }}
            </h4>
            <ul class="space-y-2.5">
              <li v-for="link in navLinks" :key="link.key">
                <router-link
                  :to="localizedPath(link.path)"
                  class="text-sm text-bp-subtle transition-colors hover:text-white"
                >
                  {{ t(`nav.${link.key}`) }}
                </router-link>
              </li>
            </ul>
          </div>

          <!-- Social Media column -->
          <div>
            <h4 class="mb-4 text-xs font-semibold uppercase tracking-widest text-bp-muted">
              {{ t('footer.social') }}
            </h4>
            <ul class="space-y-2.5">
              <li v-for="social in socialLinks" :key="social.label">
                <a
                  :href="social.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-bp-subtle transition-colors hover:text-white"
                >
                  {{ t(`footer.${social.label}`) }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ═══ Divider ═══ -->
      <div class="my-12 border-t border-bp-border md:my-16"></div>

      <!-- ═══ Bottom: Giant brand name + Copyright ═══ -->
      <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <span
          class="footer-brand-name select-none text-6xl font-black leading-none tracking-tighter text-white sm:text-7xl md:text-8xl lg:text-9xl"
        >
          {{ brandName }}
        </span>
        <p class="whitespace-nowrap pb-1 text-xs text-bp-muted md:pb-2">
          {{ t('footer.copyright', { year }) }}
        </p>
      </div>

    </div>
  </footer>
</template>

<style scoped>
.footer-tagline {
  font-family: 'Inter', 'Noto Sans TC', system-ui, sans-serif;
}

.footer-brand-name {
  font-family: 'Inter', 'Noto Sans TC', system-ui, sans-serif;
  letter-spacing: -0.04em;
}
</style>
