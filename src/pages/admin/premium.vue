<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePremiumSettingsStore } from '@/stores/premiumSettings'

const { t } = useI18n()
const store = usePremiumSettingsStore()

/* ── Tab 管理 ── */
const tabs = [
  { key: 'hero', label: 'HERO 區' },
  { key: 'intro', label: '簡介區' },
  { key: 'audience', label: '目標對象' },
  { key: 'timeline', label: '內容時間軸' },
  { key: 'comparison', label: '比較表' },
  { key: 'faq', label: 'FAQ' },
] as const

type TabKey = (typeof tabs)[number]['key']
const activeTab = ref<TabKey>('hero')

const enabledTabs: TabKey[] = ['hero', 'intro', 'audience']

/* ── Hero 區表單 ── */
const heroSubtitle = ref('')
const heroTitle = ref('')
const heroDescription = ref('')
const heroPrice = ref('')
const heroPriceUnit = ref('')
const heroBadge = ref('')
const heroTag1 = ref('')
const heroTag2 = ref('')
const heroTag3 = ref('')
const heroTag4 = ref('')
const heroQuote = ref('')
const heroButtonText = ref('')
const heroBgImage = ref('')

/* ── 簡介區表單 ── */
const introHeadline = ref('')
const introDescription = ref('')
const introMediaUrl = ref('')

/* ── 目標對象區表單 ── */
const audienceTitle = ref('')
const audience1Title = ref('')
const audience1Desc = ref('')
const audience2Title = ref('')
const audience2Desc = ref('')
const audience3Title = ref('')
const audience3Desc = ref('')
const audience4Title = ref('')
const audience4Desc = ref('')

function syncFromStore() {
  heroSubtitle.value = store.heroSubtitle
  heroTitle.value = store.heroTitle
  heroDescription.value = store.heroDescription
  heroPrice.value = store.heroPrice
  heroPriceUnit.value = store.heroPriceUnit
  heroBadge.value = store.heroBadge
  heroTag1.value = store.heroTag1
  heroTag2.value = store.heroTag2
  heroTag3.value = store.heroTag3
  heroTag4.value = store.heroTag4
  heroQuote.value = store.heroQuote
  heroButtonText.value = store.heroButtonText
  heroBgImage.value = store.heroBgImage
  // 簡介區
  introHeadline.value = store.introHeadline
  introDescription.value = store.introDescription
  introMediaUrl.value = store.introMediaUrl
  // 目標對象區
  audienceTitle.value = store.audienceTitle
  audience1Title.value = store.audience1Title
  audience1Desc.value = store.audience1Desc
  audience2Title.value = store.audience2Title
  audience2Desc.value = store.audience2Desc
  audience3Title.value = store.audience3Title
  audience3Desc.value = store.audience3Desc
  audience4Title.value = store.audience4Title
  audience4Desc.value = store.audience4Desc
}

onMounted(() => {
  syncFromStore()
})

function handleSave() {
  store.heroSubtitle = heroSubtitle.value
  store.heroTitle = heroTitle.value
  store.heroDescription = heroDescription.value
  store.heroPrice = heroPrice.value
  store.heroPriceUnit = heroPriceUnit.value
  store.heroBadge = heroBadge.value
  store.heroTag1 = heroTag1.value
  store.heroTag2 = heroTag2.value
  store.heroTag3 = heroTag3.value
  store.heroTag4 = heroTag4.value
  store.heroQuote = heroQuote.value
  store.heroButtonText = heroButtonText.value
  store.heroBgImage = heroBgImage.value
  // 簡介區
  store.introHeadline = introHeadline.value
  store.introDescription = introDescription.value
  store.introMediaUrl = introMediaUrl.value
  // 目標對象區
  store.audienceTitle = audienceTitle.value
  store.audience1Title = audience1Title.value
  store.audience1Desc = audience1Desc.value
  store.audience2Title = audience2Title.value
  store.audience2Desc = audience2Desc.value
  store.audience3Title = audience3Title.value
  store.audience3Desc = audience3Desc.value
  store.audience4Title = audience4Title.value
  store.audience4Desc = audience4Desc.value
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
      {{ t('admin.premium_page') }}
    </h1>

    <p class="mb-6 text-sm text-bp-subtle">
      {{ t('admin.premium_page_description') }}
    </p>

    <!-- Tab 列 (same style as App管理 APP PAGE / DOC PAGE) -->
    <div class="mb-6 flex gap-0">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.key"
        :class="[
          'px-5 py-2 text-xs uppercase tracking-widest transition-colors border',
          idx > 0 ? 'border-l-0' : '',
          activeTab === tab.key
            ? 'bg-bp-accent/10 text-bp-accent border-bp-accent'
            : enabledTabs.includes(tab.key)
              ? 'text-bp-muted border-bp-border hover:text-bp-white'
              : 'text-bp-muted border-bp-border cursor-not-allowed opacity-50',
        ]"
        :disabled="!enabledTabs.includes(tab.key)"
        @click="enabledTabs.includes(tab.key) && (activeTab = tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Hero 區 -->
    <div v-show="activeTab === 'hero'" class="space-y-3" style="max-width: 700px;">

      <!-- 背景圖片 -->
      <div>
        <label class="pp-label">背景圖片路徑</label>
        <input v-model="heroBgImage" class="pp-input" />
      </div>

      <!-- 副標題 -->
      <div>
        <label class="pp-label">副標題</label>
        <input v-model="heroSubtitle" class="pp-input" />
      </div>

      <!-- 主標題 + 徽章 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="pp-label">主標題</label>
          <input v-model="heroTitle" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">徽章文字</label>
          <input v-model="heroBadge" class="pp-input" />
        </div>
      </div>

      <!-- 描述 -->
      <div>
        <label class="pp-label">描述文字</label>
        <textarea v-model="heroDescription" rows="3" class="pp-input" />
      </div>

      <!-- Pricing & Links section -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Pricing</h4>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="pp-label">價格</label>
          <input v-model="heroPrice" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">週期單位</label>
          <input v-model="heroPriceUnit" class="pp-input" />
        </div>
      </div>

      <!-- Tags section -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Tags</h4>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="pp-label">標籤 1</label>
          <input v-model="heroTag1" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">標籤 2</label>
          <input v-model="heroTag2" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">標籤 3</label>
          <input v-model="heroTag3" class="pp-input" />
        </div>
        <div>
          <label class="pp-label">標籤 4</label>
          <input v-model="heroTag4" class="pp-input" />
        </div>
      </div>

      <!-- Quote & CTA section -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Quote & CTA</h4>
      <div>
        <label class="pp-label">引用語</label>
        <textarea v-model="heroQuote" rows="2" class="pp-input" />
      </div>
      <div>
        <label class="pp-label">CTA 按鈕文字</label>
        <input v-model="heroButtonText" class="pp-input" />
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

    <!-- 簡介區 -->
    <div v-show="activeTab === 'intro'" class="space-y-3" style="max-width: 700px;">

      <div>
        <label class="pp-label">主標語（引言）</label>
        <textarea v-model="introHeadline" rows="2" class="pp-input" />
      </div>

      <div>
        <label class="pp-label">內容描述</label>
        <textarea v-model="introDescription" rows="6" class="pp-input" />
      </div>

      <!-- Media section -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Media</h4>
      <div>
        <label class="pp-label">影片 / 圖片路徑</label>
        <input v-model="introMediaUrl" class="pp-input" />
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

    <!-- 目標對象區 -->
    <div v-show="activeTab === 'audience'" class="space-y-3" style="max-width: 700px;">

      <div>
        <label class="pp-label">區塊標題</label>
        <input v-model="audienceTitle" class="pp-input" />
      </div>

      <!-- Persona 1 -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Persona 1</h4>
      <div>
        <label class="pp-label">標題</label>
        <input v-model="audience1Title" class="pp-input" />
      </div>
      <div>
        <label class="pp-label">描述</label>
        <textarea v-model="audience1Desc" rows="3" class="pp-input" />
      </div>

      <!-- Persona 2 -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Persona 2</h4>
      <div>
        <label class="pp-label">標題</label>
        <input v-model="audience2Title" class="pp-input" />
      </div>
      <div>
        <label class="pp-label">描述</label>
        <textarea v-model="audience2Desc" rows="3" class="pp-input" />
      </div>

      <!-- Persona 3 -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Persona 3</h4>
      <div>
        <label class="pp-label">標題</label>
        <input v-model="audience3Title" class="pp-input" />
      </div>
      <div>
        <label class="pp-label">描述</label>
        <textarea v-model="audience3Desc" rows="3" class="pp-input" />
      </div>

      <!-- Persona 4 -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">Persona 4</h4>
      <div>
        <label class="pp-label">標題</label>
        <input v-model="audience4Title" class="pp-input" />
      </div>
      <div>
        <label class="pp-label">描述</label>
        <textarea v-model="audience4Desc" rows="3" class="pp-input" />
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

    <!-- Placeholder content for other tabs -->
    <div v-show="!enabledTabs.includes(activeTab)" class="flex items-center justify-center py-20">
      <p class="text-sm text-bp-muted">此區塊尚未開放編輯</p>
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
