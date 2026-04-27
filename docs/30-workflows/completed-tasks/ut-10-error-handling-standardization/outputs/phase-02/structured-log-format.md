# 構造化ログフォーマット（Phase 2 成果物）

## 1. 設計方針

- `console.error` / `console.warn` は JSON シリアライズ可能なオブジェクト 1 引数に統一
- 必須フィールド: `level` / `timestamp` / `traceId` / `code` / `message` / `context`
- 機密情報はサニタイズキーリストで自動マスク（substring マッチ）
- UT-08 のメトリクス基盤（後段）が取り込めるスキーマ互換性を意識
- ログヘルパは `packages/shared/src/logging.ts` に配置

## 2. ログペイロードスキーマ

```ts
// packages/shared/src/logging.ts

export type LogLevel = "error" | "warn" | "info" | "debug";

export interface StructuredLogPayload {
  /** RFC 5424 準拠（簡易） */
  level: LogLevel;
  /** ISO8601 UTC */
  timestamp: string;
  /** トレース ID（ApiError.traceId と一致） */
  traceId?: string;
  /** UBM エラーコード（エラー系のみ） */
  code?: string;
  /** 1 行サマリ */
  message: string;
  /** 任意コンテキスト（サニタイズ済み） */
  context?: Record<string, unknown>;
  /** リクエスト識別子（ミドルウェア由来） */
  requestId?: string;
  /** HTTP 関連（任意） */
  method?: string;
  path?: string;
  status?: number;
  /** 実行環境タグ */
  env?: "production" | "staging" | "development";
}

export function logError(payload: Omit<StructuredLogPayload, "level" | "timestamp">): void;
export function logWarn(payload: Omit<StructuredLogPayload, "level" | "timestamp">): void;
export function logInfo(payload: Omit<StructuredLogPayload, "level" | "timestamp">): void;

/** サニタイズ実行（ログ出力前に必ず通す） */
export function sanitize<T>(value: T): T;
```

## 3. サニタイズキーリスト（substring マッチ）

```ts
const SENSITIVE_KEY_SUBSTRINGS = [
  "authorization",
  "cookie",
  "private_key",
  "client_email",
  "password",
  "token",
  "secret",
  "credential",
  "session",
  "api_key",
  "apikey",
] as const;
```

サニタイズアルゴリズム:

1. オブジェクトを再帰的に walk
2. キー名（lowercase）が上記 substring のいずれかを含む場合、値を `"[REDACTED]"` に置換
3. 値が string で長さ > 200 の場合、先頭 200 文字 + `...[truncated:N chars]` に省略
4. 循環参照は検出して `"[Circular]"` に置換
5. Error オブジェクトは `{ name, message, stackPreview: stack の先頭 5 行 }` に整形

## 4. 出力サンプル

### エラーログ（5xx）

```json
{
  "level": "error",
  "timestamp": "2026-04-27T10:23:45.678Z",
  "traceId": "urn:uuid:8b7f2d2e-3a3a-4d52-9b1f-12cba1cd9012",
  "code": "UBM-6001",
  "message": "Sheets API failed: 503",
  "requestId": "req-abc123",
  "method": "POST",
  "path": "/sync/manual",
  "status": 502,
  "env": "production",
  "context": {
    "originalCause": {
      "name": "Error",
      "message": "Sheets API failed: 503 Service Unavailable",
      "stackPreview": "Error: Sheets API failed: 503...\n    at fetchSheetRows..."
    },
    "headers": {
      "authorization": "[REDACTED]",
      "user-agent": "..."
    }
  }
}
```

### 警告ログ（リトライ）

```json
{
  "level": "warn",
  "timestamp": "2026-04-27T10:23:45.500Z",
  "traceId": "urn:uuid:...",
  "message": "Retrying after transient failure (attempt 1/2)",
  "context": {
    "delayMs": 100,
    "classify": "retry"
  }
}
```

## 5. UT-08 連携想定

UT-08 は Cloudflare Workers の `console.error` 出力を Logpush 経由で取得し、メトリクス化する想定。本フォーマットは:

- `level` でフィルタ可能
- `code` で UBM エラーコード別に集計可能
- `traceId` でリクエスト横断トレース可能
- `path` / `status` で API endpoint 別 SLO 計測可能

UT-08 側では本スキーマを `zod` で validate して取り込む想定（`@ubm-hyogo/shared` の同じ型を import 可能）。

## 6. 実装スケルトン

```ts
// packages/shared/src/logging.ts
const SENSITIVE_KEY_SUBSTRINGS = [/* 上記リスト */];

export function sanitize<T>(value: T): T {
  const seen = new WeakSet<object>();
  function walk(v: unknown, key?: string): unknown {
    if (key && SENSITIVE_KEY_SUBSTRINGS.some((s) => key.toLowerCase().includes(s))) {
      return "[REDACTED]";
    }
    if (v === null || v === undefined) return v;
    if (typeof v === "string") {
      return v.length > 200 ? `${v.slice(0, 200)}...[truncated:${v.length} chars]` : v;
    }
    if (typeof v !== "object") return v;
    if (seen.has(v as object)) return "[Circular]";
    seen.add(v as object);
    if (v instanceof Error) {
      return {
        name: v.name,
        message: v.message,
        stackPreview: v.stack?.split("\n").slice(0, 5).join("\n"),
      };
    }
    if (Array.isArray(v)) return v.map((item) => walk(item));
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = walk(val, k);
    }
    return out;
  }
  return walk(value) as T;
}

function emit(level: LogLevel, payload: Omit<StructuredLogPayload, "level" | "timestamp">) {
  const sanitized = sanitize(payload);
  const enriched: StructuredLogPayload = {
    level,
    timestamp: new Date().toISOString(),
    ...sanitized,
  };
  const line = JSON.stringify(enriched);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "info") console.info(line);
  else console.debug(line);
}

export const logError = (p: Omit<StructuredLogPayload, "level" | "timestamp">) => emit("error", p);
export const logWarn  = (p: Omit<StructuredLogPayload, "level" | "timestamp">) => emit("warn",  p);
export const logInfo  = (p: Omit<StructuredLogPayload, "level" | "timestamp">) => emit("info",  p);
```

## 7. 不変条件

| # | 不変条件 |
| --- | --- |
| INV-L1 | ログ出力は常に JSON 1 行（複数行に跨らない）|
| INV-L2 | 必須フィールド `level` / `timestamp` / `message` を欠落させない |
| INV-L3 | サニタイズキーリストにマッチするキーの値は `[REDACTED]` に置換される |
| INV-L4 | 文字列値は 200 文字を超えると自動 truncate される |
| INV-L5 | 循環参照は `[Circular]` に置換される（無限ループ防止）|
