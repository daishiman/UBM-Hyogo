# Lessons Learned: Skill Codex Validation (2026-04)

> 親: [lessons-learned.md](lessons-learned.md)
> Source task: TASK-SKILL-CODEX-VALIDATION-001（2026-04-28 / `docs/30-workflows/completed-tasks/skill-md-codex-validation-fix/`）
> Scope: SKILL.md frontmatter を扱う全 skill（skill-creator / aiworkflow-requirements / automation-30 / skill-fixture-runner ほか）

## 概要

Codex CLI が SKILL.md frontmatter を strict YAML として検証する制約を発見し、`description ≤1024 字 / string scalar / YAML 構文有効` を二段ガードで強制した。フィクスチャ 30 件の skill discovery 圏外化、退避先 Markdown 統一、mirror parity の AC 化を実施。

## 教訓一覧

### L-CODEX-001 SKILL.md frontmatter Codex 検証契約

- **課題**: Codex CLI 側の検証契約（`description ≤1024 字 / string scalar / YAML 構文有効 / Anchors ≤5 / Trigger keywords ≤15`）が未文書化で、複数 skill が同時に reject される事象が発生した。
- **解法**: `validate-skill-md.js`（199 行）を canonical validator として整備し、R-01〜R-07 を一箇所で定義。`yaml-escape.js` を補助に置き、`<` `>` `:` 改行を string scalar として安全化する。
- **指針**: 「Codex / Claude Code 双方を満たす最小契約」を 1 ファイルに固定し、新規 skill 追加時は必ず validator を経由させる。description 圧縮は `references/{topic}.md` への外出しを優先し、frontmatter 1024 字を hard-cap として扱う。

### L-CODEX-002 二段ガード（build-time + write-time）

- **課題**: 単一 validator のみだと `init_skill.js` の writeFileSync 直前で template が変質するケースに対して bypass 経路が残った。
- **解法**: `generate_skill_md.js` 描画後（build-time）と `init_skill.js` writeFileSync 直前（write-time）の二段で `validateSkillMdContent()` を実行。`quick_validate.js` を CLI 経路の三段目に追加し、CI と手動修正の両方をカバーした。
- **指針**: 検証ルールは「最後に書き込む直前」と「テンプレート展開直後」の二段で実行する。一段だけでは template post-processing で迂回される。

### L-CODEX-003 フィクスチャ拡張子戦略（`.fixture`）

- **課題**: `__tests__/fixtures/*/SKILL.md` が Claude Code の skill discovery（`**/SKILL.md` glob scan）に物理的に拾われ、validator が「不正な skill」として fail させていた。
- **解法**: 30 件のフィクスチャを `*/SKILL.md` → `*/SKILL.md.fixture` に rename。`__tests__/helpers/load-fixture.js` で `.fixture` を読み込み仮想 SKILL.md として validator に流す。
- **指針**: テスト fixture を本物のファイル名で置かない。discovery glob で衝突する成果物は **拡張子で物理排除**する（`.gitignore` や `.skillignore` のような review 経路に依存させない）。

### L-CODEX-004 description 退避先の Markdown 統一

- **課題**: description 1024 字超過分の退避先が独自フォーマット（リスト / table / inline JSON）で散在し、参照経路が一貫しなかった。
- **解法**: 退避先を `.claude/skills/{skill}/references/{topic}.md` の Markdown に統一（`automation-30/references/elegant-review-prompt.md` / `skill-creator/references/anchors.md`）。SKILL.md からは relative link で誘導する。
- **指針**: 退避先のフォーマットは Markdown に統一し、構造は最小限（見出し + 本文）に保つ。frontmatter からの link は relative path で固定する。

### L-CODEX-005 mirror parity（`.claude/` ↔ `.agents/`）の同 wave sync

- **課題**: `.claude/skills/` と `.agents/skills/` の更新が wave 単位で drift し、Codex 側だけが新版・Claude 側が旧版という非対称状態が発生した。
- **解法**: AC-8 として「同一 wave で `.claude/` ↔ `.agents/` を sync する」を契約化。CI gate 化は follow-up（`TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001`）で扱う。
- **指針**: skill 系の更新は必ず両 mirror に同 wave で適用する。差分検出は CI 化を最終目標とし、当面は PR description テンプレに parity チェックを追加する。

## 派生未タスク

| ID | 概要 |
|----|------|
| `TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001` | task-specification-creator の SKILL.md が 500 行超過、再分割が必要 |
| `TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001` | valid-skill fixture の `example.md` リンク欠如修正 |
| `TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001` | spec-update-workflow.md の Warning 3 段階分類整備 + mirror parity CI gate 化 |

## 関連ドキュメント

- `references/workflow-skill-md-codex-validation-fix-artifact-inventory.md`
- `indexes/topic-map-skill-authoring.md`
- `indexes/quick-reference.md`（§Codex SKILL.md 検証早見）
- `indexes/resource-map.md`（§Skill Authoring / Codex Validation Contract）
