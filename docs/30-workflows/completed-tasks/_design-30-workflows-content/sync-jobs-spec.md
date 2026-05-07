# `sync_jobs` 正本仕様（design spec）

> 本ファイルは `sync_jobs` テーブルの **`job_type` enum / `metrics_json` schema / lock 制御 / 不変条件** の正本である。
> 03a（schema sync）/ 03b（response sync）および後続の sync wave は本ファイルを参照し、重複定義を持たない。

| 項目 | 値 |
| --- | --- |
| 起票タスク | `docs/30-workflows/03b-followup-005-sync-jobs-design-spec/` |
| 関連 Issue | #198（CLOSED, クローズドのまま docs 整備） |
| TS ランタイム正本 | `apps/api/src/jobs/_shared/sync-jobs-schema.ts` |
| 実装参照先 | `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/jobs/sync-lock.ts` / `apps/api/src/jobs/cursor-store.ts` / `apps/api/src/repository/syncJobs.ts` |
| DDL 正本 | `apps/api/migrations/0003_auth_support.sql`（`sync_jobs`）/ `apps/api/migrations/0005_response_sync.sql`（cursor 拡張） |
| 適用日 | 2026-05-02 |

---

## 1. 概要 / スコープ / 適用範囲

`sync_jobs` は Google Forms と D1 を結ぶ各種 sync（schema sync / response sync / 後続 wave）の **共通 ledger** であり、起動・進捗・完了・失敗の観測点として使われる。本ファイルは `sync_jobs` の論理仕様（enum 値・metrics 構造・lock 制御・不変条件）を 1 ファイルに集約することで、wave 追加時の同期更新漏れと spec drift を防止する。

DDL 物理仕様は本ファイルでは扱わない（`apps/api/migrations/` 配下の SQL を正本とする）。

### ADR-001 runtime SSOT 配置

| 項目 | 値 |
| --- | --- |
| Status | Accepted |
| Date | 2026-05-04 |
| Decision task | `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/` (Refs #435) |
| Decision | `apps/api/src/jobs/_shared/sync-jobs-schema.ts` を runtime SSOT として維持し、`packages/shared` へ移管しない |

#### Context

`sync_jobs.job_type` enum / `metrics_json` schema / `SYNC_LOCK_TTL_MS` は runtime 値として一元管理する必要がある。候補は (a) `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 維持、(b) `packages/shared` 移管の 2 つ。

#### Rationale

1. `sync_jobs` は D1 binding と API Worker の実行責務に属し、D1 への直接アクセスを `apps/api` に閉じる境界と整合する。
2. `apps/web` から `sync_jobs` runtime contract を直接参照する要件はない。
3. `packages/shared` へ移すと API-local な D1 ledger contract を cross-package contract に昇格させ、依存境界を広げる。
4. 03b-followup-005 で既に `apps/api/src/jobs/_shared/sync-jobs-schema.ts` が runtime SSOT として実体化済みであり、移管の追加価値より drift リスクの方が大きい。

#### Alternatives

| 案 | 判定 | 理由 |
| --- | --- | --- |
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 維持 | 採用 | API/D1 境界に閉じ、既存 consumer と test を最小変更で保てる |
| `packages/shared` へ移管 | 不採用 | web consumer がなく、D1/API 固有の contract を不要に共有化する |

#### Links

- runtime SSOT: `apps/api/src/jobs/_shared/sync-jobs-schema.ts`
- owner 表: `docs/30-workflows/_design/sync-shared-modules-owner.md`

---

## 2. `job_type` enum 正本一覧

| `job_type` 値 | 用途 | 担当 wave | 追加時に更新するファイル |
| --- | --- | --- | --- |
| `schema_sync` | Google Forms schema（質問構造）の D1 反映 | 03a | 本ファイル + 各 sync task spec |
| `response_sync` | Google Forms 回答の D1 冪等 upsert | 03b | 同上 |

> **enum 追加時のチェックリスト**: 本ファイル（§2 / §4）→ `database-schema.md` の `sync_jobs` 節 → 03a / 03b 親 spec の参照 → TS ランタイム正本 (`apps/api/src/jobs/_shared/sync-jobs-schema.ts`) → indexes 再生成（`mise exec -- pnpm indexes:rebuild`）の順で更新する。
>
> 値の付け方は **wave 略称なしの素朴な動詞句**（`<対象>_sync`）に統一する。`forms_*` prefix 付き値は使わない（実装値との乖離を避けるため）。
>
> owner / co-owner は `docs/30-workflows/_design/sync-shared-modules-owner.md` の `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 行を正本とする。

---

## 3. `metrics_json` 共通 schema

`metrics_json` は TEXT 列に JSON 文字列として保存する。TS ランタイム正本は `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `metricsJsonBaseSchema` / `responseSyncMetricsSchema` / `schemaSyncMetricsSchema` である。owner / co-owner は `docs/30-workflows/_design/sync-shared-modules-owner.md` を参照する。共通スキーマは以下の通り（zod 表現）:

```ts
import { z } from "zod";

export const metricsJsonBaseSchema = z
  .object({
    // 進捗系（共通）
    cursor: z.string().nullable().optional(),                 // 次回再開点（job_type 別 §4 参照）
    processed_count: z.number().int().nonnegative().optional(),
    write_count: z.number().int().nonnegative().optional(),
    error_count: z.number().int().nonnegative().optional(),
    skipped: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(), // true / 1 のとき再開時の参照対象から除外
    // lock 系
    lock_acquired_at: z.string().datetime().nullable().optional(),
  })
  .passthrough();
```

- 共通必須キーは無い（最小ペイロードは `{}` を許容）。
- 任意キーは job_type 別拡張（§4）で必須化される場合がある。
- `passthrough()` を採用する理由: 後続 wave 拡張時の互換性を保つため。ただし PII 系キーは §6 で禁止する。

---

## 4. `job_type` 別拡張 schema

| `job_type` | 代表 key | 値の意味 |
| --- | --- | --- |
| `schema_sync` | `write_count?: number` | schema 反映件数（質問追加・更新数） |
| `response_sync` | `cursor?: string` | `submittedAt\|responseId` 形式の high-water mark（Google API の `pageToken` ではない）。skipped / failed / running の `{}` 互換を維持するため optional |

`response_sync` の cursor 形式は `apps/api/src/jobs/cursor-store.ts` を実装正本とする。Google API `pageToken` は単一実行内のページングに限定し、次回 cron は high-water mark を `forms.responses.list` の timestamp filter に渡して再開する。

---

## 5. lock 制御

| 項目 | 値 / 仕様 |
| --- | --- |
| TTL | **10 分**（`apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `SYNC_LOCK_TTL_MS = 10 * 60 * 1000`） |
| lock 行 | `sync_locks` テーブル（TTL 二重起動防止） |
| ledger 行 | `sync_jobs.status='running'`（観測 / runbook 用、`lock_acquired_at` を `metrics_json` に書く） |
| stuck 検出 | `lock_acquired_at` が現在時刻から TTL を超過した row は再取得対象 |
| 強制解除 | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-007-lock-ttl-recovery-runbook.md` を runbook 正本とする |

**TTL 値変更時の手順**: 本ファイル §5 → TS ランタイム正本 (`SYNC_LOCK_TTL_MS`) → 03b lock TTL recovery runbook の順で更新し、最後に indexes 再生成。

TTL 変更時のレビュアー境界は `docs/30-workflows/_design/sync-shared-modules-owner.md` の `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 行に従う。

---

## 6. 不変条件

1. **PII 不混入**: `metrics_json` にメール / 氏名 / Forms 回答本文・選択値などの個人情報を含めない。集計対象は件数 / カーソル / タイムスタンプ / boolean フラグに限定する。書き込み経路は `syncJobs.succeed()` で `assertNoPii()` を実行し、読み取り経路は `parseMetricsJson()` + zod schema で fallback する。
2. **DDL 変更なし**: 本ファイル更新のみで `sync_jobs` テーブル DDL を変更しない。DDL 変更が必要な場合は別 follow-up（migration 追加）を起票する。
3. **マイグレーション追加なし**: 本ファイル単独では D1 migration を増やさない。

---

## 7. 参照ルール

- 各 sync task spec は本ファイルを **正本として 1 行リンクで参照** する（例: `> 正本: docs/30-workflows/_design/sync-jobs-spec.md`）。
- `job_type` enum / `metrics_json` schema / lock TTL を task spec 側に **再記述しない**（drift 防止）。
- 個別 task spec 内で必要なのは「本ファイルの何を / どう / どの値で」使うかという**運用文脈**のみ。
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_jobs` 節も本ファイル参照に置き換える。

---

## 8. 更新時チェックリスト

- [ ] enum 追加: §2 表 → §4 拡張 → 実装 → `database-schema.md` → indexes rebuild
- [ ] metrics 共通 key 追加: §3 zod → §6 PII 該当性確認 → 実装
- [ ] metrics job_type 別 key 追加: §4 表 → 実装の cursor / write 経路
- [ ] lock TTL 変更: §5 → `SYNC_LOCK_TTL_MS` → runbook
- [ ] PII 該当変更: §6 を再評価。該当する場合は実装側で除外する PR を別出し
- [ ] indexes drift: 編集後に `mise exec -- pnpm indexes:rebuild`、CI gate `verify-indexes-up-to-date` のグリーンを確認

---

## 9. 変更履歴

| 日付 | 変更内容 | 根拠 task |
| --- | --- | --- |
| 2026-05-02 | 初版作成。03a / 03b の `job_type` enum / `metrics_json` schema / lock TTL を正本化 | `docs/30-workflows/03b-followup-005-sync-jobs-design-spec/` (Refs #198) |
| 2026-05-03 | TS ランタイム正本 `apps/api/src/jobs/_shared/sync-jobs-schema.ts` と接続し、TTL / enum / metrics schema の実装参照先を更新 | `docs/30-workflows/03b-followup-005-sync-jobs-design-spec/` |
| 2026-05-04 | ADR-001 で runtime SSOT を `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 維持と決定し、owner 表への 1-hop 参照を追加 | `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/` (Refs #435) |
