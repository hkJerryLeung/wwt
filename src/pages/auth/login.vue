<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  try {
    await authStore.signIn(email.value, password.value)
    router.push('/')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Login failed'
  }
}

async function handleGoogleLogin() {
  errorMsg.value = ''
  try {
    await authStore.signInWithGoogle()
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Google login failed'
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-bp-primary bp-grid-bg px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-10 text-center">
        <span class="font-blueprint text-3xl tracking-wider text-bp-white">WWT</span>
        <p class="mt-2 text-sm text-bp-muted">{{ t('auth.login') }}</p>
      </div>

      <!-- Form -->
      <form class="border border-bp-border bg-bp-surface p-8" @submit.prevent="handleLogin">
        <!-- Error -->
        <div
          v-if="errorMsg"
          class="mb-4 border border-bp-error bg-bp-error/10 px-4 py-2 text-sm text-bp-error"
        >
          {{ errorMsg }}
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">
            {{ t('auth.email') }}
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border border-bp-border bg-bp-deep px-4 py-2.5 text-sm text-bp-white placeholder-bp-muted outline-none transition-colors focus:border-bp-accent"
            placeholder="you@example.com"
          />
        </div>

        <!-- Password -->
        <div class="mb-6">
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">
            {{ t('auth.password') }}
          </label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full border border-bp-border bg-bp-deep px-4 py-2.5 text-sm text-bp-white placeholder-bp-muted outline-none transition-colors focus:border-bp-accent"
            placeholder="••••••••"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="bp-btn-accent w-full justify-center"
          :disabled="authStore.isLoading"
        >
          <span v-if="authStore.isLoading">{{ t('common.loading') }}</span>
          <span v-else>{{ t('auth.login') }}</span>
        </button>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-bp-border"></div>
          <span class="text-xs text-bp-muted">{{ t('auth.or') }}</span>
          <div class="h-px flex-1 bg-bp-border"></div>
        </div>

        <!-- Google Button -->
        <button
          type="button"
          class="flex w-full items-center justify-center gap-3 border border-bp-border bg-bp-deep px-4 py-2.5 text-sm text-bp-white transition-colors hover:border-bp-border-strong hover:bg-bp-surface"
          :disabled="authStore.isLoading"
          @click="handleGoogleLogin"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ t('auth.signInWithGoogle') }}
        </button>
      </form>

      <!-- Register link -->
      <div class="mt-6 text-center">
        <span class="text-xs text-bp-muted">{{ t('auth.noAccount') }} </span>
        <router-link to="/auth/register" class="text-xs text-bp-accent transition-colors hover:text-bp-accent-bright">
          {{ t('auth.register') }}
        </router-link>
      </div>

      <!-- Back link -->
      <div class="mt-3 text-center">
        <router-link to="/" class="text-xs text-bp-muted transition-colors hover:text-bp-accent">
          ← {{ t('auth.backToSite') }}
        </router-link>
      </div>
    </div>
  </div>
</template>
