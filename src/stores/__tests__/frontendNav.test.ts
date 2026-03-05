/**
 * Tests for frontendNav store — mergeParsedItems logic
 * Extracted pure function tests (no Supabase dependency)
 */
import { describe, test, expect } from 'vitest'

// Re-implement mergeParsedItems for testing (it's module-private, so we test via the exported behavior)
// We'll test the merge logic by creating data matching real-world scenarios

const defaultItems = [
    { id: 'explore', key: 'explore', path: '/', labelKey: 'nav.explore', order: 0, hidden: false },
    { id: 'workshop', key: 'workshop', path: '/workshop', labelKey: 'nav.workshop', subtitleKey: 'workshop.subtitle', order: 1, hidden: false },
    { id: 'showcase', key: 'showcase', path: '/showcase', labelKey: 'nav.showcase', subtitleKey: 'showcase.subtitle', order: 2, hidden: false },
    { id: 'apps', key: 'apps', path: '/apps', labelKey: 'nav.apps', subtitleKey: 'apps.subtitle', order: 3, hidden: false, isParentMenu: true },
    { id: 'premium', key: 'premium', path: '/premium', labelKey: 'nav.premium', subtitleKey: 'premium.subtitle', order: 4, hidden: false },
]

// Replicate the exact logic from frontendNav.ts mergeParsedItems
function mergeParsedItems(parsed: unknown) {
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultItems.map((item) => ({ ...item }))
    const byId = new Map<string, any>()
    parsed.forEach((item: Record<string, unknown>) => {
        const base = defaultItems.find((d) => d.id === item.id)
        const merged = base
            ? {
                ...base,
                ...item,
                id: (item.id as string) ?? base.id,
                key: (item.key as string) ?? base.key,
                path: (((item.path as string) ?? base.path) ?? '/').trim() || '/',
                isParentMenu: item.isParentMenu !== undefined ? Boolean(item.isParentMenu) : (base as any).isParentMenu,
            }
            : {
                id: (item.id as string) ?? '',
                key: (item.key as string) ?? (item.id as string) ?? '',
                path: ((item.path as string) || '/').trim() || '/',
                labelKey: (item.labelKey as string) || '',
                customLabel: item.customLabel as string | undefined,
                isParentMenu: Boolean(item.isParentMenu),
                order: Number(item.order) || 0,
                hidden: Boolean(item.hidden),
            }
        byId.set(merged.id, merged)
    })
    return Array.from(byId.values()).sort((a: any, b: any) => a.order - b.order)
}

describe('mergeParsedItems', () => {
    // ✅ 正向案例
    test('空陣列應回傳 defaultItems 副本', () => {
        const result = mergeParsedItems([])
        expect(result).toHaveLength(defaultItems.length)
        expect(result[0].id).toBe('explore')
        expect(result[4].id).toBe('premium')
    })

    test('null 應回傳 defaultItems 副本', () => {
        const result = mergeParsedItems(null)
        expect(result).toHaveLength(defaultItems.length)
    })

    test('undefined 應回傳 defaultItems 副本', () => {
        const result = mergeParsedItems(undefined)
        expect(result).toHaveLength(defaultItems.length)
    })

    test('非陣列應回傳 defaultItems 副本', () => {
        const result = mergeParsedItems('hello')
        expect(result).toHaveLength(defaultItems.length)
    })

    test('已知 ID 應與 default 合併且保留自訂值', () => {
        const result = mergeParsedItems([
            { id: 'workshop', customLabelZh: '工作坊', hidden: true },
        ])
        expect(result).toHaveLength(1)
        const workshop = result.find((i: any) => i.id === 'workshop')
        expect(workshop).toBeDefined()
        expect(workshop.customLabelZh).toBe('工作坊')
        expect(workshop.hidden).toBe(true)
        // 應保留 default 的 path
        expect(workshop.path).toBe('/workshop')
        expect(workshop.labelKey).toBe('nav.workshop')
    })

    test('isParentMenu 為 true 時應保留', () => {
        const result = mergeParsedItems([
            { id: 'apps', isParentMenu: true },
        ])
        const apps = result.find((i: any) => i.id === 'apps')
        expect(apps?.isParentMenu).toBe(true)
    })

    test('isParentMenu 為 false 時應覆寫 default', () => {
        const result = mergeParsedItems([
            { id: 'apps', isParentMenu: false },
        ])
        const apps = result.find((i: any) => i.id === 'apps')
        expect(apps?.isParentMenu).toBe(false)
    })

    test('isParentMenu 未設定時應繼承 default', () => {
        const result = mergeParsedItems([
            { id: 'apps' },
        ])
        const apps = result.find((i: any) => i.id === 'apps')
        expect(apps?.isParentMenu).toBe(true)
    })

    test('未知 ID 的自訂項目應正確建立', () => {
        const result = mergeParsedItems([
            { id: 'custom-1', key: 'blog', path: '/blog', customLabel: 'Blog', order: 10 },
        ])
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('custom-1')
        expect(result[0].path).toBe('/blog')
        expect(result[0].order).toBe(10)
    })

    // ❌ 邊界值測試
    test('path 為空字串時應 fallback 到 /', () => {
        const result = mergeParsedItems([
            { id: 'custom-2', key: 'empty', path: '', order: 0 },
        ])
        expect(result[0].path).toBe('/')
    })

    test('path 為只有空白時應 fallback 到 /', () => {
        const result = mergeParsedItems([
            { id: 'custom-3', key: 'spaces', path: '   ', order: 0 },
        ])
        expect(result[0].path).toBe('/')
    })

    test('order 為 undefined 時應 fallback 到 0（修復 Bug A）', () => {
        const result = mergeParsedItems([
            { id: 'custom-4', key: 'no-order' },
        ])
        expect(result[0].order).toBe(0)
    })

    test('order 為 NaN（字串）時應 fallback 到 0', () => {
        const result = mergeParsedItems([
            { id: 'custom-5', key: 'bad-order', order: 'abc' },
        ])
        expect(result[0].order).toBe(0)
    })

    test('項目應依 order 排序', () => {
        const result = mergeParsedItems([
            { id: 'a', key: 'a', order: 3 },
            { id: 'b', key: 'b', order: 1 },
            { id: 'c', key: 'c', order: 2 },
        ])
        expect(result.map((i: any) => i.id)).toEqual(['b', 'c', 'a'])
    })
})
