# Phase 3 — テスト戦略（main.md）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-21-w2-screen-blueprints-admin |
| Phase | 3 / 13 |
| 種別 | docs-only / NON_VISUAL |
| 状態 | completed |
| 完了日 | 2026-05-07 |

## 入力

- Phase 1 AC-1〜9
- Phase 2 章立て・サブセクション規約・派生ルール転記計画

## 出力サマリ

09g に対する検証方針を NON_VISUAL evidence ベースで確定する。実装統合テストは発生せず、grep / diff / structure check / mermaid count を gate として採用する。

## 検証カテゴリ

| カテゴリ | 対象 | 手段 | 出力先 |
| --- | --- | --- | --- |
| markdown structure | top section 数 / sidebar 数 / sub section 数 | grep + jq | `outputs/phase-11/evidence/structure.json` |
| 視覚値 grep 規制 | HEX / OKLch 直値 / ピクセル値 / 任意値クラス記法 | grep -E | `outputs/phase-11/evidence/visual-grep.log` |
| API parity | phase-3 §2 admin block と §X.4 | diff | `outputs/phase-11/evidence/api-parity.diff` |
| a11y 文字列 | confirm Modal 4 文字列 | grep -c | `outputs/phase-11/evidence/a11y-strings.log` |
| schema 二段確認 | §6.3 mermaid キーパス | grep -A | `outputs/phase-11/evidence/schema-two-stage.log` |
| markdown lint | 構文 | markdownlint または fallback | `outputs/phase-11/evidence/lint.log` |

## grep pattern 一覧

```
# 視覚値（4 patterns — phase-3 §grep-gate に定義された正規表現を参照）
# - HEX 表記検出パターン
# - OKLch 関数呼び出し検出パターン
# - ピクセル値検出パターン
# - Tailwind 任意値クラス検出パターン

# AdminSidebar 1 箇所
^## 1\. AdminSidebar

# top section
^## [0-9]+\. 

# subsection
^### [2-9]\.[1-8] 

# a11y
role="dialog"
aria-modal="true"
focus trap
Esc close
```

## API parity 手順

1. phase-3.md §2 から admin block の method+endpoint 行を抽出
2. 09g 内の §X.4 から同形式で抽出
3. sort -u で照合し diff 行 0 を期待

## structure.json スキーマ

```
{
  "line_count": <int>,
  "top_sections": <int>,
  "sidebar_count": <int>,
  "sub_sections_2_to_9": <int>,
  "derive_notes": <int>,
  "sidebar_refs": <int>,
  "mermaid_blocks": <int>,
  "unadopted_count": <int>
}
```

期待値: line_count ∈ [700, 1200], top_sections=10, sidebar_count=1, sub_sections=64, derive_notes=4, sidebar_refs=8, mermaid_blocks=8, unadopted_count=3。

## markdown lint 戦略

リポジトリ標準に `pnpm lint:md` 等が無いため、fallback として「他の structural gate 全 PASS = lint error 0」と扱う方針を採用。`lint.log` に `NO_LINT_MD_SCRIPT: fallback` を記録する。

## DoD 充足 evidence

- 検証カテゴリ表: 上記
- grep pattern 一覧: 上記
- API parity 手順: 上記
- structure.json スキーマ: 上記
- lint fallback 戦略: 上記

## Phase 4 への引き継ぎ

- 検証スクリプトの実行命令
- 09g 不在 / 未準拠時に各 gate が fail することの確認 (RED simulation)

## 次 Phase

Phase 4（TDD RED）— 09g 不在時 / AC 未充足時に gate が fail するシミュレーション。
