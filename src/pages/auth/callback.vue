<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/plugins/supabase'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const errorMsg = ref('')

onMounted(async () => {
  try {
    // Supabase client auto-detects the hash fragment and creates the session
    const { error } = await supabase.auth.getSession()
    if (error) throw error
    // Small delay to let auth state propagate
    setTimeout(() => {
      router.replace('/')
    }, 500)
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Authentication failed'
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-bp-primary bp-grid-bg px-4">
    <div class="text-center">
      <div v-if="errorMsg" class="border border-bp-error bg-bp-error/10 p-6">
        <p class="text-sm text-bp-error">{{ errorMsg }}</p>
        <router-link
          to="/auth/login"
          class="mt-4 inline-block text-xs text-bp-accent transition-colors hover:text-bp-accent-bright"
        >
          {{ t('auth.goToLogin') }}
        </router-link>
      </div>
      <div v-else class="space-y-3">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-bp-border border-t-bp-accent"></div>
        <p class="text-sm text-bp-muted">{{ t('auth.redirecting') }}</p>
      </div>
    </div>
  </div>
</template>
