// retry helper for fragment path nonce collision avoidance.
// max retries = 3 (so up to 4 total attempts).

export const MAX_COLLISION_RETRIES = 3;

export interface RetryResult<T> {
  value: T;
  attempts: number;
}

export class CollisionError extends Error {
  constructor(public readonly attempts: number) {
    super(`fragment path collision unresolved after ${attempts} attempts`);
    this.name = "CollisionError";
  }
}

export async function retryOnCollision<T>(
  attempt: (i: number) => Promise<{ ok: true; value: T } | { ok: false }>,
  maxRetries: number = MAX_COLLISION_RETRIES,
): Promise<RetryResult<T>> {
  let attempts = 0;
  for (let i = 0; i <= maxRetries; i += 1) {
    attempts += 1;
    const r = await attempt(i);
    if (r.ok) return { value: r.value, attempts };
  }
  throw new CollisionError(attempts);
}
