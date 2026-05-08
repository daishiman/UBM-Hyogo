# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## 追加・更新テスト

| テスト | ケース |
| --- | --- |
| `apps/api/src/middleware/repository-providers.test.ts` | `writeTagNoteProviderMiddleware` が 6 provider を `c.var` に bind する |
| `apps/api/src/routes/me/index.test.ts` | self visibility/delete request が mock `adminNotesProvider` / `auditLogProvider` を使う |
| `apps/api/src/routes/admin/requests.test.ts` | list/resolve/reject/outbox enqueue が provider mock で差し替え可能 |
| `apps/api/src/routes/admin/member-notes.test.ts` | note CRUD と audit append が provider mock で差し替え可能 |
| `apps/api/src/routes/admin/audit.test.ts` | audit browsing が provider mock で差し替え可能 |
| `apps/api/src/workflows/tagQueueResolve.test.ts` | unknown tag、confirmed、rejected、race lost、idempotent が provider 経由で PASS |
| `apps/api/src/workflows/tagQueueRetryTick.test.ts` | tagQueue provider 対象関数の retry/DLQ 既存挙動維持 |
| `apps/api/src/workflows/notificationDispatchTick.test.ts` | outbox provider 対象関数の claim/dispatch 既存挙動維持 |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | workflow 専用 helper 以外の write export が増えていない |

## grep gates

```bash
rg -n "repository/(adminNotes|auditLog|notificationOutbox|tagDefinitions|tagQueue|memberTags)" apps/api/src/routes apps/api/src/workflows apps/api/src/use-cases
rg -n "\\?\\? \\[\\]|\\|\\| \\[\\]|not bound to context" apps/api/src/repository apps/api/src/routes apps/api/src/workflows
```

期待:

- 対象 repository の direct import は provider factory 実装・repository tests 以外に残さない。
- provider 未注入時の throw message は存在し、空配列 fallback は増えない。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- repository-providers
mise exec -- pnpm --filter @ubm-hyogo/api test -- routes/me routes/admin/requests workflows/tagQueueResolve
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
bash scripts/coverage-guard.sh --package @ubm-hyogo/api
```

## DoD

- provider bind、mock 差し替え、既存 route/workflow 回帰、type-level read-only がすべて PASS。

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
