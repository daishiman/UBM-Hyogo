# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | pending |

## 目的

Phase 1〜9 の総点検と GO / NO-GO 判定。上流 6 task の AC 達成を確認、内部 blocker / リスクを列挙する。

## 実行タスク

- [ ] Phase 1〜9 成果物確認
- [ ] 上流 6 task AC 達成チェック
- [ ] 内部 blocker チェック
- [ ] リスクスコア
- [ ] GO / NO-GO 判定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜09/main.md | レビュー対象 |
| 必須 | doc/02-application-implementation/06a-parallel-public-landing-directory-and-registration-pages/index.md | 上流 |
| 必須 | doc/02-application-implementation/06b-parallel-member-login-and-profile-pages/index.md | 上流 |
| 必須 | doc/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/index.md | 上流 |
| 必須 | doc/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/index.md | 上流 |
| 必須 | doc/02-application-implementation/07b-parallel-schema-diff-alias-assignment-workflow/index.md | 上流 |
| 必須 | doc/02-application-implementation/07c-parallel-meeting-attendance-and-admin-audit-log-workflow/index.md | 上流 |

## 上流 wave AC 達成チェック

| 上流 task | 必要な AC | 状態 |
| --- | --- | --- |
| 06a public pages | view model schema 確定 / endpoint 一覧 | TBD |
| 06b member pages | `/me/*` view model | TBD |
| 06c admin pages | `/admin/*` view model | TBD |
| 07a tag queue | `POST /admin/tags/queue/:id/resolve` 仕様 | TBD |
| 07b schema alias | `POST /admin/schema/aliases` 仕様 | TBD |
| 07c attendance / audit | attendance + audit hook 仕様 | TBD |

いずれか未完なら **NO-GO**（本タスクは Wave 8 並列で 08b と独立、上流が前提）

## 内部 blocker チェック

| 観点 | チェック | 状態 |
| --- | --- | --- |
| AC-1〜7 全 PASS | Phase 7 matrix | TBD |
| 不変条件 #1/#2/#5/#6/#7/#11 カバー | Phase 7 不変条件 table | TBD |
| failure cases ≥ 10 | Phase 6 list | TBD |
| 5 種 verify suite signature 完備 | Phase 4 + 5 | TBD |
| coverage 閾値 placeholder | Phase 5 vitest.config | TBD |
| CI workflow yml placeholder | Phase 5 + 11 evidence | TBD |
| eslint rule 提案 | Phase 9 | TBD |

## リスクスコア

| リスク | 影響 | 確率 | スコア | 緩和策 |
| --- | --- | --- | --- | --- |
| view model schema が上流で変動 | 高 | 中 | 高 | Phase 8 で view model schema を packages/shared に集約、変動を 1 箇所に |
| msw handler の 漏れ で外部 API 呼び出し | 中 | 低 | 中 | `onUnhandledRequest: 'error'` 設定 |
| coverage 閾値未達 | 中 | 中 | 中 | Phase 5 で 1 endpoint 6〜7 ケース確保 |
| CI 時間超過 | 低 | 低 | 低 | in-memory sqlite + 並列実行 |
| profile 編集 endpoint がコード側で誤って追加される | 高 | 低 | 中 | eslint rule + contract 404 test 二重防御 |
| sync 失敗 fixture が更新追従しない | 中 | 中 | 中 | Phase 12 で skill-feedback に「msw handler の co-located 配置」を提案 |

## GO / NO-GO 判定

- **GO 条件**: 上流 6 task AC 全 PASS、内部 blocker 全 PASS、リスク「高」が緩和済み
- **NO-GO 候補**: 上流のいずれか view model schema 未確定、coverage 閾値達成困難、msw handler 整備不足

判定結果（記入）: TBD

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 後に `pnpm test` 実行 |
| 下流 09a / 09b | 本 task GO が deploy 前提 |

## 多角的チェック観点

- 不変条件 **#1 / #2 / #5 / #6 / #7 / #11** の最終照査
- 上流 7c の audit_log 仕様が contract test で expect されていること
- 上流 7a / 7b の workflow が contract / authz に含まれていること

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 6 task AC 確認 | 10 | pending | — |
| 2 | 内部 blocker | 10 | pending | 7 観点 |
| 3 | リスクスコア | 10 | pending | 6 リスク |
| 4 | GO / NO-GO | 10 | pending | 結果記入 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | レビュー結果 |
| メタ | artifacts.json | phase 10 status |

## 完了条件

- [ ] 上流 6 task AC PASS / NO-GO 確認
- [ ] 内部 blocker 7 観点 PASS
- [ ] GO 判定（NO-GO なら戻し）

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] GO 判定済み
- [ ] artifacts.json の phase 10 を completed

## 次 Phase

- 次: Phase 11 (手動 smoke)
- 引き継ぎ: GO 判定結果、residual risk
- ブロック条件: NO-GO なら Phase 11 不可、blocker 解消後再判定
