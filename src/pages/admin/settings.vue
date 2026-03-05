<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const { t } = useI18n()
const siteSettings = useSiteSettingsStore()

const localSiteTitle = ref('')
const localSiteDescription = ref('')
const localDefaultLocale = ref<'zh-TW' | 'en'>('zh-TW')

function syncFromStore() {
  localSiteTitle.value = siteSettings.siteTitle
  localSiteDescription.value = siteSettings.siteDescription
  localDefaultLocale.value = siteSettings.defaultLocale || 'zh-TW'
}

onMounted(() => {
  syncFromStore()
})

function handleSave() {
  siteSettings.siteTitle = localSiteTitle.value
  siteSettings.siteDescription = localSiteDescription.value
  siteSettings.defaultLocale = localDefaultLocale.value
  siteSettings.save()
}

function handleReset() {
  siteSettings.reset()
  syncFromStore()
}
</script>

<template>
  <div>
    <h1 class="mb-4 font-blueprint text-2xl tracking-wide text-bp-white">
      {{ t('admin.settings') }}
    </h1>

    <p class="mb-6 text-sm text-bp-subtle">
      {{ t('admin.settings_description') }}
    </p>

    <div class="space-y-3" style="max-width: 700px;">
      <!-- 網站名稱 -->
      <div>
        <label class="pp-label">{{ t('admin.settings_site_title') }}</label>
        <input v-model="localSiteTitle" type="text" class="pp-input" />
      </div>

      <!-- 網站簡介 -->
      <div>
        <label class="pp-label">{{ t('admin.settings_site_description') }}</label>
        <textarea v-model="localSiteDescription" rows="3" class="pp-input" />
      </div>

      <!-- 預設語言 -->
      <div>
        <label class="pp-label">{{ t('admin.settings_default_locale') }}</label>
        <select v-model="localDefaultLocale" class="pp-input">
          <option value="zh-TW">{{ t('admin.settings_default_locale_zhtw') }}</option>
          <option value="en">{{ t('admin.settings_default_locale_en') }}</option>
        </select>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 mt-6 border-t border-bp-border pt-4">
        <button type="button" class="bp-btn-accent" @click="handleSave">
          {{ t('admin.appearance_save') }}
        </button>
        <button type="button" class="bp-btn-primary" @click="handleReset">
          {{ t('admin.settings_reset') }}
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
