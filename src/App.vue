<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppearanceStore } from '@/stores/appearance'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

const route = useRoute()
const { locale } = useI18n()
const authStore = useAuthStore()

const isAdminLogin = computed(() => route.name === 'admin-login')
const isAdmin = computed(() => route.path.startsWith('/admin') && !isAdminLogin.value)

function syncLocale() {
  const routeLocale = route.params.locale as string
  if (routeLocale && ['zh-TW', 'en'].includes(routeLocale)) {
    locale.value = routeLocale
  } else if (!route.path.startsWith('/admin')) {
    locale.value = 'zh-TW'
  }
}

onMounted(async () => {
  await authStore.initialize()
  syncLocale()
  useAppearanceStore().apply()
})

watch(() => route.params.locale, () => {
  syncLocale()
})
</script>

<template>
  <template v-if="isAdminLogin">
    <RouterView />
  </template>
  <AdminLayout v-else-if="isAdmin">
    <RouterView />
  </AdminLayout>
  <DefaultLayout v-else>
    <RouterView />
  </DefaultLayout>
</template>
