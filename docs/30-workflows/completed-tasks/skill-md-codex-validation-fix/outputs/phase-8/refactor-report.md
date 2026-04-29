# Phase 8 / Refactor Report

## 観点

GREEN 達成後、コード品質と責務分離を見直し、追加リファクタの要否を確認する。

## 現状の責務分離

| 責務 | 配置 | 評価 |
|------|------|------|
| YAML 検証 (R-01〜R-07) | `utils/validate-skill-md.js` | ✅ 単一ファイル / 責務明確 |
| YAML escape (出力側) | `utils/yaml-escape.js` | ✅ 入力検証と分離 |
| 件数上限定数 | `validate-skill-md.js` から re-export | ✅ |
| 生成系のガード | `generate_skill_md.js` / `init_skill.js` 内で utils を呼ぶ | ✅ 二段ガード |

## 適用したリファクタ

1. `validate-skill-md.js` 内の YAML パーサ部を `extractDescription` 関数に抽出。
2. `yaml-escape.js` を 3 関数に分離 (`normalizeWhitespace` / `escapeForScalar` / `toDoubleQuotedScalar`)。
3. `generate_skill_md.js` の anchors/trigger 退避を `writeOverflowReferences` ヘルパに切り出し。
4. テスト用 `loadFixture` ヘルパを `scripts/__tests__/helpers/` 直下に集約。

## 見送ったリファクタ

| 候補 | 見送り理由 |
|------|-----------|
| `validate-skill-md.js` の js-yaml への置換 | 既存 `yaml` parser を利用し、独自正規表現だけでは frontmatter 全体の構文保証が弱い問題を解消。 |
| `quick_validate.js` の utils 統合 | 実施済み。Codex 互換判定を `validateSkillMdContent` に接続し、追加の構造検証だけ quick_validate 側に残した。 |
| Anchors/Trigger 退避先テンプレートの外部化 | 2 形態のみで現状不要。3 形態超になった時点で検討。 |

## 残課題（次タスク候補）

- `task-specification-creator/SKILL.md` 500 行超過 (本タスク対象外、別 task spec で是正)
- `valid-skill` fixture の `references/example.md` リンク欠如 (別 task)
- spec-update-workflow.md Warning 3 段階分類セクション (別 task)
