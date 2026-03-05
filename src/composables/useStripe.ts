import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/stores/auth'

export function useStripe() {
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const authStore = useAuthStore()

    /**
     * Start a Stripe Checkout session.
     * @param priceId - The Stripe Price ID (e.g. price_xxx)
     * @param mode - 'subscription' for recurring, 'payment' for one-time
     */
    async function startCheckout(priceId: string, mode: 'subscription' | 'payment' = 'subscription') {
        if (!authStore.isAuthenticated) {
            error.value = 'Please login first'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            if (!authSession) throw new Error('No active session')

            const origin = window.location.origin
            const locale = window.location.pathname.match(/^\/(zh-TW|en)/)?.[1] || ''
            const basePath = locale ? `/${locale}` : ''

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

            // Use direct fetch instead of supabase.functions.invoke to avoid default timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

            const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authSession.access_token}`,
                    'apikey': supabaseAnonKey,
                },
                body: JSON.stringify({
                    price_id: priceId,
                    mode,
                    success_url: `${origin}${basePath}/premium?success=true`,
                    cancel_url: `${origin}${basePath}/premium?canceled=true`,
                }),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Checkout failed')

            if (data.url) {
                window.location.href = data.url
            }
        } catch (err: any) {
            console.error('Stripe checkout error:', err)
            error.value = err.message || 'Something went wrong'
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Check if the current user has purchased a specific product.
     */
    async function checkPurchase(productId: string): Promise<boolean> {
        if (!authStore.isAuthenticated || !authStore.user) return false

        const { data } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', authStore.user.id)
            .eq('product_id', productId)
            .eq('status', 'completed')
            .limit(1)

        return (data && data.length > 0) || false
    }

    /**
     * Get all purchases for the current user.
     */
    async function getUserPurchases() {
        if (!authStore.isAuthenticated || !authStore.user) return []

        const { data } = await supabase
            .from('purchases')
            .select('*')
            .eq('user_id', authStore.user.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })

        return data || []
    }

    return {
        isLoading,
        error,
        startCheckout,
        checkPurchase,
        getUserPurchases,
    }
}
