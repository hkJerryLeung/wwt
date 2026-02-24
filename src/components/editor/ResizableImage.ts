import Image from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ResizableImageView from './ResizableImageView.vue'

/**
 * Custom Image extension with drag-to-resize support.
 * Extends the official @tiptap/extension-image with a Vue NodeView
 * that adds a resize handle at the bottom-right corner.
 */
export const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    const width = element.getAttribute('width') || element.style.width
                    return width ? parseInt(width, 10) : null
                },
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.width) return {}
                    return { width: attributes.width }
                },
            },
            height: {
                default: null,
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.height) return {}
                    return { height: attributes.height }
                },
            },
        }
    },
    addNodeView() {
        return VueNodeViewRenderer(ResizableImageView)
    },
})
