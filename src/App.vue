<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const route = useRoute()
const { locale } = useI18n()
const siteSettings = useSiteSettingsStore()

const isAdminLogin = computed(() => route.name === 'admin-login')
const isAuth = computed(() => route.path.startsWith('/auth'))
const isAdmin = computed(() => route.path.startsWith('/admin') && !isAdminLogin.value)

function syncLocale() {
  const routeLocale = route.params.locale as string
  if (routeLocale && ['zh-TW', 'en'].includes(routeLocale)) {
    locale.value = routeLocale
  } else if (!route.path.startsWith('/admin')) {
    locale.value = siteSettings.effectiveDefaultLocale()
  }
}

onMounted(() => {
  syncLocale()
})

watch(() => route.params.locale, () => {
  syncLocale()
})
</script>


<template>
  <div v-cloak>
    <template v-if="isAdminLogin || isAuth">
      <RouterView />
    </template>
    <AdminLayout v-else-if="isAdmin">
      <RouterView />
    </AdminLayout>
    <DefaultLayout v-else>
      <RouterView />
    </DefaultLayout>
  </div>
</template>
