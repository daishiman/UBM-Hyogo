# Phase 12 — ドキュメント更新 (strict 7)

[実装区分: 実装仕様書]

## 1. strict 7 outputs

下記 7 ファイルを `outputs/phase-12/` 配下に生成する:

| # | File | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリ（実装範囲・差分概要・残課題） |
| 2 | `outputs/phase-12/implementation-guide.md` | PR 本文ベース（diff-to-pr が参照する） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | system spec への影響（本タスクは UI 整合中心 → 影響軽微の旨を記載） |
| 4 | `outputs/phase-12/documentation-changelog.md` | docs 変更行（本ワークフローの新規作成 + 関連 skill 同期） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | followup-004 候補（list response field 拡張 / tag pill write / avatar 画像 / list zone chip）の根拠付き記録 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への学び（adapter 戦略 / 404 仮説切り分け / in-place rewrite） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings の compliance |

## 2. canonical 9 headings (compliance ファイル)

`phase12-task-spec-compliance-check.md` は以下の見出しを **逐語** で含めること:

```markdown
## 1. Summary verdict
## 2. Changed-files classification
## 3. `workflow_state` and phase status consistency
## 4. Phase 11 evidence file inventory
## 5. Phase 12 strict 7 file inventory
## 6. Skill/reference/system spec same-wave sync
## 7. Runtime or user-gated boundary
## 8. Archive/delete stale-reference gate
## 9. Four-condition verdict
```

## 3. aiworkflow-requirements 同期

`.claude/skills/aiworkflow-requirements/` に下記 surface 同期（2026-05-27 実装完了サイクルで実施済み）:

- `indexes/topic-map.md`
- `indexes/keywords.json`（`pnpm indexes:rebuild` で再生成）
- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/workflow-admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign-artifact-inventory.md`
- `task-workflow-active.md`
- `LOGS/_legacy.md`
- `SKILL-changelog.md`

## 4. lessons-learned 候補

実装で得られた知見を `.claude/skills/aiworkflow-requirements/lessons-learned/` に追加（命名: `L-AMPROT-NNN`）:

- L-AMPROT-001: list response 不足 field の UI 側 adapter 戦略（hue: deterministic hash / zone・tags: drawer-only）
- L-AMPROT-002: staging 404 の 3 仮説切り分け手順（unauth curl / wrangler tail / env var grep）
- L-AMPROT-003: in-place rewrite + 呼び出し側 props 互換維持（V2 並走を避ける）
- L-AMPROT-004: env-gated Playwright visual baseline と stale-reference gate の両立

## 5. unassigned-task 検出と運用

`outputs/phase-12/unassigned-task-detection.md` で **本サイクル out-of-scope** を明示する（CONST_007 の例外条件: 後続 issue 化）:

| 候補 | 理由 | 実施場所 |
| --- | --- | --- |
| list response への `zone` / `tags` / `occupation` field 追加 | API surface 変更 → 不変条件 #1 と衝突。別 issue で API 仕様議論が先 | followup-004（別 issue 起票） |
| Drawer タグ pill write 永続化 | tags-queue endpoint 仕様未整備。本タスクは UI 整合に閉じる | followup-005 |
| Avatar 画像対応 | photo storage 仕様未策定 | followup-006 |
| list の zone chip 表示 | list response が zone を返すまで実装不可 | followup-004 と同 issue |

これらは **CONST_007 の許容条件「今回サイクル内完了が技術的に破綻する」** に該当（API surface 議論が前提）。本仕様の実装サイクルは UI 整合 + 404 復旧 + visual baseline で 1 サイクル完了する。
