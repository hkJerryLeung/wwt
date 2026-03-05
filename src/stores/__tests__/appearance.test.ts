/**
 * Tests for appearance store — parsePayload + brightenHex
 * Pure functions extracted for isolated testing
 */
import { describe, test, expect } from 'vitest'

// Replicate parsePayload from appearance.ts
function parsePayload(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') return {}
    const p = value as Record<string, unknown>
    const grid = p.gridStyle as string
    const validGrid = grid === 'none' || grid === 'normal' || grid === 'dense' ? grid : undefined
    const bgType = p.backgroundType as string
    const validBgType = bgType === 'grid' || bgType === 'solid' || bgType === 'image' ? bgType : undefined
    return {
        accentColor: typeof p.accentColor === 'string' ? p.accentColor : undefined,
        logoUrl: typeof p.logoUrl === 'string' ? p.logoUrl : undefined,
        siteName: typeof p.siteName === 'string' ? p.siteName : undefined,
        gridStyle: validGrid,
        backgroundType: validBgType,
        backgroundColor: typeof p.backgroundColor === 'string' ? p.backgroundColor : undefined,
        backgroundImageUrl: typeof p.backgroundImageUrl === 'string' ? p.backgroundImageUrl : undefined,
    }
}

// Replicate brightenHex from appearance.ts
const DEFAULT_ACCENT_BRIGHT = '#c60118'
function brightenHex(hex: string, factor = 1.3): string {
    const m = hex.replace(/^#/, '').match(/.{2}/g)
    if (!m || m.length !== 3) return DEFAULT_ACCENT_BRIGHT
    const r = Math.min(255, Math.round(parseInt(m[0] ?? '0', 16) * factor))
    const g = Math.min(255, Math.round(parseInt(m[1] ?? '0', 16) * factor))
    const b = Math.min(255, Math.round(parseInt(m[2] ?? '0', 16) * factor))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

describe('parsePayload', () => {
    // ✅ 正向案例
    test('有效 payload 應正確解析所有欄位', () => {
        const result = parsePayload({
            accentColor: '#ff0000',
            logoUrl: '/logo.png',
            siteName: 'Test',
            gridStyle: 'dense',
            backgroundType: 'solid',
            backgroundColor: '#000',
            backgroundImageUrl: 'https://example.com/bg.jpg',
        })
        expect(result.accentColor).toBe('#ff0000')
        expect(result.logoUrl).toBe('/logo.png')
        expect(result.siteName).toBe('Test')
        expect(result.gridStyle).toBe('dense')
        expect(result.backgroundType).toBe('solid')
        expect(result.backgroundColor).toBe('#000')
        expect(result.backgroundImageUrl).toBe('https://example.com/bg.jpg')
    })

    // ❌ 反向案例
    test('null 應回傳空物件', () => {
        expect(parsePayload(null)).toEqual({})
    })

    test('undefined 應回傳空物件', () => {
        expect(parsePayload(undefined)).toEqual({})
    })

    test('字串應回傳空物件', () => {
        expect(parsePayload('hello')).toEqual({})
    })

    test('數字應回傳空物件', () => {
        expect(parsePayload(42)).toEqual({})
    })

    // 🔢 邊界值測試
    test('gridStyle 無效值應為 undefined', () => {
        const result = parsePayload({ gridStyle: 'invalid' })
        expect(result.gridStyle).toBeUndefined()
    })

    test('backgroundType 無效值應為 undefined', () => {
        const result = parsePayload({ backgroundType: 'gradient' })
        expect(result.backgroundType).toBeUndefined()
    })

    test('非字串型別值應被忽略', () => {
        const result = parsePayload({
            accentColor: 123,
            logoUrl: true,
            siteName: [],
        })
        expect(result.accentColor).toBeUndefined()
        expect(result.logoUrl).toBeUndefined()
        expect(result.siteName).toBeUndefined()
    })

    test('gridStyle 三種有效值都應通過', () => {
        expect(parsePayload({ gridStyle: 'none' }).gridStyle).toBe('none')
        expect(parsePayload({ gridStyle: 'normal' }).gridStyle).toBe('normal')
        expect(parsePayload({ gridStyle: 'dense' }).gridStyle).toBe('dense')
    })

    test('backgroundType 三種有效值都應通過', () => {
        expect(parsePayload({ backgroundType: 'grid' }).backgroundType).toBe('grid')
        expect(parsePayload({ backgroundType: 'solid' }).backgroundType).toBe('solid')
        expect(parsePayload({ backgroundType: 'image' }).backgroundType).toBe('image')
    })
})

describe('brightenHex', () => {
    // ✅ 正向案例
    test('應正確調亮 #990011', () => {
        const result = brightenHex('#990011')
        // #990011 → R=153*1.3=199=c7, G=0*1.3=0=00, B=17*1.3=22=16
        expect(result).toBe('#c70016')
    })

    test('應支援不帶 # 的 hex', () => {
        const result = brightenHex('990011')
        expect(result).toBe('#c70016')
    })

    test('白色應被 clamp 到 #ffffff', () => {
        const result = brightenHex('#ffffff')
        expect(result).toBe('#ffffff')
    })

    test('黑色應保持 #000000', () => {
        const result = brightenHex('#000000')
        expect(result).toBe('#000000')
    })

    // ❌ 反向案例
    test('無效 hex（太短）應回傳 DEFAULT_ACCENT_BRIGHT', () => {
        expect(brightenHex('#abc')).toBe(DEFAULT_ACCENT_BRIGHT)
    })

    test('空字串應回傳 DEFAULT_ACCENT_BRIGHT', () => {
        expect(brightenHex('')).toBe(DEFAULT_ACCENT_BRIGHT)
    })

    test('完全無效字串應回傳 DEFAULT_ACCENT_BRIGHT', () => {
        expect(brightenHex('not-a-color')).toBe(DEFAULT_ACCENT_BRIGHT)
    })

    // 🔢 邊界值
    test('自訂 factor 應生效', () => {
        const result = brightenHex('#800000', 2)
        // R=128*2=256 → clamp to 255=ff
        expect(result).toBe('#ff0000')
    })
})
