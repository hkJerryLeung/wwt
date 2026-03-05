# Supabase Cross-Browser Compatibility

> **⚠️ WARNING**: The Supabase auth client (`GoTrueClient`) has several cross-tab
> and cross-browser issues. The workarounds below are **required** for this
> project to work reliably in non-Chrome browsers (Comet, Arc, Brave, etc.).
> Do NOT remove them without thorough multi-tab testing in all target browsers.

## Problem Summary

When two tabs of the same origin are open in the same browser window,
the app would freeze in a permanent loading state. This only affected
non-Chrome Chromium-based browsers and only pages that fetch data from
Supabase (admin panel, showcase, workshop).

## Root Causes & Fixes (in chronological order of discovery)

### 1. `navigator.locks` hangs in non-Chrome browsers

**File**: `src/plugins/supabase.ts`

GoTrueClient uses the Web Locks API (`navigator.locks.request()`) for
cross-tab session synchronisation. In Comet, Arc, and some other browsers,
this API hangs indefinitely, blocking `getSession()` forever.

**Fix**: Custom in-process async queue lock (`customLock`) that replaces
`navigator.locks`. Safe because this project does not require cross-tab
session sync.

### 2. `BroadcastChannel` cascading auth events between tabs

**File**: `src/plugins/supabase.ts`

GoTrueClient creates a `BroadcastChannel` to broadcast auth state changes
to all tabs. When two tabs initialize concurrently, they trigger a cascade
of auth events that freezes both tabs.

**Fix**: Temporarily suppress `globalThis.BroadcastChannel` during
`createClient()` so GoTrueClient never creates the channel.

### 3. `visibilitychange` listener causes concurrent token refresh

**File**: `src/plugins/supabase.ts`

GoTrueClient registers a `visibilitychange` event listener that calls
`_recoverAndRefresh()` when a tab becomes visible. Since we replaced
`navigator.locks` with a local lock (fix #1), there is no cross-tab
coordination. Two tabs switching visibility will concurrently try to
refresh the auth token, corrupting the session in localStorage.

**Fix**: Temporarily mock `window.addEventListener` during `createClient()`
to drop the `visibilitychange` listener registration.

### 4. `onAuthStateChange` callback deadlocks the auth lock

**File**: `src/stores/auth.ts`

GoTrueClient's `_acquireLock()` uses an internal `pendingInLock` queue.
When `_notifyAllSubscribers()` fires while the lock is held (or while
`pendingInLock` is draining), our `onAuthStateChange` callback immediately
called `fetchProfile()` → `supabase.from('profiles').select()` →
`_useSession()` → `_acquireLock()`. This re-entrant lock acquisition
deadlocked, permanently blocking ALL subsequent Supabase queries.

**Fix**: Wrap the `onAuthStateChange` callback body in `setTimeout(0)`.
This defers execution to the next event-loop tick, guaranteeing the auth
lock is fully released before any Supabase data queries run.

### 5. Dynamic routes registered too late → route bouncing

**File**: `src/router/index.ts`

Custom nav paths (e.g. `/workshop` → `/ai`) were registered asynchronously
during store hydration. The initial URL would match the wrong route, and
when the tab regained focus, the router would re-evaluate—causing the
page to bounce between the home route and the dynamic route.

**Fix**: Call `registerDynamicNavRoutes()` synchronously right after
`createRouter()` (it reads from localStorage, which is synchronous).

### 6. App mount blocked by async hydration

**File**: `src/main.ts`

The original bootstrap waited for ALL async store hydration and auth
initialization before calling `app.mount('#app')`. If any promise hung,
the entire app would never render.

**Fix**: Mount the app immediately after `router.isReady()`. Store
hydration runs in the background and reactively updates the UI.

## Rules for Future Development

1. **NEVER** call `supabase.from()` or any Supabase data query inside
   an `onAuthStateChange` callback synchronously. Always defer with
   `setTimeout(0)` or `queueMicrotask()`.

2. **NEVER** `await` Supabase queries before `app.mount()`. Mount first,
   hydrate reactively.

3. **NEVER** remove the `customLock`, `BroadcastChannel` suppression,
   or `visibilitychange` suppression from `supabase.ts` without testing
   in Comet/Arc/Brave with 2 tabs open.

4. **Dynamic routes** from localStorage must be registered synchronously
   in `router/index.ts`, not asynchronously in `main.ts`.
