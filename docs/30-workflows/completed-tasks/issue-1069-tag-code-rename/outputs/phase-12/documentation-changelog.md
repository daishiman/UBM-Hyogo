# documentation-changelog

## サマリ

Issue #1069「tag master `code` rename」の Phase 1-13 実装仕様書を新規作成し、local code/spec 実装と deterministic evidence 取得まで完了した。
commit/PR/staging runtime/Issue mutation は未実施（user-gated）。Issue #1069 は 2026-06-03 外部 CLOSED（本ワークフローは状態変更せず）。

## workflow-local 同期（本 workflow 内）

| 対象 | 内容 | 状態 |
| --- | --- | --- |
| `index.md` | workflow エントリ・実装区分・スコープ・Phase 一覧 | 作成 |
| `artifacts.json` / `outputs/artifacts.json` | gate metadata（Gate-A/B/C passed）・phases・byte-identical parity | 更新 |
| `DESIGN-BRIEF.md` | SubAgent 共有設計正本（close-out 時に削除可の補助資料） | 作成 |
| `outputs/phase-1..3/*.md` | 要件定義 / 設計（ADR）/ 設計レビュー（Gate-A 証跡） | 作成 |
| `outputs/phase-4..7/*.md` | テスト作成 / 実装 / テスト拡充 / カバレッジ | 作成 |
| `outputs/phase-8..10/*.md` | リファクタ / 品質保証 / 最終レビュー | 作成 |
| `outputs/phase-11/manual-test-result.md` | NON_VISUAL deterministic evidence（focused tests / typecheck / lint / static manifest） | 更新 |
| `outputs/phase-12/*`（strict 7） | 本 close-out セット | 作成 |
| `outputs/phase-13/phase-13.md` | PR 計画（user-gated） | 作成 |

## global skill sync（同一 wave 実施）

| 対象 | 内容 | 状態 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 不変条件 #13 を rename 可へ改訂 | done |
| aiworkflow-requirements `LOGS.md` / `indexes/*` | issue-1069 entry | done |
| task-specification-creator feedback | FB-I1069-001..004 を本 workflow docs / implementation checklist に反映 | done |

## Step 別記録

- Step 1-A（完了タスク記録）: done。
- Step 1-B（実装状況テーブル）: `implemented_local_evidence_captured` を記録。
- Step 1-C（関連タスクテーブル）: issue-1035（親・supersede 元）/ followup-001 / followup-003 を記録。
- Step 2（システム仕様更新）: 更新要（新規インターフェース追加 + 不変条件 #13 改訂）。改訂方針を記録。
</content>
