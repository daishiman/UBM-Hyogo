# Phase 5: 監査実行（実装）

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## 実行モード

`verify_existing` — read-only 監査。実装変更なし。

## 新規作成ファイル

| パス | 役割 |
|------|------|
| `outputs/phase-5/audit-runner.sh` | 監査スクリプト本体（lane-A/B/C 並列） |
| `outputs/phase-5/grep-evidence.txt` | 各 grep の生出力 |
| `outputs/phase-5/matrix.tsv` | 22×6 matrix の中間 TSV |
| `outputs/phase-5/violations.md` | VIOLATION 明細 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md` | 最終成果物 |

## 修正ファイル

なし（read-only audit）。

## 実行ステップ

1. `audit-runner.sh` を実行し、6 INV × 22 task のセルを埋める
2. `grep-evidence.txt` に全 grep 結果を append
3. `matrix.tsv` から `INVARIANT-AUDIT.md` を生成（pandoc 不要、shell の awk で十分）
4. VIOLATION ありの場合は `violations.md` に file:line と引用を記録
5. `git diff apps/ packages/` で実装変更ゼロを確認

## canUseTool 適用範囲

本タスクは shell 実行のみで LLM callback は使用しない。

## 完了条件

- `INVARIANT-AUDIT.md` に matrix セル 132 個（22×6）すべてが埋まっている
- `git diff apps/ packages/` が空（read-only 担保）
- [x] VIOLATION 件数が決定（0 件でも記録）

## メタ情報
- Phase: 5 / 実装
- State: completed

## 目的
read-only audit runner を実行し、matrix と final report を生成する。

## 実行タスク
- `audit-runner.sh` を実行する。
- `grep-evidence.txt`、`matrix.tsv`、`violations.md`、`INVARIANT-AUDIT.md` を生成する。

## 参照資料
- `outputs/phase-5/audit-runner.sh`
- `phase-4.md`

## 成果物
- `outputs/phase-5/grep-evidence.txt`
- `outputs/phase-5/matrix.tsv`
- `outputs/phase-5/violations.md`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`

## 統合テスト連携
Phase 11 の NON_VISUAL evidence と Phase 12 compliance check が本 Phase の生成物を参照する。
