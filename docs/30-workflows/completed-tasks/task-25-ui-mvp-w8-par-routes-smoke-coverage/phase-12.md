# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 12 / ドキュメント更新 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 12 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 12 の判断結果を `outputs/phase-12/main.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-12/main.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 12 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 詳細

## 必須タスク（strict 7 成果物）

| Task | 名称 | 成果物 |
|------|------|--------|
| 12-0 | Phase 12 main | `outputs/phase-12/main.md` |
| 12-1 | 実装ガイド作成（Part 1 + Part 2） | `outputs/phase-12/implementation-guide.md` |
| 12-2 | システム仕様書更新サマリ（Step 1-A〜1-C + 条件付き Step 2） | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 12-4 | 未タスク検出レポート（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | `outputs/phase-12/skill-feedback-report.md` |
| 12-6 | Phase 12 task-spec 準拠チェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Task 12-1: 実装ガイド構造

### Part 1（中学生レベル）

- 例え話: 「テストの coverage matrix は、検査表のようなもの。19 個の窓があるビルで、17 個は外から実際に開けて確認でき、2 個は内側の部品として点検方法を別に書く」
- 目的: なぜ matrix が必要か → CI 成功時でも何を見ているかを人間が把握するため

### Part 2（技術者レベル）

- matrix の構造（19 surface 行 × 5 軸 + visual / spec）
- Playwright API 対応マップ
- task-18 CI gate との接続
- 既存 4 baseline / 残り 15 non-baseline surfaces の関係
- 視覚証跡: `UI/UX変更なしのため Phase 11 スクリーンショット不要`

## Task 12-2: システム仕様書更新

| Step | 必須 | 内容 |
|------|------|------|
| 1-A | ✓ | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` を追加。`docs/30-workflows/LOGS.md` に task-25 完了を追記 |
| 1-B | ✓ | 親 workflow `EXECUTION-ORDER.md` の task-25 行を `spec_created` に更新 |
| 1-C | ✓ | 関連タスク（task-18 / task-23 / task-24 / task-26）テーブルにて本タスクのステータスを current facts に反映 |
| Step 2 | **N/A** | 新規インターフェース / 型 / API 追加なし（docs-only） |

## Task 12-3: documentation-changelog

各 Step（1-A / 1-B / 1-C / Step 2）の結果を「該当 / 該当なし」も含めて個別に明記する。

## Task 12-4: 未タスク検出（0 件でも出力必須）

Phase 10 で識別済み 3 件を current として登録:

| ID | 内容 | 関連タスク差分確認 |
|----|------|---------------------|
| U1 | 残り 15 non-baseline surfaces の visual baseline 採取 | task-18 §2.2 で MVP 後と明記済み（新規） |
| U2 | `error.tsx` の Playwright observable trigger / fixture 整備 | 既存タスクなし（新規） |
| U3 | `loading.tsx` の network throttle 観測戦略 standardize | 既存タスクなし（新規） |

baseline: 0 件（過去タスク由来の積み残しなし）

## Task 12-5: skill-feedback

- テンプレート改善: docs-only / verify_existing / NON_VISUAL の 3 軸タスクで Phase 5 が「diff check」になる場合、phase-template 側に "docs-only Phase 5" 専用テンプレ候補がない（要検討）
- ワークフロー改善: matrix の T1〜T11 lint を `scripts/verify-smoke-coverage-matrix.js` として工程化する案
- ドキュメント改善: SMOKE-COVERAGE-MATRIX.md を `references/` に格上げして横断 SSOT 化する案

## Task 12-6: phase12 compliance check

- strict 7 成果物の存在確認
- `artifacts.json` / `outputs/artifacts.json` parity
- aiworkflow-requirements 同期: quick-reference / resource-map / task-workflow-active / artifact inventory / changelog
- root evidence として `phase12-task-spec-compliance-check.md` を残す
