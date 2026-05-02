// Phase 5 擬似コード: types.ts
// 不変条件 #1: stableKey 文字列リテラルを直書きしない（mapper / shared 側マッピングを利用）
// 不変条件 #5: D1 アクセスは apps/api 内に閉じる
import type { D1Db } from "../../repository/_shared/db";

/**
 * flatten() 出力の単位（質問1件）。stableKey は resolveStableKey() 後段で確定する。
 */
export interface FlatQuestion {
  readonly questionId: string;
  readonly itemId: string | null;
  readonly title: string;
  readonly kind: string;
  readonly options: readonly string[] | null;
  readonly sectionIndex: number;
  readonly sectionTitle: string;
  readonly position: number;
  readonly required: boolean;
}

/**
 * resolveStableKey() の戻り値。source = 'unknown' のときは diff queue に積む。
 */
export interface ResolvedStableKey {
  readonly stableKey: string | null;
  readonly source: "known" | "alias" | "unknown";
}

/**
 * runSchemaSync() の戻り値。AC-5 / AC-6 を満たすための status を含む。
 */
export interface RunResult {
  readonly jobId: string;
  readonly status: "succeeded" | "conflict";
  readonly revisionId?: string;
  readonly upserted?: number;
  readonly diffEnqueued?: number;
}

/**
 * runSchemaSync() に渡る Cloudflare Workers Env の最小サブセット。
 */
export interface SchemaSyncEnv {
  readonly DB: D1Database;
  readonly GOOGLE_FORM_ID?: string;
  readonly GOOGLE_FORM_RESPONDER_URL?: string;
}

/**
 * Conflict（同種 job が running）。AC-6: HTTP 409 Conflict にマップする。
 */
export class ConflictError extends Error {
  override readonly name = "ConflictError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * 31 / 6 の不変条件を破った場合に throw する。Phase 6 FC-9 系。
 */
export class SyncIntegrityError extends Error {
  override readonly name = "SyncIntegrityError";
  constructor(message: string) {
    super(message);
  }
}
