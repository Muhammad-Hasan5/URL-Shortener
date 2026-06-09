import breaker from "./index.opossum.js";

export async function safeRedis<T>(fn: () => Promise<T>, fallback: T | null = null): Promise<T | null> {
  try {
    return await breaker.fire(fn) as Awaited<T>
  } catch{
    return fallback
  }
}
