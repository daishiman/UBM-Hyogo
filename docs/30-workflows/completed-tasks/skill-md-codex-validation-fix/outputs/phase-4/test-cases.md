# Phase 4 / Test Cases (RED)

タスクID: TASK-SKILL-CODEX-VALIDATION-001

## 目的

Codex CLI の SKILL.md 検証ルール R-01〜R-07 と、skill-creator の生成・書き込みガード（Lane C）を、未実装状態で RED にする単体テストを定義する。

## テストファイル

- `.claude/skills/skill-creator/scripts/__tests__/codex_validation.test.js`
- 実行: `mise exec -- npx vitest run` （`vitest.config.js` で include 限定）

## テストケース一覧

### R-01〜R-07 単体検証 (TC-CDX-A)

| ID | 検証内容 | 入力 | 期待 |
|----|---------|------|------|
| TC-CDX-A01 | R-01 frontmatter 欠如 | `# no frontmatter\nbody` | ok=false / R-01 |
| TC-CDX-A02 | R-02 description 欠如 | `name` のみ | ok=false / R-02 |
| TC-CDX-A03 | R-03 description が sequence | `description:\n  - a\n  - b` | ok=false / R-03 |
| TC-CDX-A04 | R-04 description 1025 字 | `"x" * 1025` | ok=false / R-04 |
| TC-CDX-A05 | R-04 boundary 1024 字 | `"x" * 1024` | ok=true |
| TC-CDX-A06 | R-06 BOM 付き | `﻿---\n...` | R-06 検出 |

### extractDescription (TC-CDX-B)

| ID | 検証内容 |
|----|---------|
| TC-CDX-B01 | missing → kind: missing |
| TC-CDX-B02 | sequence → kind: sequence |
| TC-CDX-B03 | double-quoted エスケープ復元 |
| TC-CDX-B04 | plain scalar 抽出 |
| TC-CDX-B05 | literal block (\|) 改行込み抽出 |

### yaml-escape ヘルパー (TC-CDX-C)

| ID | 検証内容 |
|----|---------|
| TC-CDX-C01 | normalizeWhitespace: 改行 → 空白 |
| TC-CDX-C02 | normalizeWhitespace: Tab → 空白 |
| TC-CDX-C03 | normalizeWhitespace: 連続空白 → 1個 |
| TC-CDX-C04 | escapeForScalar: ダブルクォート escape |
| TC-CDX-C05 | escapeForScalar: バックスラッシュ escape |
| TC-CDX-C06 | toDoubleQuotedScalar: 改行含み |
| TC-CDX-C07 | toDoubleQuotedScalar: 危険文字 |
| TC-CDX-C08 | (件数上限定数) MAX_DESC_LENGTH=1024, MAX_ANCHORS=5, MAX_TRIGGER_KEYWORDS=15 |

### リグレッション (TC-CDX-REG)

| ID | 検証内容 |
|----|---------|
| TC-CDX-REG-01 | 既存実 SKILL.md (aiworkflow-requirements / automation-30 / skill-creator) が R-01〜R-07 PASS |

## RED 段階の根拠

Phase 4 着手時点では `validate-skill-md.js` / `yaml-escape.js` が未実装のため、import で全ケース失敗 (RED)。Phase 5 で実装することで GREEN へ遷移する。

## 連動する Lane

- **Lane A** (TC-CDX-REG-01): aiworkflow-requirements / automation-30 / skill-creator の SKILL.md description を Codex 準拠に是正。
- **Lane C** (TC-CDX-A/B/C): validator + yaml-escape utils + init/generate のガード追加。
