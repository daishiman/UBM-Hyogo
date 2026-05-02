# Skill Feedback Report

## task-specification-creator

| 苦戦箇所 | promotion target | evidence path |
| --- | --- | --- |
| Phase 欠落が後続参照で見落とされる | Phase index / artifacts parity を早期 gate にする | `index.md`, `artifacts.json` |
| Phase 12 canonical filename drift | `system-spec-update-summary.md` strict check を維持 | `outputs/phase-12/system-spec-update-summary.md` |
| docs-only で実測 PASS と Design PASS が混ざる | Design GO / runtime GO 分離をテンプレに残す | `phase-10.md`, `phase-11.md` |

## aiworkflow-requirements

| 苦戦箇所 | promotion target | evidence path |
| --- | --- | --- |
| follow-up が既存正本登録済みの場合の no-op 判定 | no-op reason と existing reference path を Phase 12 に必須化 | `outputs/phase-12/system-spec-update-summary.md` |
| 新 workflow root と open follow-up を作る docs-only task の no-op 誤判定 | 実 command 昇格 no-op と workflow tracking 同期を分離 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`, `indexes/quick-reference.md`, `indexes/resource-map.md` |

## automation-30

| 苦戦箇所 | promotion target | evidence path |
| --- | --- | --- |
| 30種分析結果が実装パッチへ落ちない | compact evidence table から patchカテゴリに束ねる運用を維持 | final review summary |
