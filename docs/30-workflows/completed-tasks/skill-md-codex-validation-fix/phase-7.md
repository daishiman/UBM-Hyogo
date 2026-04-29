# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 名称 | カバレッジ確認 |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

変更行限定でカバレッジを可視化する（広域指定での意図ぼやけを防止）。

## カバレッジ対象（変更ファイル限定）

| ファイル | line cov 目標 | branch cov 目標 |
| --- | --- | --- |
| `scripts/utils/validate-skill-md.js` | 100% | 100% |
| `scripts/utils/yaml-escape.js` | 100% | 100% |
| `scripts/generate_skill_md.js`（変更行のみ: 事前ゲート / escape / 上限退避） | 100% | ≥ 90% |
| `scripts/init_skill.js`（変更行のみ: writeFile 直前ゲート） | 100% | 100% |
| `scripts/quick_validate.js`（共通化部分） | 既存維持 | 既存維持 |
| `scripts/validate_structure.js`（共通化部分） | 既存維持 | 既存維持 |

## 計測手順

```bash
cd .claude/skills/skill-creator
pnpm test --coverage \
  --include "scripts/utils/**" \
  --include "scripts/generate_skill_md.js" \
  --include "scripts/init_skill.js"
```

## 対象外

- 既存全 scripts（変更がない箇所のカバレッジ低下は本タスクの責務外）
- `__tests__/fixtures/`（テストデータ）

## 受入条件（Phase 7 完了条件）

- [ ] 変更ファイルの line/branch カバレッジが目標値以上
- [ ] カバレッジレポートを `outputs/phase-7/coverage-report.md` に保存
- [ ] 変更行で未到達ブランチがある場合は理由を明記

## 成果物

- `outputs/phase-7/coverage-report.md`

## 実行タスク

- 変更ファイル限定で coverage を測定する。
- 未到達ブランチがある場合は理由を記録する。
- Phase 8 へ渡す重複・未到達リスクを整理する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 6 | `phase-6.md` | 拡充テスト |
| Phase 5 lane result | `outputs/phase-5/diff-summary.md` | 変更対象の確定 |
| coverage standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` | coverage 判定 |

## 統合テスト連携

Phase 6 のテスト拡充結果を入力にし、coverage 未達があれば Phase 8 ではなく Phase 6 へ戻す。

## 完了条件

- [ ] 変更ファイルの coverage が目標値以上
- [ ] coverage-report.md に測定コマンドと結果が記録されている
- [ ] 未到達ブランチの扱いが明示されている

## タスク100%実行確認【必須】

- [ ] Phase 7 の成果物と artifacts.json の登録が一致している
