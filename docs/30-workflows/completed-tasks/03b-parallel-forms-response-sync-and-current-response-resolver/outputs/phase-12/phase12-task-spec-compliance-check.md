# Phase 12 task spec テンプレ準拠チェック

`docs/30-workflows/02-application-implementation/_templates/phase-template-app.md` および
`docs/30-workflows/02-application-implementation/README.md` に対して、本タスクの phase-01〜13 が必須セクションを
満たしているかを検証する。

## チェック表

| Phase | ファイル | 必須セクション網羅 | 追加セクション網羅 | 判定 |
|-------|---------|-------------------|--------------------|------|
| 1 | phase-01.md | OK（メタ情報 / 目的 / 実行タスク / 参照資料 / 完了条件 / 次 Phase） | true issue / 依存境界 / 価値とコスト / 4 条件 | PASS |
| 2 | phase-02.md | OK | Mermaid (cursor pagination 含む) / env / dependency matrix / module 設計 | PASS |
| 3 | phase-03.md | OK | alternative 4 案 / PASS-MINOR-MAJOR | PASS |
| 4 | phase-04.md | OK | verify suite / fixture 5 種 | PASS |
| 5 | phase-05.md | OK | runbook 7 章 + 擬似コード 7 関数 | PASS |
| 6 | phase-06.md | OK | failure cases 19 件 / retry 戦略 | PASS |
| 7 | phase-07.md | OK | AC matrix (AC-1〜AC-10) | PASS |
| 8 | phase-08.md | OK | naming/type/endpoint Before/After + 共通モジュール | PASS |
| 9 | phase-09.md | OK | free-tier estimate + secret hygiene + a11y + PII | PASS |
| 10 | phase-10.md | OK | GO/NO-GO + 並列契約整合 | PASS |
| 11 | phase-11.md | OK | manual evidence template + 再回答 / unknown / cursor シナリオ | PASS |
| 12 | phase-12.md | OK | 6 成果物（+ main.md = 7 ファイル） | PASS |
| 13 | phase-13.md | OK | approval gate / change-summary / PR template | PASS |

## 必須セクション詳細

各 phase が満たすべき必須セクション（テンプレ準拠）:

- メタ情報（タスク名・Phase 番号・Wave・Mode・作成日・前/次 Phase・状態）
- 目的
- 実行タスク
- 参照資料
- 実行手順
- 統合テスト連携
- 多角的チェック観点（不変条件番号 / 適用理由）
- サブタスク管理
- 成果物
- 完了条件
- タスク 100% 実行確認
- 次 Phase

## 不変条件カバレッジ

| 不変条件 | カバー Phase | カバー方法 |
|---------|------------|-----------|
| #1 schema 固定禁止 | 2 / 5 / 9 | stableKey 経由 design / runbook / QA |
| #2 consent キー統一 | 2 / 4 / 5 / 7 / 9 / 11 | extract-consent + AC-3 / AC-8 |
| #3 responseEmail = system field | 2 / 4 / 5 / 7 / 11 | SYSTEM_STABLE_KEYS + AC-4 |
| #4 profile 上書き禁止 | 5 / 7 / 11 | runbook + AC + smoke check |
| #5 apps/web → D1 直禁止 | 2 / 8 | 設計と DRY 化 |
| #6 GAS 排除 | 2 / 9 | design / QA |
| #7 ResponseId / MemberId 混同禁止 | 4 / 7 | types test + AC-7 |
| #10 無料枠 | 9 | free-tier-estimate.md + cron */15 + per sync 200 cap |
| #14 schema 集約 | 2 / 7 / 11 | schema_diff_queue + AC-2 |

## 追加セクション準拠

- [x] Phase 2: Mermaid 図、dependency matrix
- [x] Phase 4: fixture 命名と種類
- [x] Phase 5: runbook + pseudocode 分離
- [x] Phase 6: failure-cases.md（F-* 番号付け）
- [x] Phase 7: ac-matrix.md（AC × Test × Code）
- [x] Phase 9: free-tier-estimate.md / secret-hygiene.md
- [x] Phase 11: manual-evidence.md（テンプレ）
- [x] Phase 12: implementation-guide.md（中学生 + 技術者の 2 部）+ unassigned + skill feedback + compliance

## 判定

- 全 13 phase: **PASS**
- 不変条件 9 件すべてに少なくとも 1 phase でのカバーがある
- テンプレからの逸脱なし

## 残課題

なし。Phase 13 の change-summary.md / local-check-result.md は Phase 13 担当が作成する。
