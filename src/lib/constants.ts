export const PLAN_LIMITS = {
  free: { limit: 5, window: 60 * 1000 }, // 5 req/min
  pro: { limit: 50, window: 60 * 1000 }, // 50 req/min
  enterprise: { limit: 500, window: 60 * 1000 } // 500 req/min
} as const

export type PlanType = keyof typeof PLAN_LIMITS
