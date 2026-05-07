# implementation-guide

## Part 1 — 中学生向けの説明

### なぜ必要か

`sync_jobs` は「同期処理が今どうなっているか」を記録する台帳です。台帳に書く `job_type` や `metrics_json` のルールがあちこちに散らばると、誰かが片方だけ直して別の場所を忘れたときに、同じ言葉なのに意味がずれる。だから、どこを正本として見るかを決め、持ち主も決め、テストで守る必要があります。

たとえば学校の出席簿で、担任の出席簿と部活の出席簿に別々のルールがあると、同じ生徒が「出席」と「欠席」の両方に見えてしまう。今回の ADR と owner 表は、出席簿の置き場所と記入係を決める作業です。

### 何が変わるか

`sync_jobs` の runtime contract は `apps/api/src/jobs/_shared/sync-jobs-schema.ts` を見ればよい、と明文化しました。`packages/shared` へ移さない理由も ADR-001 に残したので、後から同じ議論をやり直さずに済みます。

### 今回作ったもの

- `docs/30-workflows/_design/sync-jobs-spec.md` の ADR-001
- `docs/30-workflows/_design/sync-shared-modules-owner.md` の `sync-jobs-schema.ts` owner 行
- `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の email 形式値 PII guard
- `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` の canonical contract test
- Phase 11 の NON_VISUAL evidence log 一式

## Part 2 — 技術者向けの実装詳細

### 型定義

```ts
export const SYNC_JOB_TYPES = ["schema_sync", "response_sync"] as const;
export type SyncJobKind = (typeof SYNC_JOB_TYPES)[number];

export const metricsJsonBaseSchema = z.object({
  cursor: z.string().nullable().optional(),
  processed: z.number().int().nonnegative().optional(),
}).passthrough();
```

### APIシグネチャ

```ts
export function assertNoPii(value: unknown): void;
export function parseMetricsJson<T>(
  metricsJson: string | null,
  schema: z.ZodType<T>,
  fallback: T,
): T;
```

### 使用例

```ts
const metrics = parseMetricsJson(row.metrics_json, responseSyncMetricsSchema, {
  cursor: null,
});
assertNoPii({ cursor: metrics.cursor, writes: 1 });
```

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test
```

### エラーハンドリング

`metrics_json` に PII 系キー、または email 形式値が含まれる場合、zod の custom issue または `assertNoPii` の `Error` として拒否する。`parseMetricsJson` は既存契約どおり、JSON parse / schema parse に失敗した場合は fallback を返す。

### エッジケース

- `metrics_json` が `null` または空文字なら fallback を返す
- nested object / array の中に PII key があれば path 付きで拒否する
- key 名が安全でも値が `a@example.com` 形式なら `<path>=<email>` として拒否する
- `job_type` と lock TTL の semantics は変更しない

### 設定項目と定数一覧

| 定数 | 値 | 正本 |
| --- | --- | --- |
| `SYNC_JOB_TYPES` | `["schema_sync", "response_sync"]` | `apps/api/src/jobs/_shared/sync-jobs-schema.ts` |
| `SYNC_LOCK_TTL_MINUTES` | `10` | 同上 |
| `SYNC_LOCK_TTL_MS` | `600000` | 同上 |
| `PII_FORBIDDEN_KEYS` | email / name / stable keys 等 | 同上 |

### テスト構成

- `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts`: canonical 値、TTL、PII key、email 形式値拒否
- `outputs/phase-11/vitest-sync-jobs-schema.log`: API test 実測ログ
- `outputs/phase-11/typecheck.log`: workspace typecheck 実測ログ
- `outputs/phase-11/lint.log`: lint 実測ログ

## 概要 (What / Why / 影響範囲)

**What**: `sync_jobs` runtime contract の集約完了。runtime SSOT 配置 ADR を `_design/sync-jobs-spec.md` に追記し、`_design/sync-shared-modules-owner.md` に owner 表行を登録、`apps/api/src/jobs/_shared/sync-jobs-schema.ts` の PII 検出を email 形式値まで拡張、contract test を canonical 値リテラル断言まで補強。

**Why**: 03b-followup-005 (#198) で runtime SSOT 実体は完成済みだったが、配置決定 ADR / owner 表登録 / contract test 網羅性 / unassigned ステータス解消が未確定だった (Issue #435 残スコープ)。

**影響範囲**: docs governance + apps/api runtime contract（後方互換維持・破壊的変更なし）。

## 変更ファイル一覧

| # | ファイル | 種類 |
| --- | --- | --- |
| 1 | docs/30-workflows/_design/sync-jobs-spec.md | ADR-001 セクション追加 + §2/§3/§5 リンク + §9 履歴 |
| 2 | docs/30-workflows/_design/sync-shared-modules-owner.md | alias 行 + sync-jobs-schema.ts 行追加 + 解消済み未割当節 |
| 3 | apps/api/src/jobs/_shared/sync-jobs-schema.ts | findPiiKeyPath → findPiiLeakPath / email 形式値拒否 |
| 4 | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | canonical 値リテラル断言 + email 拒否ケース |
| 5 | .claude/skills/aiworkflow-requirements/references/database-schema.md | sync_jobs 節を _design/ 参照で統一 |
| 6 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | active task 表更新 |
| 7 | docs/30-workflows/unassigned-task/task-issue195-...md | status: resolved |
| 8 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | indexes:rebuild 反映 |
| 9 | docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/ | タスク仕様書一式（13 phases + outputs） |

## 主要 diff サンプル

ADR-001 セクション (sync-jobs-spec.md §1 直下):
```
### ADR-001 runtime SSOT 配置
| Status | Accepted |
| Decision | apps/api/src/jobs/_shared/sync-jobs-schema.ts を runtime SSOT として維持し、packages/shared へ移管しない |
```

owner 表行 (sync-shared-modules-owner.md):
```
| apps/api/src/jobs/_shared/sync-jobs-schema.ts | 03a | 03b | 03a / 03b | sync_jobs runtime contract 正本 |
```

email 形式値拒否 (sync-jobs-schema.ts):
```ts
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
```

## 動作確認手順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes
```

## ロールバック手順

`git revert <merge-commit>` で全変更を戻す。runtime コードは追加 + リネームのみで破壊的変更なし。

## 関連 Issue

`Refs #435`（CLOSED のままクローズドステート維持）
