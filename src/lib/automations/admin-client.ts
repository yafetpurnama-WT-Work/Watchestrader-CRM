/**
 * @deprecated — Supabase admin client replaced by Laravel API.
 * This stub prevents server-side API routes from crashing on import.
 * All automation logic will be moved to Laravel controllers.
 */

export function supabaseAdmin(): any {
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'from') {
        return () => new Proxy({}, {
          get() {
            return () => new Proxy({}, {
              get() {
                return () => ({ data: null, error: { message: 'Supabase removed. Use Laravel API.' } })
              }
            })
          }
        })
      }
      return () => ({ data: null, error: { message: 'Supabase removed.' } })
    }
  })
}
