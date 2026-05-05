# Phase 11: 手動 smoke / 実測 evidence — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

判断根拠:
- 本タスクは unit test 追加でありランタイム挙動変更を伴わないが、coverage 数値の実測 evidence 取得が必須。
- CONST_004（実態優先）に従い `implementation` として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 11 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

unit test 追加の実測 evidence を取得・記録する。本タスクはランタイム挙動を変えないため runtime smoke は不要。代わりに coverage 数値を実測 evidence として残す。

## 実行タスク

1. `mise exec -- pnpm --filter web test:coverage` を実行し、stdout/stderr 全文を `outputs/phase-11/manual-smoke-log.md` に記録する。
2. `apps/web/coverage/coverage-summary.json` から対象 7 ファイル + total を抜粋し、`outputs/phase-11/main.md` に表として転記する。
3. `apps/web/coverage/index.html`（HTML report）で各対象 file の uncovered lines が 0 であることを確認。スクリーンショットは取得せず数値で代替（`visualEvidence: NON_VISUAL`）。
4. 関連 docs（`02-auth.md` / `13-mvp-auth.md`、本タスクの phase-XX.md および index.md）の link 切れを確認し、`outputs/phase-11/link-checklist.md` に結果を記録する。

## evidence path 一覧

- `apps/web/coverage/coverage-summary.json`
- `apps/web/coverage/coverage-final.json`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/main.md`
- `outputs/phase-11/link-checklist.md`

## 実測前後の数値比較表（テンプレ）

| ファイル | before Lines | after Lines | before Branches | after Branches |
| --- | --- | --- | --- | --- |
| apps/web/src/lib/auth.ts | 0% | ≥85% | 0% | ≥80% |
| apps/web/src/lib/auth/magic-link-client.ts | 0% | ≥85% | 0% | ≥80% |
| apps/web/src/lib/auth/oauth-client.ts | 0% | ≥85% | 0% | ≥80% |
| apps/web/src/lib/session.ts | 0% | ≥85% | 0% | ≥80% |
| apps/web/src/lib/fetch/authed.ts | 0% | ≥85% | 0% | ≥80% |
| apps/web/src/lib/fetch/public.ts | 0% | ≥85% | 0% | ≥80% |
| apps/web/total | 39.39% | 改善（数値は実測） | - | - |

> `me-types.ts` は type-only のため coverage 集計対象外。round-trip 型テストの存在のみで AC 充足。

## 入出力（CONST_005）

- 入力: 実装後ソースの coverage 実行結果
- 出力: `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md`

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

- [ ] coverage 実行ログを manual-smoke-log.md に保存
- [ ] coverage-summary.json 抜粋を main.md に転記
- [ ] link-checklist.md で docs link 切れを確認
- [ ] before/after 数値比較表を埋める

## 成果物

- outputs/phase-11/main.md
- outputs/phase-11/manual-smoke-log.md
- outputs/phase-11/link-checklist.md

## 完了条件（DoD / CONST_005）

- 実測 coverage 数値が AC（Stmts/Lines/Funcs ≥85% / Branches ≥80%）を満たす
- 関連 docs に link 切れがない
- evidence 3 ファイルが揃っている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、実測数値・evidence path・docs 更新指示を渡す。
