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
    <h1 class="mb-4 font-blueprint text-2xl tracking-wide text-bp-white">
      {{ t('admin.homepage') }}
    </h1>

    <p class="mb-6 text-sm text-bp-subtle">
      {{ t('admin.homepage_description') }}
    </p>

    <div class="space-y-3" style="max-width: 700px;">
      <!-- Hero -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mb-2">{{ t('admin.homepage_hero') }}</h4>

      <div>
        <label class="pp-label">{{ t('hero.greeting') }}</label>
        <input v-model="heroGreeting" type="text" class="pp-input" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="pp-label">{{ t('hero.name') }}</label>
          <input v-model="heroName" type="text" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">{{ t('hero.tagline') }}</label>
          <input v-model="heroTagline" type="text" class="pp-input" />
        </div>
      </div>

      <div>
        <label class="pp-label">{{ t('hero.description') }}</label>
        <textarea v-model="heroDescription" rows="3" class="pp-input" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="pp-label">{{ t('hero.cta_explore') }}</label>
          <input v-model="heroCtaExplore" type="text" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">{{ t('hero.cta_patreon') }}</label>
          <input v-model="heroCtaPatreon" type="text" class="pp-input" />
        </div>
      </div>

      <!-- Categories -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">{{ t('admin.homepage_categories') }}</h4>

      <div>
        <label class="pp-label">{{ t('home.categories_title') }}</label>
        <input v-model="categoriesTitle" type="text" class="pp-input" />
      </div>
      <div>
        <label class="pp-label">{{ t('home.categories_subtitle') }}</label>
        <input v-model="categoriesSubtitle" type="text" class="pp-input" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="pp-label">{{ t('home.cat_ai_coding') }}</label>
          <input v-model="catAiCoding" type="text" class="pp-input" />
          <label class="pp-label mt-2">Description</label>
          <input v-model="catAiCodingDesc" type="text" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">{{ t('home.cat_ai_video') }}</label>
          <input v-model="catAiVideo" type="text" class="pp-input" />
          <label class="pp-label mt-2">Description</label>
          <input v-model="catAiVideoDesc" type="text" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">{{ t('home.cat_tools') }}</label>
          <input v-model="catTools" type="text" class="pp-input" />
          <label class="pp-label mt-2">Description</label>
          <input v-model="catToolsDesc" type="text" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">{{ t('home.cat_works') }}</label>
          <input v-model="catWorks" type="text" class="pp-input" />
          <label class="pp-label mt-2">Description</label>
          <input v-model="catWorksDesc" type="text" class="pp-input" />
        </div>
      </div>

      <!-- CTA -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">{{ t('admin.homepage_cta') }}</h4>

      <div>
        <label class="pp-label">{{ t('home.cta_title') }}</label>
        <input v-model="ctaTitle" type="text" class="pp-input" />
      </div>
      <div>
        <label class="pp-label">{{ t('home.cta_description') }}</label>
        <textarea v-model="ctaDescription" rows="2" class="pp-input" />
      </div>
      <div>
        <label class="pp-label">{{ t('home.cta_button') }}</label>
        <input v-model="ctaButton" type="text" class="pp-input" />
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 mt-6 border-t border-bp-border pt-4">
        <button type="button" class="bp-btn-accent" @click="handleSave">
          {{ t('admin.appearance_save') }}
        </button>
        <button type="button" class="bp-btn-primary" @click="handleReset">
          {{ t('admin.homepage_reset') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pp-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
}

.pp-input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(16, 16, 16, 1);
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  color: #fff;
  outline: none;
  transition: border-color 0.2s;
}

.pp-input:focus {
  border-color: #990011;
}
</style>
