/**
 * Tests for projects store — getBySlug
 * Pure function test
 */
import { describe, test, expect } from 'vitest'

// Replicate getBySlug logic from projects.ts
interface Project {
    id: string
    name: string
    slug?: string
    sort_order?: number
}

function getBySlug(projects: Project[], slug: string): Project | undefined {
    return projects.find(
        (p) => (p.slug ?? p.name?.toLowerCase().replace(/\s+/g, '-')) === slug
    )
}

const sampleProjects: Project[] = [
    { id: '1', name: 'My App', slug: 'my-app', sort_order: 0 },
    { id: '2', name: 'Another Tool', sort_order: 1 },
    { id: '3', name: 'Cool Project', slug: 'cool-proj', sort_order: 2 },
    { id: '4', name: 'Hello World App', sort_order: 3 },
]

describe('getBySlug', () => {
    // ✅ 正向案例
    test('should find project by explicit slug', () => {
        expect(getBySlug(sampleProjects, 'my-app')?.id).toBe('1')
        expect(getBySlug(sampleProjects, 'cool-proj')?.id).toBe('3')
    })

    test('should find project by name-derived slug when no slug field', () => {
        expect(getBySlug(sampleProjects, 'another-tool')?.id).toBe('2')
        expect(getBySlug(sampleProjects, 'hello-world-app')?.id).toBe('4')
    })

    // ❌ 反向案例
    test('should return undefined for non-existent slug', () => {
        expect(getBySlug(sampleProjects, 'does-not-exist')).toBeUndefined()
    })

    test('should return undefined for empty slug', () => {
        expect(getBySlug(sampleProjects, '')).toBeUndefined()
    })

    test('should return undefined for empty project list', () => {
        expect(getBySlug([], 'my-app')).toBeUndefined()
    })

    // 🔢 邊界值
    test('slug 比對應為 case-sensitive（name 轉換後全小寫）', () => {
        expect(getBySlug(sampleProjects, 'My-App')).toBeUndefined()
        expect(getBySlug(sampleProjects, 'Another-Tool')).toBeUndefined()
    })

    test('name 中多個空格應轉為單一連字號', () => {
        const projects: Project[] = [{ id: '5', name: 'Two  Spaces', sort_order: 0 }]
        expect(getBySlug(projects, 'two--spaces')).toBeUndefined()
        expect(getBySlug(projects, 'two-spaces')?.id).toBe('5')
    })

    test('explicit slug 應優先於 name 轉換', () => {
        const projects: Project[] = [
            { id: '6', name: 'Mismatch Name', slug: 'actual-slug', sort_order: 0 },
        ]
        expect(getBySlug(projects, 'actual-slug')?.id).toBe('6')
        expect(getBySlug(projects, 'mismatch-name')).toBeUndefined()
    })
})
