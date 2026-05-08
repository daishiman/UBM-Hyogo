# Phase 13: PR 準備

[実装区分: 実装仕様書]

## user gate

本仕様書作成タスクでは commit / push / PR 作成を実行しない。後続実装完了後、ユーザー承認を得てから実行する。

## branch / PR

| 項目 | 値 |
| --- | --- |
| branch suggestion | `feat/issue-532-write-tag-note-provider-ctx-injection` |
| PR title | `refactor(api): issue-532 extend ctx provider injection to write tag note repositories` |
| issue link | `Refs #532` |
| labels | `priority:low`, `type:improvement`, `scale:small`, `area:api` |

## PR body checklist

- [ ] Summary: provider ctx injection for write/tag/note repositories.
- [ ] Tests: Phase 11 evidence commands.
- [ ] Issue #532 remains CLOSED; PR uses `Refs #532`.
- [ ] No D1 migration.
- [ ] No production deploy.
- [ ] No DI container.

## blocked state

`blocked_pending_user_approval`: commit / push / PR はユーザー承認待ち。


## メタ情報

- task_id: issue-532-extend-ctx-injection-to-write-tag-note-providers
- taskType: implementation
- visualEvidence: NON_VISUAL
- state: implemented-local

## 目的

Issue #371 の Hono ctx provider pattern を write/tag/note repository へ必要最小限で展開するため、この Phase の判断・作業・証跡を固定する。

## 実行タスク

- Phase 本文の判断を確認する。
- 関連する証跡・完了条件を更新する。
- 後続 Phase との依存を確認する。

## 参照資料

- `index.md`
- `artifacts.json`
- `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-03/adr-di-strategy.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 実行手順

1. 対象ファイルと依存関係を確認する。
2. Phase 固有の判断を本文に反映する。
3. 完了条件と成果物の整合を確認する。

## 成果物

- この Phase の Markdown 本文。
- 必要な場合は `outputs/phase-N/` 配下の補助証跡。

## 完了条件

- [x] taskType / visualEvidence / Issue #532 CLOSED boundary が矛盾していない。
- [x] Phase 固有の完了条件が本文に記録されている。
- [x] focused changed-path tests / typecheck / lint / grep gates は PASS として記録済み。
- [ ] full coverage threshold は PR 前 verification debt。`docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` を完了または blocker 記録してから PR 作成へ進む。`coverage-guard.sh --package -hyogo/api` は PASS/NO-OP であり threshold PASS とは扱わない。

## タスク100%実行確認【必須】

- [x] 仕様作成 wave と実装 evidence wave の境界を明記した。
- [x] commit / push / PR は実行していない。

## 次Phase

- 次の Phase は `artifacts.json` の phase order に従う。

## 多角的チェック観点（AIが判断）

- 30種思考法の compact evidence に基づき、矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## サブタスク管理

- 本 workflow 内で完結する改善は同一 cycle で反映する。未タスク化は技術的・整合性的に分離が必要な場合だけ行う。
