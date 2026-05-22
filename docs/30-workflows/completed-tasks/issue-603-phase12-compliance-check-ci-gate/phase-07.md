# Phase 7: 横断整備（skill / SSOT 同期）

## 目的

skill reference と SSOT に CI gate 名と検査対象見出しを追記し、drift 防止文言を入れる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 変更対象ファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | 編集 | 末尾に「CI gate `verify-phase12-compliance` がこの Required Sections を SSOT として参照する」旨を追記。Required Sections の番号体系を 1..9 に固定する旨を明記 |
| `.claude/skills/task-specification-creator/SKILL.md` | 編集 | `verify-phase12-compliance` workflow の存在と検査範囲を 1 行で記述 |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | 編集 | GitHub Actions CI/CD パイプライン表へ `verify-phase12-compliance.yml` を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | 本 workflow root を active implementation spec として登録 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md` | 編集 | 起票元 unassigned-task の consumed trace を反映 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-603-phase12-compliance-check-ci-gate-artifact-inventory.md` | 新規 | 本 workflow の成果物台帳 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` / `keywords.json` | 編集 | `verify-phase12-compliance` 導線追記（必要時）|

## drift 防止文言（template 末尾追記）

```markdown
> CI gate `verify-phase12-compliance`（`.github/workflows/verify-phase12-compliance.yml`）
> がこの Required Sections を SSOT として参照する。番号順・heading 文字列を変更する場合は、
> 同 gate の検査ロジック (`scripts/verify-phase12-compliance.ts`) と
> fixture (`scripts/__tests__/fixtures/phase12-compliance/`) を同 PR 内で同期更新すること。
```

## 完了条件

- [ ] skill reference 末尾追記
- [ ] SKILL.md 反映
- [ ] aiworkflow-requirements SSOT 反映（deployment-core / task-workflow-active / artifact inventory / changelog）
- [ ] indexes 再生成（`mise exec -- pnpm indexes:rebuild`）

## Next Phase

- [Phase 8](phase-08.md): セキュリティ / 安全性
