---
name: automation-30
description: |
  30種の思考法で多角的にエレガントさ・正しさを検証・改善するメタスキル。先入観をリセットし、4条件（矛盾なし・漏れなし・整合性・依存関係整合）を満たす状態へ導く。詳細プロンプトは references/elegant-review-prompt.md、思考法カタログは references/patterns.md を参照。

  Anchors:
  • 30種思考法カタログ / 適用: references/patterns.md / 目的: 多角的視点の網羅
  • elegant-review-prompt / 適用: references/elegant-review-prompt.md / 目的: 実行プロンプト本体
  • 先入観リセット / 適用: Phase 1 思考リセット / 目的: バイアス除去
  • 4条件チェック / 適用: 矛盾なし・漏れなし・整合性・依存関係整合 / 目的: 検証ゲート
  • 並列多角的分析 / 適用: 3エージェント構成 / 目的: 視点の独立性確保

  Trigger:
  automation-30, 30種思考法, エレガント検証, 多角的レビュー, 先入観リセット, 4条件, 品質審査, improve, elegant review, multi-perspective review, bias reset, 仕様レビュー, 設計レビュー
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

# automation-30

30 種の思考法で多角的にエレガントさを検証・改善するメタスキル。

## 使い方

詳細プロンプトと思考法一覧、エージェント構成、実行フローは [references/elegant-review-prompt.md](references/elegant-review-prompt.md) を参照。
30 種思考法のカタログ（カテゴリ別・適用目的）は [references/patterns.md](references/patterns.md) を参照。

## リソース一覧

| リソース | 役割 |
|----------|------|
| [references/elegant-review-prompt.md](references/elegant-review-prompt.md) | 実行プロンプト本体・3 フェーズフロー・エージェント構成 |
| [references/patterns.md](references/patterns.md) | 30 種思考法の分類カタログ（論理分析系・構造分解系・メタ抽象系 等） |

## 概要

- 思考リセット → 並列多角的分析（3 エージェント）→ 改善実行 の 3 フェーズ構成
- 30 種の思考法を 4 カテゴリ（論理分析系・構造分解系・メタ抽象系 等）に分けて並列適用
- 検証 4 条件: 矛盾なし / 漏れなし / 整合性あり / 依存関係整合

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2026-04-30 | docs-only / NON_VISUAL close-out review feedback。小規模レビューでは30種思考法を compact evidence table に集約可能だが、formalize / 正本同期 / Phase evidence / skill feedback / 4条件検証は省略不可と明記 |
| 1.1.0 | 2026-04-28 | Codex 検証準拠（R-01〜R-05）に YAML frontmatter を是正。本文は references/elegant-review-prompt.md に退避 |
| 1.0.0 | 2026-04-19 | 初版作成 |
