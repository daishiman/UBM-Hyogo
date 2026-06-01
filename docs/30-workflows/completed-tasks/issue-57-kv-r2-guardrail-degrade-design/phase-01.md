# Phase 1: 要件定義 — Issue #57 (KV/R2 guardrail + executable degrade)

> NON_VISUAL / 実装仕様書。implementation_mode: new。

## 1. 概要

Issue #57 の真の論点（05a 完了後に R2 audit cold-storage binding が追加されたことによる spec↔code ドリフト、および degrade 手順の実行不能性）を解消するための要件を固定する。

## 2. 目的

- KV / R2 の current official free-tier limits を正本仕様へ確認日付きで記録する。
- binding 実体（`apps/api/wrangler.toml` / `apps/api/src/env.ts`）と仕様記述の一致を保証する。
- 実稼働中の R2 audit cold-storage export に対する実行可能な degrade（env フラグ kill-switch）を提供する。

## 3. P50 前提確認チェック

| 確認項目 | 結果 |
| --- | --- |
| current branch に実装が存在するか | No（kill-switch / env.ts 型整合 / runbook 数値閾値は未実装）→ 通常の実装 Phase |
| upstream にマージ済みか | 対象コード未マージ |
| 前提タスク完了済みか | 05a = completed。R2 binding 追加（#514/#315）= 実装済み（前提利用） |

> 結論: `implementation_mode: new`。Phase 5 は新規実装（kill-switch）+ ドキュメント是正の両輪。

## 4. 既存コードベースの命名規則分析（FB-01 / FB-SDK-07-4）

- env var 命名: `SCREAMING_SNAKE_CASE`（`TAG_QUEUE_PAUSED` / `RETENTION_PURGE_MODE` / `MEMBERS_AUTO_PUBLISH_ON_CONSENT`）→ 新規フラグは `AUDIT_COLD_STORAGE_EXPORT_PAUSED`（既存 `*_PAUSED` に整合）。
- env bool 表現: 文字列 `"true"` / `"false"`（`TAG_QUEUE_PAUSED` と同形）。
- env 型: `apps/api/src/env.ts` の `Env` interface（`readonly XXX?: string` / `readonly XXX?: R2Bucket`）。
- env 参照: apps/api は `c.env.XXX`（Hono context）。apps/web は対象外。

## 5. 受け入れ基準（AC）— 明示列挙

- **AC-1**: KV reads(100k/day) / writes(1k/day) / deletes(1k/day) / list(1k/day) / storage(1GB) と R2 Standard storage(10GB-month) / Class A(1M/月) / Class B(10M/月) の current official free-tier limits を `specs/08-free-database.md` の無料枠表と `deployment-cloudflare.md` に確認日付きで記録（実行日に公式値を再確認し確認日併記）。
- **AC-2**: binding 棚卸し表を `outputs/phase-01/main.md` に作り、`deployment-cloudflare.md` の「R2 binding 未適用」「KV binding 未追加」stale 記述を、実在 binding（`UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE`、prod+staging）を反映する形へ是正。
- **AC-3**: `cost-guardrail-runbook.md` §2-7 に KV/R2 数値閾値（警戒/対処段階）を入れ、§4-2 を実稼働中 R2 export に対し実行可能な degrade（kill-switch 操作手順）へ書き換え。
- **AC-4**: `env.ts` の `ALERT_DEDUP_KV: KVNamespace`（必須）を runtime 実体（toml コメントアウト=未活性）と整合させる（optional 化）。alert-relay.ts が absence を guard していることを Phase 5 で確認した上で適用。
- **AC-5**: GitHub repository variable `AUDIT_COLD_STORAGE_EXPORT_PAUSED`（default `"false"`）を workflow から script env へ渡し、`export-to-r2.ts` がこれを尊重して R2 export を short-circuit。回帰テスト追加。
- **AC-6**: 05a runbook と 05a/05b handoff 表記を current facts へ同期。

## 6. inventory（変更対象ファイルの俯瞰）

| ファイル | 変更種別 | 関連 AC |
| --- | --- | --- |
| `scripts/audit-log/export-to-r2.ts` | 編集 | AC-5 |
| `apps/api/src/env.ts` | 編集 | AC-4 |
| `apps/api/src/routes/internal/alert-relay.ts` | 編集 | AC-4 |
| `.github/workflows/audit-log-cold-storage.yml` | 編集 | AC-5 |
| `scripts/audit-log/__tests__/export-to-r2.spec.ts` | 編集 | AC-5 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 編集 | AC-1 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集 | AC-1, AC-2 |
| `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` | 編集 | AC-3, AC-6 |

## 7. テスト実行環境メモ（FB-UI-02-2 / FB-MSO-002）

- 対象 targeted run: `mise exec -- pnpm exec vitest run scripts/audit-log/__tests__/export-to-r2.spec.ts apps/api/src/routes/internal/__tests__/alert-relay.spec.ts apps/api/src/routes/internal/__tests__/alert-relay.sheets-auth.contract.spec.ts`。
- worktree 直後は `mise exec -- pnpm install` で esbuild darwin バイナリ整合を確認してから着手。

## 8. 成果物

| 成果物 | パス |
| --- | --- |
| 要件定義 + binding 棚卸し表 | `outputs/phase-01/main.md` |

## 9. 完了条件

- AC-1〜AC-6 が明示列挙されている。
- 変更対象ファイル inventory が確定している。
- binding 棚卸し表ドラフトが `outputs/phase-01/main.md` にある。

## 10. 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| deployment-cloudflare | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | KV/R2/binding 正本（stale 是正対象） |
| free-database spec | `docs/00-getting-started-manual/specs/08-free-database.md` | 無料枠前提（KV/R2 limit 追記対象） |

### コード anchor

- route owner: `scripts/audit-log/export-to-r2.ts`
- env owner: `apps/api/src/env.ts`
- binding 宣言: `apps/api/wrangler.toml`（prod L120-136 / staging L202-218）


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 1 / taskType: implementation / visualEvidence: NON_VISUAL

## 目的

KV/R2 guardrail drift と executable degrade を、実装・仕様・証跡の同一 wave で整合させる。

## 実行タスク

- 本文の「実行タスク」または該当する設計・検証セクションを参照。

## 参照資料

本文の「参照資料」セクション、index.md、outputs/artifacts.json を参照。

## 成果物/実行手順

本文の成果物表および outputs/phase-* 配下の対応成果物を参照。

## 完了条件

- [x] 本文の完了条件および artifacts.json の phase status を参照。

## 統合テスト連携

NON_VISUAL のため focused Vitest / typecheck / lint を統合証跡とし、UI screenshot は不要。
