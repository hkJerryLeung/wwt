import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import type { Post, Category } from '@/types'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const categories = ref<Category[]>([])
  const currentPost = ref<Post | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchPosts(categorySlug?: string) {
    isLoading.value = true
    hasError.value = false
    try {
      let query = supabase
        .from('posts')
        .select('*, skill_topics(*, skill_sub_categories(*, skill_main_categories(*)))')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (categorySlug) {
        // We'll need to figure out how to filter this based on slug
        // For now, if filtering by main category slug, we'd need an inner join or a View. 
        // As a temporary measure, we will leave the slug filter out, or filter client-side.
      }

      const { data, error } = await query
      if (error) throw error
      posts.value = data ?? []
    } catch {
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPostBySlug(slug: string) {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, skill_topics(*, skill_sub_categories(*, skill_main_categories(*)))')
        .eq('slug', slug)
        .single()

      if (error) throw error
      currentPost.value = data
    } catch {
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')

    if (!error && data) {
      categories.value = data
    }
  }

  async function fetchAllPosts() {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, skill_topics(*, skill_sub_categories(*, skill_main_categories(*)))')
        .order('created_at', { ascending: false })

      if (error) throw error
      posts.value = data ?? []
    } finally {
      isLoading.value = false
    }
  }

  const POST_COLUMNS = [
    'title_zh', 'title_en', 'slug', 'content_zh', 'content_en',
    'excerpt_zh', 'excerpt_en', 'skill_topic_id', 'tags', 'featured_image',
    'status', 'is_premium', 'published_at', 'created_at', 'updated_at',
  ] as const

  function sanitizePostPayload(p: Partial<Post>, forInsert: boolean) {
    const row: Record<string, unknown> = {}
    for (const key of POST_COLUMNS) {
      const val = p[key]
      if (val === undefined) continue
      if (key === 'skill_topic_id' && val === '') {
        row[key] = null
        continue
      }
      if (key === 'featured_image' && val === '') {
        row[key] = null
        continue
      }
      if (key === 'published_at' && !val) {
        row[key] = null
        continue
      }
      row[key] = val
    }
    if (forInsert) {
      row.created_at = new Date().toISOString()
      row.updated_at = new Date().toISOString()
    } else {
      row.updated_at = new Date().toISOString()
    }
    return row
  }

  async function savePost(post: Partial<Post>) {
    const hasId = post.id && post.id.length > 0
    if (hasId) {
      const payload = sanitizePostPayload(post, false)
      const { data, error } = await supabase
        .from('posts')
        .update(payload)
        .eq('id', post.id)
        .select('id')
        .single()
      if (error) throw error
      return data.id
    } else {
      const payload = sanitizePostPayload(post, true)
      const { data, error } = await supabase
        .from('posts')
        .insert(payload)
        .select('id')
        .single()
      if (error) throw error
      return data.id
    }
  }

  async function deletePost(id: string) {
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) throw error
    posts.value = posts.value.filter(p => p.id !== id)
  }

  return {
    posts,
    categories,
    currentPost,
    isLoading,
    hasError,
    fetchPosts,
    fetchPostBySlug,
    fetchCategories,
    fetchAllPosts,
    savePost,
    deletePost,
  }
})
