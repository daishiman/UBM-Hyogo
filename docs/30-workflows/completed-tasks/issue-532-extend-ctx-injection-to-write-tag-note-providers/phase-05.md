# Phase 5: 実装ランブック

[実装区分: 実装仕様書]

## 実装順序

1. `provider-context.ts` に provider 変数型と `requireProvider` を追加する。
2. Phase 3 ADR で移行対象にした repository 各ファイルに provider interface/factory を追加する。既存関数 signature は後方互換のため残す。
3. `repository-providers.ts` に `writeTagNoteProviderMiddleware` を追加する。
4. `/me` route へ middleware を mount し、`services.ts` を provider ctx 入力へ移行する。
5. `/admin/requests` を provider ctx 入力へ移行する。
6. `tagQueueResolve` と `/admin/tags-queue` を provider ctx 入力へ移行する。
7. `/admin/member-notes` と `/admin/audit` の direct repository import を provider 経由へ移行する。
8. retry/dispatch workflow は provider 化対象関数のみ薄く移行する。
9. focused tests と grep gate を実行し、直接 import と fallback を除去する。

## 主要 signature

```ts
export interface MemberSelfRequestInput {
  ctx: WriteTagNoteProviderCtx;
  memberId: MemberId;
  actorEmail: string;
  reason?: string;
  payload?: Record<string, unknown>;
}

export async function tagQueueResolve(
  c: WriteTagNoteProviderCtx,
  input: TagQueueResolveInput,
): Promise<TagQueueResolveResult>;
```

## 実装時の注意

- `AttendanceProvider` の型と middleware は既存互換で維持する。
- `createOutboxRepository(ctx({ DB }))` の route 内生成は provider middleware へ移す。
- `adminNotes.create(ctx, input)` 形式の direct call は `c.var.adminNotesProvider.create(input)` に置き換える。
- `auditLog.append(ctx, input)` は `c.var.auditLogProvider.append(input)` に置き換える。
- `tagDefinitions.findByCode(ctx, code)` は `c.var.tagDefinitionsProvider.findByCode(code)` に置き換える。
- `memberTags` write helper は `tagQueueResolve` 専用 provider method とし、一般 route へ露出しない。

## 検証

Phase 4 の全コマンドを実行し、ログを `outputs/phase-11/evidence/` に保存する。

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
