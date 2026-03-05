import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import type { User, Session } from '@supabase/supabase-js'

const AUTH_PROFILE_KEY = 'wwt-auth-profile'

export const useAuthStore = defineStore('auth', () => {
  // ── 同步從 localStorage 還原 profile 快取（防止會員徽章 FOUC）──
  const _cached = (() => {
    try {
      const raw = localStorage.getItem(AUTH_PROFILE_KEY)
      if (raw) return JSON.parse(raw) as Record<string, unknown>
    } catch { }
    return null
  })()

  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isLoading = ref(false)
  const isAdmin = ref(_cached?.isAdmin === true)
  const isPremium = ref(_cached?.isPremium === true)
  const subscriptionStatus = ref<string>(typeof _cached?.subscriptionStatus === 'string' ? _cached.subscriptionStatus : 'inactive')
  const subscriptionEndDate: Ref<string | null> = ref(typeof _cached?.subscriptionEndDate === 'string' ? _cached.subscriptionEndDate : null)
  const isInitialized = ref(false)
  /** 上次關頁面時是否已登入（同步從 localStorage 讀取，防止 navbar 從 guest→auth 跳動） */
  const wasLoggedIn = ref(_cached?.wasLoggedIn === true)

  const isAuthenticated = computed(() => !!user.value)
  /**
   * navbar 應使用此值決定顯示 auth UI 或 guest UI，避免 layout shift。
   * - 如果有 localStorage 快取且上次是登入狀態 → 首幀即顯示 auth UI
   * - 如果 auth 已初始化 → 使用真實 isAuthenticated
   * - 如果無快取且未初始化 → 顯示 guest UI（首次訪問）
   */
  const shouldShowAuthUI = computed(() => {
    if (isInitialized.value) return isAuthenticated.value
    return wasLoggedIn.value
  })

  const membershipRole = computed<'admin' | 'premium' | 'free'>(() => {
    if (isAdmin.value) return 'admin'
    if (isPremium.value) return 'premium'
    return 'free'
  })

  function _saveProfileCache() {
    try {
      localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify({
        isAdmin: isAdmin.value,
        isPremium: isPremium.value,
        subscriptionStatus: subscriptionStatus.value,
        subscriptionEndDate: subscriptionEndDate.value,
        wasLoggedIn: !!user.value,
      }))
    } catch { }
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin, is_premium, subscription_status, subscription_end_date')
      .eq('id', userId)
      .single()
    isAdmin.value = data?.is_admin ?? false
    isPremium.value = data?.is_premium ?? false
    subscriptionStatus.value = data?.subscription_status ?? 'inactive'
    subscriptionEndDate.value = data?.subscription_end_date ?? null
    _saveProfileCache()
  }

  async function initialize() {
    if (isInitialized.value) return
    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null
      if (data.session?.user) {
        await fetchProfile(data.session.user.id)
      } else {
        // 使用者已登出，清除上次登入快取
        wasLoggedIn.value = false
        _saveProfileCache()
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        console.error('[WWT] Session init error:', e)
      }
    }
    isInitialized.value = true

    supabase.auth.onAuthStateChange((_event, newSession) => {
      // ── CRITICAL: defer to next tick ──
      // This callback fires from inside GoTrueClient._notifyAllSubscribers()
      // which may run while the internal auth lock is held (or while its
      // pendingInLock queue is draining). If we call fetchProfile() right
      // here, it triggers supabase.from().select() → _useSession() →
      // _acquireLock(), which tries to re-acquire the same lock → DEADLOCK.
      // By deferring to the next event-loop tick, the lock is released first.
      setTimeout(() => {
        session.value = newSession
        user.value = newSession?.user ?? null
        if (newSession?.user) {
          fetchProfile(newSession.user.id).catch((e) =>
            console.warn('[WWT] Auth state change fetchProfile error (ignored):', e)
          )
        } else {
          isAdmin.value = false
          isPremium.value = false
          subscriptionStatus.value = 'inactive'
          subscriptionEndDate.value = null
        }
      }, 0)
    })
  }

  async function signIn(email: string, password: string) {
    isLoading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      user.value = data.user
      session.value = data.session
      if (data.user) await fetchProfile(data.user.id)
    } finally {
      isLoading.value = false
    }
  }

  async function signUp(email: string, password: string) {
    isLoading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      user.value = data.user
      session.value = data.session
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function signInWithGoogle() {
    isLoading.value = true
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
    isAdmin.value = false
    isPremium.value = false
    subscriptionStatus.value = 'inactive'
    subscriptionEndDate.value = null
    try { localStorage.removeItem(AUTH_PROFILE_KEY) } catch { }
  }

  return {
    user,
    session,
    isLoading,
    isAdmin,
    isPremium,
    subscriptionStatus,
    subscriptionEndDate,
    isInitialized,
    membershipRole,
    isAuthenticated,
    shouldShowAuthUI,
    initialize,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    fetchProfile,
  }
})
