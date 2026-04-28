// Phase 5: schema sync エントリ。
// 不変条件 #5: D1 アクセスは apps/api 内に閉じる。
export { runSchemaSync, ctxFromEnv } from "./forms-schema-sync";
export type { SchemaSyncDeps } from "./forms-schema-sync";
export { flatten, countSections } from "./flatten";
export { resolveStableKey, UNKNOWN_SENTINEL } from "./resolve-stable-key";
export { diffQueueWriter } from "./diff-queue-writer";
export { schemaHash } from "./schema-hash";
export {
  ConflictError,
  SyncIntegrityError,
  type FlatQuestion,
  type RunResult,
  type SchemaSyncEnv,
  type ResolvedStableKey,
} from "./types";
