# Phase 11: evidence

[実装区分: 実装仕様書]

## evidence mode

NON_VISUAL。UI screenshot は不要。API 内部 refactor のため local command evidence と grep gate を証跡にする。

## required evidence

| ファイル | コマンド |
| --- | --- |
| `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm --filter @ubm-hyogo/api lint` |
| `outputs/phase-11/evidence/focused-tests.log` | focused route/workflow/provider tests |
| `outputs/phase-11/evidence/coverage-guard.log` | `bash scripts/coverage-guard.sh --package @ubm-hyogo/api` |
| `outputs/phase-11/evidence/grep-direct-import.log` | direct import grep |
| `outputs/phase-11/evidence/grep-fallback.log` | fallback/DI container 禁止 grep |

## completion state

現在は `implemented-local`。local evidence は取得済みで、UI screenshot は NON_VISUAL のため不要。Full coverage はローカル Miniflare port exhaustion で NOT PASS として境界記録する。


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
- [x] coverage guard は changed mode no-op、full coverage は Miniflare port exhaustion で NOT PASS として記録した。focused tests/typecheck/lint/grep は PASS。

## タスク100%実行確認【必須】

- [x] implemented-local と local evidence の境界を明記した。
- [x] commit / push / PR は実行していない。

## 次Phase

- 次の Phase は `artifacts.json` の phase order に従う。

## 統合テスト連携

- NON_VISUAL API/internal refactor のため、focused tests、typecheck、lint、coverage guard、grep gate を Phase 11 evidence に集約する。

## 多角的チェック観点（AIが判断）

- 30種思考法の compact evidence に基づき、矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## サブタスク管理

- 本 workflow 内で完結する改善は同一 cycle で反映する。未タスク化は技術的・整合性的に分離が必要な場合だけ行う。
