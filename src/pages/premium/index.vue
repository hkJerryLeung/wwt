<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { usePageHeading } from '@/composables/usePageHeading'
import { useStripe } from '@/composables/useStripe'
import { useAuthStore } from '@/stores/auth'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePremiumSettingsStore } from '@/stores/premiumSettings'

gsap.registerPlugin(ScrollTrigger)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
usePageHeading('premium')
const { startCheckout, isLoading: stripeLoading, error: stripeError } = useStripe()
const premiumStore = usePremiumSettingsStore()

const showSuccessBanner = ref(false)
const showCanceledBanner = ref(false)

let ctx: gsap.Context | null = null

/* ── Tab Navigation ── */
const tabs = [
  { label: '計畫簡介', id: 'section-intro' },
  { label: '專屬特色', id: 'section-audience' },
  { label: '文章與工具', id: 'section-curriculum' },
  { label: '會員迴響', id: 'section-comparison' },
  { label: '常見問題', id: 'section-faq' },
]
const activeTab = ref('section-intro')

function scrollToSection(sectionId: string) {
  activeTab.value = sectionId
  const el = document.getElementById(sectionId)
  if (!el) return
  // Account for sticky navbar + sticky tab bar height
  const offset = 140
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

// Check for success/canceled query params from Stripe redirect
onMounted(() => {
  if (route.query.success === 'true') {
    showSuccessBanner.value = true
    // Refresh profile to get updated premium status
    if (authStore.user) {
      authStore.fetchProfile(authStore.user.id)
    }
    // Clean the URL
    router.replace({ query: {} })
  }
  if (route.query.canceled === 'true') {
    showCanceledBanner.value = true
    router.replace({ query: {} })
  }

  // Initialize GSAP scroll animations for the timeline + tab tracking
  ctx = gsap.context(() => {
    // ScrollTrigger for active tab tracking
    tabs.forEach((tab) => {
      const section = document.getElementById(tab.id)
      if (section) {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 30%',
          end: 'bottom 30%',
          onEnter: () => { activeTab.value = tab.id },
          onEnterBack: () => { activeTab.value = tab.id },
        })
      }
    })

    const items = gsap.utils.toArray('.timeline-item')
    items.forEach((item: any) => {
      const dot = item.querySelector('.timeline-dot')
      const lineFill = item.querySelector('.timeline-line-fill')
      const content = item.querySelector('.timeline-content')

      // Animate node dot (from gray to glowing red)
      if (dot) {
        gsap.fromTo(dot, 
          { backgroundColor: '#4B5563', boxShadow: 'none' }, // gray-600
          { 
            backgroundColor: '#990011', // WWT Red
            boxShadow: '0 0 12px rgba(153, 0, 17, 0.9)',
            duration: 0.6,
            scrollTrigger: {
              trigger: item,
              start: 'top 60%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      }

      // Animate content fading in and sliding right
      if (content) {
        gsap.fromTo(content,
          { opacity: 0, x: -20 },
          { 
            opacity: 1, x: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 75%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      }

      // Animate line fill drawing down as you scroll past the item
      if (lineFill) {
        gsap.fromTo(lineFill, 
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: item,
              start: 'top 60%',
              end: 'bottom 60%',
              scrub: 0.5 // Add slight smoothing to the scrub
            }
          }
        )
      }
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})

/* ── FAQ ── */
const openedFaqIndex = ref<number | null>(null)
function toggleFaq(i: number) {
  openedFaqIndex.value = openedFaqIndex.value === i ? null : i
}

interface PremiumFaqItem {
  category: string
  question: string
  answer: string
}

const premiumFaqItems: PremiumFaqItem[] = [
  // 訂閱內容
  { category: '訂閱內容', question: '這個計畫適合完全沒用過 AI 工具的人嗎？', answer: '適合。會員專屬文章從最基礎的概念出發，即使你從未用過 ChatGPT 或 Midjourney，也能跟上進度。我們會提供從「什麼是 Prompt」開始的系統性 AI 工作流指南。' },
  { category: '訂閱內容', question: '內容會隨著 AI 工具更新嗎？', answer: '會。AI 工具迭代快速，我們承諾在主要工具（如 ChatGPT、Claude、Midjourney）發生重大更新時，提供補充文章與最新工具實踐，確保你獲得的資源不會過時。' },
  { category: '訂閱內容', question: '訂閱包含哪些具體內容？', answer: '訂閱後，你可以存取所有會員獨享的深度文章、AI 實用工具、專屬 Prompt 範本庫，以及隨時更新的實作專案與資源包。' },
  { category: '訂閱內容', question: '有提供實作練習或範本嗎？', answer: '有。許多文章與主題都附有 Prompt 範本庫、實作專案練習題，以及可直接下載使用的資源包，讓你學完馬上就能應用在工作中。' },
  // 購買與帳戶
  { category: '購買與帳戶', question: '訂閱後可以存取多久？', answer: '在你的訂閱期間內，即享有完整存取權限，不限瀏覽次數。未來的文章與工具更新也會自動為你開放。' },
  { category: '購買與帳戶', question: '可以在多台裝置上閱讀嗎？', answer: '可以。只要登入你的 WWT 帳號，就能在電腦、平板、手機等任何裝置上閱讀文章與使用工具，不限裝置數量。' },
  { category: '購買與帳戶', question: '有提供退款嗎？', answer: '由於數位內容的性質，訂閱後即不提供退款。但你可以隨時取消未來的續訂。如有特別情況，請聯繫客服。' },
  // 學習支援
  { category: '學習支援', question: '遇到問題可以發問嗎？', answer: '可以。Premium 會員享有專屬交流群組，你可以在群組中針對個人工作流的卡關進行提問，也能與其他會員交流討論。' },
  { category: '學習支援', question: '文章與工具有中文介面嗎？', answer: '會員專屬文章全程以中文撰寫，工具也會提供詳盡的中文操作指南，確保你能輕鬆理解每一個概念與操作步驟。' },
]

const faqCategories = computed(() => {
  const cats: Record<string, PremiumFaqItem[]> = {}
  for (const item of premiumFaqItems) {
    if (!cats[item.category]) cats[item.category] = []
    cats[item.category]!.push(item)
  }
  return cats
})

async function handleJoinPremium() {
  if (!authStore.isAuthenticated) {
    router.push('/auth/login')
    return
  }

  // TODO: Replace with your Stripe Price ID after creating it in Stripe Dashboard
  // This is a placeholder — you need to create a product in Stripe and paste the price_id here
  const PREMIUM_PRICE_ID = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || 'price_REPLACE_ME'
  await startCheckout(PREMIUM_PRICE_ID, 'subscription')
}

function dismissBanner() {
  showSuccessBanner.value = false
  showCanceledBanner.value = false
}
</script>

<template>
  <div class="bg-black text-white w-full min-h-screen pb-20">
    
    <!-- Success Banner -->
    <div class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 pointer-events-none">
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showSuccessBanner"
          class="pointer-events-auto border border-green-500/30 bg-green-900/90 backdrop-blur-md p-4 text-center rounded-lg shadow-xl"
        >
          <p class="font-blueprint text-white">{{ t('premium.success_title') }}</p>
          <p class="mt-1 text-sm text-green-100">{{ t('premium.success_message') }}</p>
          <button class="mt-2 text-xs text-green-200 underline" @click="dismissBanner">✕</button>
        </div>
      </Transition>

      <!-- Canceled Banner -->
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showCanceledBanner"
          class="pointer-events-auto border border-yellow-500/30 bg-yellow-900/90 backdrop-blur-md p-4 text-center rounded-lg shadow-xl"
        >
          <p class="text-sm text-yellow-100">{{ t('premium.canceled_message') }}</p>
          <button class="mt-2 text-xs text-yellow-200 underline" @click="dismissBanner">✕</button>
        </div>
      </Transition>
    </div>

    <!-- Section 1: Hero with Right Panel -->
    <div 
      class="relative w-full bg-cover bg-center min-h-[60vh] flex items-center" 
      :style="`background-image: url('${premiumStore.effective('heroBgImage') || '/images/premium/ai-hero-bg.png'}');`"
    >
      <!-- Overlay to darken background -->
      <div class="absolute inset-0 bg-black/60"></div>

      <div class="mx-auto w-full max-w-[1400px] relative z-10 flex justify-end px-4 sm:px-12 py-10 mt-12">
        <!-- Right Floating Panel -->
        <div class="w-full max-w-[420px] rounded-xl bg-black/80 backdrop-blur-md text-white p-8 shadow-2xl relative border border-white/10">
          <p class="text-xs text-gray-400 mb-2 tracking-widest uppercase">{{ premiumStore.effective('heroSubtitle') || 'WWT 會員訂閱計畫 · 全新上線' }}</p>
          <h1 class="text-3xl font-bold mb-3 tracking-widest text-white">{{ premiumStore.effective('heroTitle') || 'WWT Premium' }}</h1>
          <p class="text-sm text-gray-400 mb-8 border-b border-gray-800 pb-6">{{ premiumStore.effective('heroDescription') || '解鎖會員獨享深度文章與實用 AI 工具，掌握未來工作型態' }}</p>
          
          <div class="flex items-end justify-between mb-4">
            <div class="text-4xl font-bold tracking-tight">{{ premiumStore.effective('heroPrice') || 'NT$8,000' }} <span class="text-lg text-gray-400 font-normal">{{ premiumStore.effective('heroPriceUnit') || '/ 年' }}</span></div>
            <div class="flex items-center gap-1 bg-white/10 text-gray-300 text-[11px] px-2.5 py-1 rounded">
              <span class="text-[10px]">★</span> {{ premiumStore.effective('heroBadge') || '專屬會員' }}
            </div>
          </div>

          <div class="flex gap-2 mb-4">
            <span class="bg-white/10 text-white text-xs px-2.5 py-1 rounded border border-white/20 font-medium tracking-wide">{{ premiumStore.effective('heroTag1') || '隨時存取' }}</span>
            <span class="border border-gray-600 text-gray-300 text-xs px-2.5 py-1 rounded flex items-center gap-1.5 font-medium tracking-wide">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              {{ premiumStore.effective('heroTag2') || '無限存取文章與工具' }}
            </span>
          </div>

          <div class="flex gap-2 mb-8">
            <span class="border border-gray-700 text-gray-400 text-[11px] px-3 py-1.5 rounded tracking-wider">{{ premiumStore.effective('heroTag3') || '深度文章' }}</span>
            <span class="border border-gray-700 text-gray-400 text-[11px] px-3 py-1.5 rounded tracking-wider">{{ premiumStore.effective('heroTag4') || '實用工具' }}</span>
          </div>

          <!-- Carousel placeholder -->
          <div class="flex items-center justify-between border-t border-b border-gray-800 py-5 mb-8">
            <button class="text-gray-600 hover:text-white transition-colors">&lt;</button>
            <p class="text-xs text-center text-gray-400 px-4 leading-relaxed tracking-wide">
              {{ premiumStore.effective('heroQuote') || '「AI 不是來取代你，而是要成為你最強大的副駕」— 善用工具與知識，讓效率翻倍。' }}
            </p>
            <button class="text-gray-600 hover:text-white transition-colors">&gt;</button>
          </div>

          <!-- Buy Button -->
          <button
            v-if="authStore.isPremium"
            class="w-full bg-white/30 text-white/50 py-3.5 rounded text-sm font-medium mb-3 cursor-not-allowed tracking-wider"
            disabled
          >
            {{ t('premium.already_premium') }}
          </button>
          <button
            v-else
            class="w-full bg-white hover:bg-gray-200 text-black py-3.5 rounded text-sm font-medium transition-colors duration-200 mb-3 flex justify-center items-center tracking-wider"
            :disabled="stripeLoading"
            @click="handleJoinPremium"
          >
            <template v-if="stripeLoading">
              <svg class="mr-2 h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              處理中...
            </template>
            <template v-else-if="!authStore.isAuthenticated">
              {{ premiumStore.effective('heroButtonText') || '登入以訂閱 · NT$8,000 / 年' }}
            </template>
            <template v-else>
              {{ premiumStore.effective('heroButtonText') || '立即訂閱 · NT$8,000 / 年' }}
            </template>
          </button>
          
          <p v-if="stripeError" class="mb-4 text-center text-xs text-red-400">{{ stripeError }}</p>

          <div class="text-center mt-4">
            <button class="text-xs text-gray-500 hover:text-white transition-colors duration-200 tracking-wider">分享計畫</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Tab Bar -->
    <div class="sticky top-[64px] sm:top-[72px] z-40 w-full bg-black border-b border-gray-800/60 shadow-lg">
      <div class="mx-auto max-w-[1400px] px-4 sm:px-12 flex gap-8 py-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'text-sm py-1.5 font-medium transition-colors duration-200',
            activeTab === tab.id
              ? 'bg-white text-black px-5 rounded-full'
              : 'text-gray-400 hover:text-white'
          ]"
          @click="scrollToSection(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Section 2: Storyline -->
    <div id="section-intro" class="w-full bg-black py-24 sm:py-32">
      <div class="mx-auto max-w-[900px] px-4 sm:px-6">
        <h2 class="text-3xl sm:text-4xl md:text-[42px] font-sans text-center mb-10 tracking-[0.1em] leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 font-bold">
          {{ premiumStore.effective('introHeadline') || '「那些讓你驚豔的 AI 應用，原來藏著你從未掌握的提示詞技巧。」' }}
        </h2>
        
        <div class="text-gray-300 text-[15px] sm:text-[17px] leading-8 sm:leading-10 tracking-wide space-y-6 text-justify mx-auto max-w-[700px]">
          <p>
            {{ premiumStore.effective('introDescription') || '你曾因為別人產出的驚艷圖片與精準文案感到焦慮，卻總是在 ChatGPT 裡得到制式化的空泛回答。這不是一門普通的課程，而是專為現代工作者打造的工具庫與知識庫。WWT Premium 訂閱計畫，橫跨大語言模型、圖像生成與自動化串接。透過每週更新的深度文章與實用工具，帶你深入 AI 的底層邏輯與運作內涵。從 ChatGPT 的框架思維、Midjourney 的參數微調、再到打造個人專屬的 AI Agent，讓你理解 AI 大師們為什麼能創造十倍生產力。這不只是訂閱工具，更是重塑你看待知識與工作模式的思維旅程。' }}
          </p>
        </div>

        <!-- Video Player Placeholder -->
        <div class="mt-20 relative aspect-video w-full bg-[#111] rounded overflow-hidden border border-gray-800 shadow-2xl group cursor-pointer">
          <img 
            :src="premiumStore.effective('introMediaUrl') || '/images/premium/ai-workflow.png'" 
            alt="AI Workflow Visualization" 
            class="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000"
          />
          
          <!-- Play Icon Center Overlay -->
          <div class="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
            <div class="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
              <svg class="w-8 h-8 sm:w-10 sm:h-10 text-white translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>

          <!-- Video UI Overlay -->
          <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div class="flex items-center gap-4 text-white">
                <button class="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <div class="w-full h-1.5 bg-gray-600 hover:bg-gray-500 rounded-full cursor-pointer relative transition-colors">
                  <div class="absolute left-0 top-0 h-full w-1/4 bg-red-600 rounded-full before:content-[''] before:absolute before:right-0 before:top-1/2 before:-translate-y-1/2 before:w-3.5 before:h-3.5 before:bg-white before:rounded-full before:shadow before:scale-0 group-hover:before:scale-100 before:transition-transform"></div>
                </div>
                <div class="text-[11px] tracking-wider whitespace-nowrap font-medium text-gray-300">03:14 / 12:45</div>
                <button class="p-1.5 hover:bg-white/10 rounded transition-colors text-white">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
                <button class="p-1.5 hover:bg-white/10 rounded transition-colors text-white">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
    <!-- Section 3: Target Audience -->
    <div id="section-audience" class="w-full bg-[#111111] py-24 sm:py-32 border-t border-gray-800">
      <div class="mx-auto max-w-[1000px] px-4 sm:px-6">
        <h2 class="text-2xl sm:text-3xl font-sans font-bold text-center mb-16 tracking-widest text-gray-200">
          {{ premiumStore.effective('audienceTitle') || '本訂閱計畫適合這樣的你······' }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          <!-- Persona 1 -->
          <div>
            <h3 class="text-gray-100 text-lg mb-4 tracking-widest text-center leading-relaxed font-bold">
              {{ premiumStore.effective('audience1Title') || '每天都在用 ChatGPT，卻總是得不到滿意答案' }}
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed tracking-wide text-justify">
              {{ premiumStore.effective('audience1Desc') || '你知道 AI 很聰明，但每次提問總是得到空泛、制式化的回覆？你曾試圖讓 AI 寫文案或寫程式，最後卻花更多時間自己在修改？透過我們的專屬文章，拆解 Prompt 的結構與框架，讓 AI 真正懂你要什麼。' }}
            </p>
          </div>
          <!-- Persona 2 -->
          <div>
            <h3 class="text-gray-100 text-lg mb-4 tracking-widest text-center leading-relaxed font-bold">
              {{ premiumStore.effective('audience2Title') || '看過許多 Midjourney 神圖，自己卻只會打單字盲測' }}
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed tracking-wide text-justify">
              {{ premiumStore.effective('audience2Desc') || '你能看出別人生成的圖很有質感，卻不知道背後加了哪些攝影參數跟風格關鍵字？這套計畫將提供豐富的工具庫與參數指南，從提示詞語法到風格微調，建立完整的 AI 視覺生成力。' }}
            </p>
          </div>
          
          <div class="col-span-1 md:col-span-2 py-4">
            <div class="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          </div>

          <!-- Persona 3 -->
          <div>
            <h3 class="text-gray-100 text-lg mb-4 tracking-widest text-center leading-relaxed font-bold">
              {{ premiumStore.effective('audience3Title') || '對「AI 自動化」感興趣，想要把重複工作交給機器人' }}
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed tracking-wide text-justify">
              {{ premiumStore.effective('audience3Desc') || '這不只是工具分享，更是提供「智能工作流」的深度文章與實戰工具。從擷取資料、文本分析、到自動生成報告，你會學會如何把多個 AI 工具（如 Claude, Gemini, Make）串聯在一起，打造你的數位分身。' }}
            </p>
          </div>
          <!-- Persona 4 -->
          <div>
            <h3 class="text-gray-100 text-lg mb-4 tracking-widest text-center leading-relaxed font-bold">
              {{ premiumStore.effective('audience4Title') || '希望用更有感的方式，帶領團隊導入 AI 思維與工作流' }}
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed tracking-wide text-justify">
              {{ premiumStore.effective('audience4Desc') || '無論你是主管還是專案 PM，你都在尋找能讓團隊真正「用對 AI」的方法。本計畫能給你的是一套從認知升級到落地實踐的藍圖，幫助你把 AI 的巨大潛力精準對接到團隊的日常業務裡。' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Curriculum Timeline -->
    <div 
      id="section-curriculum"
      class="relative w-full bg-cover bg-center py-32"
      style="background-image: url('/images/premium/ai-timeline-bg.png');"
    >
      <div class="absolute inset-0 bg-black/80"></div>
      
      <div class="mx-auto max-w-[800px] px-4 sm:px-6 relative z-10 text-gray-200">
        <!-- Timeline Item 1 -->
        <div class="timeline-item relative pl-8 sm:pl-16 mb-24">
          <!-- Background track line (static) -->
          <div class="absolute left-[3px] sm:left-[19px] top-8 bottom-[-96px] w-[2px] bg-white/10"></div>
          <!-- Animated fill line -->
          <div class="timeline-line-fill absolute left-[3px] sm:left-[19px] top-8 bottom-[-96px] w-[2px] bg-[#990011] origin-top transform scale-y-0"></div>
          
          <!-- Node Dot -->
          <div class="timeline-dot absolute left-0 sm:left-4 top-2 w-2 h-2 rounded-full bg-gray-600"></div>
          
          <!-- Content -->
          <div class="timeline-content opacity-0">
            <h3 class="text-xl font-bold font-sans mb-6 tracking-widest flex items-center gap-4 text-white">
              核心概念 <span class="font-sans text-sm tracking-[0.2em] text-gray-400 uppercase">Foundations</span>
            </h3>
            <div class="bg-black/40 backdrop-blur border border-white/10 p-8 rounded-lg shadow-xl hover:bg-black/50 transition-colors">
              <h4 class="text-lg mb-4 tracking-widest font-bold text-gray-200">聽懂 AI 的語言，揭開精準生成的關鍵</h4>
              <p class="text-sm text-gray-400 leading-relaxed tracking-wide text-justify">
                為了解析大語言模型（LLM）背後的運作邏輯，文章將從 Token 預測與脈絡長度的概念出發，帶你理解如何建構具備框架、角色設定與限制條件的高品質 Prompt，不再只是亂槍打鳥。
              </p>
            </div>
          </div>
        </div>

        <!-- Timeline Item 2 -->
        <div class="timeline-item relative pl-8 sm:pl-16 mb-24">
          <div class="absolute left-[3px] sm:left-[19px] top-8 bottom-[-96px] w-[2px] bg-white/10"></div>
          <div class="timeline-line-fill absolute left-[3px] sm:left-[19px] top-8 bottom-[-96px] w-[2px] bg-[#990011] origin-top transform scale-y-0"></div>
          
          <div class="timeline-dot absolute left-0 sm:left-4 top-2 w-2 h-2 rounded-full bg-gray-600"></div>
          
          <div class="timeline-content opacity-0">
            <h3 class="text-xl font-bold font-sans mb-6 tracking-widest flex items-center gap-4 text-gray-400">
              深度文章 <span class="font-sans text-sm tracking-[0.2em] text-gray-500 uppercase">Articles</span>
            </h3>
            <div class="bg-black/40 backdrop-blur border border-white/10 p-8 rounded-lg shadow-xl hover:bg-black/50 transition-colors">
              <h4 class="text-lg mb-4 tracking-widest font-bold text-gray-200">文本與邏輯：ChatGPT / Claude 進階寫作與分析</h4>
              <p class="text-sm text-gray-400 leading-relaxed tracking-wide text-justify">
                定期更新實戰文章，包含 Few-shot prompting 與思維鏈（CoH）技巧。從商業提案、文案撰寫到深度數據分析，學會控制 AI 的語氣與輸出格式，讓機器真正成為你的最強文字秘書。
              </p>
            </div>
          </div>
        </div>

        <!-- Timeline Item 3 -->
        <div class="timeline-item relative pl-8 sm:pl-16 mb-24">
          <div class="absolute left-[3px] sm:left-[19px] top-8 bottom-[-96px] w-[2px] bg-white/10"></div>
          <div class="timeline-line-fill absolute left-[3px] sm:left-[19px] top-8 bottom-[-96px] w-[2px] bg-[#990011] origin-top transform scale-y-0"></div>
          
          <div class="timeline-dot absolute left-0 sm:left-4 top-2 w-2 h-2 rounded-full bg-gray-600"></div>
          
          <div class="timeline-content opacity-0">
            <h3 class="text-xl font-bold font-sans mb-6 tracking-widest flex items-center gap-4 text-gray-400">
              實用工具 <span class="font-sans text-sm tracking-[0.2em] text-gray-500 uppercase">Tools</span>
            </h3>
            <div class="bg-black/40 backdrop-blur border border-white/10 p-8 rounded-lg shadow-xl hover:bg-black/50 transition-colors">
              <h4 class="text-lg mb-4 tracking-widest font-bold text-gray-200">釋放工作潛能：專屬 Prompt 產生器與輔助工具</h4>
              <p class="text-sm text-gray-400 leading-relaxed tracking-wide text-justify">
                會員可直接使用我們開發的多款 AI 輔助工具。跳脫繁瑣設定，透過簡潔的介面快速生成高質量的提示詞、風格參數，並將 AI 工作流程無縫融入你的日常任務中。
              </p>
            </div>
          </div>
        </div>

        <!-- Timeline Item 4 -->
        <div class="timeline-item relative pl-8 sm:pl-16 mb-24">
          <div class="absolute left-[3px] sm:left-[19px] top-8 bottom-[-96px] w-[2px] bg-white/10"></div>
          <div class="timeline-line-fill absolute left-[3px] sm:left-[19px] top-8 bottom-[-96px] w-[2px] bg-[#990011] origin-top transform scale-y-0"></div>
          
          <div class="timeline-dot absolute left-0 sm:left-4 top-2 w-2 h-2 rounded-full bg-gray-600"></div>
          
          <div class="timeline-content opacity-0">
            <h3 class="text-xl font-bold font-sans mb-6 tracking-widest flex items-center gap-4 text-gray-400">
              自動化串接 <span class="font-sans text-sm tracking-[0.2em] text-gray-500 uppercase">Automation</span>
            </h3>
            <div class="bg-black/40 backdrop-blur border border-white/10 p-8 rounded-lg shadow-xl hover:bg-black/50 transition-colors">
              <h4 class="text-lg mb-4 tracking-widest font-bold text-gray-200">打造數位分身：客製化 AI Agent 與 自動化串接</h4>
              <p class="text-sm text-gray-400 leading-relaxed tracking-wide text-justify">
                不再每天重複複製貼上！透過專屬文章與指南，帶你利用 Make / Zapier 串接 API，打造會自動回信、抓取新聞、整理表格的 Custom GPTs。把枯燥的例行公事交給 AI 助理。
              </p>
            </div>
          </div>
        </div>

        <!-- Timeline Item 5 (Last item, no downward line) -->
        <div class="timeline-item relative pl-8 sm:pl-16">
          <div class="timeline-dot absolute left-0 sm:left-4 top-2 w-2 h-2 rounded-full bg-gray-600"></div>
          
          <div class="timeline-content opacity-0">
            <h3 class="text-xl font-bold font-sans mb-6 tracking-widest flex items-center gap-4 text-gray-400">
              資源庫 <span class="font-sans text-sm tracking-[0.2em] text-gray-500 uppercase">Resources</span>
            </h3>
            <div class="bg-black/40 backdrop-blur border border-white/10 p-8 rounded-lg shadow-xl hover:bg-black/50 transition-colors">
              <h4 class="text-lg mb-4 tracking-widest font-bold text-gray-200">持續更新：從零到一完成商業專案佈局</h4>
              <p class="text-sm text-gray-400 leading-relaxed tracking-wide text-justify">
                提供豐富的專案企劃、素材生成與文案產出範例。完整驗證你所學的 AI 工作流。我們將持續擴增資源與模板，確保你具備獨立駕馭 AI 解決覆雜問題的能力。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 5: Comparison Table -->
    <div id="section-comparison" class="w-full bg-[#E8E8E8] text-black py-24 sm:py-32">
      <div class="mx-auto max-w-[1000px] px-4 sm:px-6">
        <h2 class="text-2xl sm:text-3xl font-bold font-sans text-center mb-16 tracking-widest">
          零散教學與 WWT Premium 訂閱比較
        </h2>

        <div class="bg-white/50 backdrop-blur rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="w-1/4 p-6 bg-transparent"></th>
                <th class="w-3/8 p-6 text-center font-bold text-lg text-gray-600 tracking-widest border-l border-b border-r border-gray-200">
                  YouTube / 網路文章<br/>
                  <span class="font-sans text-sm font-normal text-gray-500">免費教學資源</span>
                </th>
                <!-- Highlighted Header -->
                <th class="w-3/8 p-6 text-center font-bold text-lg text-white bg-gradient-to-br from-[#c60118] to-[#990011] tracking-widest shadow-lg relative z-10">
                  WWT Premium<br/>
                  <span class="font-sans text-sm font-normal text-white/80">系統性文章與專屬工具</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Row 1 -->
              <tr class="border-t border-b border-gray-200">
                <td class="p-6 font-medium text-gray-600 tracking-widest align-middle border-r border-gray-200">內容規劃</td>
                <td class="p-6 text-sm text-center text-gray-600 tracking-wide leading-relaxed border-r border-gray-200">
                  單點式教學，常常只分享單一 Prompt<br/>或工具更新，沒有結構性思維
                </td>
                <td class="p-6 text-sm text-center text-white bg-gradient-to-br from-[#b80015] to-[#990011] tracking-wide leading-relaxed font-medium">
                  系統性設計，從底層邏輯到進階技巧，<br/>提供從概念到落地的完整實踐路線庫
                </td>
              </tr>
              <!-- Row 2 -->
              <tr class="border-b border-gray-200">
                <td class="p-6 font-medium text-gray-600 tracking-widest align-middle border-r border-gray-200">深度層次</td>
                <td class="p-6 text-sm text-center text-gray-600 tracking-wide leading-relaxed border-r border-gray-200">
                  以流量與吸睛為主，聚焦皮毛，<br/>缺乏如何Debug與實際專案應用
                </td>
                <td class="p-6 text-sm text-center text-white bg-gradient-to-br from-[#b80015] to-[#990011] tracking-wide leading-relaxed font-medium">
                  拆解大模型特性、微調參數、提供直覺工具，<br/>針對真實商業痛點深度探討，<br/>滿足真懂 AI 的知識渴望。
                </td>
              </tr>
              <!-- Row 3 -->
              <tr class="border-b border-gray-200">
                <td class="p-6 font-medium text-gray-600 tracking-widest align-middle border-r border-gray-200">更新時效</td>
                <td class="p-6 text-sm text-center text-gray-600 tracking-wide leading-relaxed border-r border-gray-200">
                  內容容易過時，且不一定會回頭修正<br/>過去錯誤的教法
                </td>
                <td class="p-6 text-sm text-center text-white bg-gradient-to-br from-[#b80015] to-[#990011] tracking-wide leading-relaxed font-medium">
                  持續更新的資源庫，工具大改版時提供<br/>補充文章與最新最佳化實踐工具
                </td>
              </tr>
              <!-- Row 4 -->
              <tr class="border-b border-gray-200">
                <td class="p-6 font-medium text-gray-600 tracking-widest align-middle border-r border-gray-200">實作資源</td>
                <td class="p-6 text-sm text-center text-gray-600 tracking-wide leading-relaxed border-r border-gray-200">
                  大多需要自行摸索，找不到對應的<br/>範例檔案與指令對照表
                </td>
                <td class="p-6 text-sm text-center text-white bg-gradient-to-br from-[#b80015] to-[#990011] tracking-wide leading-relaxed font-medium">
                  提供完整文章、專屬工具包，<br/>以及實作專案與資源下載
                </td>
              </tr>
              <!-- Row 5 -->
              <tr>
                <td class="p-6 font-medium text-gray-600 tracking-widest align-middle border-r border-gray-200">諮詢與問答</td>
                <td class="p-6 text-sm text-center text-gray-600 tracking-wide leading-relaxed border-r border-gray-200">
                  在留言區發問，不一定能得到<br/>客製化或詳細的解答
                </td>
                <td class="p-6 text-sm text-center text-white bg-gradient-to-br from-[#b80015] to-[#990011] tracking-wide leading-relaxed font-medium">
                  專屬會員群組，可針對個人工作流卡關<br/>進行提問與深度交流討論
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-16 text-center text-[15px] text-gray-600 tracking-wide leading-loose max-w-[800px] mx-auto">
          WWT Premium 訂閱計畫不僅僅是教學文章的集合，而是一個能有效幫助你建立「AI 工作流」的專屬工具與資源庫，適合真正想要提升生產力、並在 AI 時代保持競爭力的職場工作者與創作者。
        </p>
      </div>
    </div>

    <!-- Section 6: Common Questions (FAQ) -->
    <div id="section-faq" class="w-full bg-black py-24 px-4 sm:px-8">
      <div class="mx-auto max-w-[1000px]">
        <h2 class="premium-faq-heading">COMMON QUESTIONS</h2>

        <div class="premium-faq-groups mt-12">
          <div v-for="(items, category) in faqCategories" :key="category" class="premium-faq-group">
            <h4 class="premium-faq-category">{{ category }}</h4>
            <div v-for="(item, i) in items" :key="i" class="premium-faq-item">
              <button
                type="button"
                class="premium-faq-question"
                @click="toggleFaq(premiumFaqItems.indexOf(item))"
              >
                <span>{{ item.question }}</span>
                <span class="premium-faq-arrow">{{ openedFaqIndex === premiumFaqItems.indexOf(item) ? '↑' : '↓' }}</span>
              </button>
              <div
                v-show="openedFaqIndex === premiumFaqItems.indexOf(item)"
                class="premium-faq-answer"
              >
                {{ item.answer }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* ── FAQ Section Styles (matching APP page) ── */
.premium-faq-heading {
  font-family: var(--font-blueprint, 'Inter', sans-serif);
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 900;
  font-style: normal;
  letter-spacing: 0.08em;
  color: #fff;
  line-height: 1.2;
}

.premium-faq-groups {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.premium-faq-category {
  font-family: var(--font-sans, 'Inter', sans-serif);
  font-size: 0.91rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #fff;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 0.5rem;
}

.premium-faq-item {
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.premium-faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-blueprint, 'Inter', sans-serif);
  font-size: 1.3rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.premium-faq-question:hover {
  color: rgba(255,255,255,0.8);
}

.premium-faq-arrow {
  font-size: 1.04rem;
  color: #fff;
  transition: color 0.3s;
  flex-shrink: 0;
  margin-left: 1rem;
}

.premium-faq-question:hover .premium-faq-arrow {
  color: rgba(255,255,255,0.8);
}

.premium-faq-answer {
  font-family: var(--font-sans, 'Inter', sans-serif);
  font-size: 1.105rem;
  color: rgba(255,255,255,0.75);
  padding: 0 0 1.25rem 0;
  line-height: 1.7;
  letter-spacing: 0.02em;
}
</style>
