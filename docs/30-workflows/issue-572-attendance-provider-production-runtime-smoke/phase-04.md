# Phase 4: タスク仕様書記述（粒度確定 / 仕様書間依存）

> **CONST_004 / CONST_005 準拠の実装仕様書**。本ドキュメントは production runtime smoke ワークフローの仕様書粒度・仕様書間の依存関係・本仕様書群（Phase 5-7）が解こうとするスコープを確定するための spec であり、コード実装そのものは含まない（実装手順の記述は必須）。

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-4/phase-4.md` |
| 実装区分 | 仕様書記述（meta-spec） |
| 親 Issue | #572（CLOSED） |
| 関連 Issue | #531 / #371 / #571（すべて CLOSED） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的
production で `/admin/members*` および `/me*` の read-only GET smoke を PASS させ、`issue-371` の `workflow_state` を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` / `completed` に昇格するために必要な仕様書粒度を確定する。本 Phase は Phase 5（実装計画）/ Phase 6（実装手順）/ Phase 7（単体テスト）の入口として、依存ファイル・スコープ境界・正本順位を固定する。

## 実行タスク
詳細は `outputs/phase-4/phase-4.md` を正本とする。

## 仕様書間の依存
- Phase 5: production smoke スクリプト・redact filter 拡張・session 注入手順・wrangler binding 検証手順の **実装ステップ計画**（実装は本サイクルで反映済み）。
- Phase 6: 変更対象ファイル詳細・関数シグネチャ・差分方針（実装手順は記述するが、実装そのものは別タスク）。
- Phase 7: redact filter のユニットテスト追加 / wrangler env vars 解析テスト等の **単体テスト仕様**（実装は本サイクルで反映済み）。

## 統合テスト連携
- Phase 11（手動検証）が production runtime smoke の最終 evidence 取得点。Phase 5-7 で確定する spec が Phase 11 の前提となる。
- DI-bound evidence の契約 `.attendance | type == "array"` を `/admin/members/:memberId` および `/me/profile` の双方で確認する。

## 参照資料
- `outputs/phase-4/phase-4.md`
- `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/unassigned-task/runtime-smoke-attendance-provider-migration.md`（staging 用前駆タスク指示書）
- `apps/api/src/routes/admin/members.ts` / `apps/api/src/routes/me/index.ts`
- `apps/api/src/middleware/repository-providers.ts`
- `scripts/lib/redaction.sh` / `tests/unit/redaction.test.sh`
- `scripts/cf.sh`

## 成果物
- `outputs/phase-4/phase-4.md`
- 本ドキュメント（仕様書粒度・依存・スコープを固定するメタ仕様）

## 完了条件
- Phase 5/6/7 が分担すべきスコープ境界が確定している（実装計画 / 実装手順 / 単体テスト の 3 分割が明示）。
- production smoke / redact filter / session 注入 / wrangler binding 検証 の 4 ワークストリームが Phase 5 で計画化される旨が確定。
- 変更対象が `apps/api/scripts/runtime-smoke/`（新規）・`scripts/lib/redaction.sh`（拡張）・`docs/30-workflows/runbooks/`（新規 runbook）・親タスク state 更新 PR の 4 領域に限定されることが明記。
- 本 Phase 群はコード実装を行わない（実装手順は記述する）ことが冒頭で明示。
