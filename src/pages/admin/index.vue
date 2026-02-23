<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  await authStore.initialize()
  if (!authStore.isAuthenticated) {
    router.push('/admin/login')
  }
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (!isAuth) router.push('/admin/login')
})
</script>

<template>
  <RouterView v-if="authStore.isAuthenticated" />
  <div v-else class="flex items-center justify-center py-20">
    <span class="font-blueprint text-sm text-bp-muted">Authenticating...</span>
  </div>
</template>
