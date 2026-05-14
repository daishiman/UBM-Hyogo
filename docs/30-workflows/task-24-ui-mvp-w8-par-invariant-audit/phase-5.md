# Phase 5: 監査実行（実装）

## 実行モード

`verify_existing` — read-only 監査。実装変更なし。

## 新規作成ファイル

| パス | 役割 |
|------|------|
| `outputs/phase-5/audit-runner.sh` | 監査スクリプト本体（lane-A/B/C 並列） |
| `outputs/phase-5/grep-evidence.txt` | 各 grep の生出力 |
| `outputs/phase-5/matrix.tsv` | 22×6 matrix の中間 TSV |
| `outputs/phase-5/violations.md` | VIOLATION 明細 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md` | 最終成果物 |

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
- VIOLATION 件数が決定（0 件でも記録）
