<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const { t } = useI18n()
const siteSettings = useSiteSettingsStore()

const localSiteTitle = ref('')
const localSiteDescription = ref('')

function syncFromStore() {
  localSiteTitle.value = siteSettings.siteTitle
  localSiteDescription.value = siteSettings.siteDescription
}

onMounted(() => {
  syncFromStore()
})

function handleSave() {
  siteSettings.siteTitle = localSiteTitle.value
  siteSettings.siteDescription = localSiteDescription.value
  siteSettings.save()
}

function handleReset() {
  siteSettings.reset()
  syncFromStore()
}
</script>

<template>
  <div>
    <h1 class="mb-8 font-blueprint text-2xl tracking-wide text-bp-white">
      {{ t('admin.settings') }}
    </h1>

    <p class="mb-6 text-sm text-bp-subtle">
      {{ t('admin.settings_description') }}
    </p>

    <div class="max-w-xl space-y-6">
      <!-- 網站名稱 -->
      <div class="bp-card relative p-6">
        <div class="bp-corner-marks absolute inset-0" />
        <label class="mb-2 block text-sm font-medium text-bp-subtle">
          {{ t('admin.settings_site_title') }}
        </label>
        <input
          v-model="localSiteTitle"
          type="text"
          class="w-full rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
          :placeholder="t('admin.settings_site_title_placeholder')"
        />
      </div>

      <!-- 網站簡介 -->
      <div class="bp-card relative p-6">
        <div class="bp-corner-marks absolute inset-0" />
        <label class="mb-2 block text-sm font-medium text-bp-subtle">
          {{ t('admin.settings_site_description') }}
        </label>
        <textarea
          v-model="localSiteDescription"
          rows="3"
          class="w-full resize-y rounded border border-bp-border bg-bp-primary px-3 py-2 text-sm text-bp-white placeholder:text-bp-muted focus:border-bp-accent focus:outline-none"
          :placeholder="t('admin.settings_site_description_placeholder')"
        />
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
          {{ t('admin.settings_reset') }}
        </button>
      </div>
    </div>
  </div>
</template>
