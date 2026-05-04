# Phase 9: 品質保証 — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 5/6/8 で導入したテスト・helper を品質ゲート（typecheck / lint / test / test:coverage / build）で検証し、不合格時の自動修復を伴うため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 9 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | テスト追加・helper 抽出後に apps/web の品質ゲート 5 種を実行し、不合格時に lint --fix / mock 調整等の最小修復を行うため。 |

## 目的

Phase 5/6/8 で完成したテストコード群が apps/web の品質ゲート 5 種（typecheck / lint / test / test:coverage / build）すべてを green にし、既存テストに regression が無いことを確定する。flaky 検知・失敗時の自動修復方針・反復上限を明記し、Phase 11 実測前に品質ゲートが通る状態を確実にする。

## CONST_005 必須項目

| 項目 | 値 |
| --- | --- |
| 変更対象ファイル | 原則なし。品質ゲート失敗時に Phase 5/6/8 で追加した 13 + helper ファイル群を最小修正する（production code は触らない） |
| シグネチャ | n/a（QA phase） |
| 入出力 | 入力: Phase 5/6/8 完了状態のリポジトリ。出力: 5 ゲート全 PASS の確認ログ + flaky 検知結果 |
| テスト方針 | 下記「品質ゲート一覧」を順次実行。失敗時は「失敗時の自動修復方針」に従い最大 3 反復で修復。3 反復で解消しない場合は user approval を求めて停止 |
| 実行コマンド | 下記「品質ゲート一覧」コマンド群（apps/web に閉じる） |
| DoD | (a) 5 ゲート全 PASS (b) 既存 web test 件数が baseline + 追加分以上で regression 0 (c) `--repeat 3` の flaky 検知が PASS (d) AC マトリクス（Phase 7）の coverage 目標達成 |

## 品質ゲート一覧

| # | ゲート | コマンド | PASS 条件 |
| --- | --- | --- | --- |
| 1 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 / TS error 0 件 |
| 2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 / lint error 0 件 |
| 3 | test (regression) | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 全件 green / 既存件数 + 追加件数 ≥ baseline + 追加 |
| 4 | test:coverage (AC) | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | Phase 7 マトリクス A の 13 × 4 metric 全て目標以上 |
| 5 | build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 / `@opennextjs/cloudflare` build 成功 |

> ゲート 5 (build) はテスト追加が build 成果物に影響しないこと（test ファイルが production bundle に含まれない / `vitest.config.ts` の include 範囲が production と分離されている）の検証として実行する。

## 視覚 / a11y / E2E の対象外宣言

- 本タスクは `visualEvidence: NON_VISUAL` のため、Playwright / Storybook / a11y axe-core の自動視覚 regression は **対象外**
- UI primitives の振る舞い（aria 属性 / role / focus 遷移）は Vitest + RTL で構造的に assert するに留め、screenshot / Lighthouse / axe scan は実施しない
- a11y 観点は Phase 5 で `aria-modal / aria-labelledby / role` の存在を unit test で assert する範囲のみで担保

## flaky test 検知（任意手順）

```bash
# focus trap / fake timer 系の flaky 検知（apps/web 単体に閉じる）
mise exec -- pnpm --filter @ubm-hyogo/web test --repeat 3
```

| 対象 | 検知理由 |
| --- | --- |
| Modal / Drawer focus trap ケース | `document.activeElement` 復元が tick 順に依存 |
| Toast 3000ms タイマーケース | `vi.useFakeTimers` の advance タイミング |
| `next/headers` mock を伴う server-fetch ケース | dynamic import 順序 |

PASS 条件: `--repeat 3` で全件 green（1 件でも intermittent fail があれば flaky とみなす）。

## 失敗時の自動修復方針

| ゲート | 失敗種別 | 自動修復アクション | 反復上限 |
| --- | --- | --- | --- |
| typecheck | unused import / 型注釈漏れ / `any` 流入 | 最小差分で型修正（production code は触らない） | 3 |
| typecheck | helper シグネチャの型不整合 | helper 側 generic を緩める / call site で `as const` 付与 | 3 |
| lint | format / unused-vars / import order | `mise exec -- pnpm --filter @ubm-hyogo/web lint --fix` を 1 回 → 残違反のみ手修正 | 3 |
| test (regression) | 既存テストが追加 mock の影響で fail | 追加 mock を `vi.resetAllMocks()` / `vi.unstubAllEnvs()` を `afterEach` で確実に復元するよう修正 | 3 |
| test (regression) | primitives.test.tsx 縮小により reference 切れ | 既存 describe を移譲先ファイルへ確実に移植したか再確認・差分修復 | 3 |
| test:coverage | metric 未達 | 未到達 branch を Phase 6 異常系ケース表から再抽出し、ケース追加（Phase 5/6 へ差し戻し） | 3 |
| build | test 由来の import が production bundle に混入 | `vitest.config.ts` `include` を `**/*.test.{ts,tsx}` に閉じる（既設定済みのはず）/ helper を `src/__test-helpers__/**` に隔離 | 3 |
| 共通 | flaky | fake timer / `await act` / `findBy*` への置換、`waitFor` の timeout 調整 | 3 |

3 反復で解消しない場合は **user approval を求めて停止**（CONST_007 単サイクル完了原則。無限ループ・過剰修正を回避）。

## regression 検知手順（既存 3 テストファイル）

1. baseline 取得（Phase 5 着手前に実行済みであること）: `pnpm --filter @ubm-hyogo/web test --reporter=json | jq '{total: .numTotalTests, files: [.testResults[].name]}'`
2. Phase 9 で再取得し diff
3. 既存 3 ファイル（`primitives.test.tsx`, `lib/admin/__tests__/api.test.ts`, `lib/url/login-state.test.ts`）が以下を満たすこと:
   - 全 describe / it が green
   - 件数が baseline と等しいか増加（縮小した primitives.test.tsx は移譲先で同等以上のケース数を保持しているため、apps/web 全体としては減少しない）
4. 既存 13 ケース（不変条件 #11 / #13 / 関数 export 一覧 / login-state 2 + primitives 描画群）の名前が test 結果に含まれていることを `--reporter=verbose` で確認

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- #5 public/member/admin boundary: 品質ゲートも admin 文脈の test に閉じる
- #6 apps/web → D1 直接アクセス禁止: build ゲートで Worker bundle に D1 binding 直 import が混入しないことを確認
- 未実装 / 未実測を PASS と扱わない: 5 ゲートのいずれかが skip / pending なら PASS としない
- 自動修復で production code を触らない（CONST_005 の変更対象 = test/helper のみ）

## サブタスク管理

- [ ] 5 ゲート全コマンドを実行
- [ ] flaky 検知（`--repeat 3`）を実行
- [ ] 失敗時の自動修復を 3 反復以内で完了
- [ ] regression 検知（既存 3 ファイル）を実施
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- `outputs/phase-09/main.md`: 5 ゲート結果 / flaky 検知結果 / regression 検知結果 / 自動修復ログ

## 完了条件

- 5 ゲート（typecheck / lint / test / test:coverage / build）全 PASS
- `--repeat 3` で flaky 0 件
- 既存 3 テストファイルの green 維持（件数非減少）
- AC マトリクス（Phase 7 A〜E）達成

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] 5 ゲート全コマンドが apps/web に閉じている
- [ ] a11y / 視覚 regression の対象外宣言が明記されている
- [ ] flaky 検知手順 / 失敗時の自動修復方針 / 反復上限 3 が明記されている
- [ ] regression 検知（既存 3 ファイル）の手順が明記されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ次を渡す: 5 ゲート全 PASS 状態のリポジトリ、Phase 7 マトリクス（実測列が埋まる準備が完了した状態）、flaky 検知結果、既存 3 ファイルの regression 0 件、最終レビューで確認すべき差分（13 + helper のテストファイル + production code 0 件改変）。
