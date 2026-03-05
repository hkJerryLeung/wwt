<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppearanceStore } from '@/stores/appearance'
import type { GridStyle, BackgroundType } from '@/stores/appearance'

const { t } = useI18n()
const appearance = useAppearanceStore()

const DEFAULT_ACCENT = '#990011'
const DEFAULT_BG_COLOR = '#101010'

const localAccentColor = ref('')
const localLogoUrl = ref('')
const localSiteName = ref('')
const localGridStyle = ref<GridStyle>('normal')
const localBackgroundType = ref<BackgroundType>('grid')
const localBackgroundColor = ref('')
const localBackgroundImageUrl = ref('')

function syncFromStore() {
  localAccentColor.value = appearance.accentColor
  localLogoUrl.value = appearance.logoUrl
  localSiteName.value = appearance.siteName
  localGridStyle.value = appearance.gridStyle
  localBackgroundType.value = appearance.backgroundType
  localBackgroundColor.value = appearance.backgroundColor
  localBackgroundImageUrl.value = appearance.backgroundImageUrl
}

onMounted(() => {
  syncFromStore()
})

function handleSave() {
  appearance.accentColor = localAccentColor.value
  appearance.logoUrl = localLogoUrl.value
  appearance.siteName = localSiteName.value
  appearance.gridStyle = localGridStyle.value
  appearance.backgroundType = localBackgroundType.value
  appearance.backgroundColor = localBackgroundColor.value
  appearance.backgroundImageUrl = localBackgroundImageUrl.value
  appearance.save()
}

function handleReset() {
  appearance.reset()
  syncFromStore()
}

const gridOptions: { value: GridStyle; labelKey: string }[] = [
  { value: 'none', labelKey: 'admin.appearance_grid_none' },
  { value: 'normal', labelKey: 'admin.appearance_grid_normal' },
  { value: 'dense', labelKey: 'admin.appearance_grid_dense' },
]

const backgroundTypeOptions: { value: BackgroundType; labelKey: string }[] = [
  { value: 'grid', labelKey: 'admin.appearance_background_grid' },
  { value: 'solid', labelKey: 'admin.appearance_background_solid' },
  { value: 'image', labelKey: 'admin.appearance_background_image' },
]
</script>

<template>
  <div>
    <h1 class="mb-4 font-blueprint text-2xl tracking-wide text-bp-white">
      {{ t('admin.appearance') }}
    </h1>

    <p class="mb-6 text-sm text-bp-subtle">
      {{ t('admin.appearance_description') }}
    </p>

    <div class="space-y-3" style="max-width: 700px;">
      <!-- 強調色 -->
      <div>
        <label class="pp-label">{{ t('admin.appearance_accent') }}</label>
        <div class="flex flex-wrap items-center gap-3">
          <input
            type="color"
            class="h-10 w-16 cursor-pointer border border-[rgba(255,255,255,0.15)] bg-[rgba(16,16,16,1)] p-1"
            :value="localAccentColor || DEFAULT_ACCENT"
            @input="localAccentColor = ($event.target as HTMLInputElement).value"
          />
          <input
            v-model="localAccentColor"
            type="text"
            class="pp-input font-mono"
            style="width: 7rem;"
          />
        </div>
      </div>

      <!-- Logo 網址 -->
      <div>
        <label class="pp-label">{{ t('admin.appearance_logo_url') }}</label>
        <input v-model="localLogoUrl" type="url" class="pp-input" />
      </div>

      <!-- 網站名稱 -->
      <div>
        <label class="pp-label">{{ t('admin.appearance_site_name') }}</label>
        <input v-model="localSiteName" type="text" class="pp-input" />
      </div>

      <!-- 背景樣式 -->
      <h4 class="text-[10px] uppercase tracking-widest text-bp-muted mt-4 mb-2 border-t border-bp-border pt-3">{{ t('admin.appearance_background') }}</h4>

      <div>
        <label class="pp-label">{{ t('admin.appearance_background') }}</label>
        <select v-model="localBackgroundType" class="pp-input">
          <option
            v-for="opt in backgroundTypeOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ t(opt.labelKey) }}
          </option>
        </select>
      </div>

      <!-- 網格：關閉 / 一般 / 密集 -->
      <template v-if="localBackgroundType === 'grid'">
        <div>
          <label class="pp-label">{{ t('admin.appearance_grid') }}</label>
          <select v-model="localGridStyle" class="pp-input">
            <option
              v-for="opt in gridOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ t(opt.labelKey) }}
            </option>
          </select>
        </div>
      </template>

      <!-- 純色：顏色選擇器 -->
      <template v-else-if="localBackgroundType === 'solid'">
        <div>
          <label class="pp-label">{{ t('admin.appearance_bg_color') }}</label>
          <div class="flex flex-wrap items-center gap-3">
            <input
              type="color"
              class="h-10 w-16 cursor-pointer border border-[rgba(255,255,255,0.15)] bg-[rgba(16,16,16,1)] p-1"
              :value="localBackgroundColor || DEFAULT_BG_COLOR"
              @input="localBackgroundColor = ($event.target as HTMLInputElement).value"
            />
            <input
              v-model="localBackgroundColor"
              type="text"
              class="pp-input font-mono"
              style="width: 7rem;"
            />
          </div>
        </div>
      </template>

      <!-- 圖片：URL -->
      <template v-else-if="localBackgroundType === 'image'">
        <div>
          <label class="pp-label">{{ t('admin.appearance_bg_image_url') }}</label>
          <input v-model="localBackgroundImageUrl" type="url" class="pp-input" />
        </div>
      </template>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 mt-6 border-t border-bp-border pt-4">
        <button type="button" class="bp-btn-accent" @click="handleSave">
          {{ t('admin.appearance_save') }}
        </button>
        <button type="button" class="bp-btn-primary" @click="handleReset">
          {{ t('admin.appearance_reset') }}
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
