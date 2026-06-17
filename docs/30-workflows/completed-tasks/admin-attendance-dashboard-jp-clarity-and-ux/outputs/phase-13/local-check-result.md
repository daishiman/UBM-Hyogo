# Phase 13 — PR 前ローカル検証結果

> ステータス: `implemented_local_visual_present_staging_pending`。本サイクルで実行した検証コマンドの結果を記す。commit / PR / push / authenticated staging capture は user 承認後のみ。

---

## 1. 想定検証コマンド（CLAUDE.md「PR作成の完全自律フロー」§5）

| # | コマンド | 目的 | 期待結果 | 本サイクル結果 |
| --- | --- | --- | --- | --- |
| 1 | `mise exec -- pnpm install --force` | 依存整合 | PASS | **pending**（依存変更なし見込み） |
| 2 | `mise exec -- pnpm typecheck` | 型チェック | PASS | **PASS** |
| 3 | `mise exec -- pnpm lint` | リント | PASS | **PASS** |
| 4 | `bash scripts/verify-pr-ready.sh` | docs-only gate pre-flight（phase12-compliance / gate-metadata / indexes drift） | PASS | **pending** |

## 2. VISUAL タスク固有の追加検証（実装サイクル）

| # | コマンド | 目的 | 期待結果 | 本サイクル結果 |
| --- | --- | --- | --- | --- |
| 5 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__` | 出席 feature の component / lib spec（T-01〜T-06 追従 + 回帰） | PASS | **PASS**（8 files / 23 tests） |
| 6 | `mise exec -- pnpm verify:tokens` | HEX / token gate（AC-5） | PASS（HEX 0 件） | **PASS**（91 tracked） |
| 7 | `git diff --name-only -- apps/api packages/shared` | AC-7 不変確認 | 空 | **PASS**（空） |
| 8 | `rg -n "PRIMARY\|TREND\|DETAIL\|TOP ?10\|ADMIN / DASHBOARD\|セッション\|ユニーク\|トレンド\|区画" .../attendance` | AC-1/2/3 英語・専門語残存 | 0 件 | **PASS**（UI-facing 旧文言なし。識別子/test 名 residual は対象外） |

## 3. 失敗時の自動修復方針（CLAUDE.md 準拠）

| 失敗 | 修復方針 |
| --- | --- |
| install 失敗 | lockfile 不整合を疑い最小再生成 |
| typecheck 失敗 | unused import / null 許容 / 型注釈漏れ / export-import 不整合を最小差分で修正 |
| lint 失敗 | `pnpm lint --fix` → 残違反を手修正 |
| verify-pr-ready 失敗 | `pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い gate-metadata → phase12-compliance → indexes drift の順で切り分け |
| token gate 失敗 | HEX 直書きを `var(--ubm-color-*)` へ置換（AC-5） |

> 最大 3 回まで自動修復し、修復差分をコミットする（ただし commit 自体は user 承認後）。

## 4. 現在の記録

| 項目 | 値 |
| --- | --- |
| 実行状態 | apps/web 実装・focused Vitest・token gate・API/shared boundary・Phase 12 guide validator・typecheck・lint 実行済み |
| 未実行 | install / verify-pr-ready / visual capture 6 PNG（PR/外部操作に近いため user-gated または PR 前に実行） |
| 承認境界 | commit / PR / push は user 承認後のみ |
