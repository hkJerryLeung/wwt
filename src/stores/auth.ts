import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/plugins/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isLoading = ref(false)
  const isAdmin = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    isAdmin.value = data?.is_admin ?? false
  }

  async function initialize() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null
    if (data.session?.user) {
      await fetchProfile(data.session.user.id)
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      if (newSession?.user) {
        await fetchProfile(newSession.user.id)
      } else {
        isAdmin.value = false
      }
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
  }

  return {
    user,
    session,
    isLoading,
    isAdmin,
    isAuthenticated,
    initialize,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }
})
