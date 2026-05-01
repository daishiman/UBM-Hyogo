# UT-07A-02: search-tags resolve API contract follow-up

## メタ情報

```yaml
issue_number: 297
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07A-02 |
| タスク名 | search-tags resolve API contract follow-up |
| 分類 | 改善 |
| 対象機能 | admin tag queue resolve API contract / apps web admin client |
| 優先度 | 高 |
| 見積もり規模 | 中規模 |
| ステータス | consumed / completed_without_pr |
| 発見元 | 07a Phase 12 unassigned-task-detection |
| 発見日 | 2026-04-30 |

## 概要

`docs/00-getting-started-manual/specs/12-search-tags.md` に 07a の resolve API 契約を反映済み。後続で admin UI client / API contract test 側にも同じ discriminated union 契約を広げる。

## 消費状態

- consumed_by: `docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup/`
- consumed_at: 2026-05-01
- result: Phase 1-12 completed / Phase 13 pending_user_approval
- note: Issue #297 の実装仕様は上記 workflow に昇格済み。未タスク選定では再選択しない。

## 背景

07a の正本は `{ action: "confirmed", tagCodes } | { action: "rejected", reason }`。06c 由来の client docs には空 body 時代の記述が残りやすい。

## 受入条件

- `resolveTagQueue(queueId, body)` の型が apps/web 側の実装・test に反映されている
- 08a contract test で confirmed / rejected / validation error / idempotent を検証する
- 正本仕様と implementation-guide の body shape が一致している

## 関連

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md`
- `docs/00-getting-started-manual/specs/12-search-tags.md`

## 苦戦箇所【記入必須】

- 対象: `apps/web/src/lib/admin/api.ts`
- 症状: 06c 由来の admin client が空 body resolve 前提を持ちやすく、07a の `{ action: "confirmed", tagCodes } | { action: "rejected", reason }` 契約と正本仕様の同期範囲を見落としやすかった。
- 参照: `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| apps/api と apps/web の request body 型がドリフトする | shared zod schema または contract test で confirmed / rejected の body shape を固定する |
| idempotent / validation error の扱いが UI toast と不一致になる | 08a contract test に 409 / 422 / already resolved の期待値を含める |

## 検証方法

### 契約検証

```bash
mise exec -- pnpm --filter @repo/api test -- tags-queue
mise exec -- pnpm --filter @repo/web typecheck
```

期待: API route tests と web typecheck が PASS し、resolve body の型不一致がない。

### 仕様照合

```bash
rg "resolveTagQueue|admin/tags/queue/.*/resolve|action: \"confirmed\"|action: \"rejected\"" apps docs .claude/skills/aiworkflow-requirements/references
```

期待: 正本仕様、implementation guide、client 実装、contract test の body shape が一致。

## スコープ

### 含む

- apps/web admin client の resolve body 型反映
- 08a contract test への confirmed / rejected / validation / idempotent ケース追加
- 正本仕様と implementation guide の契約照合

### 含まない

- tag queue resolve workflow 本体の再設計
- staging 並行 POST smoke（UT-07A-03 で対応）
