# Skill Feedback Report — issue-1081-bulk-tag-real-d1-runtime-smoke

> 改善点なしでも出力必須。

## task-specification-creator skill への feedback

| # | 観点 | 内容 | 提案 |
| - | ---- | ---- | ---- |
| FB-1 | 「endpoint landed 済 + runtime smoke 未取得」型タスクの区分 | 本タスクは endpoint 実装は既に landed（issue-1036）で、未取得なのは staging real D1 への runtime 証跡のみ。ただし runner / fixture / CI job が新規コード化可能なら `spec_created` ではなく `implemented_local_evidence_captured` へ同 cycle 昇格するのが正しい | `references/patterns-runtime-evidence-followup.md` に「domain contract landed + runtime gate missing」型の local implementation 昇格 rule を追記 |
| FB-2 | issue 本文 contract と実装の乖離記録パターン | issue 本文は `200 + assigned` 単値・`@repo/api` と記載されていたが、実装は `200 + {batchId, results:[{...,status}]}`・`@ubm-hyogo/api`。最新コードへ最適化した差分を index.md / phase-1 / artifacts.json metadata の 3 箇所に表形式で固定する運用は再発防止に有効 | `phase-1` テンプレに「issue 本文 vs 実装の乖離表（# / issue 記述 / 実装実態 / 仕様書での扱い）」を NON_VISUAL runtime smoke タスクの定型節として明文化 |

## aiworkflow-requirements skill への feedback

| # | 観点 | 内容 | 提案 |
| - | ---- | ---- | ---- |
| FB-3 | 派生物（CI / smoke 層）の正本登録判定 | runtime smoke runner / seed・cleanup SQL / CI gate job は「派生物」であり API/IPC/UI/auth/schema の契約変更ではない。ただし workflow registration と local implementation status は aiworkflow 台帳へ同 wave で同期する必要がある | aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / changelog に本 workflow を登録 |

## 所有スキルファイルへの反映方針

- 本タスクは `implemented_local_evidence_captured` へ昇格したため、skill 反映を後続 wave に送らず同一 cycle で完了した。
- task-specification-creator: `.claude/skills/task-specification-creator/references/patterns-runtime-evidence-followup.md` / `SKILL-changelog.md` を更新。
- aiworkflow-requirements: `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` / `references/task-workflow-active.md` / `SKILL-changelog.md` を更新。
