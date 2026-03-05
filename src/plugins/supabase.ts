import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// ── HMR-safe singleton ──
// During Vite HMR, every module re-evaluation calls createClient() which creates
// a new GoTrueClient that acquires a navigator lock. The OLD client's lock then
// gets aborted, throwing an AbortError that crashes the app.
// By caching the client on the window, we ensure only one client ever exists.
const HMR_KEY = '__supabase_client__'

/**
 * Custom lock function to replace navigator.locks.
 *
 * Supabase's GoTrueClient defaults to the Web Locks API (navigator.locks)
 * for cross-tab session synchronisation. While Chrome handles this perfectly,
 * many Chromium-based browsers (Comet, Arc, Brave, etc.) and some WebKit
 * browsers have buggy or hanging implementations that cause the auth
 * initialisation to freeze, blocking the entire app.
 *
 * This custom lock uses a simple in-process async queue instead. It is safe
 * because this project only uses a single tab per origin at a time and does
 * not rely on cross-tab session sync.
 */
const PROCESS_LOCKS: Record<string, Promise<unknown>> = {}
async function customLock<R>(
    name: string,
    _acquireTimeout: number,
    fn: () => Promise<R>,
): Promise<R> {
    const prev = PROCESS_LOCKS[name] ?? Promise.resolve()
    const current = prev.catch(() => null).then(() => fn())
    PROCESS_LOCKS[name] = current.catch(() => null)
    return await current
}

function getOrCreateClient() {
    const win = globalThis as unknown as Record<string, unknown>
    if (win[HMR_KEY]) {
        return win[HMR_KEY] as ReturnType<typeof createClient>
    }

    // ── Suppress BroadcastChannel during client creation ──
    const OrigBC = globalThis.BroadcastChannel
        ; (globalThis as any).BroadcastChannel = undefined

    // ── Suppress visibilitychange listener ──
    // GoTrueClient registers a 'visibilitychange' listener to auto-recover sessions.
    // Since we disabled navigator.locks (Comet bug), two tabs changing visibility
    // will concurrently try to refresh the token, crashing the session.
    // By dropping the listener, we prevent these concurrent refresh fights.
    const origAddEventListener = window.addEventListener
    window.addEventListener = function (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ) {
        if (type === 'visibilitychange') return
        return origAddEventListener.call(window, type, listener, options)
    } as typeof window.addEventListener

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: { params: { eventsPerSecond: 0 } },
        auth: { lock: customLock },
    })

    // Restore original globals
    globalThis.BroadcastChannel = OrigBC
    window.addEventListener = origAddEventListener

    // This project doesn't use Realtime — kill the idle WebSocket
    client.realtime.disconnect()
    win[HMR_KEY] = client
    return client
}

export const supabase = getOrCreateClient()
