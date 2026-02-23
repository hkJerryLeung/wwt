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
    <h1 class="mb-8 font-blueprint text-2xl tracking-wide text-bp-white">
      {{ t('admin.appearance') }}
    </h1>

    <p class="mb-6 text-sm text-bp-subtle">
      {{ t('admin.appearance_description') }}
    </p>

    <div class="max-w-xl space-y-6">
      <!-- 強調色 -->
      <div class="bp-card relative p-6">
        <div class="bp-corner-marks absolute inset-0" />
        <label class="mb-2 block text-sm font-medium text-bp-subtle">
          {{ t('admin.appearance_accent') }}
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <input
            type="color"
            class="h-10 w-16 cursor-pointer rounded border border-bp-border bg-bp-deep p-1"
            :value="localAccentColor || DEFAULT_ACCENT"
            @input="localAccentColor = ($event.target as HTMLInputElement).value"
          />
          <input
            v-model="localAccentColor"
            type="text"
            class="w-28 rounded border border-bp-border bg-bp-primary px-3 py-2 font-mono text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
            placeholder="#990011"
          />
        </div>
      </div>

      <!-- Logo 網址 -->
      <div class="bp-card relative p-6">
        <div class="bp-corner-marks absolute inset-0" />
        <label class="mb-2 block text-sm font-medium text-bp-subtle">
          {{ t('admin.appearance_logo_url') }}
        </label>
        <input
          v-model="localLogoUrl"
          type="url"
          class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
          :placeholder="t('admin.appearance_logo_placeholder')"
        />
      </div>

      <!-- 網站名稱 -->
      <div class="bp-card relative p-6">
        <div class="bp-corner-marks absolute inset-0" />
        <label class="mb-2 block text-sm font-medium text-bp-subtle">
          {{ t('admin.appearance_site_name') }}
        </label>
        <input
          v-model="localSiteName"
          type="text"
          class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
          :placeholder="t('admin.appearance_site_name_placeholder')"
        />
      </div>

      <!-- 背景樣式：網格 / 純色 / 圖片 -->
      <div class="bp-card relative p-6">
        <div class="bp-corner-marks absolute inset-0" />
        <label class="mb-2 block text-sm font-medium text-bp-subtle">
          {{ t('admin.appearance_background') }}
        </label>
        <select
          v-model="localBackgroundType"
          class="mb-4 w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white focus:border-bp-accent focus:outline-none"
        >
          <option
            v-for="opt in backgroundTypeOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ t(opt.labelKey) }}
          </option>
        </select>

        <!-- 網格：關閉 / 一般 / 密集 -->
        <template v-if="localBackgroundType === 'grid'">
          <label class="mb-2 mt-2 block text-xs text-bp-muted">
            {{ t('admin.appearance_grid') }}
          </label>
          <select
            v-model="localGridStyle"
            class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white focus:border-bp-accent focus:outline-none"
          >
            <option
              v-for="opt in gridOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ t(opt.labelKey) }}
            </option>
          </select>
        </template>

        <!-- 純色：顏色選擇器 -->
        <template v-else-if="localBackgroundType === 'solid'">
          <label class="mb-2 mt-2 block text-xs text-bp-muted">
            {{ t('admin.appearance_bg_color') }}
          </label>
          <div class="flex flex-wrap items-center gap-3">
            <input
              type="color"
              class="h-10 w-16 cursor-pointer rounded border border-bp-border bg-bp-deep p-1"
              :value="localBackgroundColor || DEFAULT_BG_COLOR"
              @input="localBackgroundColor = ($event.target as HTMLInputElement).value"
            />
            <input
              v-model="localBackgroundColor"
              type="text"
              class="w-28 rounded border border-bp-border bg-bp-primary px-3 py-2 font-mono text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
              :placeholder="t('admin.appearance_bg_color_placeholder')"
            />
          </div>
        </template>

        <!-- 圖片：URL -->
        <template v-else-if="localBackgroundType === 'image'">
          <label class="mb-2 mt-2 block text-xs text-bp-muted">
            {{ t('admin.appearance_bg_image_url') }}
          </label>
          <input
            v-model="localBackgroundImageUrl"
            type="url"
            class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
            :placeholder="t('admin.appearance_bg_image_placeholder')"
          />
        </template>
      </div>

      <!-- 按鈕 -->
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
          {{ t('admin.appearance_reset') }}
        </button>
      </div>
    </div>
  </div>
</template>
