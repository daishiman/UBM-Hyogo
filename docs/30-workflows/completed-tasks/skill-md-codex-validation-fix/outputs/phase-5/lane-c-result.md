# Phase 5 / Lane C 実装結果

タスクID: TASK-SKILL-CODEX-VALIDATION-001 / Lane C

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `.claude/skills/skill-creator/scripts/utils/validate-skill-md.js` | R-01〜R-07 検証 + YAML parser frontmatter 検証 + extractDescription + 件数上限定数 |
| `.claude/skills/skill-creator/scripts/utils/yaml-escape.js` | normalizeWhitespace / escapeForScalar / toDoubleQuotedScalar |
| `.claude/skills/skill-creator/scripts/init_skill.js` | writeFileSync 直前に validateSkillMdContent ガード |
| `.claude/skills/skill-creator/scripts/generate_skill_md.js` | Anchors ≤ 5 / Trigger keywords ≤ 15 で slice、超過分は references/anchors.md / references/triggers.md へ退避、description を YAML safe scalar 化し生成後に validate |
| `.claude/skills/skill-creator/scripts/__tests__/codex_validation.test.js` | RED → GREEN テスト 28 件 |
| `.claude/skills/skill-creator/vitest.config.js` | skill-creator スコープの vitest include 限定 |

## エクスポート定数

| 定数 | 値 | 根拠 |
|------|-----|------|
| `MAX_DESC_LENGTH` | 1024 | Codex R-04 |
| `MAX_ANCHORS` | 5 | spec-update-workflow.md / Anchors 件数上限 |
| `MAX_TRIGGER_KEYWORDS` | 15 | spec-update-workflow.md / Trigger キーワード件数上限 |

## 検証結果 (GREEN)

```
$ mise exec -- npx vitest run scripts/__tests__/codex_validation.test.js
 Test Files  1 passed (1)
      Tests  28 passed (28)
```

28 ケース全 GREEN を確認。

## 二段ガード設計

1. **生成側ガード** (`generate_skill_md.js`):
   - Anchors / Trigger keywords を上限超過分も保持し、超過分は `references/anchors.md` / `references/triggers.md` に退避。
   - description を `toDoubleQuotedScalar` で YAML safe 化する。
   - 描画後に `validateSkillMdContent` を呼び、Codex 違反があれば throw。
2. **書き込み側ガード** (`init_skill.js`):
   - `writeFileSync` 直前に `validateSkillMdContent` を必ず通す。違反時は throw して書き込みを中止。

これにより、テンプレート変更や他経路での生成混入があっても Codex 違反が永続化しない。
