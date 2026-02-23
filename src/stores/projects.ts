import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/plugins/supabase'
import type { Project } from '@/types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchProjects() {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order')

      if (error) throw error
      projects.value = (data ?? []) as Project[]
    } catch {
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  /** 依 slug 取得單一 App（用於產品頁） */
  function getBySlug(slug: string): Project | undefined {
    return projects.value.find(
      (p) => (p.slug ?? p.name?.toLowerCase().replace(/\s+/g, '-')) === slug
    )
  }

  /** 供導航「自家程式」下拉與產品頁用：所有有 id 的專案（有 name 或 slug 則用於顯示／連結） */
  const appsWithSlug = computed(() =>
    projects.value
      .filter((p) => p != null && p.id != null)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  )

  async function saveProject(project: Partial<Project>) {
    if (project.id) {
      const { error } = await supabase.from('projects').update(project).eq('id', project.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('projects').insert(project)
      if (error) throw error
    }
  }

  async function deleteProject(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    projects.value = projects.value.filter(p => p.id !== id)
  }

  return {
    projects,
    isLoading,
    hasError,
    fetchProjects,
    saveProject,
    deleteProject,
    getBySlug,
    appsWithSlug,
  }
})
