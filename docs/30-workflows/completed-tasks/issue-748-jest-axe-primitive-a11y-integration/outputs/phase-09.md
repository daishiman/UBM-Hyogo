# Phase 9 — 運用・監視

[実装区分: 実装仕様書]

## 9.1 継続監視

| 項目 | 監視方法 | 対応 |
| --- | --- | --- |
| primitive a11y regression | CI test job が axe violation を検出すると fail | PR 時点で red → 修正後マージ |
| axe rule baseline の経年腐食 | 半年に 1 回、`apps/web/src/test/axe.ts` の disable rule 妥当性をレビュー | 必要なら enable 復帰 |
| 新規 primitive 追加時 | spec template に `describe.each` の a11y ケースを含める | レビュー観点に追加 |

## 9.2 運用ドキュメント参照

- `apps/web/src/test/axe.ts` のコメントで disable 理由を SSOT 化
- 本ワークフローの `index.md` で運用方針へのリンクを提供

## 9.3 担当

solo 開発のため owner は `@daishiman`。
