# Phase 9: 品質保証 — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 9 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

apps/web public components 向けに追加した Vitest unit test が typecheck / lint / coverage threshold を全て満たし、既存テストへ regression を及ぼさないことを保証する。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/00-overview.md
- docs/00-getting-started-manual/claude-design-prototype/

## CONST_005 必須項目

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `apps/web/src/components/public/__tests__/*.test.tsx`, `apps/web/src/components/feedback/__tests__/EmptyState.test.tsx`, `apps/web/vitest.config.ts`（threshold 調整時のみ） |
| シグネチャ | テスト関数: `describe(name, () => { it(case, async () => { render(<Component {...props} />); ... }) })` |
| 入出力 | 入力: component props（happy/empty/variant の 3 fixture）。出力: `@testing-library/react` の `screen.getByRole/Text` 経由 assertion |
| テスト | 各 component で happy / empty-or-null / interaction-or-prop-variant の 3 ケース最低 |
| コマンド | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` |
| DoD | 全 verify suite green かつ Stmts/Lines/Funcs ≥85% / Branches ≥80% を `coverage-summary.json` で確認 |

## 実行する verify suite と期待出力

1. `mise exec -- pnpm typecheck`
   - 期待: `Tasks: N successful` / exit 0。型エラー 0 件。
2. `mise exec -- pnpm lint`
   - 期待: `0 errors` / exit 0。新規テストファイルが lint rule (`@typescript-eslint`, `react/*`) を満たす。
3. `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage`
   - 期待: 全 test PASS（`Test Files  X passed`）かつ vitest coverage summary に target 7 component が `>=85%` (Stmts/Lines/Funcs) / `>=80%` (Branches) を表示。
   - 出力 artifact: `apps/web/coverage/coverage-summary.json`, `apps/web/coverage/coverage-final.json`, `apps/web/coverage/lcov.info`。

## coverage threshold 検証手順

1. `apps/web/coverage/coverage-summary.json` を読み、対象 7 ファイルの metric を抽出する。
2. 各ファイルが `statements.pct >= 85`, `lines.pct >= 85`, `functions.pct >= 85`, `branches.pct >= 80` を満たすことを確認する。
3. いずれか未達の場合は Phase 5 の runbook へ戻り追加ケースを実装する（DoD 未達のまま Phase 10 へ進めない）。
4. baseline（lines=39.39%）からの delta を算出し outputs/phase-09/main.md に記録する。

## regression 確認手順

1. `git stash -u` で test 追加分を退避し `mise exec -- pnpm --filter @ubm-hyogo/web test` を実行（事前 baseline）。または直前 main の test result を参照する。
2. 退避を戻し再度 `test:coverage` を実行、追加 test 以外の test 数・PASS 数が同等以上であることを確認。
3. 既存 admin / shared package の coverage が低下していないこと（UT-WEB-COV-01 / 04 の baseline と比較）。

## 統合テスト連携

- 上流: 04a-parallel-public-directory-api-endpoints
- 下流: 09a-A-staging-deploy-smoke-execution

## 多角的チェック観点

- #2 responseId/memberId separation — fixture で `responseId`/`memberId` を混在させない
- #5 public/member/admin boundary — public component test は member/admin 状態を import しない
- #6 apps/web D1 direct access forbidden — test で D1 binding を mock しない（不要）
- 未実装/未実測を PASS と扱わない
- placeholder と実測 evidence を分離する

## サブタスク管理

- [ ] verify suite 3 種を順に実行する
- [ ] coverage-summary.json を取得し threshold を満たすか手動確認する
- [ ] regression 比較を実行し既存 test 数を記録する
- [ ] outputs/phase-09/main.md に command 出力サマリを残す

## 成果物

- outputs/phase-09/main.md

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- 各 component に happy / empty-or-null-data / interaction-or-prop-variant の最低 3 ケース
- snapshot 依存ではなく明示 assertion
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ verify suite 結果、coverage delta、regression 比較結果、未達 component の有無を渡す。
