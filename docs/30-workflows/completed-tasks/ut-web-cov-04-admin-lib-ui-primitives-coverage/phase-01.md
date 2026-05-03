# Phase 1: 要件定義 — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — 本タスクは Vitest テストファイルを 13 件の対象モジュールに対し新規追加 / 拡張する必要があるため、実装区分は「実装仕様書」とする（CONST_004 ラベル `docs-only` より実態優先）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 1 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | apps/web 配下の lib/admin および components/ui の Vitest テストを新規追加し coverage を底上げするため、production code は変更せずテストコードを追加する code-impl タスク。 |

## 目的

apps/web の admin lib（server-fetch / api / types）と UI primitives（Toast / Modal / Drawer / Field / Segmented / Switch / Search / icons / index / login-state）の Vitest coverage が 80% 未満となっている 13 モジュールについて、Stmts / Lines / Funcs ≥ 85%、Branches ≥ 80% を達成する。Phase 1 ではその要件と境界条件、approval gate を確定する。

## 現状 baseline と目標値

起票根拠: 2026-05-01 実測 `apps/web/coverage/coverage-summary.json`（apps/web 全体: lines=39.39%）。

| ファイル | Stmts | Branches | Funcs | Lines | 目標 (S/B/F/L) |
| --- | --- | --- | --- | --- | --- |
| apps/web/src/lib/admin/server-fetch.ts | 12.5 | n/a | 0 | 12.5 | 85 / 80 / 85 / 85 |
| apps/web/src/lib/admin/api.ts | 17.24 | n/a | 0 | 17.24 | 85 / 80 / 85 / 85 |
| apps/web/src/lib/admin/types.ts | 0 | 0 | 0 | 0 | 85 / 80 / 85 / 85（型のみのため import smoke で達成） |
| apps/web/src/components/ui/Toast.tsx | 61.53 | n/a | 50 | 61.53 | 85 / 80 / 85 / 85 |
| apps/web/src/components/ui/Modal.tsx | n/a | 46.15 | n/a | n/a | 85 / 80 / 85 / 85 |
| apps/web/src/components/ui/Drawer.tsx | n/a | 64.7 | n/a | n/a | 85 / 80 / 85 / 85 |
| apps/web/src/components/ui/Field.tsx | n/a | 50 | n/a | n/a | 85 / 80 / 85 / 85 |
| apps/web/src/components/ui/Segmented.tsx | n/a | n/a | 50 | n/a | 85 / 80 / 85 / 85 |
| apps/web/src/components/ui/Switch.tsx | n/a | n/a | 50 | n/a | 85 / 80 / 85 / 85 |
| apps/web/src/components/ui/Search.tsx | n/a | n/a | 66.66 | n/a | 85 / 80 / 85 / 85 |
| apps/web/src/components/ui/icons.ts | 0 | 0 | 0 | 0 | 85 / 80 / 85 / 85（型のみ／import smoke で達成） |
| apps/web/src/components/ui/index.ts | 0 | 0 | 0 | 0 | 85 / 80 / 85 / 85（barrel／import smoke で達成） |
| apps/web/src/lib/url/login-state.ts | n/a | 33.33 | n/a | n/a | 85 / 80 / 85 / 85 |

> 「n/a」は coverage-summary.json に該当 metric の閾値違反は記録されていないが、対象シナリオ（branch / function）が未網羅であることを示す。Phase 11 で実測し、AC を満たさない metric は再計測 → 追補テストとする（CONST_007 単サイクル完了原則）。

## 実行タスク

1. 起票根拠（`apps/web/coverage/coverage-summary.json` 2026-05-01 実測）と AC を index.md と突合し、対象 13 件と目標値を確定する。完了条件: 上表が AC と整合している。
2. 対象モジュールの責務・依存（`next/headers`, `next/navigation`, `crypto.randomUUID`, `window.history`, `fetch`）を Read で確認し、テスト時に必要な mock surface を一覧化する。完了条件: Phase 2 の mock 戦略入力が揃う。
3. user approval / 自走禁止操作を分離する。完了条件: 下記 approval gate / 禁止操作が明記される。

## 参照資料

- 起票根拠: 2026-05-01 実測 `apps/web/coverage/coverage-summary.json`（apps/web lines=39.39%）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/claude-design-prototype/`（UI primitives 視覚仕様）
- `vitest.config.ts`（coverage include / exclude / provider=v8）
- 既存テスト:
  - `apps/web/src/components/ui/__tests__/primitives.test.tsx`
  - `apps/web/src/lib/admin/__tests__/api.test.ts`
  - `apps/web/src/lib/url/login-state.test.ts`

## 実行手順

- 対象ディレクトリ: `docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/`
- production code（`apps/web/src/**` のテスト以外のファイル）は本タスクで変更しない。テストファイル追加のみで coverage を達成する設計とする。
- 実装着手は Phase 5、実測は Phase 11 で行う。Phase 1 では仕様書記述のみ。
- coverage exclude による数値合わせ（`vitest.config.ts` の `exclude` 追加で対象を除外する逃げ）は禁止。

## approval gate / 自走禁止操作

| 操作 | 自走可否 | 備考 |
| --- | --- | --- |
| テストファイル追加（Phase 5） | 自走可 | production code 改変なしの限り |
| `apps/web/src/**` の production code 改変 | 要 user approval | 本タスクの scope out。必要なら別タスク起票 |
| `vitest.config.ts` の include/exclude 編集 | 要 user approval | coverage 数値操作と見なされるため |
| commit / push / PR 作成 | 要 user approval | Phase 13 で diff-to-pr フロー時のみ |
| Cloudflare deploy | 禁止 | 本タスクの scope out |

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`（admin lib 利用元）
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`（release runbook 連動）

## 多角的チェック観点

- 不変条件 #5: public / member / admin の境界。admin lib テストは admin 文脈の cookie / header 整形のみを検証し、member 文脈と混ぜない。
- 不変条件 #6: apps/web から D1 直接アクセス禁止。`server-fetch.ts` は `INTERNAL_API_BASE_URL` 経由のみを assert する。テスト内でも D1 binding を mock しない（そもそも import しない）。
- 未実装 / 未実測を PASS と扱わない。Phase 11 で実測 evidence（coverage-summary.json 抜粋）を残す。
- placeholder 値と実測値を分離する（baseline 表は 2026-05-01 実測値、目標値は AC 由来）。

## サブタスク管理

- [ ] 対象 13 件の baseline 表を確定する
- [ ] mock surface を Phase 2 へ渡す形で整理する
- [ ] approval gate / 自走禁止操作を確定する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- `outputs/phase-01/main.md`: 本仕様書のサマリと baseline 表

## 完了条件

- 全対象 Stmts / Lines / Funcs ≥ 85% / Branches ≥ 80%（Phase 11 で実測検証）
- admin lib: contract test（authed fetch / error mapping / type guard / mutation list）の 4 ケース体系
- UI primitives: open/close / prop variant / callback invocation の最低 3 ケース
- barrel files (`icons.ts`, `ui/index.ts`) は import smoke で export 群の存在を assert
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] 実装区分が実装仕様書として明記されている
- [ ] baseline / 目標 / approval gate が表で整理されている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ次を渡す: 対象 13 件の baseline 表、mock surface 一覧（next/headers, next/navigation, crypto, window.history, fetch, document keydown）、approval gate、CONST_005 入力としての対象モジュール責務リスト。
