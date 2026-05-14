# Phase 12 — 実装ガイド / system spec 同期 / skill feedback

## 12.1 strict outputs 配置

`outputs/phase-12/` 配下に以下 7 ファイルを実体として配置する。短縮名・別名は使わない。

```text
outputs/phase-12/
├── main.md
├── implementation-guide.md
├── system-spec-update-summary.md
├── documentation-changelog.md
├── unassigned-task-detection.md
├── skill-feedback-report.md
└── phase12-task-spec-compliance-check.md
```

## 12.2 implementation-guide.md の必須セクション

Task 1 は 2 パート構成にする。

- Part 1: 中学生レベル。日常生活の例え話を 1 つ以上入れ、「なぜ必要か」から「何をするか」の順で説明する。専門用語セルフチェック表を 5 語以上含める。
- Part 2: 技術者向け。CSV schema、`git mv` ループ、検証コマンド、エラー時の rollback、設定値を記載する。

## 12.3 system-spec-update-summary.md

本タスクは active implementation workflow の新規 root なので、aiworkflow-requirements 側の discoverability 同期を no-op にしない。

必須記録:

- Step 1-A: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`、`indexes/resource-map.md`、`indexes/quick-reference.md`、`LOGS/_legacy.md`、`changelog/20260511-issue622-packages-test-suffix-rename-spec.md` への登録
- Step 1-B: root state は `implemented-local / implementation / NON_VISUAL / rename-only / local-evidence-partial`
- Step 1-C: #622 は active、#325 / #621 は upstream refs、#623 / followup-003 は downstream blocker
- Step 2: 新規 runtime API / TypeScript interface / DB schema 追加なしのため N/A

## 12.4 unassigned-task-detection.md

新規未タスクは 0 件。既存 followup の継続確認のみ行う。

| ID | 内容 | 既存配置 | 判定 |
| --- | --- | --- | --- |
| FU-622-A | followup-003 vitest spec 単一収斂（`{test,spec}` → `spec`） | `docs/30-workflows/unassigned-task/task-issue-325-followup-003-vitest-spec-suffix-convergence.md` / Issue #623 | 既存未タスクを継続。本タスク完了後に unblock |

種別 prefix（zod/db/contract/mapper）の全面導入は、本タスクの rename-only 境界と直接依存しないため未タスク化しない。必要性は各 package ADR の Non-goal として残し、実需要が発生した時点で再評価する。

## 12.5 skill-feedback-report.md

- task-specification-creator: Phase 12 strict 7、state vocabulary、root `artifacts.json`、existing followup 再利用を PASS 根拠として記録
- aiworkflow-requirements: active workflow discoverability のため task-workflow / resource-map / quick-reference / LOGS / changelog を same wave sync
- automation-30: 30 種思考法は compact evidence table として `phase12-task-spec-compliance-check.md` に集約可能

## 12.6 phase12-task-spec-compliance-check.md

以下を最終 gate とする。

- strict 7 ファイル存在: completed
- root `artifacts.json` 存在: completed
- `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。
- aiworkflow same-wave sync: completed
- 既存 followup #623 参照: completed
- 30 種思考法 compact evidence table: completed
- 4 条件: 矛盾なし / 漏れなし / 整合性あり / 依存関係整合すべて completed
