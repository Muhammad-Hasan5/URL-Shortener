const TTL = {
  NEW: 5 * 60,
  COLD: 10 * 60,
  WARM: 60 * 60,
  HOT: 24 * 60,
} as const;

const AGE_THRESHOLD_MS = 5 * 60 * 1000;
const WARM_CLICK_THRESHOLD = 100;
const HOT_CLICK_THRESHOLD = 1000;

export function getTTL(clickCount: number, created_at: Date): number {
  const ageMS = Date.now() - created_at.getTime();

  if (ageMS < AGE_THRESHOLD_MS) return TTL.NEW;

  if (clickCount >= HOT_CLICK_THRESHOLD) return TTL.HOT;
  if (clickCount >= WARM_CLICK_THRESHOLD) return TTL.WARM;
  if (clickCount > 0) return TTL.COLD;

  return TTL.NEW;
}
