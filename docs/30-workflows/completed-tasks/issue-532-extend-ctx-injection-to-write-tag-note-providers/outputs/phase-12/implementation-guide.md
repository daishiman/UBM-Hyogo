# Implementation Guide

Status: IMPLEMENTED_LOCAL

Implemented in code despite this workflow previously being `spec_created`; the task purpose requires provider types, middleware, route/workflow call-site changes, and tests.

## Part 1: 中学生レベルの説明

### なぜ必要か

学校の職員室で、先生が毎回それぞれ別の棚まで出席表や連絡帳を取りに行くと、どこから何を持ってきたかが分かりにくくなります。たとえば、必要な道具を受付の箱にまとめて入れておき、先生はその箱から取り出す約束にすると、授業ごとの準備がそろいやすくなります。

このタスクも同じです。会員のお願い、管理メモ、タグ確認、記録の保存などで使う道具を、決まった箱から取り出す形にそろえます。そうすると、テストでは本物の道具ではなく練習用の道具に差し替えやすくなり、失敗した時もどこが悪いか見つけやすくなります。

### 今回作ったもの / この機能でできること

Issue #371 で出席情報の道具箱を作った方法を、書き込み・タグ・メモの処理にも広げました。広げる対象は何でも増やすのではなく、実際に差し替えが必要で、複数の場所から使われているものだけにしました。

### 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
| --- | --- |
| provider | 必要な道具をまとめた箱 |
| repository | データを読み書きする係 |
| Hono ctx | リクエストごとの持ち物入れ |
| middleware | 処理の前に準備する係 |
| mock | テスト用の練習道具 |
| D1 | データをしまう場所 |

## Part 2: 技術者向け

### Implemented Contract

The implementation wave must extend the Issue #371 Hono ctx provider pattern only where the ADR threshold is met. The target is an internal API refactor; public/member/admin response shapes and D1 schema are invariant.

```ts
export type WriteTagNoteProviderVariables = {
  adminNotesProvider: AdminNotesProvider;
  auditLogProvider: AuditLogProvider;
  notificationOutboxProvider: NotificationOutboxRepository;
  tagDefinitionsProvider: TagDefinitionsProvider;
  tagQueueProvider: TagQueueProvider;
  memberTagsProvider: MemberTagsProvider;
};

export type WriteTagNoteProviderCtx = DbCtx & {
  readonly var: WriteTagNoteProviderVariables;
};
```

### APIシグネチャ

```ts
export async function tagQueueResolve(
  c: WriteTagNoteProviderCtx,
  input: TagQueueResolveInput,
): Promise<TagQueueResolveResult>;
```

### 使用例

```ts
const result = await tagQueueResolve(c, {
  queueId,
  action: "confirmed",
  tagCodes,
  actorUserId,
  actorEmail,
});
```

### エラーハンドリング

| Case | Required behavior |
| --- | --- |
| Provider middleware missing | Throw `Error("<provider> not bound to context")`; no silent fallback |
| Tag code unknown | Preserve existing `unknown_tag_code` behavior |
| Race lost after guarded update | Do not execute downstream side effects |
| Outbox enqueue failure after request resolve | Preserve existing best-effort boundary and warning behavior |
| Member tag write exposure | Keep write helper scoped to tag queue resolve provider only |

### エッジケース

| Case | Handling |
| --- | --- |
| Scheduled workflow without Hono context | Pass an explicit provider bundle instead of fabricating `c.var` |
| Coverage guard no-op | Treat as scope guard only, not full threshold PASS |
| Broad Miniflare port exhaustion | Track as verification debt and keep focused changed-path test evidence separate |

### 設定項目と定数一覧

| Item | Value |
| --- | --- |
| `taskType` | `implementation` |
| `visualEvidence` | `NON_VISUAL` |
| Issue linkage | `Refs #532`; do not reopen Issue #532 |
| D1 migration | Not allowed |
| DI container | Not allowed |
| Runtime evidence | Phase 11 local command evidence after implementation |

### テスト構成

| Path | Evidence required |
| --- | --- |
| Local typecheck | `outputs/phase-11/evidence/typecheck.log` |
| Local lint | `outputs/phase-11/evidence/lint.log` |
| Local tests | `outputs/phase-11/evidence/focused-tests.log` |
| Type-level test | included in API typecheck (`src/**/*.ts` includes `*.test-d.ts`) |
| Structural grep | `grep-direct-import.log`, `grep-fallback.log` |

### Changed Code Areas

- Provider context and middleware: `apps/api/src/repository/_shared/provider-context.ts`, `apps/api/src/middleware/repository-providers.ts`
- Repository provider factories: `adminNotes`, `auditLog`, `notificationOutbox`, `tagDefinitions`, `tagQueue`, `memberTags`
- Provider consumers: `/me`, admin requests/member-notes/audit/tags/members/dashboard/meetings/attendance/status, tag queue workflows, schema alias workflow, public member profile use-case
- `/admin/requests` request resolution now delegates the guarded multi-table note/status/audit batch to `adminNotesProvider.resolveRequestAtomic()` so route code does not own raw request-resolution writes.

### Verification Summary

- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api lint`: PASS
- Focused changed-path Vitest: PASS
- Direct import grep gate: PASS
- Full `test:coverage`: attempted; failed due Miniflare `EADDRNOTAVAIL` port exhaustion in broad concurrent D1 tests. This was not reproduced in focused changed-path test runs.

## Follow-up: Full Coverage Rerun (Issue #577)

`@ubm-hyogo/api` full `test:coverage` の EADDRNOTAVAIL port exhaustion は Issue #577 で triage 完了:

- baseline rerun 3 回で EADDRNOTAVAIL が単調増加（23 → 38 → 51 件）し、TIME_WAIT 蓄積が支配要因と推定。
- 軸 B（`--maxWorkers=1 --minWorkers=1`）で 133/133 PASS / 0 EADDRNOTAVAIL を確認。
- patch 適用先: `apps/api/package.json#scripts.test:coverage` に `--maxWorkers=1 --minWorkers=1` を追加（最小差分。`vitest.config.ts` 不変）。
- 30day-contract 適用なし（恒久対応として patch 採用）。

参照: `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/main.md` と `evidence/triage-summary.md`。
