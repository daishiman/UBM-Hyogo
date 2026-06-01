# Phase 12: ドキュメント整合

| 項目 | 値 |
| --- | --- |
| 実装区分 | 実装仕様書（本サイクルで guard test 実装済み） |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| canonical 見出し SSOT | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の `## Required Sections` 1..9 |

## strict 7 ファイル一覧（`outputs/phase-12/`）

本フラット phase ファイルは概要のみを示し、Phase 12 の本体は `outputs/phase-12/` 配下の strict 7 に配置する:

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリ（中学生レベルの概念説明含む） |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装ガイド本体。**ADR（再スコープ判断）＋ 解析的無料枠予算表**を含む（DoD 必須） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | system spec 同期サマリ（本サイクルは参照・back-link 同期済み） |
| 4 | `outputs/phase-12/documentation-changelog.md` | ドキュメント変更履歴 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未割当タスク検出 ＋ supersede 記録 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | スキルフィードバック |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し compliance チェック（既存） |

> strict 7 の生成・更新は別エージェントが `outputs/phase-12/` に対して行う。本フラット `phase-12.md` は
> 索引・方針記述のみを担い、strict 7 本体は重複生成しない。

## canonical 9 見出し compliance の位置づけ

`outputs/phase-12/phase12-task-spec-compliance-check.md` が canonical 9 見出し（SSOT テンプレ逐語）で
本ワークフローの整合を検証する。verdict は implemented_local_evidence_captured（guard test 実装済み）前提の
`PASS_IMPLEMENTED_LOCAL_EVIDENCE_CAPTURED_STRICT_7_SYNCED`。

- four-condition verdict（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）すべて PASS。
- Phase 11 evidence inventory は spec-only テンプレ（`n/a` 1 行）で existence 検証を満たす。
- root `artifacts.json` と `outputs/artifacts.json` は byte-identical（parity OK）。

## system spec 同期方針

| 対象 | 本サイクルの扱い | 申し送り |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（L85-89 / L171 / L259-269） | **参照・back-link 同期済み**（free-plan 3-cron 上限・Forms sync・legacy Sheets manual-only を正本として参照。同一サイクルで back-link 追記） | guard test 本サイクルで、当該箇所へ **guard test への back-link を 1 行追記**（「enforcement: `wrangler-cron-schedule.guard.spec.ts`」） |
| issue #266 enum（`SyncLogStatus=running\|success\|failed\|skipped` / `SyncTriggerType=cron\|admin\|backfill`） | 観測クエリ・予算表の値整合に参照 | 変更なし |
| `apps/api/wrangler.toml` | cron 値は既に canonical（L14 / L91 / L173）。**編集なし** | guard が値を固定（本サイクルで実装済み） |

> 本サイクルは spec 作成のため system spec 本体の編集は行わない（CONST: docs-only / apps 非接触）。guard test が
> 実装されることで「3-cron 上限の enforcement」が初めてコードで担保される、という関係を documentation-changelog に記録する。

## supersede 記録方針

| 対象 | 記録先 | 方針 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md`（原 Sheets 24h 実測タスク） | `outputs/phase-12/unassigned-task-detection.md` + index.md `supersedes` 欄 | 本ワークフローが supersede。**ファイル削除はuser-gated**（live unassigned-task ledger を本サイクルで破壊しない）。supersession を記録のみ |

> stale 参照ゲート: `issue-264-cron-schedule-free-tier-guard` の hit はすべて本ワークフロー自身の live inventory。
> stale 参照 0 件であることを compliance-check の `Archive/delete stale-reference gate` 節で確認済。

## DoD（Phase 12）

- strict 7 ファイル一覧（`outputs/phase-12/` の 7 ファイル）を提示。
- canonical 9 見出し compliance の位置づけ（spec_created verdict）を明記。
- system spec 同期方針（本サイクルは参照・back-link 同期済み・実装時に deployment-cloudflare.md へ back-link 追記の申し送り）を明記。
- supersede 記録方針（U-UT01-02 は記録のみ・削除は user-gated）を明記。
