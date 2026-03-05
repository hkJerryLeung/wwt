<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLocale } from '@/composables/useLocale'

const props = defineProps<{
  title: string
}>()

const { t } = useLocale()

// --- Like ---
const likeCount = ref(0)
const isLiked = ref(false)
function toggleLike() {
  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1
}

// --- Share dropdown ---
const showShareMenu = ref(false)
const shareRef = ref<HTMLElement | null>(null)
const linkCopied = ref(false)

function toggleShareMenu() {
  showShareMenu.value = !showShareMenu.value
  linkCopied.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (shareRef.value && !shareRef.value.contains(e.target as Node)) {
    showShareMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
      showShareMenu.value = false
    }, 1200)
  } catch {
    // fallback
    const input = document.createElement('input')
    input.value = window.location.href
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
      showShareMenu.value = false
    }, 1200)
  }
}

function shareOnX() {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(props.title)
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer')
  showShareMenu.value = false
}

function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer')
  showShareMenu.value = false
}
</script>

<template>
  <div class="article-actions">
    <!-- Like -->
    <button
      type="button"
      class="action-btn"
      :class="{ 'is-liked': isLiked }"
      @click="toggleLike"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon" :class="{ 'fill-current': isLiked }">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span v-if="likeCount > 0" class="action-count">{{ likeCount }}</span>
    </button>

    <!-- Comment -->
    <button type="button" class="action-btn">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>

    <!-- Share -->
    <div ref="shareRef" class="share-wrapper">
      <button type="button" class="action-btn" @click.stop="toggleShareMenu">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      <!-- Share dropdown -->
      <Transition name="share-menu">
        <div v-if="showShareMenu" class="share-dropdown">
          <p class="share-dropdown-title">Share a preview of this post</p>

          <button type="button" class="share-option" @click="copyLink">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="share-option-icon">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>{{ linkCopied ? t('workshop.link_copied') : t('workshop.copy_link') }}</span>
          </button>

          <button type="button" class="share-option" @click="shareOnX">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="share-option-icon">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>{{ t('workshop.share_x') }}</span>
          </button>

          <button type="button" class="share-option" @click="shareOnFacebook">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="share-option-icon">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>{{ t('workshop.share_facebook') }}</span>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.article-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid var(--color-bp-border);
  background: rgba(31, 31, 31, 0.8);
  color: var(--color-bp-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  backdrop-filter: blur(8px);
}

.action-btn:hover {
  border-color: var(--color-bp-border-strong);
  color: var(--color-bp-white);
  background: rgba(31, 31, 31, 0.95);
}

.action-btn.is-liked {
  color: var(--color-bp-accent-bright);
  border-color: rgba(198, 1, 24, 0.3);
}

.action-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.action-icon.fill-current {
  fill: currentColor;
}

.action-count {
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1;
}

/* Share wrapper */
.share-wrapper {
  position: relative;
}

.share-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: rgba(30, 30, 30, 0.97);
  border: 1px solid var(--color-bp-border);
  border-radius: 12px;
  padding: 0.75rem 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
  z-index: 50;
}

.share-dropdown-title {
  padding: 0.25rem 1rem 0.625rem;
  font-size: 0.8rem;
  color: var(--color-bp-muted);
  border-bottom: 1px solid var(--color-bp-border);
  margin-bottom: 0.375rem;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  color: var(--color-bp-subtle);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  text-align: left;
}

.share-option:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-bp-white);
}

.share-option-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Transition */
.share-menu-enter-active,
.share-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.share-menu-enter-from,
.share-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
