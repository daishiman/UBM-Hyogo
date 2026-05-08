# Phase 7: AC マトリクス

[実装区分: 実装仕様書]

| AC | 内容 | 証跡 |
| --- | --- | --- |
| AC-1 | provider 候補の移行/据え置き判定が ADR に残る | `phase-03.md` |
| AC-2 | ADR で移行対象にした provider が `writeTagNoteProviderMiddleware` で bind される | `repository-providers.test.ts` |
| AC-3 | `/me` self request が `adminNotesProvider` / `auditLogProvider` 経由になる | `routes/me/index.test.ts` |
| AC-4 | admin request resolve/list が note/outbox/audit provider 経由になる | `routes/admin/requests.test.ts` |
| AC-5 | admin member notes / audit browsing が provider 経由になる | `routes/admin/member-notes.test.ts` / `routes/admin/audit.test.ts` |
| AC-6 | tag queue resolve が tag provider 経由になり既存 state machine を維持 | `workflows/tagQueueResolve.test.ts` |
| AC-7 | `memberTags` read-only 境界を維持 | `memberTags.readonly.test-d.ts` |
| AC-8 | direct repository import が route/workflow/use-case から消える | grep gate |
| AC-9 | typecheck/lint/test が PASS | Phase 11 evidence |
| AC-10 | Issue #532 を reopen しない | Phase 13 PR 文面 `Refs #532` |

## DoD

AC-1 から AC-10 まで同一実装サイクル内で満たす。未タスク分離は行わない。

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

## 統合テスト連携

- NON_VISUAL API/internal refactor のため、focused tests、typecheck、lint、coverage guard、grep gate を Phase 11 evidence に集約する。

## 多角的チェック観点（AIが判断）

- 30種思考法の compact evidence に基づき、矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## サブタスク管理

- 本 workflow 内で完結する改善は同一 cycle で反映する。未タスク化は技術的・整合性的に分離が必要な場合だけ行う。
