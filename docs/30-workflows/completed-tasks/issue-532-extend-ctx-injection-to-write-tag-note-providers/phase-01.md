# Phase 1: 要件定義

[実装区分: 実装仕様書]

判定根拠: provider 抽象、middleware、route/workflow call site、テストの変更を伴う。Issue #532 は closed だが、実装対象は API 内部コードであり docs-only ではない。

## 要件

- Issue #371 の `AttendanceProvider` ctx 注入パターンを正本として、write/tag/note 系 repository の provider 化を実装する。
- 評価だけで close しない。今回サイクル内で、ADR 判定、移行対象の確定、必要 provider の実装、call site 移行、テストまで完了する。
- 機械的な全 repository provider 化は禁止する。Phase 3 の ADR で mock 頻度、call site 数、silent fallback risk、transaction/write boundary を根拠に移行セットを確定する。
- Issue #532 は CLOSED のまま扱い、PR 文脈は `Refs #532` のみとする。
- DI container は導入しない。Hono `c.var` と repository factory で閉じる。
- D1 schema、public/member/admin API response shape、Auth.js/admin gate は変更しない。

## 入力

| 種別 | パス |
| --- | --- |
| Issue | `https://github.com/daishiman/UBM-Hyogo/issues/532` |
| 親 ADR | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-03/adr-di-strategy.md` |
| 元未タスク | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/unassigned-task/extend-ctx-injection-to-write-tag-note-providers.md` |
| 現行 middleware | `apps/api/src/middleware/repository-providers.ts` |
| 現行 ctx 型 | `apps/api/src/repository/_shared/provider-context.ts` |

## 変更対象ファイル

新規ファイルは作らず、既存 repository に provider interface/factory を追加する。例外としてテスト補助が必要な場合のみ `apps/api/src/middleware/repository-providers.test.ts` に fixture helper を追加する。

| パス | 種別 |
| --- | --- |
| `apps/api/src/repository/_shared/provider-context.ts` | 編集 |
| `apps/api/src/middleware/repository-providers.ts` | 編集 |
| `apps/api/src/repository/{adminNotes,auditLog,notificationOutbox,tagDefinitions,tagQueue,memberTags}.ts` | 編集 |
| `apps/api/src/routes/me/{index.ts,services.ts}` | 編集 |
| `apps/api/src/routes/admin/{requests.ts,member-notes.ts,audit.ts,tags-queue.ts}` | 編集 |
| `apps/api/src/workflows/{tagQueueResolve.ts,tagQueueRetryTick.ts,notificationDispatchTick.ts}` | 編集 |
| `apps/api/src/**/__tests__/*` / `*.test.ts` | 編集 |

## 入出力と副作用

- 入力: Hono `c.env.DB` または上流 `c.var.ctx`、既存 request payload。
- 出力: 既存 API response と workflow return 型を維持。
- 副作用: D1 read/write は Phase 3 で移行対象とした provider factory 内で作った repository 経由に統一。新規 table、migration、外部 API 呼び出しはなし。
- エラー: provider 未注入時は silent fallback せず `Error("<provider> not bound to context")` を throw する。

## DoD

- provider ctx 型、middleware、対象 call site、focused tests がすべて整合している。
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `lint` / focused tests / `typecheck` が PASS。
- grep gate で route/workflow から対象 repository の直接 import が残っていない。ただし repository 自身と tests の明示 mock は除外。

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
