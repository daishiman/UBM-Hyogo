# Phase 11 成果物 — 手動 smoke test（CLI 回帰検証）

> **本ワークフローの位置付け**: 本タスク（issue-229-indexes-rebuild-fail-fast）は **タスク仕様書整備と実コード hardening**を目的とする。`generate-index.js` 編集・focused spec test・CLI smoke は今回の実装サイクルで完了済み。commit / push / PR はユーザー承認まで実行しない。

## 0. NON_VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| タスク種別 | tooling（CLI スクリプト hardening + 回帰 spec test） |
| 非視覚的理由 | `pnpm indexes:rebuild`（= `generate-index.js`）は CLI スクリプトで画面・UI・UX を持たない。観測対象は exit code / stderr / 出力ファイルの byte 内容であり、スクリーンショットで観測可能な挙動が存在しない |
| 代替証跡 | 回帰 spec test（`generate-index-fail-fast.spec.ts` 1 file / 6 tests）+ CLI 回帰（`pnpm indexes:rebuild` の exit code と `git diff`、失敗注入時の decisive stderr） |

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 状態 | PASS（仕様書整備と実コード hardening。local evidence captured） |
| visualEvidence | NON_VISUAL（スクリーンショット不要・代替証跡のみ） |
| 代替 evidence | manual-smoke-log.md / manual-test-checklist.md / manual-test-result.md |
| AC 対応 | AC-1（exit）/ AC-2（atomic）/ AC-3（decisive log）/ AC-4（byte-identical）/ AC-7（回帰 spec test） |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |

## 2. 実走済み gate

今回サイクルで次を満たした:

1. `generate-index.js` の hardening 差分（atomic helper / decisive log / silent catch 分離 / CLI ガード / export）を実装済み。
2. 回帰 spec test `scripts/__tests__/generate-index-fail-fast.spec.ts` を作成済み。
3. `pnpm exec vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` が PASS。
4. `pnpm indexes:rebuild -- --quiet` が exit 0 で完了し、新規 artifact inventory 由来の topic-map/keywords 更新を生成。直後の 2 回目 rebuild は index diff unchanged。

## 3. 実走範囲

| サブ | 範囲 | 期待結果 | 失敗時の戻し先 |
| --- | --- | --- | --- |
| S-1 | 正常系 byte-identical | `exit=0` かつ `git diff --quiet -- indexes` 差分 0 | Phase 2（設計）/ Phase 8（DRY） |
| S-2 | 失敗注入 fail-fast | `exit=1` かつ stderr に `[generate-index] <skill> / <index-file> <step> 失敗:` | Phase 5（ランブック） |
| S-3 | atomic（部分書き込みなし） | 本ファイル不変 + `.tmp` 残存 0 | Phase 5 |
| S-4 | 回帰 spec test | 1 file / 6 tests PASS | Phase 6（異常系）/ Phase 4（テスト戦略） |
| S-5 | hook / CI 回帰 | pre-push drift guard グリーン（drift 0 で push 可） | Phase 9（品質保証） |

## 4. 実測値

| 項目 | 値 |
| --- | --- |
| S1_exit_code | 0 |
| S1_git_diff | topic-map/keywords update present for new inventory; second rebuild idempotent |
| S2_fail_fast | focused test injection PASS |
| S3_tmp_residual | 0（focused test injection） |
| S4_vitest_result | 1 file / 6 tests PASS |
| S5_prepush_guard | direct rebuild + second rebuild idempotency で同契約を検証 |

## 5. 結果サマリ（PASS 時）

- S-1 正常系 byte-identical: **PASS**
- S-2 失敗注入 fail-fast: **PASS**
- S-3 atomic（部分書き込みなし）: **PASS**
- S-4 回帰 spec test（TC-01〜07）: **PASS**
- S-5 hook / CI 回帰: **PASS**

commit / push / PR のみ user-gated。

## 6. 関連成果物

| ファイル | 役割 |
| --- | --- |
| outputs/phase-11/manual-smoke-log.md | コマンド系列・exit code・git diff・decisive stderr の記入欄 |
| outputs/phase-11/manual-test-checklist.md | S-1〜S-5 の実走 checklist |
| outputs/phase-11/manual-test-result.md | AC マトリクス + 証跡メタ（主ソース = spec test + CLI 回帰） |
| outputs/phase-11/link-checklist.md | index.md / artifacts.json / 各 phase / 参照リンク健全性 |
| outputs/phase-11/discovered-issues.md | 仕様書整備時点で検出された懸念 |
| outputs/phase-11/screenshot-plan.json | NON_VISUAL 判定とスクリーンショット不要の明示 |

## 7. 完了判定

- [x] `S1_exit_code=0` かつ second rebuild idempotency を記録した
- [x] failure injection の decisive error context を focused spec で検証した
- [x] `S4_vitest_result` が PASS
- [x] `link-checklist.md` の項目を確認した

本ワークフローは Phase 11 local evidence captured としてクローズする。
