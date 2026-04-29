# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 名称 | リファクタリング |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

Phase 5-7 で追加・変更した実装の重複や設計の歪みを取り除く。

## リファクタ対象

| 対象/Before/After/理由 |
| --- |

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| description 検証ロジック | quick_validate.js / validate_structure.js / generate_skill_md.js / init_skill.js に分散 | `utils/validate-skill-md.js` に一本化 | DRY、ガード追加時の漏れ防止 |
| YAML escape 処理 | generate_skill_md.js 内に inline | `utils/yaml-escape.js` に抽出 | 単一責務、テスト容易性 |
| Anchors / Trigger の上限処理 | generate_skill_md.js 内に直書き | `utils/overflow-extract.js`（任意）に抽出可 | テスト粒度向上。**ただし行数増を判断し、過剰抽象化なら見送り** |
| エラーメッセージ | ハードコード | constants 化（`ERROR_MESSAGES.DESC_TOO_LONG` 等） | i18n やテストでの message 検証容易化。**任意、優先度低** |

## 判断ログ

| 案 | 採用 | 却下理由 |
| --- | --- | --- |
| `validate-skill-md.js` の export を `default` か named か | named export `validateSkillMdContent` | 既存スタイルに合わせる |
| `yaml-escape.js` を `js-yaml` 依存に置き換える | 採用見送り | 既存依存を増やさない、要件は `escape` で十分 |
| エラーメッセージ constants 化 | 見送り | 過剰設計。Phase 12 lessons-learned へメモ |

## 削除対象（live import 0 確認）

```bash
grep -rn "import.*validate_structure" .claude/skills/skill-creator/scripts/ \
  | grep -v __tests__
```

旧ロジックが共通バリデータに移管された後、validate_structure.js / quick_validate.js 内の重複ロジックを削除（import 経由に置換）。

## 受入条件（Phase 8 完了条件）

- [ ] DRY 違反 0（同一ロジックが 2 箇所以上に存在しない）
- [ ] 既存テスト全件 Green 維持
- [ ] 削除した行数 / 追加した行数 を記録

## 成果物

- `outputs/phase-8/refactor-report.md`

## 実行タスク

- 重複した validation / escape ロジックを共通化する。
- 過剰抽象化を避け、必要な削除と置換だけを記録する。
- Before / After / 理由を refactor-report にまとめる。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 2 design | `outputs/phase-2/design.md` | 設計方針 |
| Phase 7 | `phase-7.md` | coverage 結果 |
| patterns | `.claude/skills/task-specification-creator/references/patterns.md` | リファクタ判断 |

## 統合テスト連携

Phase 8 後は Phase 6 までのテストと Phase 7 coverage を再確認し、共通化による回帰を検出する。

## 完了条件

- [ ] 同一 validation ロジックの重複が解消されている
- [ ] 削除行と追加行の理由が記録されている
- [ ] 既存テストが Green を維持している

## タスク100%実行確認【必須】

- [ ] Phase 8 の成果物と artifacts.json の登録が一致している
