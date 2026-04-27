# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | pending |

## 目的

Phase 1〜9 の総点検と GO / NO-GO 判定。上流 6 task (06a / 06b / 06c / 07a / 07b / 07c) の実 UI / workflow が揃っていることを確認し、AC-1〜8 と不変条件 #4 / #8 / #9 / #15 の E2E 担保を最終照査する。並列タスク 08a の API 契約と齟齬がないことも併せて確認する。

## 実行タスク

- [ ] Phase 1〜9 成果物の配置確認
- [ ] 上流 6 task AC 達成チェック
- [ ] 並列 08a との fixture / 命名整合確認
- [ ] 内部 blocker チェック（AC × suite × 不変条件）
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
| 必須 | doc/02-application-implementation/08a-parallel-api-contract-repository-and-authorization-tests/index.md | 並列、命名整合 |

## 上流 wave AC 達成チェック

| 上流 task | 必要な AC | E2E から見た成立条件 | 状態 |
| --- | --- | --- | --- |
| 06a public pages | `/`, `/members`, `/members/[id]`, `/register` の view + URL | public.spec の navigation がすべて pass | TBD |
| 06b member pages | `/login` の AuthGateState 5 状態 + `/profile` view | login.spec / profile.spec の signature が動作 | TBD |
| 06c admin pages | `/admin/*` 5 画面 view + 認可境界 | admin.spec の admin/member/anon 3 軸が動作 | TBD |
| 07a tag queue | `/admin/tags` で resolve UI | admin.spec の tag シナリオ (queue → resolve) | TBD |
| 07b schema alias | `/admin/schema` で alias 操作 UI | admin.spec の schema シナリオ (diff → alias) | TBD |
| 07c attendance / audit | `/admin/meetings/:id` attendance + audit hook | attendance.spec の dup toast + 削除済み除外 | TBD |

いずれか未完なら **NO-GO**（本タスクは Wave 8 並列で 08a と独立、上流 6 task が前提）

## 並列 08a との整合チェック

| 観点 | 08a (API contract) | 08b (E2E) | 整合状態 |
| --- | --- | --- | --- |
| brand 型 / view model schema | packages/shared から import | 同 import | TBD |
| fixture 定義 | apps/api/test/fixtures/users.ts | apps/web/tests/fixtures/seed.ts (D1 execute で同 fixture) | TBD |
| auth session 形式 | session cookie 直接生成 | `adminPage` / `memberPage` fixture | TBD |
| `/no-access` 取扱い | contract に存在しない (404) | login.spec で 404 verify | TBD |
| profile 編集 endpoint 不在 | 08a の eslint rule で禁止 | profile.spec で form 不在 verify | TBD |
| attendance UNIQUE | 08a の contract test で 409 | 08b の UI で toast verify | TBD |

## 内部 blocker チェック

| 観点 | チェック | 状態 |
| --- | --- | --- |
| AC-1〜8 全 PASS | Phase 7 matrix | TBD |
| 不変条件 #4 / #8 / #9 / #15 が E2E test として記述 | Phase 4 + 6 + 7 | TBD |
| failure cases ≥ 12 | Phase 6 list (F-1〜F-14) | TBD |
| 7 種 spec signature 完備 | Phase 4 (public/login/profile/admin/search/density/attendance) | TBD |
| Playwright config / fixtures / helpers placeholder | Phase 5 | TBD |
| screenshot 30 枚以上の命名規約 | Phase 4 + 7 (36 枚目論み) | TBD |
| CI workflow yml placeholder | Phase 5 + 11 evidence | TBD |
| eslint rule 提案 | Phase 9 (#5 / #8 / #9) | TBD |
| browser matrix (chromium + webkit) | Phase 5 + 9 | TBD |
| viewport matrix (desktop + mobile) | Phase 4 + 5 + 9 | TBD |

## リスクスコア

| リスク | 影響 | 確率 | スコア | 緩和策 |
| --- | --- | --- | --- | --- |
| 上流 06b の AuthGateState UI が遅延 | 高 | 中 | 高 | login.spec の `gotoState` を hash / クエリ起点で疎結合化、UI 完成前は state stub も検討 |
| 上流 06c の admin UI がない状態で admin.spec が大量 fail | 高 | 中 | 高 | 上流 GO 待機を Phase 10 の必須条件にし、未達時は本 task を pause |
| editResponseUrl 遷移で Google Form が popup blocker に阻まれる | 中 | 中 | 中 | Phase 6 F-8 の通り tolerable とし、CI 上は popup 開く設定で安定化 |
| screenshot サイズが artifact 上限超過 | 中 | 低 | 中 | desktop only fullPage / mobile clip にする、PNG 圧縮 helper 追加 |
| webkit (mobile) の flaky | 中 | 中 | 中 | retries: CI 時 1、trace 取得で原因解析 |
| axe report が node を冗長に保持し PII 漏洩 | 高 | 低 | 中 | runAxe wrapper で `nodes` を `target` のみに redact |
| local Workers の port 競合 / 起動失敗 | 中 | 中 | 中 | webServer.timeout 60s、`reuseExistingServer` で local debug 容易化 |

## GO / NO-GO 判定

- **GO 条件**: 上流 6 task UI / workflow が staging deploy 直前まで完成、内部 blocker 全 PASS、リスク「高」が緩和済み、08a と命名整合
- **NO-GO 候補**: 上流の admin UI / AuthGateState UI 未完、screenshot 30 枚未達計画、不変条件のいずれかが test 化されていない、eslint rule 未策定

判定結果（記入）: TBD

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 後に `pnpm --filter @ubm/web exec playwright test` 実行 |
| 下流 09a / 09b | 本 task GO が staging deploy + release runbook 前提 |
| 並列 08a | 同 wave 完了 GO で 09a 着手可能 |

## 多角的チェック観点

- 不変条件 **#4 / #5 / #8 / #9 / #15** の最終照査
- 上流 7c の audit_log が attendance UI 操作で必ず記録されること（E2E は audit を直接 verify しないが、API 経由で副作用が発生することは前提）
- 上流 7a / 7b の workflow UI が admin.spec から連鎖 verify されていること
- 08a の eslint rule (apps/web → D1 禁止) が apps/web/tests にも適用されていること

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 6 task AC 確認 | 10 | pending | 06a/b/c + 07a/b/c |
| 2 | 並列 08a 整合確認 | 10 | pending | brand 型 / fixture / 命名 |
| 3 | 内部 blocker | 10 | pending | 10 観点 |
| 4 | リスクスコア | 10 | pending | 7 リスク |
| 5 | GO / NO-GO | 10 | pending | 結果記入 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | レビュー結果 |
| メタ | artifacts.json | phase 10 status |

## 完了条件

- [ ] 上流 6 task AC PASS / NO-GO 確認
- [ ] 並列 08a との整合 PASS
- [ ] 内部 blocker 10 観点 PASS
- [ ] GO 判定（NO-GO なら戻し）

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] GO 判定済み
- [ ] artifacts.json の phase 10 を completed

## 次 Phase

- 次: Phase 11 (手動 smoke)
- 引き継ぎ: GO 判定結果、residual risk、上流 6 task の deploy 可用性
- ブロック条件: NO-GO なら Phase 11 不可、上流 UI 完成 / blocker 解消後再判定
