<script setup lang="ts">
import { ref, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps({
  ...nodeViewProps,
})

const imageRef = ref<HTMLImageElement | null>(null)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

const imageWidth = computed(() => {
  return props.node?.attrs?.width || null
})

const imageSrc = computed(() => props.node?.attrs?.src || '')
const imageAlt = computed(() => props.node?.attrs?.alt || '')
const imageTitle = computed(() => props.node?.attrs?.title || '')

const isSelected = computed(() => props.selected)

function onMouseDown(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  isResizing.value = true
  startX.value = event.clientX

  const img = imageRef.value
  if (img) {
    startWidth.value = img.offsetWidth
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(event: MouseEvent) {
  if (!isResizing.value) return
  const diff = event.clientX - startX.value
  const newWidth = Math.max(60, startWidth.value + diff)
  
  if (props.updateAttributes) {
    props.updateAttributes({ width: newWidth })
  }
}

function onMouseUp() {
  isResizing.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <NodeViewWrapper class="resizable-image-wrapper" :class="{ 'is-selected': isSelected, 'is-resizing': isResizing }">
    <div class="resizable-image-container" :style="imageWidth ? { width: `${imageWidth}px` } : {}">
      <img
        ref="imageRef"
        :src="imageSrc"
        :alt="imageAlt"
        :title="imageTitle"
        class="resizable-image"
        draggable="false"
      />
      <!-- Resize handle (bottom-right corner) -->
      <div
        class="resize-handle resize-handle--br"
        @mousedown="onMouseDown"
        title="Drag to resize"
      />
      <!-- Width indicator while resizing -->
      <div v-if="isResizing && imageWidth" class="resize-indicator">
        {{ Math.round(imageWidth) }}px
      </div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.resizable-image-wrapper {
  display: inline-block;
  max-width: 100%;
  line-height: 0;
}

.resizable-image-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.resizable-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 4px;
}

/* Selected / hover state */
.is-selected .resizable-image,
.resizable-image-wrapper:hover .resizable-image {
  border-color: #87ceeb;
}

.is-resizing .resizable-image {
  border-color: #87ceeb;
}

/* Resize handle */
.resize-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #87ceeb;
  border: 2px solid #111;
  border-radius: 3px;
  cursor: nwse-resize;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 10;
}

.resize-handle--br {
  bottom: 4px;
  right: 4px;
}

.is-selected .resize-handle,
.is-resizing .resize-handle,
.resizable-image-wrapper:hover .resize-handle {
  opacity: 1;
}

/* Width indicator */
.resize-indicator {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #87ceeb;
  font-size: 11px;
  font-family: monospace;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}
</style>
