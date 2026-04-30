# Phase 10: 最終レビュー — GO / NO-GO

> 目的: Phase 1〜9 の総点検と GO 判定。上流 6 task の AC 達成状態と AC-1〜8 の達成見込みを確認し、本タスクが scaffolding として GO 可能かを判定する。

## 1. 上流 6 task AC 達成チェックリスト（GO 条件）

| 上流 task | 必要 AC | E2E 成立条件 | 現状判定 |
| --- | --- | --- | --- |
| 06a public pages | `/` / `/members` / `/members/[id]` / `/register` 表示 | public.spec の 4 navigation pass | **GO 前提**（merged 済み） |
| 06b member pages | `/login` AuthGateState 5 状態 + `/profile` | login.spec / profile.spec の signature 動作 | **GO 前提**（merged 済み） |
| 06c admin pages | `/admin/*` 5 画面 + 認可境界 | admin.spec の admin/member/anon 3 軸 | **GO 前提**（merged 済み） |
| 07a tag queue | `/admin/tags` resolve UI | admin.spec の tag シナリオ | **GO 前提**（merged 済み） |
| 07b schema alias | `/admin/schema` alias UI | admin.spec の schema シナリオ | **GO 前提**（merged 済み） |
| 07c attendance / audit | `/admin/meetings/:id` attendance + audit | attendance.spec の dup toast / 削除済み除外 | **GO 前提**（merged 済み、PR #316） |

> 上流が green である前提で本タスクは scaffolding 完了として GO。実 UI が staging 相当で稼働している必要があるため、Phase 11 の手動 smoke 時点で再確認する。

## 2. AC-1〜8 達成見込み

| AC | 内容 | 達成手段 | 達成見込み |
| --- | --- | --- | --- |
| AC-1 | 検証マトリクス全 20 セル green | 7 spec × 2 viewport（Phase 7 ac-matrix） | **PASS 見込み**（scaffolding 完備） |
| AC-2 | 公開導線 4 シナリオ × 2 viewport | public.spec.ts | **PASS 見込み** |
| AC-3 | AuthGateState 5 状態 + `/no-access` 404 | login.spec.ts、`gotoState` × 5 + `assertNoAccessReturns404` | **PASS 見込み**（不変条件 #9） |
| AC-4 | editResponseUrl 遷移 + reload 後 state 維持 | profile.spec.ts、popup → forms.google.com viewform | **PASS 見込み**（不変条件 #4 / #8） |
| AC-5 | admin 5 画面 × 認可境界 3 ロール + attendance 二重防御 | admin.spec.ts + attendance.spec.ts | **PASS 見込み**（不変条件 #15） |
| AC-6 | 検索 6 パラメータ + density 3 値 | search.spec.ts + density.spec.ts | **PASS 見込み** |
| AC-7 | screenshot ≥ 30 枚 | Phase 7 集計で 44 枚計画 | **PASS 見込み** |
| AC-8 | axe WCAG 2.1 AA 主要違反 0 件 | runAxe helper × 14 行 | **PASS 見込み**（admin の color-contrast は除外可） |

## 3. 並列 08a との整合チェック

| 観点 | 08a (API contract) | 08b (E2E) | 整合 |
| --- | --- | --- | --- |
| brand 型 / view model schema | `packages/shared` から import | 同 import | OK |
| fixture user 定義 | `apps/api/test/fixtures/users.ts` | `apps/web/tests/fixtures/seed.ts` 同 user | OK |
| auth | session cookie 直接生成 | `adminPage` / `memberPage` fixture で同 helper 再利用 | OK |
| `/no-access` | contract 404 | login.spec で 404 verify | OK |
| profile 編集 endpoint | eslint 禁止 | UI form 不在 verify | OK |
| attendance UNIQUE | 09 contract test で 409 | UI で toast verify | OK |

## 4. 内部 blocker チェック

| # | チェック項目 | 状態 |
| --- | --- | --- |
| 1 | AC-1〜8 全 PASS 見込み | OK |
| 2 | 不変条件 #4 / #8 / #9 / #15 が E2E test として記述 | OK（Phase 4 + 6 + 7） |
| 3 | failure cases ≥ 12 | OK（F-1〜F-14） |
| 4 | 7 種 spec signature 完備 | OK（public/login/profile/admin/search/density/attendance） |
| 5 | playwright config / fixtures / helpers placeholder | OK（Phase 5） |
| 6 | screenshot 30 枚以上の命名規約 | OK（44 枚計画） |
| 7 | CI workflow yml placeholder | OK（Phase 5 + 11 evidence） |
| 8 | eslint rule 提案 | OK（#5 / #8 / #9） |
| 9 | browser matrix (chromium + webkit) | OK |
| 10 | viewport matrix (desktop + mobile) | OK |

## 5. リスクスコア（Phase 9 検討の最終版）

| リスク | 影響 | 確率 | スコア | 緩和策 |
| --- | --- | --- | --- | --- |
| 上流 06b AuthGateState UI に細部変更 | 中 | 低 | 低 | `gotoState` を疎結合化、Phase 11 で実画面確認 |
| editResponseUrl popup blocker | 中 | 中 | 中 | F-8 として tolerable、CI 上は popup 開く設定 |
| screenshot サイズ artifact 上限 | 中 | 低 | 低 | desktop fullPage / mobile clip、PNG 圧縮 |
| webkit (mobile) flaky | 中 | 中 | 中 | retries=2、trace で原因解析 |
| axe report に PII | 高 | 低 | 中 | runAxe で `target` のみ redact |
| local Workers port 競合 | 中 | 中 | 中 | webServer.timeout 60s、`reuseExistingServer` |

## 6. GO / NO-GO 判定

**判定: GO（scaffolding 完了として）**

判定根拠:
- 上流 6 task は merged 済みで前提条件を満たす
- Phase 1〜9 の成果物（AC マトリクス / DRY 化 / QA 観点）すべて配置済み
- AC-1〜8 達成手段が page-object + fixture + helper として定義済み
- 不変条件 #4 / #8 / #9 / #15 が複数 AC 行で多重トレース済み
- リスク「高」は 1 件のみで緩和策定義済み

NO-GO 候補（Phase 11 で再判定が必要な事項）:
- 上流の admin UI / AuthGateState UI が staging で実稼働しているか
- screenshot 30 枚の実取得結果（44 枚計画 → 実際の生成数）
- axe violation の実測値が AC-8 を満たすか

## 7. 残作業（Phase 11 で実評価が必要な項目）

| # | 項目 | Phase 11 の確認内容 |
| --- | --- | --- |
| 1 | local Workers + local D1 seed の起動 | `mise exec -- pnpm --filter @ubm/web exec playwright test` 実行 |
| 2 | screenshot 実生成（44 枚目論み） | `outputs/phase-11/evidence/{desktop,mobile}/` 配置 |
| 3 | axe-report.json 生成 | violation 数を実測 |
| 4 | playwright-report HTML | `outputs/phase-11/evidence/playwright-report/` 配置 |
| 5 | CI workflow yml drift 確認 | `.github/workflows/e2e-tests.yml` placeholder と整合 |
| 6 | 不変条件の実 UI 反映 | #4 編集 form 不在 / #9 `/no-access` 404 / #15 toast |
| 7 | flaky 実測 | retries=2 で 100% pass か |

## 8. 不変条件への参照（最終照査）

- **#4** profile に編集 form がない E2E（`ProfilePage.assertNoEditFormVisible()`）
- **#8** reload 後の state 維持（`BasePage.reloadAndClearStorage()` + `localStorage.clear()`）
- **#9** `/no-access` 404 + AuthGateState 5 状態出し分け（`LoginPage.gotoState` / `assertNoAccessReturns404`）
- **#15** attendance 二重防御（`AttendancePage.assertDuplicateToast` / `assertDeletedExcluded`）

## 9. 完了条件

- [x] 上流 6 task AC 達成チェック完了
- [x] 並列 08a との整合確認完了
- [x] 内部 blocker 10 観点 PASS
- [x] リスクスコア記録
- [x] **GO 判定**（scaffolding 完了、実評価は Phase 11）
