# Phase 1: 要件定義 — 成果物サマリ

## 真の論点（1 文）

Codex CLI の SKILL.md 検証は外部仕様であり、skill-creator の生成ロジックがその仕様を**事前に強制していない**ため、生成時点では valid でも検証時点で fail する SKILL.md が量産されている。

## 検証ルール（R-01〜R-07）

| ID | 内容 | 根拠 |
| --- | --- | --- |
| R-01 | YAML frontmatter（`---` 区切り）必須 | Codex `missing YAML frontmatter delimited by ---` |
| R-02 | `description` フィールド必須 | `missing field 'description'` |
| R-03 | `description` は string 型のみ | `invalid type: sequence, expected a string` |
| R-04 | `description` ≤ 1024 文字 | `exceeds maximum length of 1024 characters` |
| R-05 | YAML 構文として有効 | `invalid YAML: did not find expected key` |
| R-06 | BOM 付き UTF-8 は frontmatter 認識不可 | `bom-utf8` フィクスチャ失敗 |

## アクター責務

| アクター | 責務 |
| --- | --- |
| skill-creator | 生成時に R-01〜R-07 を**事前**保証 |
| skill 著者 | description を肥大化させない判断 |
| Codex / Claude Code | 起動時に R-01〜R-07 を検証（外部仕様、変更不可） |

## Lane 構造

- Lane A: 既存 SKILL.md 是正（A-1 / A-2 / A-3 並列）
- Lane B: テストフィクスチャ拡張子変更（A と完全並列）
- Lane C: skill-creator 改修（B 完了後にフィクスチャ出力経路整合のみ確認）

## 受入条件（Phase 1 完了）

- [x] R-01〜R-07 文書化
- [x] inventory（mirror 含む）完了
- [x] Lane A/B/C 責務境界明示
