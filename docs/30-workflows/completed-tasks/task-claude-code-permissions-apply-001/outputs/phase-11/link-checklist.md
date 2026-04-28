# link-checklist（NON_VISUAL 代替証跡）

## メタ情報

- 実施日時: 2026-04-28T20:05:24+09:00
- 主証跡: `manual-smoke-log.md`
- 補助証跡: 本ファイル

## Workflow 内リンク

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `phase-01.md` 〜 `phase-13.md` | OK（13 phase 完備） |
| `artifacts.json` | `phases[10].outputs[*]`（main / manual-smoke-log / link-checklist） | OK（1:1 一致） |
| `outputs/artifacts.json` | `phases[10].outputs[*]` | OK（root と diff 0 件） |
| Phase 11 main.md | Phase 5 runbook-execution-log / backup-manifest | OK |
| Phase 11 main.md | Phase 6 fail-path-tests.md | OK |
| Phase 11 main.md | Phase 10 final-review-result.md | OK |

## Artifact 名 1:1 一致

| artifacts.json `phases[10].outputs` | 物理ファイル |
| --- | --- |
| `outputs/phase-11/main.md` | 存在 |
| `outputs/phase-11/manual-smoke-log.md` | 存在 |
| `outputs/phase-11/link-checklist.md` | 存在（本ファイル） |

## Skill 参照先

| 参照 | 状態 |
| --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | OK |
| `.claude/skills/task-specification-creator/assets/phase-spec-template.md` | OK |
| `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md` | OK（Phase 12 で使用） |
| `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` | OK（階層優先順位の正本） |

## NON_VISUAL 物理担保

| 項目 | 確認コマンド | 結果 |
| --- | --- | --- |
| `outputs/phase-11/screenshots/` 非存在 | `test ! -e .../phase-11/screenshots` | **OK**（不在確認済） |
| `screenshots/.gitkeep` 不作成 | `find outputs/phase-11 -name ".gitkeep"` | OK（0 件） |
| placeholder PNG 不使用 | `find outputs -name "*.png"` | OK（0 件） |

## Secrets grep 結果

```bash
grep -rE '(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|CLOUDFLARE_API_TOKEN=|OAuth)' \
  docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/
```

結果: **0 件**（exit code 1）。`.env` 実値・API token・OAuth token の混入なし。

## TC 件数チェック

```bash
grep -cE '^## TC-' manual-smoke-log.md
# → 8（TC-01..05, TC-F-01, TC-F-02, TC-R-01）
```

## 不変条件チェック

- [x] workflow 内リンク全て OK
- [x] artifact 名 1:1 一致
- [x] skill 参照先 OK
- [x] `screenshots/` 物理非存在
- [x] secrets grep 0 件
- [x] TC 件数 8
