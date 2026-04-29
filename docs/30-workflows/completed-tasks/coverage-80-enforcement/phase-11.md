# Phase 11: 手動 smoke test（baseline 計測 / coverage-guard 実行 / soft→hard 切替リハーサル — 仕様レベル固定）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制(全 package 一律 / CI hard gate / ローカル auto-loop) (coverage-80-enforcement) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（baseline 計測 / coverage-guard 実行 / soft→hard 切替リハーサル） |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / quality_governance |
| user_approval_required | false（Phase 13 の実 PR① / PR② / PR③ merge 承認とは独立。本 Phase は仕様レベル固定のみ） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- **taskType: implementation（quality governance / CI gate + script + skill 正本同期）**
- 判定理由:
  - 本ワークフローは vitest coverage 計測 / `scripts/coverage-guard.sh` の stdout/stderr / GitHub Actions ログ / lefthook pre-push 出力 が中心であり、UI / Renderer / 画面遷移は一切発生しない。
  - 実 baseline 計測 / coverage-guard 実走 / CI soft gate dry-run / hard 切替リハーサル / lefthook pre-push 動作確認は **Phase 13 ユーザー承認後**（PR① / PR② / PR③ の段階適用）の別オペレーションで実行する。本 Phase 11 では「仕様レベルでの手順固定 + spec walkthrough」までを成果物とする。
  - したがって screenshot は不要。`phase-template-phase11.md` の docs-only / spec_created 代替証跡フォーマットおよび `phase-11-non-visual-alternative-evidence.md` の L1〜L4 プレイブックを適用する。
- **`outputs/phase-11/screenshots/` ディレクトリは作成しない**（NON_VISUAL のため `.gitkeep` 含め一切作らない）。
- **本 Phase は「実地操作不可」**: 実 `pnpm test:coverage` 実行ログ / `coverage-guard.sh` の pass/fail 実出力 / GitHub Actions の actions run 番号 / lefthook の実 push 結果 は本ワークフローのスコープ外であり、Phase 13 ユーザー承認後（PR① merge 後 = baseline 取得 / PR③ merge 前 = hard 切替リハーサル）に別オペレーションで実走される。本 Phase ではコマンド系列・期待結果・検証手順の仕様レベル固定と spec walkthrough のみを行う。

## 必須 outputs（spec_created Phase 11 代替証跡 4 点 + 本タスク特有の baseline 枠）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 walkthrough のトップ index。NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）の適用結果と「実地操作不可」明示 |
| `outputs/phase-11/manual-smoke-log.md` | 5〜8 ケース（baseline / coverage-guard pass / coverage-guard fail / CI soft / lefthook / hard 切替リハーサル）を **NOT EXECUTED** ステータスで列挙。各ケースに「実行前提（PR 番号 / branch / 実施時刻枠）」「rollback 手順」を含む |
| `outputs/phase-11/link-checklist.md` | 仕様書間 + skill + 外部 URL の参照リンク健全性チェック |
| `outputs/phase-11/coverage-baseline-summary.md` | T0 baseline 計測結果テンプレ（実値は `<TBD: T0 実行時に埋める>` プレースホルダで枠だけ用意） |

## 目的

Phase 1〜10 で固定された設計（全 package 一律 80% / `scripts/coverage-guard.sh` の I/O / vitest config の coverage セクション / 3 段階 PR 戦略 / CI soft → hard 切替 / lefthook pre-push 統合）に対し、docs-only / NON_VISUAL 代替 evidence プレイブックを適用して spec walkthrough を実施し、以下を確定する。

1. 仕様書の自己完結性（前提・AC-1〜AC-14・成果物パス）が満たされている
2. 6 ケースの手動 smoke（**baseline 計測 / coverage-guard pass / coverage-guard fail / CI soft 動作 / lefthook 動作 / hard 切替リハーサル**）のコマンド系列が Phase 2 §coverage-guard.sh I/O 仕様 / §CI workflow 更新仕様 / §lefthook.yml 更新仕様の固定通りに `manual-smoke-log.md` で再現可能な形に展開されている
3. 全リンク（aiworkflow-requirements 更新箇所 / task-specification-creator coverage-standards.md / Vitest 公式 / Codecov / CLAUDE.md / index.md ↔ phase-NN.md ↔ outputs）が健全である
4. T0 baseline の枠（package×metric の実値プレースホルダ / 80% との差分 / 不足ファイル top10 link / 推定追加テスト数）が `coverage-baseline-summary.md` に確定している
5. NON_VISUAL の限界（実走時の vitest 実行時間 drift / OS 依存差 / GitHub Actions runner 起因の flake）を明示し、保証できない範囲を Phase 12 `unassigned-task-detection.md` 候補として記録する

依存成果物として Phase 2 設計（coverage-guard.sh I/O / vitest config / CI gate / lefthook）、Phase 3 レビュー（NO-GO ゲート / 4 条件 PASS）、Phase 5 実装ランブックを入力する。本 Phase 11 は実走ではなく walkthrough と手順仕様固定に限定する。

## 実行タスク

1. NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）を `outputs/phase-11/main.md` に作成する（完了条件: 4 階層が漏れなく記述）。
2. 6 ケース手動 smoke のコマンド一覧を `outputs/phase-11/manual-smoke-log.md` に **NOT EXECUTED** ステータスで列挙する（完了条件: 各ケースに「実行コマンド / 期待結果 / 実測 / PASS-FAIL」「実行前提（PR 番号 / branch / 実施時刻枠）」「rollback 手順」が含まれる）。
3. spec walkthrough を実施し、参照リンク（aiworkflow-requirements の更新箇所 / task-specification-creator coverage-standards.md / Vitest 公式 / Codecov / CLAUDE.md / index.md ↔ phase-NN.md ↔ outputs / artifacts.json）を `outputs/phase-11/link-checklist.md` に記録する（完了条件: 全リンクが [ ] 未確認 / [x] 確認済 で表記）。
4. T0 baseline の枠を `outputs/phase-11/coverage-baseline-summary.md` に作成する（完了条件: package×metric 表 + 80% との差分 + 不足ファイル top10 link + 推定追加テスト数 + 集計サマリ が `<TBD: T0 実行時に埋める>` プレースホルダで全件埋まっている）。
5. 「実地操作不可 / Phase 13 ユーザー承認後実走」を `main.md` 冒頭に明記する。
6. 保証できない範囲（vitest 実行時間 drift / OS 依存差 / GitHub Actions runner 起因の flake / lefthook 遅延 / OpenNext bundle exclude 不足）を Phase 12 申し送り候補として最低 3 項目列挙する。

## NON_VISUAL 代替 evidence の 4 階層（本タスク適用版）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| **L1: 型** | `coverage-guard.sh` の I/O 契約（引数 flag / exit code 0/1/2 / stderr フォーマット）と vitest `coverage.thresholds` field の型整合を Phase 2 §仕様で読み取り検証 | 引数・exit code・出力フォーマットの「型」整合 | 実走時の vitest 実行 stderr / coverage-summary.json の現実値 |
| **L2: lint / boundary** | `coverage-summary.json`（vitest 出力）vs `coverage-final.json`（file 別）の **用途分離 boundary** を仕様レベルで読取検証。summary は package 集計用、final は file 単位 top10 抽出用、を spec で固定 | 「summary を file 別 top10 抽出に流す」誤用防止の境界 | 実走時の人為ミス（誤ファイル指定）— `coverage-guard.sh` 内 jq path で別途緩和 |
| **L3: in-memory test** | 6 ケース手動 smoke（baseline / pass / fail / CI soft / lefthook / hard 切替リハーサル）の **コマンド系列を仕様レベルで固定**（manual-smoke-log.md に NOT EXECUTED で列挙） | 「再現する手順」の網羅性 + rollback 手順の存在 | vitest 実行時間 drift / GitHub Actions runner flake / OS 依存差 |
| **L4: 意図的 violation snippet** | わざと vitest config の threshold を一時 90% に上げて fail させるリハーサル / `coverage-guard.sh` を threshold 未達の package で走らせて exit 1 を確認 / lefthook を skip せず push して block されることを確認 を spec walkthrough で red 確認 | 「赤がちゃんと赤になる」（threshold 違反検出 / hook block 検出） | （L4 自体は green 保証ではない） |

## 6 ケース手動 smoke 概要（NOT EXECUTED）

> 本 Phase では実走しない。Phase 13 ユーザー明示承認後、PR① merge 後（baseline / soft 確認）/ PR② sub PR ごと（不足ファイル消化）/ PR③ merge 前（hard 切替リハーサル / lefthook 確認）に別オペレーションで走らせる前提。
> 詳細コマンド系列は `manual-smoke-log.md` を参照。

| # | ケース | 主目的 | 実走タイミング |
| --- | --- | --- | --- |
| 1 | T0 baseline 計測 | 全 package の lines/branches/functions/statements pct を取得し `coverage-baseline-summary.md` を埋める | PR① merge 直後（branch: 本タスク worktree → dev） |
| 2 | coverage-guard pass | 全 package が 80% を満たす状態で `bash scripts/coverage-guard.sh` が exit 0 で終了することを確認 | PR② 全 sub PR merge 後（dev branch） |
| 3 | coverage-guard fail | わざと閾値を上げる / テストファイルを一時 skip して exit 1 + stderr に top10 + 雛形パスが出ることを確認 | PR① / PR② のいずれかの worktree（merge せず手元のみ） |
| 4 | CI soft gate 動作 | PR① で `coverage-gate` job が `continue-on-error: true` のもと warning 表示で merge 可能なことを確認 | PR① のドラフト PR 状態（dev に merge する前） |
| 5 | lefthook pre-push 動作 | PR③ で `lefthook.yml` 統合後、80% 未達の状態で push が block されることを確認 | PR③ の worktree（merge する前） |
| 6 | soft → hard 切替リハーサル | vitest config を一時 90% に上げて CI が fail することを確認 → 80% に戻す。`continue-on-error` を削除した状態で hard fail することも併せて確認 | PR③ merge 前のドラフト PR 状態 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-02/main.md | coverage-guard.sh I/O / vitest config / CI gate / lefthook の正本 |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-03/main.md | NO-GO 条件 / 4 条件 PASS の参照 |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-05/main.md | 実装ランブック（PR① の T0/T1/T2/T3/T4 手順） |
| 必須 | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md | 既存 coverage 正本（更新対象 / Phase 12 で同期） |
| 必須 | .claude/skills/task-specification-creator/references/coverage-standards.md | Phase 6/7 検証テンプレ / `coverage-guard.sh` 参照追記対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | docs-only / spec_created Phase 11 必須 outputs フォーマット |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11-detail.md | Phase 11 詳細テンプレ |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 縮約テンプレ（L1〜L4 の正本） |
| 必須 | vitest.config.ts | coverage 設定追加対象（実走時の現物） |
| 必須 | .github/workflows/ci.yml | coverage-gate job 追加対象（実走時の現物） |
| 必須 | lefthook.yml | pre-push hook 追加対象（実走時の現物） |
| 必須 | CLAUDE.md | branch 戦略 / solo 運用ポリシー / mise 経由実行原則 |
| 参考 | https://vitest.dev/guide/coverage | Vitest v8 coverage provider 仕様 |
| 参考 | https://docs.codecov.com/docs | 既存 codecov.yml 再評価用 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/ | NON_VISUAL Phase 11 構造リファレンス |

## 実行手順

1. NON_VISUAL 代替 evidence の 4 階層を `outputs/phase-11/main.md` へ記録する。
2. 6 ケース手動 smoke のコマンド系列を `manual-smoke-log.md` に NOT EXECUTED として記録する（各ケースに実行前提 / rollback 手順を含む）。
3. `link-checklist.md` で aiworkflow-requirements / task-specification-creator / 外部 URL / index.md ↔ phase-NN.md ↔ outputs を確認する。
4. `coverage-baseline-summary.md` の枠（package×metric 表 / 不足ファイル top10 link / 推定追加テスト数 / 集計サマリ）を `<TBD: T0 実行時に埋める>` プレースホルダで埋める。
5. 「Phase 13 ユーザー承認後に実走」を `main.md` 冒頭で明記する。

## 統合テスト連携

本 Phase は spec walkthrough のため smoke を実走しない。Phase 13 ユーザー明示承認後、PR① / PR② / PR③ の各タイミングで同じコマンド系列を実走し、`coverage-baseline-summary.md` の `<TBD>` プレースホルダを実値で埋め、`manual-smoke-log.md` の各ケースを `NOT EXECUTED` → `PASS` / `FAIL` に書き換える。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| walkthrough | outputs/phase-11/main.md | NON_VISUAL 代替 evidence の記録（L1〜L4）+ 「実地操作不可」明示 |
| smoke log | outputs/phase-11/manual-smoke-log.md | 6 ケース手動 smoke の NOT EXECUTED コマンド系列 + 実行前提 + rollback |
| link check | outputs/phase-11/link-checklist.md | 参照リンク健全性チェック |
| baseline 枠 | outputs/phase-11/coverage-baseline-summary.md | T0 baseline 計測結果テンプレ（実値は `<TBD>` プレースホルダ） |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] `outputs/phase-11/` に `main.md` / `manual-smoke-log.md` / `link-checklist.md` / `coverage-baseline-summary.md` の 4 ファイルが揃っている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）が `main.md` に記載
- [ ] 6 ケース手動 smoke（baseline / pass / fail / CI soft / lefthook / hard 切替）のコマンド系列が `manual-smoke-log.md` に NOT EXECUTED ステータスで網羅
- [ ] 各ケースに「実行前提（PR 番号 / branch / 実施時刻枠）」「rollback 手順」が含まれる
- [ ] spec walkthrough のリンク健全性が `link-checklist.md` に [ ]/[x] で記録され、aiworkflow-requirements 更新箇所 / coverage-standards.md / Vitest 公式 / Codecov / CLAUDE.md を必ず含む
- [ ] `coverage-baseline-summary.md` に package×metric 表（5 package × 4 metrics）と「不足ファイル top10 link」「推定追加テスト数」「集計サマリ」が `<TBD: T0 実行時に埋める>` プレースホルダで枠だけ用意されている
- [ ] 「実地操作不可 / Phase 13 ユーザー承認後実走」が `main.md` 冒頭で明記
- [ ] 保証できない範囲が Phase 12 申し送り候補として最低 3 項目列挙
- [ ] 鶏卵問題（PR① soft gate / PR③ hard 切替）が NO-GO 条件として再掲されている（3 重明記の 3 箇所目）

## 検証コマンド

```bash
# 必須 4 ファイルの存在
ls docs/30-workflows/coverage-80-enforcement/outputs/phase-11/
# main.md / manual-smoke-log.md / link-checklist.md / coverage-baseline-summary.md の 4 件

# screenshots/ が存在しないこと
test ! -d docs/30-workflows/coverage-80-enforcement/outputs/phase-11/screenshots && echo OK

# NOT EXECUTED が manual-smoke-log.md に明記されていること
rg -n "NOT EXECUTED" docs/30-workflows/coverage-80-enforcement/outputs/phase-11/manual-smoke-log.md

# 6 ケースが網羅されているか
rg -n "ケース [1-6]|CASE [1-6]" docs/30-workflows/coverage-80-enforcement/outputs/phase-11/manual-smoke-log.md

# baseline-summary が TBD プレースホルダで埋まっているか
rg -n "TBD" docs/30-workflows/coverage-80-enforcement/outputs/phase-11/coverage-baseline-summary.md
```

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定する。
2. **「実走した」と書かない**: 本 Phase は spec walkthrough。manual-smoke-log.md には必ず `NOT EXECUTED` ステータスを残す。実走は Phase 13 ユーザー承認後（PR①/②/③ の段階適用）。
3. **`coverage-baseline-summary.md` に実値を書かない**: 本 Phase では `<TBD: T0 実行時に埋める>` プレースホルダのみ。実値は PR① merge 後の T0 実走時に埋める。
4. **soft → hard 切替リハーサルを「green 確認」と誤解しない**: L4（赤がちゃんと赤になる）として位置づけ、threshold を一時 90% に上げる / `continue-on-error` を削除する操作は実走時のみ実施する。
5. **lefthook の skip 抜け道を残さない**: `LEFTHOOK=0 git push` の存在は Phase 12 README で明示するが、CI hard gate が同等 check を走らせるため事実上 skip 不可、を本 Phase でも再掲。
6. **鶏卵問題の 3 重明記**: Phase 1 / Phase 2 / Phase 3 に加え、本 Phase 11 でも `manual-smoke-log.md` ケース 4（CI soft）の前提条件に再掲する。
7. **OpenNext / Edge runtime の exclude 不足は Phase 11 baseline で再評価**: Phase 2 の exclude リストが現物と乖離する場合、Phase 12 で同期し、必要なら unassigned-task として formalize する。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - L3/L4 で発見した「保証できない範囲」を `unassigned-task-detection.md` の current 区分へ転記
  - 6 ケース手動 smoke のコマンド系列を `implementation-guide.md` Part 2 に再掲
  - link-checklist.md の Broken / 未確認項目があれば Phase 12 で同 sprint 修正
  - `coverage-baseline-summary.md` の `<TBD>` プレースホルダは Phase 13 PR① 実走時に実値で上書き
  - aiworkflow-requirements `quality-requirements-advanced.md` の 80%/65% → 全 package 80% 差分を `system-spec-update-summary.md` Step 1-A に申し送る
  - task-specification-creator `coverage-standards.md` への `scripts/coverage-guard.sh` 参照追記を申し送る
- ブロック条件:
  - `screenshots/` ディレクトリが誤って作成されている
  - `manual-smoke-log.md` が「実走済」と誤記している
  - `coverage-baseline-summary.md` に `<TBD>` 以外の実値が混入している
  - `link-checklist.md` が空（spec walkthrough 未実施）
  - 6 ケースのいずれかが欠落
