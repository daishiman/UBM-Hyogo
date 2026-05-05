# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 4 (followup, serial) |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |

## 目的

Phase 2 / 3 で確定した DDL・repository helper・partial index と、Phase 4 のテスト計画を合流させ、migration → repository → route の順序で擬似コードと適用 runbook を確定する。`bash scripts/cf.sh d1 migrations apply` を経由する 1Password 注入経路を明示し、ローカル smoke / staging / production の 3 段階で適用できる手順に揃える。

## 実行タスク

1. 実装順序の確定（migration → repository helper → route guard 改修 → spec 追記）
2. migration 0007 の最終 SQL（DDL + backfill + partial index）の擬似コード化
3. repository helper の擬似コード（`hasPendingRequest` 改修 / `markResolved` / `markRejected`）
4. `routes/me/services.ts` の `memberSelfRequestQueue` 経路の挙動確認（コード変更不要、AC-7 の透過的成立を runbook 化）
5. local smoke runbook（`bash scripts/cf.sh d1 migrations apply ... --local`）
6. staging / production 適用 runbook
7. placeholder（適用前 / 適用後の D1 状態）
8. sanity check（typecheck / lint / vitest / `EXPLAIN QUERY PLAN`）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | DDL 草案・helper interface |
| 必須 | phase-04.md | sanity check に組込む test 計画 |
| 必須 | apps/api/migrations/0006_admin_member_notes_type.sql | 直前 migration との接続 |
| 必須 | apps/api/src/repository/adminNotes.ts | 改修対象 |
| 必須 | apps/api/src/routes/me/services.ts | `memberSelfRequestQueue` 呼出側 |
| 必須 | apps/api/src/repository/_shared/db.ts | DbCtx |
| 必須 | scripts/cf.sh | wrangler ラッパー（必須経路） |
| 必須 | CLAUDE.md | Cloudflare CLI 実行ルール |
| 参考 | docs/30-workflows/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/phase-05.md | runbook 体裁 |

## 実行手順

### ステップ 1: ファイル作成・改修順序

1. `apps/api/migrations/0007_admin_member_notes_request_status.sql` (新規)
2. `apps/api/src/repository/adminNotes.ts` (改修: 型 + helper 3 件)
3. `apps/api/src/repository/__tests__/adminNotes.test.ts` (追記: state transition unit test)
4. `apps/api/src/routes/me/index.test.ts` (追記: 再申請 202 ケース)
5. `docs/00-getting-started-manual/specs/07-edit-delete.md` (追記: queue 状態遷移節 + Mermaid)

> route 本体 (`routes/me/services.ts`) は `hasPendingRequest` 経由で透過的に挙動が変わるため、コード変更不要（AC-7 / AC-8 を route test で担保）。

### ステップ 2: migration 0007 擬似コード

```sql
-- apps/api/migrations/0007_admin_member_notes_request_status.sql
-- 04b-followup-001: admin_member_notes に処理状態メタを追加
-- 不変条件 #4: response_fields 不変
-- 不変条件 #5: D1 操作は apps/api 配下のみ
-- 不変条件 #11: member 本文（member_responses）は不変

ALTER TABLE admin_member_notes ADD COLUMN request_status TEXT;
ALTER TABLE admin_member_notes ADD COLUMN resolved_at INTEGER;
ALTER TABLE admin_member_notes ADD COLUMN resolved_by_admin_id TEXT;

-- backfill: 既存 request 行を pending 化（取りこぼし防止のため IS NULL ガード）
UPDATE admin_member_notes
   SET request_status = 'pending'
 WHERE note_type IN ('visibility_request', 'delete_request')
   AND request_status IS NULL;

-- partial index: hasPendingRequest のホットパス用
CREATE INDEX IF NOT EXISTS idx_admin_notes_pending_requests
  ON admin_member_notes (member_id, note_type)
  WHERE request_status = 'pending';
```

### ステップ 3: repository helper 擬似コード

```ts
// apps/api/src/repository/adminNotes.ts （差分のみ抜粋）
export type RequestStatus = "pending" | "resolved" | "rejected";

export interface AdminMemberNoteRow {
  noteId: string;
  memberId: MemberId;
  body: string;
  noteType: AdminMemberNoteType;
  requestStatus: RequestStatus | null;     // 新規
  resolvedAt: number | null;                // 新規 (unix epoch ms)
  resolvedByAdminId: string | null;         // 新規
  createdBy: AdminEmail;
  updatedBy: AdminEmail;
  createdAt: string;
  updatedAt: string;
}

/** AC-3: pending 行限定の存在判定。resolved/rejected は false。 */
export const hasPendingRequest = async (
  c: DbCtx,
  memberId: MemberId,
  noteType: Exclude<AdminMemberNoteType, "general">,
): Promise<boolean> => {
  const row = await c.db
    .prepare(
      `SELECT 1 AS hit FROM admin_member_notes
        WHERE member_id = ?1
          AND note_type = ?2
          AND request_status = 'pending'
        LIMIT 1`,
    )
    .bind(memberId, noteType)
    .first<{ hit: number }>();
  return row !== null;
};

/** AC-4 / AC-6: pending 行のみを resolved に遷移させる。 */
export const markResolved = async (
  c: DbCtx,
  noteId: string,
  adminId: string,
): Promise<string | null> => {
  const now = Date.now();
  const result = await c.db
    .prepare(
      `UPDATE admin_member_notes
          SET request_status = 'resolved',
              resolved_at = ?1,
              resolved_by_admin_id = ?2,
              updated_at = ?3,
              updated_by = ?2
        WHERE note_id = ?4
          AND request_status = 'pending'`,
    )
    .bind(now, adminId, new Date(now).toISOString(), noteId)
    .run();
  return result.meta.changes > 0 ? noteId : null;
};

/** AC-5 / AC-6: pending 行のみを rejected に遷移し、reason を body 末尾に追記。 */
export const markRejected = async (
  c: DbCtx,
  noteId: string,
  adminId: string,
  reason: string,
): Promise<string | null> => {
  const now = Date.now();
  const isoNow = new Date(now).toISOString();
  const appended = `\n\n[rejected ${isoNow}] ${reason}`;
  const result = await c.db
    .prepare(
      `UPDATE admin_member_notes
          SET request_status = 'rejected',
              resolved_at = ?1,
              resolved_by_admin_id = ?2,
              updated_at = ?3,
              updated_by = ?2,
              body = body || ?4
        WHERE note_id = ?5
          AND request_status = 'pending'`,
    )
    .bind(now, adminId, isoNow, appended, noteId)
    .run();
  return result.meta.changes > 0 ? noteId : null;
};
```

### ステップ 4: route guard 改修（コード変更なし、確認のみ）

`routes/me/services.ts` の `memberSelfRequestQueue` は内部で `hasPendingRequest` を呼ぶ。Phase 5 ではコードに手を入れず、`hasPendingRequest` のクエリが pending 限定になったことで以下が**透過的に成立する**ことを `routes/me/index.test.ts` で検証する。

- resolved 行のみ → `hasPendingRequest=false` → INSERT に到達 → 202（AC-7）
- pending 行存在 → `hasPendingRequest=true` → 409 DUPLICATE_PENDING_REQUEST（AC-8）

### ステップ 5: ローカル smoke runbook

```bash
# 1. lint / typecheck（実装側）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 2. local D1 へ migration 適用（wrangler 直接実行禁止）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --local

# 3. repository unit test
mise exec -- pnpm -F @ubm-hyogo/api test repository/__tests__/adminNotes

# 4. route contract test
mise exec -- pnpm -F @ubm-hyogo/api test routes/me/index

# 5. partial index hit を EXPLAIN QUERY PLAN で確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --local --command \
  "EXPLAIN QUERY PLAN SELECT 1 FROM admin_member_notes WHERE member_id='mem_smoke' AND note_type='visibility_request' AND request_status='pending' LIMIT 1"
# 期待: USING INDEX idx_admin_notes_pending_requests を含む

# 6. backfill 取りこぼし 0 件確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --local --command \
  "SELECT COUNT(*) AS leftover FROM admin_member_notes WHERE note_type IN ('visibility_request','delete_request') AND request_status IS NULL"
# 期待: leftover = 0
```

### ステップ 6: staging / production 適用 runbook

```bash
# staging
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# production（user 承認後のみ）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-pre-0007.sql
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

> production 適用前に必ず `d1 export` で backup を取得し、Phase 6 の rollback 手順に備える。

### ステップ 7: placeholder（適用前 / 適用後 D1 状態）

**適用前（migration 0006 まで適用済みの想定）:**

```text
admin_member_notes 列:
  note_id, member_id, body, note_type, created_by, updated_by, created_at, updated_at
index:
  idx_admin_notes_member_type (member_id, note_type, created_at)
```

**適用後（migration 0007 適用済み）:**

```text
admin_member_notes 列:
  note_id, member_id, body, note_type,
  request_status, resolved_at, resolved_by_admin_id,    -- 追加
  created_by, updated_by, created_at, updated_at
index:
  idx_admin_notes_member_type (member_id, note_type, created_at)
  idx_admin_notes_pending_requests (member_id, note_type) WHERE request_status='pending'  -- 追加

行状態:
  note_type='general'                → request_status / resolved_at / resolved_by_admin_id 全て NULL
  note_type IN ('visibility_request','delete_request') → request_status='pending' に backfill
```

### ステップ 8: sanity check

```bash
# 全件 green を確認
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F @ubm-hyogo/api test
```

確認項目:

- [ ] typecheck で `RequestStatus` 型が export 可能
- [ ] lint で `unused-vars` / `no-explicit-any` の警告なし
- [ ] vitest 全件 green（Phase 4 で定義した 14 件以上）
- [ ] `EXPLAIN QUERY PLAN` 出力に `idx_admin_notes_pending_requests` が含まれる
- [ ] backfill 検証 SQL の leftover = 0

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 14 件のテスト計画を assertion 文言として実装 |
| Phase 6 | `WHERE request_status='pending'` の構造的拒否を異常系 case の根拠に |
| Phase 7 | 擬似コードのファイル / 関数を AC マトリクスの実装列にトレース |
| Phase 11 | manual smoke の curl / wrangler 出力 placeholder の前提として参照 |

## 多角的チェック観点

| 不変条件 | runbook 担保 | 確認 |
| --- | --- | --- |
| #4 | DDL 対象 table が `admin_member_notes` のみ | grep `ALTER TABLE` 行 |
| #5 | migration / repository / route が全て `apps/api` 配下 | ファイル path |
| #11 | helper の SQL 文字列 grep で `member_responses` / `response_fields` への UPDATE / INSERT が無いこと | grep |
| 認可 | helper は `adminId` を引数で受ける契約 | 型定義で担保 |
| 無料枠 | partial index は pending 行のみ | EXPLAIN で hit 確認 |
| 機密 | `bash scripts/cf.sh` 経由で `wrangler` 直接実行禁止 | runbook の全 D1 操作で担保 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装順序 | 5 | pending | 5 ファイル |
| 2 | migration 擬似コード | 5 | pending | DDL + backfill + index |
| 3 | repository 擬似コード | 5 | pending | helper 3 件 |
| 4 | route 透過的成立確認 | 5 | pending | コード変更なし |
| 5 | local smoke runbook | 5 | pending | 6 ステップ |
| 6 | staging/prod runbook | 5 | pending | backup 含 |
| 7 | placeholder | 5 | pending | 適用前後 |
| 8 | sanity check | 5 | pending | EXPLAIN + leftover |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook サマリ |
| ドキュメント | outputs/phase-05/migration-runbook.md | DDL + smoke + staging/prod 適用手順 |
| メタ | artifacts.json | Phase 5 を completed |

## 完了条件

- [ ] migration 0007 の SQL が DDL + backfill + partial index の 3 ブロックで完成
- [ ] repository helper 3 件の擬似コードに `WHERE request_status='pending'` 構造的ガードを含む
- [ ] route 側はコード変更なしで AC-7 / AC-8 が透過的に成立することを記述
- [ ] local smoke runbook が `bash scripts/cf.sh` 経由で完結
- [ ] staging / production 適用 runbook が backup 取得を含む
- [ ] placeholder で適用前 / 適用後の列・index・行状態が表示されている
- [ ] sanity check で `EXPLAIN QUERY PLAN` が partial index hit を確認

## タスク100%実行確認

- [ ] 全実行タスク 8 件 completed
- [ ] artifacts.json で phase 5 を completed
- [ ] outputs/phase-05/migration-runbook.md が Phase 6 / 11 の入力として参照可能

## 次 Phase への引き渡し

- 次: 6 (異常系検証)
- 引き継ぎ: helper の throw / null 戻り値 / migration 失敗パターンを異常系 case の起点に
- ブロック条件: migration SQL がテーブル再作成を含む / helper の WHERE 句に pending ガードがない / `bash scripts/cf.sh` 以外の wrangler 直接実行が記載されている場合は Phase 5 へ差し戻し
