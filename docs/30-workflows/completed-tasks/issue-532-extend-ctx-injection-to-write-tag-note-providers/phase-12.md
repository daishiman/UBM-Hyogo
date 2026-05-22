# Phase 12: ドキュメント同期

[実装区分: 実装仕様書]

## 更新対象

| パス | 種別 | 内容 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 必要時編集 | API 内部 provider 注入の非公開実装境界を追記 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | 必要時編集 | admin requests/tag queue の response shape 不変を明記 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` または対応 index | 編集 | Issue #532 workflow 参照を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 | API repository provider refactor として登録 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | `implemented-local` 状態を同期 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 編集 | fragment 体系の同期履歴を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260508-issue532-write-tag-note-provider-spec.md` | 作成 | 同期履歴を追加 |

## Phase 12 outputs

この仕様書改善 wave で以下を作成する:

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## compliance

- docs-only 判定にしない。コード変更を伴うため implementation として同期する。
- Issue #532 は CLOSED 維持。
- root workflow state は実装後に `implemented-local` へ昇格済み。


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
