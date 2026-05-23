// ut-17-followup-002: Miniflare 互換の KVNamespace stub。
// alert-relay の dedup ロジックを isolate 非依存にテストするための test-only helper。

export interface KvStubEntry {
  readonly value: string;
  readonly expiresAt: number;
}

export interface KvPutCall {
  readonly key: string;
  readonly value: string;
  readonly expirationTtl?: number;
}

export interface KvStub {
  readonly kv: KVNamespace;
  readonly puts: ReadonlyArray<KvPutCall>;
  readonly store: ReadonlyMap<string, KvStubEntry>;
}

export interface CreateKvStubOptions {
  readonly now?: () => number;
  readonly getError?: () => Error | null;
  readonly putError?: () => Error | null;
}

export function createKvStub(options: CreateKvStubOptions = {}): KvStub {
  const now = options.now ?? Date.now;
  const store = new Map<string, KvStubEntry>();
  const puts: KvPutCall[] = [];

  const kv: KVNamespace = {
    get: (async (key: string) => {
      const err = options.getError?.();
      if (err) throw err;
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }) as KVNamespace["get"],
    put: (async (
      key: string,
      value: string,
      opts?: { expirationTtl?: number },
    ) => {
      const err = options.putError?.();
      if (err) throw err;
      const ttl = opts?.expirationTtl ?? 0;
      const call: KvPutCall = opts?.expirationTtl !== undefined
        ? { key, value, expirationTtl: opts.expirationTtl }
        : { key, value };
      puts.push(call);
      store.set(key, { value, expiresAt: now() + ttl * 1000 });
    }) as KVNamespace["put"],
    delete: (async (key: string) => {
      store.delete(key);
    }) as KVNamespace["delete"],
    list: (async () => ({
      keys: [],
      list_complete: true,
      cacheStatus: null,
    })) as unknown as KVNamespace["list"],
    getWithMetadata: (async () => ({
      value: null,
      metadata: null,
      cacheStatus: null,
    })) as unknown as KVNamespace["getWithMetadata"],
  } as unknown as KVNamespace;

  return { kv, puts, store };
}
