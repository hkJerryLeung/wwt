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
    router.push('/admin')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Login failed'
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-bp-primary bp-grid-bg px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-10 text-center">
        <span class="font-blueprint text-3xl tracking-wider text-bp-white">WWT</span>
        <p class="mt-2 text-sm text-bp-muted">{{ t('admin.login') }}</p>
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
            {{ t('admin.email') }}
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border border-bp-border bg-bp-deep px-4 py-2.5 text-sm text-bp-white placeholder-bp-muted outline-none transition-colors focus:border-bp-accent"
            placeholder="admin@example.com"
          />
        </div>

        <!-- Password -->
        <div class="mb-6">
          <label class="mb-1.5 block text-xs uppercase tracking-wider text-bp-muted">
            {{ t('admin.password') }}
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
          <span v-else>{{ t('admin.login') }}</span>
        </button>
      </form>

      <!-- Back link -->
      <div class="mt-6 text-center">
        <router-link to="/" class="text-xs text-bp-muted transition-colors hover:text-bp-accent">
          ← Back to site
        </router-link>
      </div>
    </div>
  </div>
</template>
