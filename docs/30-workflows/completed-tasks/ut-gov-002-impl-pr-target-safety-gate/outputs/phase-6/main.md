# Phase 6 — テスト拡充（main）

## Status

spec_created

## 1. 目的

実 workflow 編集と dry-run 実走で防がねばならない**境界条件・失敗ケース** FC-1〜FC-8 を `outputs/phase-6/failure-cases.md` に固定する。各失敗ケースに Severity（MAJOR / MINOR）、検出手段（静的 / 動的 / レビュー）、是正手順を一意に紐づけることで、Phase 7 coverage（クロス表）と Phase 9 quality-gate（MAJOR 0 件判定）が直接参照できる正本にする。

## 2. 入力の継承

| 入力 | 用途 |
| --- | --- |
| `outputs/phase-3/review.md` §3 / §4 | "pwn request" 非該当 5 箇条 / S-1〜S-6 |
| `outputs/phase-4/test-matrix.md` §2 / §5 | T-1〜T-5 / F-1〜F-5（FC-1〜FC-8 へ拡張する母本） |
| `outputs/phase-5/runbook.md` Step 4〜7 | 静的検査 5 コマンド / dry-run D-1〜D-6 / required status checks 同期 |
| `.github/workflows/pr-target-safety-gate.yml` | triage workflow 実装本体（FC-1〜FC-5 検査対象） |
| `.github/workflows/pr-build-test.yml` | untrusted build workflow 実装本体（FC-3 / FC-6 検査対象） |
| 上流 dry-run `failure-cases.md` | 母本（仕様レベルでの母集合。本タスクは実 workflow 観点で FC-7 / FC-8 を拡張） |

## 3. 成果物

- `outputs/phase-6/main.md`（本書）
- `outputs/phase-6/failure-cases.md`（FC-1〜FC-8 表 / 回帰防止チェックリスト 5 項目 / レポート規約）

## 4. FC-1〜FC-8 の責務範囲

| 観点 | 含む | 含まない |
| --- | --- | --- |
| 静的検出 | actionlint / yq / grep / `gh api` の実走で観測できる失敗 | actor の意図・運用判断（FC-7 はレビュー欄で扱う） |
| 動的検出 | `gh run view --log` grep / fork PR / labeled trigger で観測できる失敗 | dry-run 結果の主観評価（VISUAL は Phase 11） |
| レビュー検出 | PR diff / reviewer チェックリストで red flag 化できる項目 | merge 後の運用監視（観測自動化は UT-GOV-002-OBS） |

## 5. Severity 分類方針

- **MAJOR (= 6 件)**: pwn request 直撃・secrets 露出経路・required status checks 同期破綻のいずれかに該当。Phase 9 quality-gate の「MAJOR 0 件」要件に直結する。
- **MINOR (= 1 件)**: 静的検出が原理上不可能で、運用ルール（CODEOWNERS / repository settings）で制御する事項。Phase 11 の reviewer 観点で扱う。
- 上流 dry-run 仕様（仕様正本）は MAJOR 5 / MINOR 1 だったが、本タスクは実 workflow 編集観点で FC-6（fork PR build への secrets 流入）/ FC-8（required status checks 名 drift）を MAJOR として明示固定する。

> 仕様母数: MAJOR 7 / MINOR 1（FC-1〜FC-6 + FC-8 が MAJOR、FC-7 が MINOR）。Phase 6 完了条件の Severity 分類はこの数値で固定する。

## 6. 回帰防止と次 Phase 連携

- 回帰防止チェックリスト 5 項目は failure-cases.md §4 で正本化し、Phase 11 reviewer / Phase 12 ドキュメントに転記する。
- レポート規約: 失敗ケース検出時は GitHub Issue を `security` ラベル付きで起票し、Phase 12 `unassigned-task-detection.md` にも記録する（仕様作成時点では起票せず、実走で違反検出時に発火）。
- Phase 7 coverage（シナリオ × FC / コマンド × FC / VISUAL × AC）の入力として FC-1〜FC-8 を渡す。
- Phase 9 quality-gate G-1〜G-2 / G-3 の MAJOR 0 件判定の根拠として FC 表を直接参照する。

## 7. 完了条件

- [x] failure-cases.md に FC-1〜FC-8 の表が作成される。
- [x] Severity（MAJOR 7 / MINOR 1）の分類が記述される。
- [x] 回帰防止チェックリスト 5 項目が記述される。
- [x] レポート規約（GitHub Issue + `security` label + Phase 12 連携）が記述される。
- [x] 機械コピーではなく本タスク観点（実 workflow 差分 / 4 系統 dry-run / VISUAL）が反映される。
