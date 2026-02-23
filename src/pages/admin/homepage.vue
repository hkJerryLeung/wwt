<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHomepageSettingsStore } from '@/stores/homepageSettings'

const { t } = useI18n()
const store = useHomepageSettingsStore()

const heroGreeting = ref('')
const heroName = ref('')
const heroTagline = ref('')
const heroDescription = ref('')
const heroCtaExplore = ref('')
const heroCtaPatreon = ref('')
const categoriesTitle = ref('')
const categoriesSubtitle = ref('')
const catAiCoding = ref('')
const catAiCodingDesc = ref('')
const catAiVideo = ref('')
const catAiVideoDesc = ref('')
const catTools = ref('')
const catToolsDesc = ref('')
const catWorks = ref('')
const catWorksDesc = ref('')
const ctaTitle = ref('')
const ctaDescription = ref('')
const ctaButton = ref('')

function syncFromStore() {
  heroGreeting.value = store.heroGreeting
  heroName.value = store.heroName
  heroTagline.value = store.heroTagline
  heroDescription.value = store.heroDescription
  heroCtaExplore.value = store.heroCtaExplore
  heroCtaPatreon.value = store.heroCtaPatreon
  categoriesTitle.value = store.categoriesTitle
  categoriesSubtitle.value = store.categoriesSubtitle
  catAiCoding.value = store.catAiCoding
  catAiCodingDesc.value = store.catAiCodingDesc
  catAiVideo.value = store.catAiVideo
  catAiVideoDesc.value = store.catAiVideoDesc
  catTools.value = store.catTools
  catToolsDesc.value = store.catToolsDesc
  catWorks.value = store.catWorks
  catWorksDesc.value = store.catWorksDesc
  ctaTitle.value = store.ctaTitle
  ctaDescription.value = store.ctaDescription
  ctaButton.value = store.ctaButton
}

onMounted(() => {
  syncFromStore()
})

function handleSave() {
  store.heroGreeting = heroGreeting.value
  store.heroName = heroName.value
  store.heroTagline = heroTagline.value
  store.heroDescription = heroDescription.value
  store.heroCtaExplore = heroCtaExplore.value
  store.heroCtaPatreon = heroCtaPatreon.value
  store.categoriesTitle = categoriesTitle.value
  store.categoriesSubtitle = categoriesSubtitle.value
  store.catAiCoding = catAiCoding.value
  store.catAiCodingDesc = catAiCodingDesc.value
  store.catAiVideo = catAiVideo.value
  store.catAiVideoDesc = catAiVideoDesc.value
  store.catTools = catTools.value
  store.catToolsDesc = catToolsDesc.value
  store.catWorks = catWorks.value
  store.catWorksDesc = catWorksDesc.value
  store.ctaTitle = ctaTitle.value
  store.ctaDescription = ctaDescription.value
  store.ctaButton = ctaButton.value
  store.save()
}

function handleReset() {
  store.reset()
  syncFromStore()
}
</script>

<template>
  <div>
    <h1 class="mb-8 font-blueprint text-2xl tracking-wide text-bp-white">
      {{ t('admin.homepage') }}
    </h1>

    <p class="mb-6 text-sm text-bp-subtle">
      {{ t('admin.homepage_description') }}
    </p>

    <div class="max-w-2xl space-y-8">
      <!-- Hero -->
      <section class="space-y-4">
        <h2 class="font-blueprint text-lg text-bp-accent">
          {{ t('admin.homepage_hero') }}
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="bp-card relative p-6 sm:col-span-2">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('hero.greeting') }}</label>
            <input
              v-model="heroGreeting"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('hero.greeting')"
            />
          </div>
          <div class="bp-card relative p-6">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('hero.name') }}</label>
            <input
              v-model="heroName"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('hero.name')"
            />
          </div>
          <div class="bp-card relative p-6">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('hero.tagline') }}</label>
            <input
              v-model="heroTagline"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('hero.tagline')"
            />
          </div>
          <div class="bp-card relative p-6 sm:col-span-2">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('hero.description') }}</label>
            <textarea
              v-model="heroDescription"
              rows="3"
              class="w-full resize-y rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('hero.description')"
            />
          </div>
          <div class="bp-card relative p-6">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('hero.cta_explore') }}</label>
            <input
              v-model="heroCtaExplore"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('hero.cta_explore')"
            />
          </div>
          <div class="bp-card relative p-6">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('hero.cta_patreon') }}</label>
            <input
              v-model="heroCtaPatreon"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('hero.cta_patreon')"
            />
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="space-y-4">
        <h2 class="font-blueprint text-lg text-bp-accent">
          {{ t('admin.homepage_categories') }}
        </h2>
        <div class="bp-card relative p-6">
          <div class="bp-corner-marks absolute inset-0" />
          <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.categories_title') }}</label>
          <input
            v-model="categoriesTitle"
            type="text"
            class="mb-4 w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
            :placeholder="t('home.categories_title')"
          />
          <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.categories_subtitle') }}</label>
          <input
            v-model="categoriesSubtitle"
            type="text"
            class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
            :placeholder="t('home.categories_subtitle')"
          />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="bp-card relative p-6">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.cat_ai_coding') }}</label>
            <input
              v-model="catAiCoding"
              type="text"
              class="mb-3 w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('home.cat_ai_coding')"
            />
            <label class="mb-2 block text-xs text-bp-muted">Description</label>
            <input
              v-model="catAiCodingDesc"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('home.cat_ai_coding_desc')"
            />
          </div>
          <div class="bp-card relative p-6">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.cat_ai_video') }}</label>
            <input
              v-model="catAiVideo"
              type="text"
              class="mb-3 w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('home.cat_ai_video')"
            />
            <label class="mb-2 block text-xs text-bp-muted">Description</label>
            <input
              v-model="catAiVideoDesc"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('home.cat_ai_video_desc')"
            />
          </div>
          <div class="bp-card relative p-6">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.cat_tools') }}</label>
            <input
              v-model="catTools"
              type="text"
              class="mb-3 w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('home.cat_tools')"
            />
            <label class="mb-2 block text-xs text-bp-muted">Description</label>
            <input
              v-model="catToolsDesc"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('home.cat_tools_desc')"
            />
          </div>
          <div class="bp-card relative p-6">
            <div class="bp-corner-marks absolute inset-0" />
            <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.cat_works') }}</label>
            <input
              v-model="catWorks"
              type="text"
              class="mb-3 w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('home.cat_works')"
            />
            <label class="mb-2 block text-xs text-bp-muted">Description</label>
            <input
              v-model="catWorksDesc"
              type="text"
              class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('home.cat_works_desc')"
            />
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="space-y-4">
        <h2 class="font-blueprint text-lg text-bp-accent">
          {{ t('admin.homepage_cta') }}
        </h2>
        <div class="bp-card relative p-6">
          <div class="bp-corner-marks absolute inset-0" />
          <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.cta_title') }}</label>
          <input
            v-model="ctaTitle"
            type="text"
            class="mb-4 w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
            :placeholder="t('home.cta_title')"
          />
          <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.cta_description') }}</label>
          <textarea
            v-model="ctaDescription"
            rows="2"
            class="mb-4 w-full resize-y rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
            :placeholder="t('home.cta_description')"
          />
          <label class="mb-2 block text-sm font-medium text-bp-subtle">{{ t('home.cta_button') }}</label>
          <input
            v-model="ctaButton"
            type="text"
            class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
            :placeholder="t('home.cta_button')"
          />
        </div>
      </section>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="bp-btn-accent"
          @click="handleSave"
        >
          {{ t('admin.appearance_save') }}
        </button>
        <button
          type="button"
          class="bp-btn-primary"
          @click="handleReset"
        >
          {{ t('admin.homepage_reset') }}
        </button>
      </div>
    </div>
  </div>
</template>
