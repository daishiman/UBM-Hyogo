[実装区分: 実装仕様書]

> CONST_004 判定根拠: 本 Phase 7 は sub-task 2a の Playwright spec（実コード）に対する **カバレッジ確認** を仕様化する。出力ファイル `apps/web/playwright/tests/admin-requests.spec.ts` は CI で実行される TypeScript ソースであり、ラベル `taskType=docs-only` より実態優先（CONST_004）に従い実装仕様書扱い。

---

# Phase 7: カバレッジ確認 — sub-task 2a `/admin/requests` E2E

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| sub-task ID | `2a` |
| 対象 spec | `apps/web/playwright/tests/admin-requests.spec.ts` |
| coverageTier | **standard**（lines >= 70%, critical route smoke 100%） |
| 計測対象 | `apps/web` line coverage、`apps/api` line coverage、Playwright critical smoke 成功率 |

---

## 2. coverage 計算根拠

| 観点 | 計算根拠 | 期待値 |
|------|---------|-------|
| critical route smoke | `/admin/requests` の admin / member / anonymous 3 ロール × mutation flow（list / approve / reject / race / 認可 2）= 6 test 全 green ÷ 6 = 100% | **100%** |
| `apps/web` line cov | Playwright spec は vitest line cov に **直接寄与しない**（spec は別ランタイム）。本 2a 単体での寄与は 0%。Stage 1 baseline を保全し、>= 70% は親 workflow 全体（2a-2d 合算 + 既存 vitest unit）で達成 | baseline 保全 |
| `apps/api` line cov | sub-task 2d（contract test）が `apps/api/src/routes/admin/requests.ts` の zod schema parse 経路を踏むことで間接寄与（+1〜3% 想定）。本 2a 単体では 0% 寄与 | baseline 保全 |
| `/admin/requests` mutation path | approve / reject / race の 3 path × 認可 3 ロール = 6 path カバー | 100%（route surface） |

> standard tier は **「lines >= 70% AND critical smoke 100%」** の AND 条件。本 2a 単体は smoke 100% 担当、line cov は親 workflow 全体で担保する設計。

---

## 3. 計測コマンド

| 計測 | コマンド | 出力先 |
|------|---------|-------|
| Playwright critical smoke（2a） | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` | `apps/web/playwright-report/` |
| Playwright critical smoke（全 critical） | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e --grep '@critical'` | 同上 |
| `apps/web` vitest line cov | `mise exec -- pnpm --filter @ubm-hyogo/web test:run --coverage` | `apps/web/coverage/coverage-summary.json` |
| `apps/api` vitest line cov | `mise exec -- pnpm --filter @ubm-hyogo/api test --coverage` | `apps/api/coverage/coverage-summary.json` |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | stdout |
| lint | `mise exec -- pnpm lint` | stdout |

---

## 4. critical smoke 100% の確認手順（2a 単体）

| step | コマンド / 確認 | 期待 |
|------|----------------|------|
| 1 | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` | exit 0 |
| 2 | reporter で 6 test 全 green / skip 0 / fail 0 | 全 green |
| 3 | flaky retry 0 件 | retry count = 0 |
| 4 | reporter HTML を `apps/web/playwright-report/` で確認 | suite green |

---

## 5. coverage 結果の判定 matrix

| 結果 | `/admin/requests` smoke | apps/web lines | 判定 | 次アクション |
|------|------------------------|---------------|------|------------|
| A | 100% | >= 70% | **PASS** | 親 workflow Phase 8 へ |
| B | 100% | < 70% | **CONDITIONAL** | 親 workflow Phase 9 で追加 vitest unit test、または Stage 3 持越し（本 2a 単体責務外） |
| C | < 100% | >= 70% | **FAIL** | 2a spec の green 化を最優先で修復（fail/flaky test を確定的に直す） |
| D | < 100% | < 70% | **FAIL** | 両方修復（smoke を最優先） |

> 本 2a 単体での green 判定は **A または B**（smoke 100% が成立していれば、line cov は親 workflow 責務）。

---

## 6. 計測結果の記録様式

```text
[stage-2 / sub-task 2a coverage @ YYYY-MM-DD]
admin-requests.spec.ts test results: <pass>/<total> (skip 0)
playwright critical smoke: <pass|fail>
flaky retries: <n>
apps/web lines (workflow 全体): <X>%
apps/api lines (workflow 全体): <Y>%
typecheck: <pass|fail>
lint: <pass|fail>
```

> 上記を親 workflow `outputs/phase-11/evidence` に追記し、Phase 9 Quality Gate ログと連動させる。

---

## 7. 70% 未達時の補完戦略

| 観測 | 原因仮説 | 補完経路 |
|------|---------|---------|
| `apps/api` lines < 70% | 2d contract test 未到達経路 | 親 workflow Phase 9 で `apps/api/src/routes/admin/*` の vitest unit test を追加 |
| `apps/web` lines < 70% | UI 側 mutation handler / dialog の vitest 直接 cov 不在 | 親 workflow Phase 9 で components の vitest unit を補完、または Stage 3 持越し |
| critical smoke fail | UI 側 mutation handler / redirect 未接続 | 本 2a 範囲外の UI 実装差分を別 PR で対応、本サブタスクは smoke 修復まで |

> 本サブタスク 2a の責務は **`/admin/requests` smoke 100%** までとする。line cov は親 workflow Phase 7 / Phase 9 で全体担保。

---

## 8. 不変条件チェック（カバレッジ計測時）

| # | 不変条件 | 計測時の適合 |
|---|---------|-------------|
| 1 | 既存 API のみ接続 | spec が叩く endpoint は既存 GET / POST resolve のみ |
| 4 | D1 直接アクセス禁止 | spec は `page.route()` のみ。coverage 計測中も D1 binding を踏まない |
| 5 | 既存 fixture 再利用 | `auth.ts` の 3 fixture のみ |
| Stage 2 横断 | `test.skip` 禁止 | reporter で skip 0 を確認 |

---

## 9. Phase 7 完了定義

- [x] coverage 計算根拠（§2）が確定
- [x] 計測コマンド（§3）が 6 行確定
- [x] critical smoke 100% 確認手順（§4）が 4 step 確定
- [x] 結果判定 matrix（§5）が standard tier に整合
- [x] 記録様式（§6）が確定
- [x] 70% 未達時の補完戦略（§7）が確定
- [x] 不変条件チェック（§8）OK

> 本 Phase 7 完了をもって sub-task 2a の Phase 4–7 仕様書群が full に整い、後続実装サイクル（CONST_007）で `apps/web/playwright/tests/admin-requests.spec.ts` の新規追加 → green 化を 1 サイクルで完了させる準備が整う。
