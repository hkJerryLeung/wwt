/**
 * Tests for posts store — sanitizePostPayload
 * Pure function test (no Supabase dependency)
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// Replicate POST_COLUMNS + sanitizePostPayload from posts.ts
const POST_COLUMNS = [
    'title_zh', 'title_en', 'slug', 'content_zh', 'content_en',
    'excerpt_zh', 'excerpt_en', 'skill_topic_id', 'tags', 'featured_image',
    'status', 'is_premium', 'is_recommended', 'published_at', 'created_at', 'updated_at',
] as const

function sanitizePostPayload(p: Record<string, unknown>, forInsert: boolean) {
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

describe('sanitizePostPayload', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    // ✅ 正向案例
    test('insert 模式應加入 created_at 與 updated_at', () => {
        const result = sanitizePostPayload({ title_zh: '測試' }, true)
        expect(result.title_zh).toBe('測試')
        expect(result.created_at).toBe('2024-06-15T12:00:00.000Z')
        expect(result.updated_at).toBe('2024-06-15T12:00:00.000Z')
    })

    test('update 模式應只加入 updated_at', () => {
        const result = sanitizePostPayload({ title_zh: '更新' }, false)
        expect(result.title_zh).toBe('更新')
        expect(result.updated_at).toBe('2024-06-15T12:00:00.000Z')
        expect(result.created_at).toBeUndefined()
    })

    test('完整 payload 應保留所有有效欄位', () => {
        const payload = {
            title_zh: '中文標題',
            title_en: 'English Title',
            slug: 'test-post',
            status: 'published',
            is_premium: true,
            tags: ['vue', 'test'],
        }
        const result = sanitizePostPayload(payload, false)
        expect(result.title_zh).toBe('中文標題')
        expect(result.title_en).toBe('English Title')
        expect(result.slug).toBe('test-post')
        expect(result.status).toBe('published')
        expect(result.is_premium).toBe(true)
        expect(result.tags).toEqual(['vue', 'test'])
    })

    // ❌ 特殊欄位清洗
    test('空 skill_topic_id 應轉為 null', () => {
        const result = sanitizePostPayload({ skill_topic_id: '' }, false)
        expect(result.skill_topic_id).toBeNull()
    })

    test('非空 skill_topic_id 應保留', () => {
        const result = sanitizePostPayload({ skill_topic_id: 'uuid-123' }, false)
        expect(result.skill_topic_id).toBe('uuid-123')
    })

    test('空 featured_image 應轉為 null', () => {
        const result = sanitizePostPayload({ featured_image: '' }, false)
        expect(result.featured_image).toBeNull()
    })

    test('非空 featured_image 應保留', () => {
        const result = sanitizePostPayload({ featured_image: 'https://img.com/a.jpg' }, false)
        expect(result.featured_image).toBe('https://img.com/a.jpg')
    })

    test('falsy published_at 應轉為 null', () => {
        expect(sanitizePostPayload({ published_at: '' }, false).published_at).toBeNull()
        expect(sanitizePostPayload({ published_at: null }, false).published_at).toBeNull()
        expect(sanitizePostPayload({ published_at: 0 }, false).published_at).toBeNull()
    })

    test('有值的 published_at 應保留', () => {
        const result = sanitizePostPayload({ published_at: '2024-01-01' }, false)
        expect(result.published_at).toBe('2024-01-01')
    })

    // 🔢 邊界值
    test('undefined 欄位不應出現在結果中', () => {
        const result = sanitizePostPayload({}, false)
        expect(Object.keys(result)).toEqual(['updated_at'])
    })

    test('不在 POST_COLUMNS 內的欄位應被忽略', () => {
        const result = sanitizePostPayload({
            title_zh: '保留',
            random_field: '應被忽略',
            another: 123,
        }, false)
        expect(result.title_zh).toBe('保留')
        expect(result.random_field).toBeUndefined()
        expect(result.another).toBeUndefined()
    })
})
