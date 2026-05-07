// R2 binding 経由の薄い wrapper。直接 S3 互換 API は使用しない。
// Workers runtime の R2Bucket 型に依存するが、CLI からも使えるよう型は最小定義する。

export interface R2PutOptions {
  contentType: string;
  contentEncoding?: string;
  metadata: Record<string, string>;
  ifNoneMatch?: "*";
}

export interface R2PutResult {
  etag: string;
}

export interface R2GetResult {
  body: Uint8Array;
  metadata: Record<string, string>;
}

export interface R2ListResult {
  key: string;
  size: number;
  etag: string;
}

export interface R2Client {
  putObject(key: string, body: Uint8Array, opts: R2PutOptions): Promise<R2PutResult>;
  getObject(key: string): Promise<R2GetResult>;
  listObjects(prefix: string): Promise<R2ListResult[]>;
}

// 最小 R2 binding interface（Workers runtime と互換）
export interface R2BucketLike {
  put(
    key: string,
    body: ArrayBuffer | Uint8Array,
    opts?: {
      httpMetadata?: { contentType?: string; contentEncoding?: string };
      customMetadata?: Record<string, string>;
      onlyIf?: { etagDoesNotMatch?: string } | { uploadedBefore?: Date };
    },
  ): Promise<{ etag: string } | null>;
  get(key: string): Promise<
    | {
        arrayBuffer(): Promise<ArrayBuffer>;
        customMetadata?: Record<string, string>;
        httpMetadata?: { contentType?: string; contentEncoding?: string };
      }
    | null
  >;
  list(opts?: { prefix?: string }): Promise<{
    objects: Array<{ key: string; size: number; etag: string }>;
  }>;
}

export function createR2Client(bucket: R2BucketLike): R2Client {
  return {
    async putObject(key, body, opts) {
      const result = await bucket.put(key, body, {
        httpMetadata: {
          contentType: opts.contentType,
          ...(opts.contentEncoding ? { contentEncoding: opts.contentEncoding } : {}),
        },
        customMetadata: opts.metadata,
        ...(opts.ifNoneMatch === "*" ? { onlyIf: { etagDoesNotMatch: "*" } } : {}),
      });
      if (!result) {
        throw new Error(`r2 put returned null (likely If-None-Match conflict): ${key}`);
      }
      return { etag: result.etag };
    },
    async getObject(key) {
      const obj = await bucket.get(key);
      if (!obj) {
        throw new Error(`r2 object not found: ${key}`);
      }
      const buf = new Uint8Array(await obj.arrayBuffer());
      return { body: buf, metadata: obj.customMetadata ?? {} };
    },
    async listObjects(prefix) {
      const res = await bucket.list({ prefix });
      return res.objects.map((o) => ({ key: o.key, size: o.size, etag: o.etag }));
    },
  };
}
