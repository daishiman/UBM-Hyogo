# Topic Map: Skill Authoring / Codex Validation Contract

> Parent: [topic-map.md](topic-map.md)（5047 行超過のため classification-first split）
> Scope: skill-creator / aiworkflow-requirements / automation-30 / skill-fixture-runner ほか SKILL.md frontmatter を扱う全 skill
> Source task: TASK-SKILL-CODEX-VALIDATION-001（2026-04-28 / `docs/30-workflows/completed-tasks/skill-md-codex-validation-fix/`）

---

## 1. Codex SKILL.md frontmatter 検証契約（R-01〜R-07）

| ルール | 内容 | 失敗時挙動 |
|--------|------|-----------|
| R-01 | `description` ≤ 1024 字 | ≥1025 字で `validateSkillMdContent` が throw（build/write 両時点） |
| R-02 | frontmatter は YAML string scalar | block scalar / list / mapping は reject |
| R-03 | YAML 構文として valid | `<` `>` `:` 改行は escape 必須（`yaml-escape.js`） |
| R-04 | `name` ≤ 64 字 / snake-case | 違反で reject |
| R-05 | BOM / `\r\n` / 末尾改行は normalize して許容 | warn |
| R-06 | `name` / `description` の trim 後空文字禁止 | reject |
| R-07 | Anchors ≤ 5 / Trigger keywords ≤ 15 | 超過分は `references/anchors.md` へ自動退避 |

### 参照

| リソース | パス |
|----------|------|
| 検証実装 | `.claude/skills/skill-creator/scripts/utils/validate-skill-md.js`（199 行） |
| YAML escape ヘルパ | `.claude/skills/skill-creator/scripts/utils/yaml-escape.js` |
| テスト 24 ケース | `.claude/skills/skill-creator/scripts/__tests__/codex_validation.test.js`（232 行） |
| フィクスチャ loader | `.claude/skills/skill-creator/scripts/__tests__/helpers/load-fixture.js` |
| Vitest 設定 | `.claude/skills/skill-creator/vitest.config.js` |

---

## 2. 二段ガード（build-time + write-time）

| 段階 | 呼び出し箇所 | 役割 |
|------|--------------|------|
| 1 段目 | `generate_skill_md.js` 描画後 | テンプレート展開直後に `validateSkillMdContent()` 実行。description ≥1025 字で throw |
| 2 段目 | `init_skill.js` `writeFileSync` 直前 | ファイル書き込み直前で再検証。Anchors ≤5 / Trigger ≤15 自動退避 |
| 3 段目（CI 経路） | `quick_validate.js` | CLI 経路でも同 validator を実行（手動修正後の再検証） |

---

## 3. フィクスチャ拡張子戦略（`*.fixture`）

> Claude Code の skill discovery は `**/SKILL.md` を scan するため、テスト fixture が discovery に混入する事故が発生していた。これを物理的に排除するため、fixture を `*.fixture` 拡張子に rename した（30 件）。

| 観点 | 値 |
|------|---|
| rename 範囲 | `.claude/skills/skill-creator/scripts/__tests__/fixtures/*/SKILL.md` → `*/SKILL.md.fixture` |
| 件数 | 30 件 |
| loader | `__tests__/helpers/load-fixture.js`（`.fixture` を読み込み仮想 SKILL.md として検証） |
| 効果 | skill discovery が fixture を skill 本体と誤認しない |

---

## 4. description 退避先 Markdown 統一

| 退避元 | 退避先 |
|--------|--------|
| `automation-30/SKILL.md` 本文 | `automation-30/references/elegant-review-prompt.md` |
| `skill-creator/SKILL.md` Anchors | `skill-creator/references/anchors.md` |
| `aiworkflow-requirements/SKILL.md` description | （≤1024 字に圧縮、退避先 markdown は不要） |

退避先は **`references/{topic}.md` 形式の Markdown 統一**（独自フォーマット禁止）。

---

## 5. Mirror parity（`.claude/` ↔ `.agents/`）

> AC-8: `.claude/skills/` への変更は同 wave で `.agents/skills/` に sync する。CI gate 化は follow-up（`TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001` で扱う Warning 3 段階分類の対象）。

---

## 6. 苦戦箇所（L-CODEX-001〜005）

詳細は `references/lessons-learned-skill-codex-validation-2026-04.md`。

| ID | 課題 |
|----|------|
| L-CODEX-001 | Codex 検証契約発見の遅延（≤1024 字 / string scalar / YAML 構文有効） |
| L-CODEX-002 | 単一 validator の bypass 経路（→ 二段ガード化） |
| L-CODEX-003 | フィクスチャが skill discovery に混入（→ `.fixture` 化） |
| L-CODEX-004 | 退避先フォーマットの非統一（→ Markdown 統一） |
| L-CODEX-005 | mirror parity の wave drift（→ AC-8 化） |

---

## 7. Follow-up 未タスク

| タスク | 概要 |
|--------|------|
| `TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001` | task-specification-creator の SKILL.md が 500 行超過、再分割が必要 |
| `TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001` | valid-skill fixture の `example.md` リンク欠如修正 |
| `TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001` | spec-update-workflow.md の Warning 3 段階分類整備 + `.claude` ↔ `.agents` mirror parity CI gate 化 |
