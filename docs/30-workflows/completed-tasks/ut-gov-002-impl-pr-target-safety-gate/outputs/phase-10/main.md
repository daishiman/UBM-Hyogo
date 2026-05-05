# Phase 10 — 最終レビュー（main）

## Status

spec_created

## 1. 目的

Phase 1〜9 の総和をレビュアー視点で再点検し、**Go / No-Go 判定**を `outputs/phase-10/go-no-go.md` に記録する。実装タスクの最終レビューでは、静的検査・dry-run smoke・VISUAL evidence・"pwn request" 非該当根拠・ロールバック手順・本タスク非対象の後続委譲の **6 軸**で総合判定する。Phase 11 の VISUAL evidence 取得 / Phase 13 のユーザー承認ゲートに進む前段の最終関門として機能する。

## 2. 入力の継承

| 入力 | 用途 |
| --- | --- |
| `index.md` AC-1〜AC-9 | AC × 証跡 × 判定の 3 列表の分母 |
| `outputs/phase-3/review.md` §3 / §4 | "pwn request" 非該当 5 箇条 / S-1〜S-6 |
| `outputs/phase-7/coverage.md` §6 | AC 9/9 = 100% 宣言 |
| `outputs/phase-8/before-after.md` §6 | 3 コミット分割計画 / ロールバック粒度 |
| `outputs/phase-9/quality-gate.md` §11 / §12 | G-1〜G-8 評価 / 戻り先ルール |
| `CLAUDE.md` | solo 運用ポリシー / レビュアー指定 0 名 |

## 3. 成果物

- `outputs/phase-10/main.md`（本書）
- `outputs/phase-10/go-no-go.md`（AC × 証跡 × 判定 / GO 条件 / NO-GO 条件 / ステークホルダー提示物 / 後続委譲 / 最終 Go/No-Go 判定）

## 4. 判定の責務範囲

| 軸 | 含む | 含まない |
| --- | --- | --- |
| 静的検査 | actionlint / yq / grep の実走判定（机上） | 実 PR 上の CI 実走（Phase 11 / 13） |
| dry-run smoke | T-1〜T-5 シナリオ確定と要件判定 | 実走結果（Phase 11） |
| VISUAL evidence | 要件・命名・解像度の確定 | 取得（Phase 11） |
| 5 箇条 | 担保箇所の最終確認 | （含まない） |
| ロールバック | 単一 revert + drift 検知の机上検証 | 実 revert（インシデント発生時のみ） |
| 後続委譲 | UT-GOV-002-EVAL/SEC/OBS / secrets rotate の起票条件記録 | 起票自体（Phase 12 unassigned-task-detection） |

## 5. 最終 Go/No-Go 判定方針

- spec_created 時点では **「spec_created → 実走証跡を Phase 11 で取得後に再判定」** とする。
- 机上判定で MAJOR 0 件 / AC 9/9 PASS / NO-GO 条件いずれも非該当のため、**机上 Go**（実走前提）。
- 実走証跡（Phase 11 manual-smoke-log + screenshots/）が揃った段階で Phase 13 で最終 Go 判定を確定。
- 1 件でも MAJOR / NO-GO 条件該当が観測された場合、Phase 9 §12 の戻り先ルールに従って差し戻し。

## 6. 完了条件

- [x] go-no-go.md に AC × 証跡 × 判定の 3 列表が記述される。
- [x] GO 条件 / NO-GO 条件が独立表で明示される。
- [x] MAJOR 0 件 / AC 9/9 PASS が記録される。
- [x] ステークホルダー提示物（5 種）が列挙される。
- [x] 後続委譲先（UT-GOV-002-EVAL/SEC/OBS / secrets rotate）が明記される。
- [x] ロールバック設計と drift 検知コマンドが再確認される。
- [x] レビュアー指定方針（solo 0 名 + CI gate）が再確認される。
- [x] Go / No-Go 判定が明示的に記録される（spec_created → Phase 11 で再判定）。
- [x] artifacts.json の Phase 10 status が `spec_created` で同期される（既同期）。

## 7. 次 Phase への引き継ぎ

- Phase 11 manual smoke は本 Phase の M-1〜M-3（Phase 7 §5 で確定済み）を必須実走項目として実行する。
- Phase 12 documentation-changelog / unassigned-task-detection は本 Phase の後続委譲先を起点に Issue 起票を整理する。
- Phase 13 完了確認は本 Phase の Go/No-Go 判定 + 静的検査ログ実走で最終 Go を確定させる。
