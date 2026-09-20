import rateLimit from 'express-rate-limit'

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
})

// Strict limit for auth routes (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
})

// AI routes (expensive — limit per user per hour)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  keyGenerator: (req: any) => req.user?._id?.toString() || req.ip,
  // @ts-ignore
  validate: { keyGeneratorIpFallback: false },

  message: { error: 'AI request limit reached. Resets in 1 hour.' }
})

// Code Execution routes (limit 20 executions per minute per user)
export const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyGenerator: (req: any) => req.user?.userId || req.user?._id?.toString() || req.ip,
  // @ts-ignore
  validate: { keyGeneratorIpFallback: false },
  message: { error: 'Execution rate limit reached (max 20 executions per minute). Please slow down.' }
})

