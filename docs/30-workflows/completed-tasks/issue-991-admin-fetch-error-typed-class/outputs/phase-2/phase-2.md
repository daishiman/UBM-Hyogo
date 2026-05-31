# Phase 2: 設計 — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## 1. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 候補 | 再利用可否 | 判断 |
| --- | --- | --- |
| 既存 `Error`（untyped throw） | 部分再利用 | message 文字列生成ロジックは維持。class でラップする |
| `safe-fetch.ts` の `STATUS_FROM_MESSAGE` 正規表現 | 維持（fallback として残す） | 構造化 `status` 未提供時の後方互換経路。削除しない |
| `safe-server-fetch.ts` の `admin_fetch_404` warn | 不変 | `result.error.code` は不変のため consumer 変更不要 |

> 新規 UI 実装ゼロ。新規追加は `AdminFetchError` class + `isAdminFetchError` guard + `safe-fetch.ts` の 1 箇所強化のみ。

## 2. 状態所有権 / 責務境界

| レイヤー | ファイル | 責務 | 変更 |
| --- | --- | --- | --- |
| transport error 生成 | `lib/admin/server-fetch.ts` | admin API 失敗を `AdminFetchError` に構造化して throw | **編集** |
| 共通正規化 | `lib/server-fetch/safe-fetch.ts` | `Error` → `SafeResultError`（code/message）。status 抽出 | **編集**（generic 強化） |
| admin consumer | `lib/admin/safe-server-fetch.ts` | `ADMIN_FETCH_404` warn | **不変** |

> **責務境界の原則**: `safe-fetch.ts` は public/admin 共通層。admin 固有の `AdminFetchError` を import してはならない（循環 import + 関心混在を防ぐ）。よって構造化 status の参照は **duck typing**（`"status" in err && typeof err.status === "number"`）で行い、admin 非依存に保つ。

## 3. `AdminFetchError` クラス設計

### 3.1 シグネチャ
```ts
// apps/web/src/lib/admin/server-fetch.ts

/**
 * admin API 呼び出し失敗を表す typed error。
 * status / path / responseBodySnippet を構造化フィールドで提供し、
 * message string parse なしで 404/500 を切り分け可能にする。
 *
 * 不変条件:
 * - message は現状の untyped Error と byte-identical（既存テスト互換）。
 *   `admin api ${path} failed: ${status}` + (body あれば ` body=${rawBody.slice(0,256)}`)
 * - responseBodySnippet は <=500 文字（message suffix の 256 とは独立スライス）
 */
export class AdminFetchError extends Error {
  readonly status: number;
  readonly path: string;
  readonly responseBodySnippet: string | null;

  constructor(opts: { path: string; status: number; responseBody?: string | null }) {
    const rawBody = opts.responseBody ?? null;
    const messageSuffix = rawBody ? ` body=${rawBody.slice(0, 256)}` : "";
    super(`admin api ${opts.path} failed: ${opts.status}${messageSuffix}`);
    this.name = "AdminFetchError";
    this.status = opts.status;
    this.path = opts.path;
    this.responseBodySnippet = rawBody === null ? null : rawBody.slice(0, 500);
  }
}

/**
 * Cloudflare Workers の cross-module bundling で instanceof が false になる事故に備え、
 * name 判定 fallback を持つ type guard。
 */
export function isAdminFetchError(error: unknown): error is AdminFetchError {
  return (
    error instanceof AdminFetchError ||
    (error instanceof Error && error.name === "AdminFetchError")
  );
}
```

### 3.2 入力・出力・副作用
| 項目 | 内容 |
| --- | --- |
| 入力 | `{ path: string; status: number; responseBody?: string \| null }` |
| 出力（フィールド） | `message`（byte-identical）/ `name="AdminFetchError"` / `status` / `path` / `responseBodySnippet`（≤500 \| null） |
| 副作用 | なし（純粋な値オブジェクト） |
| エラー時 | コンストラクタは throw しない |

### 3.3 message byte-identical 検証マトリクス（現状 vs 新）
| ケース | 現状 message（line 530） | `AdminFetchError` message | 一致 |
| --- | --- | --- | --- |
| body あり短文（`"error code: 1042"`） | `admin api /admin/dashboard failed: 404 body=error code: 1042` | 同左（slice(0,256) は短文をそのまま） | ✓ binding.spec.ts:89 |
| body 256+ 文字（`"x".repeat(N)`） | `... failed: 500 body=${text.slice(0,256)}` | 同左 | ✓ binding.spec.ts:101 |
| body 空文字 | `... failed: 404`（suffix なし） | `rawBody=""` → falsy → suffix なし | ✓ |
| body 読み取り失敗（catch） | 現状 `bodySnippet=""` | `responseBody` に `null` を渡す → suffix なし | ✓ |

## 4. `server-fetch.ts` 改修設計（line 509-530）

現状の error path（`text` を 1 回 read 済み）を活かし、`Response.clone()` は導入しない。

```ts
if (!res.ok) {
  let rawBody: string | null = null;
  try {
    rawBody = await res.text();
  } catch {
    // body 読み取り失敗は致命的でない（status だけで切り分け可能）
  }
  if (process.env["NODE_ENV"] !== "production" && res.status === 404) {
    let host = "<invalid>";
    try {
      host = new URL(resolveApiBase()).host;
    } catch {
      host = "<invalid>";
    }
    console.warn("[admin/server-fetch] 404", { host, path, status: res.status });
  }
  throw new AdminFetchError({ path, status: res.status, responseBody: rawBody });
}
```

> 変更点: `bodySnippet` 文字列組み立てを削除し、`rawBody`（生 text、`""`/`null` を区別）を `AdminFetchError` に渡す。message suffix 組み立ては class 内に集約。404 warn は不変。`res.text()` の read 回数は現状と同じ 1 回（二重 read なし）。

## 5. `safe-fetch.ts` 改修設計（generic / admin 非依存）

```ts
function statusFromError(err: Error): number | null {
  // 構造化 status フィールドを優先（AdminFetchError 等が提供）
  const candidate = (err as { status?: unknown }).status;
  if (typeof candidate === "number" && Number.isInteger(candidate)) return candidate;
  // 後方互換: message 正規表現 fallback
  const match = err.message.match(STATUS_FROM_MESSAGE);
  return match ? Number(match[1]) : null;
}

function normalizeError(
  err: unknown,
  { codePrefix = "SERVER_FETCH", unknownMessage }: SafeServerFetchOptions,
): SafeResultError {
  if (err instanceof Error) {
    const status = statusFromError(err);
    return {
      code: status !== null ? `${codePrefix}_${status}` : `${codePrefix}_FAILED`,
      message: err.message,
    };
  }
  return { code: `${codePrefix}_UNKNOWN`, message: unknownMessage ?? "unknown server fetch error" };
}
```

> **不変条件**: `AdminFetchError` を import しない（duck typing で `status` を読む）。既存テスト（message-only な mock Error）は正規表現 fallback でこれまで通り `ADMIN_FETCH_404` 等を返す。`AdminFetchError` 経由でも同一 code（status 数値が一致するため）。

## 6. 因果ループ（責務境界の健全性）

- バランスループ: `AdminFetchError` が status を構造化提供 → `safe-fetch.ts` が parse 不要に → message format 変更耐性が上がる → mount regression 切り分けコスト低下。
- 強化ループの遮断: `safe-fetch.ts` に admin import を入れない設計で「共通層が admin に依存 → admin が共通層に依存」の循環を構造的に排除。

## 7. 4条件評価
| 条件 | 評価 |
| --- | --- |
| 価値性 | observability 向上（status 構造化）。呼び出し側の正規表現 parse 依存を解消 |
| 実現性 | 1 class + 1 guard + 1 共通層関数抽出 + 1 spec。小規模・単一サイクル内（CONST_007） |
| 整合性 | message byte-identical で既存テスト不変。共通層は admin 非依存（責務境界閉じる） |
| 運用性 | type guard で Workers bundling 耐性。fallback 維持で段階移行可 |

## 完了条件（Phase 2）
- [x] `AdminFetchError` / `isAdminFetchError` シグネチャ確定
- [x] message byte-identical マトリクス（4 ケース）作成
- [x] `safe-fetch.ts` の admin 非依存 duck typing 設計確定
- [x] 二重 read 回避（`Response.clone()` 不要）を根拠付きで確定
- [x] 責務境界・因果ループ・4条件評価
