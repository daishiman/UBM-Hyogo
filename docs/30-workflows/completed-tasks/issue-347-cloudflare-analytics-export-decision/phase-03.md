# Phase 3 — 設計レビュー

## 目的

Phase 2 推奨案（GraphQL Analytics API + 手動 CSV fallback）を、Free plan 制約 / PII 観点 / 運用継続性の 3 軸で再評価し、PASS / MINOR / MAJOR の判定を下す。

## レビュー観点と判定

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| Free plan 制約整合性 | GraphQL Analytics API は Free plan で利用可、dataset 限定 | PASS（Phase 9 で実証） |
| PII 観点 | aggregate field のみ select、URL query / body は構造上取得しない | PASS |
| 運用継続性 | 手動取得 1 回 / 月次サンプルで運用負荷低、自動化は別タスクで拡張可 | PASS |
| retention 規律 | repo 内ファイルで明示、超過分は archive ディレクトリへ移送 | MINOR（Phase 5 で具体化） |
| 09c 親 workflow との整合 | 09c spec_created 据え置きで矛盾なし | PASS |

## 不採用案レビュー

- B（手動 CSV）: PII 列混入リスクあり。fallback としてのみ位置づけ、redaction-check を必須化（Phase 6）
- C（screenshot）: 数値比較不可、aggregate-only 抽出も保証できないため REJECT

## 出力

- `outputs/phase-03/main.md`: 観点別判定表 + alternative 不採用理由

## 完了条件

- [ ] 5 観点すべてに判定（PASS / MINOR / MAJOR）が付与
- [ ] MINOR / MAJOR がある場合は対応 Phase が明記
- [ ] AC-1 / AC-4 が再確認

## 受け入れ条件（AC mapping）

- AC-1: 採用方式の妥当性レビュー
- AC-4: PII 観点の構造的評価
- AC-5: Free plan 制約整合の前提

## 検証手順

```bash
grep -E "PASS|MINOR|MAJOR|REJECT" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-03/main.md | wc -l
# 期待: >= 5
```

## リスク

| リスク | 対策 |
| --- | --- |
| Phase 9 で Free plan 制約 NG が判明 | fallback B + redaction で再判定し Phase 2 へ戻る |
