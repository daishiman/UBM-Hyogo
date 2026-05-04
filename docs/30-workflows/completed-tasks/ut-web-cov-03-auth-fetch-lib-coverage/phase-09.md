# Phase 9: 品質保証 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

判断根拠:
- 本タスクは apps/web 配下に Vitest unit test を新規追加するコード変更を伴う。
- CONST_004（実態優先）に従い `implementation` として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 9 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装後の test/typecheck/lint/coverage gate を全て green にし、pre-existing test に regression がないことを保証する。

## 実行タスク

| # | gate | コマンド | 期待値 |
| --- | --- | --- | --- |
| 1 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| 2 | lint | `mise exec -- pnpm lint` | exit 0 |
| 3 | test+coverage | `mise exec -- pnpm --filter web test:coverage` | exit 0 |
| 4 | coverage 数値検証 | `apps/web/coverage/coverage-summary.json` を parse し、対象 7 ファイル全てが Stmts/Lines/Funcs ≥85, Branches ≥80 を満たすことを script で検証（`me-types.ts` は type-only のため除外） | 全ファイル閾値クリア |
| 5 | regression | before/after で pass test 数を比較し、既存 test の pass 数が減っていないこと | pass 数が単調増加 |

## 入出力（CONST_005）

- 入力: 実装後の apps/web ソース + 新規追加 test ファイル
- 出力: CLI exit code 0 / coverage-summary.json の数値 / 実行ログ要約 (`outputs/phase-09/main.md`)

## 失敗時の対応 runbook

| 失敗 gate | 一次対応 | 二次対応 |
| --- | --- | --- |
| typecheck | エラー箇所を最小差分で修正（unused import / 型注釈漏れ / null 許容） | 修正で coverage が変動した場合は再実行 |
| lint | `mise exec -- pnpm lint --fix` を試行 → 残違反のみ手修正 | rule 抑制は禁止 |
| coverage 不足 | `coverage-final.json` から該当 file の missing branch / line を特定し、Phase 4 のテスト戦略に追加ケースを追記の上 test を追加 | 4 ケース / 5 ケース網羅原則を再確認 |
| regression | failing test を特定し、mock 漏れ・assertion 改変を確認。production code は触らない | mock helper (`fetch-mock.ts`) 側の不整合を疑う |

## evidence 保存先

- `outputs/phase-09/main.md`: 5 gate の実行ログ要約（コマンド / exit code / 数値）
- `apps/web/coverage/coverage-summary.json`（実装側で生成される一次ソース）

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md

## 実行手順

- 対象 directory: docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/
- 本仕様書作成タスクではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] 5 gate の実行ログを `outputs/phase-09/main.md` に記録
- [ ] coverage-summary.json の対象 7 ファイル数値を表形式で抜粋
- [ ] regression 比較表（before/after pass 数）を記録
- [ ] 失敗 gate があれば runbook に従い対応し再実行

## 成果物

- outputs/phase-09/main.md

## 完了条件（DoD / CONST_005）

1. typecheck exit 0
2. lint exit 0
3. test:coverage exit 0
4. 対象 6 ファイル（me-types.ts 除く）が Stmts/Lines/Funcs ≥85% / Branches ≥80%
5. 既存 web test に regression なし

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、AC、blocker、evidence path、approval gate を渡す。
