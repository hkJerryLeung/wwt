import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import type { Work } from '@/types'

export const useWorksStore = defineStore('works', () => {
  const works = ref<Work[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchWorks(category?: string) {
    isLoading.value = true
    hasError.value = false
    try {
      let query = supabase
        .from('works')
        .select('*')
        .order('sort_order')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      works.value = data ?? []
    } catch {
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function saveWork(work: Partial<Work>) {
    if (work.id) {
      const { error } = await supabase.from('works').update(work).eq('id', work.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('works').insert(work)
      if (error) throw error
    }
  }

  async function deleteWork(id: string) {
    const { error } = await supabase.from('works').delete().eq('id', id)
    if (error) throw error
    works.value = works.value.filter(w => w.id !== id)
  }

  return { works, isLoading, hasError, fetchWorks, saveWork, deleteWork }
})
