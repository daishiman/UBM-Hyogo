# Phase 5 Output — 実装ランブック概要

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 名称 | 実装ランブック |
| 前提 | Phase 02 scenario-matrix / Phase 04 verify-matrix |
| 後続 | Phase 06 異常系検証 |
| 状態 | completed (scaffolding) |

## サマリ

Phase 4 で確定した 45 verify row を実装可能にする scaffolding を `apps/web/playwright/` 配下に配置した。`playwright.config.ts` を `apps/web` 直下に置き、`@playwright/test` + `@axe-core/playwright` 想定の structure を準備した状態。実 test 本体は `test.describe.skip` でスケルトンのみ、Phase 11 manual smoke で活性化する設計。

## 成果物（本 Phase で生成）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-05/main.md` | 本ファイル（runbook 概要） |
| ドキュメント | `outputs/phase-05/runbook.md` | 7 step 手順 |
| placeholder | `outputs/phase-05/playwright-config.ts.placeholder` | playwright.config 雛形 |
| ドキュメント | `outputs/phase-05/page-objects.md` | 11 page object signature |
| 実コード | `apps/web/playwright.config.ts` | 実 config |
| 実コード | `apps/web/playwright/fixtures/{auth,d1-seed}.ts` | fixture placeholder |
| 実コード | `apps/web/playwright/page-objects/*.ts` | 11 page objects |
| 実コード | `apps/web/playwright/tests/*.spec.ts` | 7 spec skeleton |
| CI | `.github/workflows/e2e-tests.yml` | placeholder workflow |

## 引き継ぎ事項

- **Phase 6 (異常系検証)**: runbook の各 step で発生し得る failure を異常系シナリオへ展開する。特に `wrangler dev` の起動失敗 / D1 seed mismatch / Auth.js cookie sign 失敗の 3 領域。
- **Phase 7 (受け入れ基準照合)**: AC-1〜8 ↔ runbook step ↔ verify-matrix row の 3-way trace を完成させる。
- **Phase 11 (manual smoke)**: 本 scaffolding の `test.describe.skip` を解除し、screenshot を `outputs/phase-11/evidence/` に蓄積する。
- **下流タスク 09a / 09b**: `e2e-tests.yml` を release ワークフローへ組み込む際は ubuntu-latest + pnpm cache 前提を維持。

## 不変条件マッピング（Phase 5 適用分）

| 不変条件 | 実装位置 |
| --- | --- |
| #4 (profile 編集 form 不在) | `tests/profile.spec.ts` + `ProfilePage.assertNoEditFormVisible()` |
| #5 (admin role separation) | `tests/admin-pages.spec.ts` (admin/member/anonymous 3 fixture) |
| #8 (session 持続) | `tests/profile.spec.ts` reload sub-case |
| #9 (`/no-access` 不在) | `tests/auth-gate-state.spec.ts` 404 verify |
| #15 (attendance 二重防御) | `tests/attendance.spec.ts` |

## 残作業（Phase 11 へ申し送り）

- `playwright install` の chromium / webkit / firefox バイナリ取得
- `signSession()` 実装（Auth.js 互換 JWT 生成）
- D1 seed SQL 本実装（5 members + 2 meetings + 6 tag categories）
- `test.describe.skip` の解除と本体 assertion 充填
