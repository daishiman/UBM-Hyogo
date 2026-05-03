# Phase 6: `_shared/sync-jobs-schema.ts` 実装 + テスト + `_design/` 注記追加

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 6 / 13 |
| Phase 名称 | `_shared/sync-jobs-schema.ts` 実装 + テスト + `_design/` 注記追加 |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 5 (既存定義棚卸し) |
| 次 Phase | 7 (`sync-forms-responses.ts` / `syncJobs.ts` / `cursor-store.ts` の差し替え) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

Phase 2 の API 契約に基づき `apps/api/src/jobs/_shared/sync-jobs-schema.ts` と同テストを新規作成、加えて `_design/sync-jobs-spec.md` §3 / §5 に TS ランタイム正本へのリンク注記を追加する。本 Phase 完了後、Phase 7 の call site 差し替えに進める状態にする。

## 実行タスク

1. `apps/api/src/jobs/_shared/` ディレクトリ作成
2. `apps/api/src/jobs/_shared/sync-jobs-schema.ts` を Phase 2 契約通りに実装
3. `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` を Phase 4 のテストケース 10 件で実装
4. `vitest` 単独実行で全件 PASS を確認
5. `_design/sync-jobs-spec.md` §3 / §5 / lock 章に TS 正本リンク注記を追記
6. コミット 1 件として整える

## 変更対象ファイル

| 種別 | パス |
| --- | --- |
| 新規 | apps/api/src/jobs/_shared/sync-jobs-schema.ts |
| 新規 | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts |
| 編集 | docs/30-workflows/_design/sync-jobs-spec.md |

## 関数シグネチャ（再掲・実装の正）

```ts
import { z } from "zod";

export const SYNC_JOB_TYPES = ["schema_sync", "response_sync"] as const;
export type SyncJobKind = (typeof SYNC_JOB_TYPES)[number];

export const SYNC_LOCK_TTL_MINUTES = 10;
export const SYNC_LOCK_TTL_MS = SYNC_LOCK_TTL_MINUTES * 60 * 1000;

export const metricsJsonBaseSchema = z
  .object({
    cursor: z.string().optional(),
    processed_count: z.number().int().nonnegative().optional(),
    write_count: z.number().int().nonnegative().optional(),
    error_count: z.number().int().nonnegative().optional(),
    skipped: z.union([z.literal(0), z.literal(1)]).optional(),
    lock_acquired_at: z.string().optional(),
  })
  .passthrough();

export const schemaSyncMetricsSchema = metricsJsonBaseSchema.extend({
  write_count: z.number().int().nonnegative(),
});

export const responseSyncMetricsSchema = metricsJsonBaseSchema.extend({
  cursor: z.string(),
});

export const PII_FORBIDDEN_KEYS = [
  "email",
  "responseEmail",
  "name",
  "fullName",
  "phone",
  "address",
  "answers",
  "raw",
  "value",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertNoPii(metrics: Record<string, unknown>): void {
  for (const key of Object.keys(metrics)) {
    if ((PII_FORBIDDEN_KEYS as readonly string[]).includes(key)) {
      throw new Error(`PII forbidden key detected in metrics: ${key}`);
    }
    const value = metrics[key];
    if (typeof value === "string" && EMAIL_RE.test(value)) {
      throw new Error(`PII email-shaped value detected in metrics key: ${key}`);
    }
  }
}

export function parseMetricsJson<S extends z.ZodTypeAny>(
  raw: string | null | undefined,
  schema: S,
): z.infer<S> | null {
  if (raw == null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = schema.safeParse(parsed);
  return result.success ? (result.data as z.infer<S>) : null;
}
```

## テストファイル方針

- `vitest` 採用（既存 `apps/api` の test runner）
- `import { describe, it, expect } from "vitest";` を使用
- Phase 4 テスト一覧 10 件をすべて実装

## `_design/sync-jobs-spec.md` 追記文面

### §3 末尾

```md
> **TS ランタイム正本**: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `SYNC_JOB_TYPES` を一次正本とする。enum 追加時は本 markdown → TS 正本の順で同期する。
```

### §5 末尾

```md
> **TS ランタイム正本**: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `metricsJsonBaseSchema` / `schemaSyncMetricsSchema` / `responseSyncMetricsSchema`。本 markdown を論理正本、TS を実装正本とし、差分が出たら markdown → TS の順で同期する。
```

### lock 章末尾

```md
> **TS ランタイム正本**: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `SYNC_LOCK_TTL_MS = 10 * 60 * 1000`（`SYNC_LOCK_TTL_MINUTES = 10`）。
```

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

## DoD（Definition of Done）

- [ ] `apps/api/src/jobs/_shared/sync-jobs-schema.ts` が存在し、Phase 2 契約の export がすべて揃っている
- [ ] `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` が vitest で全件 PASS
- [ ] `_design/sync-jobs-spec.md` の §3 / §5 / lock 章に TS 正本リンクが追記されている
- [ ] `pnpm typecheck` が PASS
- [ ] 既存テスト（`sync-forms-responses.test.ts` 等）には影響しない（call site 未編集のため）

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 実装ログ / vitest 出力 / `_design/` diff |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 統合テスト連携

- 単体テストは本 Phase で完結
- Phase 7 で call site 差し替え後に既存テスト回帰を確認

## 完了条件

- [ ] 新規 2 ファイルが存在
- [ ] vitest 全 10 件 PASS
- [ ] `_design/` 注記追加済み
- [ ] typecheck PASS
- [ ] 1 commit にまとまっている

## 次 Phase

- 次: 7（call site 差し替え）
- 引き継ぎ事項: 共有 module の export 一式
- ブロック条件: vitest fail / `zod` 不足
