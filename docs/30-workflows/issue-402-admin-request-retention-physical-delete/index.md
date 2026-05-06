# タスク仕様書: Issue #402 — delete request 承認後の物理削除 / retention policy

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-402-admin-request-retention-physical-delete |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/402 (CLOSED) |
| 起票元 source | `docs/30-workflows/completed-tasks/task-04b-admin-request-retention-physical-delete-001.md` |
| 親タスク | 04b-followup-004 admin queue resolve workflow (#319) |
| 配置先 | `docs/30-workflows/issue-402-admin-request-retention-physical-delete/` |
| 作成日 | 2026-05-06 |
| 状態 | implemented-local / runtime evidence pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: implementation]** — root cause: 「retention 経過後の物理削除ジョブ設計」「audit minimum を保持した purge」を実現するには `apps/api` 側のコード（scheduled handler / D1 DELETE / migration）変更が不可避。今回 cycle で実コード・migration・test・runbook・SSOT を同時反映し、runtime evidence と production apply は user gate に残す。 |
| 親 Issue 状態維持 | CLOSED のまま運用（ユーザー指示）。本仕様書は historical traceability のための後追いドキュメント化であり、Issue 再オープンは行わない。 |
| 優先度 | HIGH（personal data の retention を policy で明文化しない限り GDPR / 自治体個人情報保護条例リスクが残るため） |
| 想定 PR 数 | 1（schema migration + Cron job + runbook + SSOT 同期） |
| coverage AC | apps/api 配下の retention purge 関連コード coverage ≥ 80%（branch / line 双方） |

## 目的

delete request の admin approve は既に `deleted_members` への論理削除遷移を行うが、`member_responses` / `member_identities` / `member_status` 等の PII 残存および `deleted_members` 行自体の retention 期間が未定義のまま運用されている。本タスクで以下を確定する:

1. table-by-table の retention period 方針（90 / 180 / 365 日案から選定）
2. PII-bearing row の物理削除と tombstone 保持の境界
3. 既存 Cloudflare Workers daily Cron Trigger (`0 18 * * *`) branch による retention purge job 実装、または manual runbook の整備
4. dry-run mode（D1 cross-table cascade なしのため必須）
5. audit minimum（`deleted_members.member_id` / `deleted_by` / `deleted_at` / `reason` / `purged_at` / `retention_policy_version`）の永続保持
6. approve 時点で「本削除実施日（不可逆時刻）」を申請者に通知する経路

## スコープ

### 含む

- `apps/api/src/jobs/retention-purge.ts` 新規実装（Cron Trigger ハンドラ）
- `apps/api/src/services/retention-policy.ts` 新規実装（policy 適用ロジック）
- `apps/api/migrations/00XX_add_deleted_members_purge_metadata.sql` に retention metadata 列追加（`purged_at` / `retention_policy_version`）
- `apps/api/wrangler.toml` の既存 Cron Trigger（毎日 03:00 JST）を再利用（cron 本数追加なし）
- `apps/api/src/jobs/retention-purge.test.ts` 新規（dry-run / apply / restore round-trip）
- `docs/runbooks/retention-physical-delete.md` 新規（manual fallback）
- `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md` 新規 or 編集（SSOT）
- approve 時の API response に `retentionPurgeScheduledAt`（`deletedAt + 180 days`）を返す。email / マイページ文言はこの値を使って notification 側で吸収

### 含まない

- delete request 承認 workflow 本体の修正（#319 で実装済）
- audit_log / admin_audit テーブルの構造変更（PII を含まないため retention 適用外。既存運用維持）
- コンプライアンス監査の外部委託・法務レビュー手続き（rationale 文書のみ本タスクで添付）
- 物理削除済み行の D1 PITR からの復元自動化（manual runbook で吸収）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | #319 admin queue resolve workflow | `deleted_members` 行の生成元 |
| 上流 | `deleted_members` schema の存在 | retention metadata 列を追加する対象 |
| 下流 | admin notification (#404 系) | 「本削除実施日」テキストを email/UI に出す側 |
| 下流 | data-retention-policy SSOT 参照箇所 | `.claude/skills/aiworkflow-requirements` の resource-map |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `deleted_members` migration が存在 | `rg -n "CREATE TABLE IF NOT EXISTS deleted_members" apps/api/migrations` |
| Cron Trigger が wrangler.toml で利用可 | `grep -A2 '\[triggers\]' apps/api/wrangler.toml` |
| `member_responses` / `member_identities` / `member_status` schema が存在 | `rg -n "CREATE TABLE IF NOT EXISTS (member_responses|member_identities|member_status)" apps/api/migrations` |
| #319 が main 取り込み済 | `gh pr view 319 --json mergedAt` |

## 苦戦箇所・知見（Issue body から継承）

1. **論理 vs 物理境界（不可逆時刻の通知）**: 論理削除は reversible だが物理削除は復元不能。申請者へ「本削除実施日」を approve 時点で通知し、retention 期間中の撤回経路を明示する必要がある。
2. **audit minimum 先決**: 物理削除しても accountability のために残すべき最小フィールドを policy で先に確定しないと、purge 実装が振動する。本タスクでは `deleted_members.{member_id, deleted_by, deleted_at, reason, purged_at, retention_policy_version}` を保持する案を Phase 1 で固定。
3. **dry-run 必須（D1 cross-table cascade なし）**: D1 は外部キー cascade 削除をサポートしないため、削除順序ミスで親行先消し → 子行残留が起きる。実 apply 前に必ず dry-run report を確認するモードを実装する。
4. **retention 期間の根拠**: 90 日 / 180 日 / 365 日のいずれも法令直接要件ではなく社内方針。Phase 1 で rationale を残して可監査にする。

## 想定変更ファイル一覧

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/jobs/retention-purge.ts` | 新規 | Cron Trigger ハンドラ。env から D1 binding を取得し `runRetentionPurge` を呼ぶ |
| `apps/api/src/services/retention-policy.ts` | 新規 | policy 定義 + table-by-table の DELETE / UPDATE クエリ実装 |
| `apps/api/migrations/00XX_add_deleted_members_purge_metadata.sql` | 新規 | `purged_at` / `retention_policy_version` の D1 migration |
| `apps/api/wrangler.toml` | 確認 | 既存 `[triggers] crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` を維持 |
| `apps/api/src/jobs/retention-purge.test.ts` | 新規 | dry-run / apply / restore round-trip Vitest |
| `apps/api/src/services/retention-policy.test.ts` | 新規 | policy ユニットテスト |
| `docs/runbooks/retention-physical-delete.md` | 新規 | manual 実行 runbook（Cron 障害時の fallback） |
| `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md` | 新規 | SSOT。table 別 retention 期間 / PII 列マトリクス / rationale |

## 主要関数シグネチャ（Phase 2/3 で具体化）

```ts
// apps/api/src/jobs/retention-purge.ts
export async function runRetentionPurge(
  env: ApiEnv,
  opts: { dryRun: boolean; now?: Date }
): Promise<RetentionPurgeReport>;

// apps/api/src/services/retention-policy.ts
export async function applyRetentionPolicy(
  db: D1Database,
  policy: RetentionPolicy,
  dryRun: boolean,
  now: Date
): Promise<TableDeletionSummary[]>;

export type RetentionPurgeReport = {
  startedAt: string;          // ISO
  finishedAt: string;         // ISO
  mode: 'dry-run' | 'apply';
  policyVersion: string;      // 例: "v1-2026-05"
  totals: TableDeletionSummary[];
  errors: ErrorEntry[];
};

export type TableDeletionSummary = {
  table: 'member_responses' | 'member_identities' | 'member_status' | 'deleted_members';
  mode: 'physical_delete' | 'tombstone_update';
  candidateCount: number;     // 対象行数
  appliedCount: number;       // dryRun=true なら 0
  cutoffAt: string;           // ISO retention 期限
};

export type ErrorEntry = { table: string; message: string; sqlState?: string };

export type RetentionPolicy = {
  version: string;
  defaultRetentionDays: number;       // 推奨 180
  tables: Array<{
    table: string;
    retentionDays: number;
    mode: 'physical_delete' | 'tombstone_update';
    pkColumn: string;
    cutoffColumn: string;             // 例: deleted_members.deleted_at
  }>;
};
```

## テスト方針

| レイヤ | 対象 | フレームワーク |
| --- | --- | --- |
| ユニット | `applyRetentionPolicy` の SQL 組立 / cutoff 計算 | Vitest（`apps/api/src/services/retention-policy.test.ts`） |
| 統合 | `runRetentionPurge` を miniflare D1 で end-to-end | Vitest + miniflare（`apps/api/src/jobs/retention-purge.test.ts`） |
| シナリオ | seed → cron tick → dry-run report → apply → restore round-trip | Phase 4 で staging 想定手順を定義 |
| 回帰 | dry-run mode で `appliedCount === 0` 不変条件 | Vitest property-based 風アサーション |

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- retention
# wrangler dev で Cron を即時 trigger（dry-run）
bash scripts/cf.sh dev --config apps/api/wrangler.toml --test-scheduled
curl 'http://localhost:8787/__scheduled?cron=0+18+*+*+*&dryRun=1'
```

## DoD（完了条件）

- [ ] retention policy SSOT (`data-retention-policy.md`) が table 別 retention / mode / rationale を含めて存在
- [ ] `deleted_members` に `purged_at` / `retention_policy_version` 列が migration 込みで追加
- [ ] `runRetentionPurge` が dry-run / apply の双方で動作し、`appliedCount === 0` (dry-run) を保証
- [ ] `applyRetentionPolicy` が PII-bearing row 物理削除と `deleted_members` tombstone update を実装
- [ ] D1 cascade 不在を前提に削除順序が子→親で実装される（Phase 3 依存図準拠）
- [ ] audit minimum (`deleted_members.{member_id, deleted_by, deleted_at, reason, purged_at, retention_policy_version}`) は retention 経過後も残置
- [ ] approve 時 API response に「本削除実施日（= deletedAt + retentionDays）」として `retentionPurgeScheduledAt` が含まれる
- [ ] retention purge は wrangler.toml 既存 `0 18 * * *` (UTC) daily branch を再利用し、cron 本数を増やさない
- [ ] manual runbook (`docs/runbooks/retention-physical-delete.md`) が dry-run / apply / rollback の3節を持つ
- [ ] retention 関連コードの coverage ≥ 80%（branch / line）
- [ ] staging で seed → cron tick → dry-run → apply → 復元 round-trip 検証完了

## 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/402
- source spec: `docs/30-workflows/completed-tasks/task-04b-admin-request-retention-physical-delete-001.md`
- 親タスク: 04b-followup-004 admin queue resolve workflow (#319)
- D1 制約参照: `docs/00-getting-started-manual/specs/08-free-database.md`
- aiworkflow SSOT: `.claude/skills/aiworkflow-requirements/references/`

## Phase 一覧

| Phase | 目的 | 状態 |
| --- | --- | --- |
| 1 | 要件定義・retention 期間選定・GO 判定 | spec_created |
| 2 | retention policy 設計（table 別表 / 判断ツリー / schema 拡張） | spec_created |
| 3 | アーキテクチャ（Cron / D1 binding / 削除順序 / dry-run / rollback 境界） | spec_created |
| 4 | 検証シナリオ（seed → tick → dry-run → apply → restore round-trip） | spec_created |
| 5 | 実装（schema migration / policy / job / runbook / SSOT） | completed |
| 6 | カバレッジ確認 | completed |
| 7 | カバレッジ判定（≥ 80%） | completed |
| 8 | 統合テスト（fake D1 unit + staging contract） | completed_local_runtime_pending |
| 9 | 品質検証（typecheck / lint / test） | completed_local |
| 10 | 最終レビュー・rollback 経路確認 | completed |
| 11 | 手動テスト / runtime evidence | blocked_runtime_evidence_pending |
| 12 | ドキュメント整備（必須7成果物） | completed |
| 13 | コミット・PR 作成 | blocked_pending_user_approval |

## Phase Links

- [Phase 1](phase-01.md)
- [Phase 2](phase-02.md)
- [Phase 3](phase-03.md)
- [Phase 4](phase-04.md)
