# Phase 12: ドキュメント更新 / 未タスク検出 / skill フィードバック

[実装区分: 実装仕様書]

## メタ情報

| Phase | 12 / 13 |
| --- | --- |
| 前 Phase | 11 |
| 次 Phase | 13（PR 作成） |
| 状態 | completed |

## 必須 Task 1〜6（task-specification-creator skill 規定）

### Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` を作成する。Part 1（中学生レベル）と Part 2（技術者レベル）の 2 部構成。

#### Part 1（中学生レベル）— 例

> 「03a と 03b は同じ部品を使う 2 人組のような関係です。今までは『どっちが部品を作る人』『どっちが借りて使う人』を紙に書いていなかったので、ぶつかって壊す危険がありました。今回は紙（owner 表）を作って、貼り出した、というだけの作業です。」

#### Part 2（技術者レベル）

- 対象モジュール: `apps/api/src/jobs/_shared/ledger.ts` / `sync-error.ts`
- 編集ファイル: `_design/README.md`（新規） / `_design/sync-shared-modules-owner.md`（新規） / 03a index.md / 03b index.md
- gate: Phase 6 markdown lint / Phase 7 cross-ref / Phase 9 secret hygiene
- 後続: 未割当 #7（schema 集約）が本表を foundation として起票

### Task 12-2: システム仕様書更新

`docs/00-getting-started-manual/specs/` 配下への反映は **不要**（システム正本は変更されない、governance 文書の追加のみ）。理由を `outputs/phase-12/system-spec-update-summary.md` に明記:

- Step 1-A: 不要（API schema 不変）
- Step 1-B: 不要（D1 schema 不変）
- Step 1-C: 不要（auth 不変）
- Step 2: 条件不成立（runtime API / DB / auth / UI contract 変更なし。`apps/api/src/jobs/_shared/` skeleton は内部 facade）

ただし `aiworkflow-requirements` の `references/` または `indexes/` のうち workflow 一覧に本タスクを 1 行追加する必要がある場合は、`references/task-workflow-active.md` と `indexes/resource-map.md` に same-wave 登録し、必要に応じて index 再生成または targeted grep で drift 0 を確認する（CI gate `verify-indexes-up-to-date`）。

### Task 12-3: ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md` に下記を記録:

- 新規: `docs/30-workflows/_design/README.md`
- 新規: `docs/30-workflows/_design/sync-shared-modules-owner.md`
- 編集: `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md`
- 編集: `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md`

### Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**）。本タスクで判明した残課題候補:

1. `sync_jobs` `job_type` enum / `metrics_json` schema 集約タスク（未割当 #7、本表を foundation に起票予定）
2. 03a / 03b spec 文中の「主担当 / サブ担当」語彙の "owner / co-owner" 統一
3. `_design/` 配下に置くべき他の workflow 横断 governance 文書（例: 認証共通 helper の owner 表）の起票要否

### Task 12-5: skill フィードバックレポート

`outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須**）。候補:

- task-specification-creator skill: code / NON_VISUAL governance タスクで「owner 表 + skeleton 実体化」テンプレを `references/` 化する案
- aiworkflow-requirements skill: `_design/` 階層を resource-map に分類として追加する案

### Task 12-6: phase12 task spec compliance check

`outputs/phase-12/phase12-task-spec-compliance-check.md` に `outputs/phase-12/` 配下の 7 ファイル実体存在、root / outputs `artifacts.json` parity、`completed` へ実態同期、Phase 13 user approval gate を記録する。1 つでも欠落した場合は PASS 断言せず blocker を列挙する。

## 成果物

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/main.md`

## 完了条件

- `outputs/phase-12/` の 7 ファイルすべてを実体確認できる
- root `artifacts.json` と `outputs/artifacts.json` が同一内容で、`metadata.visualEvidence: NON_VISUAL` / `metadata.workflow_state: completed` を保持している
- `aiworkflow-requirements` workflow 一覧への same-wave 登録結果が `system-spec-update-summary.md` に記録されている
- `pnpm indexes:rebuild` を実行した場合は CI gate `verify-indexes-up-to-date` が PASS

## 目的

本 Phase の目的は、issue-195 follow-up 002 を code / NON_VISUAL workflow として矛盾なく完了させるための判断・作業・検証を記録すること。

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
