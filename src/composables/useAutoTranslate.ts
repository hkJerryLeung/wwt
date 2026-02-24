import { ref, type Ref } from 'vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const CACHE_PREFIX = 'wwt-translate-'

/**
 * Check if a TipTap JSON document is "empty"
 * (null, undefined, or only contains an empty paragraph)
 */
function isTiptapEmpty(content: Record<string, unknown> | null | undefined): boolean {
    if (!content) return true
    const c = content as any
    if (c.type !== 'doc') return true
    if (!Array.isArray(c.content) || c.content.length === 0) return true
    // Exactly one empty paragraph
    if (
        c.content.length === 1 &&
        c.content[0].type === 'paragraph' &&
        !c.content[0].content
    ) {
        return true
    }
    return false
}

/**
 * Try to get cached translation from localStorage
 */
function getCached(postId: string): Record<string, unknown> | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + postId)
        if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return null
}

/**
 * Cache translation to localStorage
 */
function setCache(postId: string, content: Record<string, unknown>) {
    try {
        localStorage.setItem(CACHE_PREFIX + postId, JSON.stringify(content))
    } catch { /* ignore if storage full */ }
}

/**
 * Composable that auto-translates TipTap content from Chinese to English.
 * Returns reactive refs for the translated content and loading state.
 */
export function useAutoTranslate() {
    const translatedContent: Ref<Record<string, unknown> | null> = ref(null)
    const isTranslating = ref(false)

    /**
     * Translate the Chinese TipTap content for a given post.
     * Uses localStorage cache to avoid repeated API calls.
     */
    async function translate(postId: string, contentZh: Record<string, unknown> | null) {
        translatedContent.value = null
        isTranslating.value = false

        if (!contentZh || isTiptapEmpty(contentZh)) return

        // Check cache first
        const cached = getCached(postId)
        if (cached) {
            translatedContent.value = cached
            return
        }

        // Call Edge Function
        isTranslating.value = true
        try {
            const resp = await fetch(`${SUPABASE_URL}/functions/v1/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contentZh, from: 'zh', to: 'en' }),
            })
            const data = await resp.json()
            if (data.translated) {
                translatedContent.value = data.translated
                setCache(postId, data.translated)
            }
        } catch (err) {
            console.warn('[useAutoTranslate] Translation failed:', err)
        } finally {
            isTranslating.value = false
        }
    }

    return {
        translatedContent,
        isTranslating,
        translate,
        isTiptapEmpty,
    }
}
