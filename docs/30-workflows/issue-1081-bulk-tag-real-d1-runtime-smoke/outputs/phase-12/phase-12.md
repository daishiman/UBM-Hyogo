# Phase 12: ドキュメント更新

## 目的

issue #1081 実装仕様書の strict 7 outputs を生成し、`implemented_local_evidence_captured` として close-out する。bulk tag endpoint（issue-1036 landed 済）を staging real D1 で実走させる runtime smoke 基盤の実装ガイド / spec sync / 未タスク検出 / skill feedback を完成させる。コード実装と local evidence は本サイクルで完了し、staging 実走だけ user-gated。

## strict 7 outputs

| # | ファイル | 状態 |
| - | -------- | ---- |
| 1 | `outputs/phase-12/main.md` | 作成済み（タスク要約 / 成果物 / 実装対象・仕様化のみ / 状態） |
| 2 | `outputs/phase-12/implementation-guide.md` | 作成済み（Part 1 ナビ / Part 2 実装詳細・関数シグネチャ + SQL + CI YAML + jq） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 作成済み（Step 1-A/1-B/1-C + aiworkflow index sync + ドメイン契約変更なし） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 作成済み（作成ファイル / validator / current vs baseline / 変更理由） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 作成済み（4 パターン + 3 候補・本体スコープ分離） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 作成済み（FB-1/2/3・改善点あり） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 作成済み（canonical 9 見出し） |

## Step 1-A〜1-C（implemented local close-out）

- Step 1-A: タスク記録 — 本タスク root を 30-workflows ledger に `implemented_local_evidence_captured` で記録。親 `completed-tasks/issue-1036-bulk-member-tag-assign/` の in-memory テストを staging real D1 runtime smoke gate へ拡張する実装として位置付け。
- Step 1-B: 実装状況テーブル — 仕様書 Phase 1-13 作成完了 / runner・SQL fixture・CI job・local test 実装済み / runtime 検証 pending（Gate-B）/ commit・PR pending（Gate-C）。
- Step 1-C: 関連タスクテーブル — 親 issue-1036（endpoint landed・変更しない）/ consumed unassigned（formalize）/ issue #913（別物）/ 既存 runtime smoke（別 endpoint・重複なし）の関係を記録。
- Step 2: ドメイン契約（API/IPC/UI/auth/schema/Secret）への新規影響なし。aiworkflow index / task-workflow-active へ workflow registration を同期。

## 完了判定

- [x] strict 7 を全て生成（canonical 9 見出し逐語準拠）
- [x] implementation-guide.md を Part 1 / Part 2 で実体付き作成（heading-only 回避）
- [x] Phase 11 evidence inventory を `Classification / Path / Status` テーブルで固定し、local evidence present / staging evidence pending と明記
- [x] Step 1-A〜1-C を implemented local 状態で close-out（domain contract は変更なし）
- [x] issue #1081 CLOSED 維持・コード実装と staging 実走は後続 / user-gated
