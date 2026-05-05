# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 02 (parallel) |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |
| 種別 | implementation, NON_VISUAL |

## 目的

`tag_assignment_queue` の repository / workflow / migration を runbook + 擬似コード化する。idempotency key・retry/DLQ・unidirectional state guard を実装し、02a `memberTags.ts` の read-only を維持する（不変条件 #13）。D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。

## 実行タスク

1. 作成順とファイル配置
2. queue schema (migration) 確定
3. repository 関数擬似コード（CRUD / state transition / idempotency / retry / DLQ）
4. workflow 擬似コード（enqueue / retry tick / dlq sweep）
5. migration 反映手順
6. 02a memberTags.ts read-only 維持の確認
7. 上流 02b queue/member_tags repository との衝突回避メモ
8. sanity check

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 schema |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | queue 管理 admin |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | state alias |
| 必須 | outputs/phase-04/test-strategy.md | assertion |
| 推奨 | apps/api/migrations/ | 既存 migration 連番 |
| 推奨 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/phase-05.md | 上流 resolve 規約 |

## 状態 alias 統一

| 仕様語 | DB 実装語 | 説明 |
| --- | --- | --- |
| candidate | `queued` | 投入済み未処理 |
| confirmed | `resolved` | 07a resolve で確定 |
| rejected | `rejected` | 却下 |
| (DLQ) | `dlq` | retry max 超過の poison message |

## 実行手順

### ステップ 1: ファイル作成順

1. `apps/api/migrations/NNNN_tag_assignment_queue.sql`（新規 / 既存 schema 拡張）
2. `apps/api/src/repositories/tagAssignmentQueue.ts`（CRUD + state transition）
3. `apps/api/src/workflows/tagQueueRetry.ts`（retry tick / DLQ sweep）
4. `apps/api/src/workflows/tagQueueEnqueue.ts`（idempotent enqueue facade）
5. `apps/api/src/repositories/__tests__/tagAssignmentQueue.test.ts`（unit）
6. `apps/api/src/repositories/__tests__/memberTags.readonly.test-d.ts`（type-level）

### ステップ 2: queue schema (migration)

```sql
-- apps/api/migrations/NNNN_tag_assignment_queue.sql
CREATE TABLE IF NOT EXISTS tag_assignment_queue (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  member_id TEXT NOT NULL,
  response_id TEXT,
  payload TEXT NOT NULL,                       -- JSON: { tagCodes, source, ... }
  status TEXT NOT NULL CHECK (status IN ('queued','resolved','rejected','dlq')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_visible_at TEXT,                        -- ISO8601, retry backoff 用
  dlq_at TEXT,                                 -- DLQ 移送時刻
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE INDEX idx_taq_status ON tag_assignment_queue(status);
CREATE INDEX idx_taq_member ON tag_assignment_queue(member_id);
CREATE INDEX idx_taq_visible ON tag_assignment_queue(status, next_visible_at);
```

### ステップ 3: repository 擬似コード

```ts
// apps/api/src/repositories/tagAssignmentQueue.ts
export interface TagQueueRow {
  readonly id: string
  readonly idempotencyKey: string
  readonly memberId: string
  readonly status: 'queued' | 'resolved' | 'rejected' | 'dlq'
  readonly retryCount: number
  readonly lastError: string | null
  readonly nextVisibleAt: string | null
  readonly dlqAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export const tagQueueRepo = {
  // --- READ ---
  async findById(db: D1Database, id: string): Promise<TagQueueRow | null> { /* SELECT */ },
  async findByIdempotencyKey(db: D1Database, key: string): Promise<TagQueueRow | null> { /* SELECT */ },
  async listPending(db: D1Database, now: string, limit = 50): Promise<ReadonlyArray<TagQueueRow>> {
    // WHERE status='queued' AND (next_visible_at IS NULL OR next_visible_at <= now)
  },
  async listDlq(db: D1Database, limit = 50): Promise<ReadonlyArray<TagQueueRow>> { /* status='dlq' */ },

  // --- CREATE (idempotent) ---
  async createIdempotent(db: D1Database, input: CreateInput): Promise<TagQueueRow> {
    // 1. INSERT ... ON CONFLICT(idempotency_key) DO NOTHING
    // 2. SELECT by idempotency_key して既存 or 新規行を返す
  },

  // --- STATE TRANSITION (unidirectional) ---
  async markResolved(db: D1Database, id: string, now: string): Promise<{ changed: boolean }> {
    // UPDATE ... SET status='resolved', resolved_at=?, updated_at=? WHERE id=? AND status='queued'
    // changes=0 を changed:false で返す（race lost / 既に終端）
  },
  async markRejected(db: D1Database, id: string, now: string): Promise<{ changed: boolean }> {
    // UPDATE ... SET status='rejected' WHERE id=? AND status='queued'
  },

  // --- RETRY / DLQ ---
  async incrementRetry(db: D1Database, id: string, error: string, now: string, maxRetry: number): Promise<{ moved: 'retry' | 'dlq' }> {
    // 1. retry_count = retry_count + 1
    // 2. retry_count > maxRetry → status='dlq', dlq_at=now
    //    else → next_visible_at = now + base * 2^retry_count
    // guarded: WHERE id=? AND status='queued'
  },
}
```

### ステップ 4: workflow 擬似コード

```ts
// apps/api/src/workflows/tagQueueEnqueue.ts
export async function enqueueTagAssignment(env: Env, input: EnqueueInput) {
  const idempotencyKey = input.idempotencyKey ?? deriveKey(input)  // memberId+responseId+source
  return tagQueueRepo.createIdempotent(env.DB, { ...input, idempotencyKey })
}

// apps/api/src/workflows/tagQueueRetry.ts
const MAX_RETRY = 3
const BASE_BACKOFF_SEC = 30

export async function tickRetry(env: Env, now: string) {
  const due = await tagQueueRepo.listPending(env.DB, now)
  for (const row of due) {
    try {
      // 実際の resolve 処理は 07a workflow に委譲（本タスクでは呼び出し境界のみ）
      await externalResolveHandle(env, row)
    } catch (e) {
      await tagQueueRepo.incrementRetry(env.DB, row.id, String(e), now, MAX_RETRY)
    }
  }
}
```

### ステップ 5: 02a memberTags.ts read-only 維持

```ts
// apps/api/src/repositories/memberTags.ts （02a 既存・本タスクで触らない）
export const memberTagsRepo = {
  findByMemberId(db: D1Database, memberId: string): Promise<ReadonlyArray<MemberTag>> { /* ... */ },
  countByMemberId(db: D1Database, memberId: string): Promise<number> { /* ... */ },
  // INSERT / UPDATE / DELETE は **export しない**
} as const
```

→ type-level test で `'insert' extends keyof typeof memberTagsRepo` が `false` を assert する。

### ステップ 6: migration 反映手順

```bash
# local (miniflare)
mise exec -- pnpm -F apps/api d1:migrate:local

# staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-stg --env staging

# production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

### ステップ 7: 上流 02b との衝突回避メモ

| 衝突点 | 02a (本タスク) | 02b | 回避策 |
| --- | --- | --- | --- |
| `memberTags.ts` 編集 | read-only 維持・触らない | write API を別 repository へ切り出し | 02b は `memberTagsWrite.ts` 等の別 file に新設し、02a は import のみで衝突回避 |
| `tag_assignment_queue` migration | 本タスクが正本作成 | 02b 側は import のみ | migration 連番を本タスクで採番 |
| repository 命名 | `tagQueueRepo` | `memberTagsRepo`(read) / writer は別 | 名前空間を分離 |

### ステップ 8: sanity check

```bash
mise exec -- pnpm -F apps/api typecheck
mise exec -- pnpm -F apps/api lint
mise exec -- pnpm -F apps/api test repositories/tagAssignmentQueue
mise exec -- pnpm -F apps/api test:types  # type-level (tsd / vitest typecheck)
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 各 throw / changes=0 / DLQ 移送を異常系へ |
| Phase 7 | AC trace |
| Phase 8 | 全 layer 実行 |

## 多角的チェック観点

| 不変条件 | runbook 担保 | 確認 |
| --- | --- | --- |
| #5 | repository / workflow が apps/api 内、apps/web は import 不可 | code review + boundary lint |
| #13 | `member_tags` への INSERT を本 repository は持たない | grep + type-level |
| idempotency | UNIQUE(idempotency_key) + ON CONFLICT DO NOTHING | unit + integration |
| retry/DLQ | guarded UPDATE WHERE status='queued' で race 安全 | integration |
| state | unidirectional WHERE 句 | unit |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | migration SQL | 5 | pending | UNIQUE / CHECK |
| 2 | repository 擬似コード | 5 | pending | CRUD/state/retry |
| 3 | workflow 擬似コード | 5 | pending | enqueue/retry tick |
| 4 | memberTags read-only 維持 | 5 | pending | 触らない |
| 5 | migration 反映 | 5 | pending | scripts/cf.sh |
| 6 | 02b 衝突回避 | 5 | pending | 命名/採番 |
| 7 | sanity check | 5 | pending | 4 コマンド |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | サマリー |
| ドキュメント | outputs/phase-05/implementation-runbook.md | 全擬似コード |
| メタ | artifacts.json | Phase 5 を completed |

## 完了条件

- [ ] 6 ファイルの作成順
- [ ] migration / repository / workflow の擬似コード完成
- [ ] migration 反映手順（local / staging / production）
- [ ] 不変条件 #5, #13 担保
- [ ] 02b との衝突回避メモ

## タスク100%実行確認

- 全擬似コードが対応 path
- artifacts.json で phase 5 を completed

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ: 各 throw / changes=0 を異常系へ
- ブロック条件: 擬似コード未完なら次へ進めない
