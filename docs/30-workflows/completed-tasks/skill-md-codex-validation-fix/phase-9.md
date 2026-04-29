# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 名称 | 品質保証 |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

line budget / link / mirror parity / typecheck / lint を一括判定する。

## チェック項目

| ID | 項目 | コマンド / 確認方法 | 期待 |
| --- | --- | --- | --- |
| Q-01 | typecheck | `mise exec -- pnpm typecheck` | PASS |
| Q-02 | lint | `mise exec -- pnpm lint` | PASS |
| Q-03 | skill-creator unit test 全件 | `pnpm --filter skill-creator test` 相当 | Green |
| Q-04 | mirror parity（aiworkflow-requirements） | `diff -qr .claude/skills/aiworkflow-requirements ~/.agents/skills/aiworkflow-requirements`（generated index 除外） | 0 件差分 |
| Q-05 | mirror parity（skill-creator） | `test -d ~/.agents/skills/skill-creator && diff -qr .claude/skills/skill-creator ~/.agents/skills/skill-creator || echo "mirror not present; skipped"` | mirror が存在する場合のみ 0 件差分 |
| Q-06 | mirror parity（automation-30） | `test -d ~/.agents/skills/automation-30 && diff -qr .claude/skills/automation-30 ~/.agents/skills/automation-30 || echo "mirror not present; skipped"` | mirror が存在する場合のみ 0 件差分 |
| Q-07 | SKILL.md line budget | 各 SKILL.md ≤ 200 行 | PASS |
| Q-08 | references リンク切れ | `find references -name "*.md" -exec grep -l "](references/" {} \;` で参照先存在確認 | 0 切れ |
| Q-09 | `validate-skill-md.js` を全 SKILL.md に適用 | スクリプト一括実行 | 全件 PASS（フィクスチャ除く） |
| Q-10 | フィクスチャ rename 整合 | `find ... -name "SKILL.md"` 0 件、`-name "SKILL.md.fixture"` ≥ 28 件 | PASS |
| Q-11 | .gitignore 追加確認 | `grep "fixtures/.*/SKILL.md" .gitignore` | ヒット |

## 削除確認（Phase 8 削除対象）

ファイル削除ではなくロジック削除（共通化）のため、以下を確認:

```bash
grep -rn "if (desc.length > 1024)" .claude/skills/skill-creator/scripts/ \
  | grep -v utils/validate-skill-md.js \
  | grep -v __tests__
# 期待: 0 件（共通バリデータに集約されている）
```

## 受入条件（Phase 9 完了条件）

- [ ] Q-01〜Q-11 全件 PASS
- [ ] 結果を `outputs/phase-9/qa-result.md` に記録（PASS/FAIL を ID 単位で）

## 成果物

- `outputs/phase-9/qa-result.md`

## 実行タスク

- typecheck / lint / test / mirror parity / link / line budget を確認する。
- 実在しない mirror は skipped として明示し、失敗と混在させない。
- QA 結果を Phase 10 の AC 判定へ渡す。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 5 diff | `outputs/phase-5/diff-summary.md` | QA 対象 |
| Phase 8 | `phase-8.md` | リファクタ結果 |
| quality standards | `.claude/skills/task-specification-creator/references/quality-standards.md` | QA 判定 |

## 統合テスト連携

Phase 4〜8 の成果を横断し、source-level failure と環境ブロッカーを分けて qa-result に記録する。

## 完了条件

- [ ] Q-01〜Q-11 が PASS または skipped-with-reason
- [ ] mirror parity は実在 mirror のみ確認されている
- [ ] Phase 10 へ渡す AC 証跡が揃っている

## タスク100%実行確認【必須】

- [ ] Phase 9 の成果物と artifacts.json の登録が一致している
