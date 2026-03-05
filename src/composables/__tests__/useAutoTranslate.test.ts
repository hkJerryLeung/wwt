/**
 * Tests for useAutoTranslate composable — isTiptapEmpty
 * Pure function test
 */
import { describe, test, expect } from 'vitest'

// Replicate isTiptapEmpty from useAutoTranslate.ts
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

describe('isTiptapEmpty', () => {
    // ✅ 應判為空的案例
    test('null 應為空', () => {
        expect(isTiptapEmpty(null)).toBe(true)
    })

    test('undefined 應為空', () => {
        expect(isTiptapEmpty(undefined)).toBe(true)
    })

    test('空物件應為空（type !== doc）', () => {
        expect(isTiptapEmpty({})).toBe(true)
    })

    test('type 不是 doc 應為空', () => {
        expect(isTiptapEmpty({ type: 'paragraph' })).toBe(true)
    })

    test('doc 無 content 應為空', () => {
        expect(isTiptapEmpty({ type: 'doc' })).toBe(true)
    })

    test('doc content 為空陣列應為空', () => {
        expect(isTiptapEmpty({ type: 'doc', content: [] })).toBe(true)
    })

    test('doc 只有一個空段落應為空', () => {
        expect(isTiptapEmpty({
            type: 'doc',
            content: [{ type: 'paragraph' }],
        })).toBe(true)
    })

    test('doc 只有一個段落 content 為 undefined 應為空', () => {
        expect(isTiptapEmpty({
            type: 'doc',
            content: [{ type: 'paragraph', content: undefined }],
        })).toBe(true)
    })

    // ❌ 應判為非空的案例
    test('doc 有段落含文字應為非空', () => {
        expect(isTiptapEmpty({
            type: 'doc',
            content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Hello' }],
            }],
        })).toBe(false)
    })

    test('doc 有多個段落應為非空', () => {
        expect(isTiptapEmpty({
            type: 'doc',
            content: [
                { type: 'paragraph' },
                { type: 'paragraph' },
            ],
        })).toBe(false)
    })

    test('doc 有 heading 節點應為非空', () => {
        expect(isTiptapEmpty({
            type: 'doc',
            content: [{ type: 'heading', attrs: { level: 1 } }],
        })).toBe(false)
    })

    test('doc 有圖片應為非空', () => {
        expect(isTiptapEmpty({
            type: 'doc',
            content: [{ type: 'image', attrs: { src: 'https://example.com/img.jpg' } }],
        })).toBe(false)
    })

    // 🔢 邊界值
    test('段落有空 content 陣列時應為非空', () => {
        // content: [] 是 truthy 所以不會進入 empty 分支
        expect(isTiptapEmpty({
            type: 'doc',
            content: [{ type: 'paragraph', content: [] }],
        })).toBe(false)
    })
})
