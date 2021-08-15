declare module 'pauls-sliding-window-rate-limiter' {
  interface RateLimiterConfig {
    window: number
    limit: number
  }
  class RateLimiter {
    constructor (config?: RateLimiterConfig)
    getCurrentWindow(): [number, number]
    hit (id: string): boolean
  }
}