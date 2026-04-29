# Phase 11 成果物 — 手動 smoke walkthrough（NON_VISUAL / spec_created）

> **本 Phase は「実地操作不可」**: 実 `pnpm test:coverage` 実行 / `coverage-guard.sh` の pass/fail 実出力 / GitHub Actions の actions run 番号 / lefthook の実 push 結果 / vitest config を一時 90% に上げる hard 切替リハーサル は **Phase 13 ユーザー明示承認後**（PR① / PR② / PR③ の段階適用）の別オペレーションでのみ実行する。
> 本 Phase 11 は spec walkthrough と 6 ケース手動 smoke の **仕様レベル固定** に閉じる。実行ログ・実 coverage 値・実 actions run link は本 Phase では取得しない。

## 1. テスト方式

| 項目 | 値 |
| --- | --- |
| mode | NON_VISUAL |
| taskType | implementation（quality governance / CI gate + script + skill 正本同期） |
| 状態 | pending |
| 主ソース | spec walkthrough（本ファイル）/ `manual-smoke-log.md`（NOT EXECUTED）/ `link-checklist.md` / `coverage-baseline-summary.md`（TBD プレースホルダ） |
| screenshot | 不要（UI / Renderer / 画面遷移なし） |
| 実行日時 | 2026-04-29（spec 固定日） |
| 実行者 | worktree branch: `task-20260429-132037-wt-3`（solo 開発） |

## 2. NON_VISUAL 代替 evidence 4 階層（L1/L2/L3/L4）

| 階層 | 代替手段 | 何を保証 | 何を保証しない（→ 申し送り） |
| --- | --- | --- | --- |
| L1: 型 | `coverage-guard.sh` の I/O 契約（引数 `--changed` / `--package` / `--threshold` / exit code 0/1/2 / stderr フォーマット）と `vitest.config.ts` の `coverage.thresholds` field（lines/branches/functions/statements: 80）の型整合を Phase 2 §仕様で読み取り検証 | 引数・exit code・出力フォーマット・閾値 field の「型」整合 | 実走時の vitest 実行 stderr / 実 `coverage-summary.json` の現実値 |
| L2: lint / boundary | `coverage-summary.json`（vitest 出力 / package 集計用）vs `coverage-final.json`（file 単位 top10 抽出用）の **用途分離 boundary** を仕様レベルで読取検証。summary は package 集計、final は不足ファイル top10 抽出、を spec で固定 | 「summary を file 別 top10 抽出に流す」誤用防止の境界 | 実走時の人為ミス（誤 jq path 指定）— `coverage-guard.sh` 内 jq path で別途緩和 |
| L3: in-memory test | 6 ケース手動 smoke（baseline / coverage-guard pass / coverage-guard fail / CI soft 動作 / lefthook 動作 / hard 切替リハーサル）の **コマンド系列を仕様レベルで固定**（manual-smoke-log.md に NOT EXECUTED で列挙、各ケースに実行前提 + rollback を含む） | 「再現する手順」の網羅性 + rollback の存在 | vitest 実行時間 drift / GitHub Actions runner flake / OS（macOS vs Linux）依存差 |
| L4: 意図的 violation | (a) vitest threshold を一時 90% に上げて CI が fail することを spec walkthrough で red 確認 / (b) わざと未テスト関数を含む状態で `coverage-guard.sh` を走らせ exit 1 + stderr top10 を red 確認 / (c) lefthook を skip せず push して block されることを red 確認 | 「赤がちゃんと赤になる」（threshold 違反検出 / hook block 検出 / soft→hard 切替の hard fail） | L4 自体は green 保証ではない |

## 3. 6 ケース手動 smoke（仕様レベル固定）

詳細は [`manual-smoke-log.md`](./manual-smoke-log.md) に NOT EXECUTED ステータスで記録。本ファイルではサマリのみ示す。

| # | ケース | 概要 | 期待結果 | 実走タイミング |
| --- | --- | --- | --- | --- |
| 1 | T0 baseline 計測 | 全 package で `pnpm test:coverage` を実行し、`coverage/coverage-summary.json` を package 別に取得 | 5 package × 4 metrics の pct が取得され `coverage-baseline-summary.md` を埋められる | PR① merge 直後 |
| 2 | coverage-guard pass | 全 package が 80% を満たす状態で `bash scripts/coverage-guard.sh` を実行 | exit 0 / stderr に FAIL 行なし | PR② 全 sub PR merge 後（dev branch） |
| 3 | coverage-guard fail | わざと閾値を上げる or 未達 package を残した状態で実行 | exit 1 / stderr に `[coverage-guard] FAIL: <pkg> <metric>=<pct>%` + 不足ファイル top10 + suggested test path が出力 | PR① / PR② のいずれかの worktree（merge せず手元のみ） |
| 4 | CI soft gate 動作 | PR① ドラフト状態で `coverage-gate` job が `continue-on-error: true` のもと動作することを確認 | warning として表示されるが PR merge 可能 / artifact `coverage-report` がアップロードされる | PR① ドラフト PR（dev に merge する前） |
| 5 | lefthook pre-push 動作 | PR③ で `lefthook.yml` 統合後、80% 未達状態で `git push` | push が block され、`coverage-guard.sh` の stderr が表示される | PR③ worktree（merge する前） |
| 6 | soft → hard 切替リハーサル | vitest config を一時 90% に上げて CI を回す → fail を確認 → 80% に戻す。`continue-on-error: true` を削除した状態で hard fail することも確認 | 90% に上げた時点で `coverage-gate` が fail / 80% に戻すと再 green / `continue-on-error` 削除後は required gate として block | PR③ merge 前のドラフト PR |

## 4. spec walkthrough 確認項目

| 確認項目 | 方法 | 結果 |
| --- | --- | --- |
| 仕様書の自己完結性（前提・AC-1〜AC-14・成果物パス） | `index.md` / `phase-NN.md` 横断確認 | OK |
| `coverage-guard.sh` I/O 契約が exit code / stderr フォーマット / 引数 flag を網羅 | Phase 2 §coverage-guard.sh I/O 仕様 | OK |
| `vitest.config.ts` の coverage セクションが provider / thresholds / include / exclude を網羅 | Phase 2 §vitest.config.ts 更新仕様 | OK |
| 3 段階 PR 戦略（PR① soft / PR② テスト追加 / PR③ hard）が Phase 5 / 13 で重複明記 | Phase 2 §3 段階 PR 段取り + Phase 13 runbook 草案 | OK |
| 鶏卵問題回避の NO-GO 条件 | Phase 1 / Phase 2 / Phase 3 で 3 重明記 + 本 Phase 11 ケース 4 前提条件で再掲 | OK |
| Phase 3 レビュー指摘 R-1〜R-4 との照合 | Phase 3 main.md レビュー指摘表 | OK（R-1 exclude 再評価 / R-3 `--changed` 漏れ / R-4 既存 PR 一斉 block を本 Phase 6 / 13 に紐付け） |
| 後続実装への引き継ぎ（型定義 → 実装 / 契約 → テスト） | coverage-guard.sh I/O 擬似コード / vitest config skeleton | OK |

## 5. 「実地操作不可」明示

- 本 Phase 11 は **spec walkthrough のみ**。`pnpm test:coverage` / `bash scripts/coverage-guard.sh` / GitHub Actions 実 run / `git push` 経由の lefthook 実発火 / vitest config の一時 90% 上書き は **Phase 13 ユーザー明示承認後**（PR① merge 直後 = baseline 取得 / PR② sub PR ごと = 不足消化 / PR③ merge 前 = hard 切替リハーサル / lefthook 確認）に別オペレーションで実走する。
- 6 ケース手動 smoke のコマンド系列は `manual-smoke-log.md` に NOT EXECUTED ステータスで列挙し、Phase 13 で実走時にそのまま辿れる粒度で固定する。
- `coverage-baseline-summary.md` の package×metric 表は本 Phase では `<TBD: T0 実行時に埋める>` プレースホルダのみ。実値は PR① merge 後の T0 実走時に上書きする。

## 6. 保証できない範囲（Phase 12 unassigned-task-detection 候補）

最低 3 項目を列挙する（Phase 12 で current 区分へ formalize 判定）。

| # | 範囲 | 理由 | 受け皿候補 |
| --- | --- | --- | --- |
| 1 | vitest 実行時間 drift（pre-push 遅延） | 仕様 walkthrough では実行時間を測れない。`--changed` 限定モードでも package 横断依存があると遅延する可能性 | Phase 12 unassigned-task-detection.md → `--changed` 高速化 / vitest workspace 移行候補 |
| 2 | `apps/web` Edge runtime / OpenNext bundle の exclude 不足 | Phase 2 で exclude リスト草案を確定したが、実 baseline で `.open-next/` 配下の予期せぬ拡張子が入る可能性 | Phase 12 → `vitest.config.ts` exclude の再評価 / E2E（Playwright）導入の別タスク化 |
| 3 | GitHub Actions runner 起因の coverage flake | jq バージョン差 / Node 24 install 失敗 / artifact upload race などの runner 起因 flake は spec では検出不可 | Phase 12 → CI flake 監視タスクの formalize（retry / re-run 規約） |
| 4 | macOS vs Linux の jq / bash 挙動差 | POSIX + jq 1.6+ 前提を Phase 2 で固定したが、Apple silicon の jq 旧版同梱 / `set -o pipefail` 挙動差は実走でしか確認できない | Phase 12 → README に「`mise` 経由 + `jq --version >= 1.6` チェック」記述追加 |
| 5 | soft → hard 切替の運用忘却 | PR③ を出さないと永遠に warning のままになるリスク。spec では切替期限を仕様化するのみで、実カレンダー連動は不可 | Phase 12 unassigned-task-detection.md current 区分（PR③ 実施期限） |

## 7. 関連リンク

- 上位 index: [../../index.md](../../index.md)
- Phase 2 設計: [../phase-02/main.md](../phase-02/main.md)
- Phase 3 レビュー: [../phase-03/main.md](../phase-03/main.md)
- 6 ケース smoke 詳細: [./manual-smoke-log.md](./manual-smoke-log.md)
- リンク健全性: [./link-checklist.md](./link-checklist.md)
- T0 baseline 枠: [./coverage-baseline-summary.md](./coverage-baseline-summary.md)
- aiworkflow-requirements 正本（更新対象）: [../../../../.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md](../../../../.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md)
- task-specification-creator coverage 基準: [../../../../.claude/skills/task-specification-creator/references/coverage-standards.md](../../../../.claude/skills/task-specification-creator/references/coverage-standards.md)
- 連携タスク（governance）: [../../../ut-gov-001-github-branch-protection-apply/](../../../ut-gov-001-github-branch-protection-apply/)

## 8. 完了判定

- [x] 4 階層代替 evidence（L1/L2/L3/L4）記載済
- [x] 6 ケース手動 smoke の NOT EXECUTED 列挙（manual-smoke-log.md）
- [x] 「実地操作不可 / Phase 13 ユーザー承認後実走」明示
- [x] 保証できない範囲 5 項目列挙（最低 3 項目要件 PASS）
- [x] spec walkthrough 確認項目 7 件すべて OK
- [x] T0 baseline 枠（coverage-baseline-summary.md）が `<TBD>` プレースホルダで全件埋まっている
