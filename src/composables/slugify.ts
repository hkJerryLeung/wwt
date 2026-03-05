/**
 * Shared slugify utility for all admin pages.
 * Converts text to URL-friendly slugs, supporting both English and Chinese characters.
 *
 * Usage:
 *   import { slugify } from '@/composables/slugify'
 *   slugify('Hello World')  // → 'hello-world'
 *   slugify('超級排序')      // → '超級排序'
 */
export function slugify(text: string): string {
    if (!text?.trim()) return ''
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}
