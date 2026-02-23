<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageHeading } from '@/composables/usePageHeading'

const { t, tm, rt } = useI18n()
const { title, subtitle } = usePageHeading('premium')
const openFaqIndex = ref<number | null>(null)

function toggleFaq(index: number) {
  openFaqIndex.value = openFaqIndex.value === index ? null : index
}

interface FaqItem {
  q: string
  a: string
}

const faqItems = computed<FaqItem[]>(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = tm('premium.faq') as any[]
  return items.map((item: any) => ({
    q: rt(item.q),
    a: rt(item.a),
  }))
})
</script>

<template>
  <div class="py-24 sm:py-32">
    <div class="mx-auto max-w-[1080px] px-4 sm:px-6">
      <!-- Header（標題與簡介跟隨後台選單管理） -->
      <div class="mb-16 text-center">
        <h1 class="font-blueprint text-4xl tracking-wide text-bp-white sm:text-5xl">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="mt-3 text-bp-subtle">{{ subtitle }}</p>
      </div>

      <!-- Pricing cards -->
      <div class="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Free tier -->
        <div class="bp-card relative p-8">
          <div class="bp-corner-marks absolute inset-0" />
          <span class="bp-section-number mb-2 block">{{ t('premium.free_tier') }}</span>
          <div class="mb-1 font-blueprint text-3xl text-bp-white">{{ t('premium.free_price') }}</div>
          <p class="mb-6 text-sm text-bp-muted">{{ t('premium.free_desc') }}</p>

          <ul class="mb-8 space-y-3">
            <li
              v-for="(feature, i) in tm('premium.free_features')"
              :key="i"
              class="flex items-start gap-2 text-sm text-bp-subtle"
            >
              <span class="mt-0.5 text-bp-accent">+</span>
              {{ rt(feature) }}
            </li>
          </ul>

          <button class="bp-btn-primary w-full justify-center">
            {{ t('premium.join_free') }}
          </button>
        </div>

        <!-- Premium tier -->
        <div class="relative border-2 border-bp-accent bg-bp-surface p-8">
          <div class="bp-corner-marks absolute inset-0" />

          <!-- Recommended badge -->
          <div class="absolute -top-3 left-1/2 -translate-x-1/2">
            <span class="bg-bp-accent px-4 py-1 font-blueprint text-[10px] uppercase tracking-widest text-bp-primary">
              Recommended
            </span>
          </div>

          <span class="bp-section-number mb-2 block">{{ t('premium.premium_tier') }}</span>
          <div class="mb-1 font-blueprint text-3xl text-bp-white">{{ t('premium.premium_price') }}</div>
          <p class="mb-6 text-sm text-bp-muted">{{ t('premium.premium_desc') }}</p>

          <ul class="mb-8 space-y-3">
            <li
              v-for="(feature, i) in tm('premium.premium_features')"
              :key="i"
              class="flex items-start gap-2 text-sm text-bp-subtle"
            >
              <span class="mt-0.5 text-bp-accent">+</span>
              {{ rt(feature) }}
            </li>
          </ul>

          <a
            href="https://www.patreon.com"
            target="_blank"
            rel="noopener noreferrer"
            class="bp-btn-accent w-full justify-center"
          >
            {{ t('premium.join_premium') }} →
          </a>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="mx-auto mt-24 max-w-2xl">
        <h2 class="mb-8 text-center font-blueprint text-2xl tracking-wide text-bp-white">
          {{ t('premium.faq_title') }}
        </h2>

        <div class="space-y-2">
          <div
            v-for="(faq, index) in faqItems"
            :key="index"
            class="border border-bp-border transition-colors hover:border-bp-border-strong"
          >
            <button
              class="flex w-full items-center justify-between px-6 py-4 text-left"
              @click="toggleFaq(index)"
            >
              <span class="pr-4 text-sm font-medium text-bp-white">{{ faq.q }}</span>
              <svg
                class="h-4 w-4 shrink-0 text-bp-muted transition-transform"
                :class="{ 'rotate-180': openFaqIndex === index }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-40 opacity-100"
              leave-active-class="transition-all duration-150"
              leave-from-class="max-h-40 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div
                v-if="openFaqIndex === index"
                class="overflow-hidden border-t border-bp-border"
              >
                <p class="px-6 py-4 text-sm leading-relaxed text-bp-subtle">
                  {{ faq.a }}
                </p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
