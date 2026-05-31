# Phase 5: 実装（TDD Green）

## 0. このフェーズの目的

Phase 4 で固定した Red テストを Green にする。
`dismissIdentityConflict()` を merge と対称化し、`identity_conflict_dismissals` upsert と `audit_log` INSERT を **D1 batch でアトミック**に実行する。route 側は actor_email を追加配線する。

> 実装方針の正本は共通設計 BRIEF。merge（`identity-merge.ts:119-167`）の D1 batch パターンを dismiss に踏襲する。

---

## 1. 新規作成 / 修正ファイル一覧（必須）

| 区分 | パス | 変更内容 |
|------|------|----------|
| 修正 | `apps/api/src/repository/identity-conflict.ts` | `dismissIdentityConflict()` を新シグネチャ + D1 batch 化。`DismissAtomicBatchUnavailable` クラス追加。`AdminId` / `AdminEmail` / `AuditAction` brand 型 import 追加 |
| 修正 | `apps/api/src/routes/admin/identity-conflicts.ts` | dismiss endpoint の呼び出しに `user.email ?? null`（actorAdminEmail）引数を追加 |
| 新規 | なし | テストは Phase 4 / Phase 6 で扱う。新規 migration なし（`audit_log` は既存テーブル） |

> **新規 migration が不要な理由**: `audit_log` は merge が既に書き込んでいる既存テーブルで、スキーマ変更はない。dismiss は同一カラム構成（audit_id / actor_id / actor_email / action / target_type / target_id / before_json / after_json / created_at）へ INSERT するだけ。

---

## 2. `dismissIdentityConflict()` の修正後コード構造

### 2-1. シグネチャ変更

```ts
// before（現行・5 引数）
export async function dismissIdentityConflict(
  c: DbCtx, source: string, target: string, actorAdminId: string, reason: string,
): Promise<{ dismissedAt: string }>

// after（新・6 引数: actorAdminEmail を追加）
export async function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  actorAdminEmail: string | null,
  reason: string,
): Promise<{ dismissedAt: string }>
```

> 引数順は merge の `args` オブジェクトと対応させる意図で `actorAdminId` の直後に `actorAdminEmail` を置く。reason は末尾。

### 2-2. import 追加（ファイル冒頭）

```ts
import type { AdminId, AdminEmail, AuditAction } from "./_shared/brand";
// redactIdentityReason は現行で既に import 済み（identity-merge から）
```

### 2-3. 関数本体（疑似コード・batch 構成 / 列バインド順）

```ts
export class DismissAtomicBatchUnavailable extends Error {
  readonly name = "DismissAtomicBatchUnavailable";
  constructor() {
    super("D1 batch is required for atomic identity dismiss");
  }
}

export async function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  actorAdminEmail: string | null,
  reason: string,
): Promise<{ dismissedAt: string }> {
  const db = c.db;
  const dismissalId = crypto.randomUUID();
  const auditId = crypto.randomUUID();
  const dismissedAt = new Date().toISOString();
  const reasonRedacted = redactIdentityReason(reason);

  // audit_log 用 JSON。before = source/target 識別情報、after = dismiss metadata
  const auditBefore = JSON.stringify({
    sourceMemberId: source,
    targetMemberId: target,
  });
  const auditAfter = JSON.stringify({
    dismissalId,
    dismissedAt,
  });

  // stmt1: dismissal upsert（既存 ON CONFLICT ロジックを維持）
  const stmtDismissal = db
    .prepare(
      `INSERT INTO identity_conflict_dismissals
         (dismissal_id, source_member_id, candidate_target_member_id,
          dismissed_by, reason, dismissed_at)
       VALUES (?1,?2,?3,?4,?5,?6)
       ON CONFLICT(source_member_id, candidate_target_member_id)
         DO UPDATE SET dismissal_id = excluded.dismissal_id,
                       dismissed_by = excluded.dismissed_by,
                       reason = excluded.reason,
                       dismissed_at = excluded.dismissed_at`,
    )
    .bind(dismissalId, source, target, actorAdminId, reasonRedacted, dismissedAt);

  // stmt2: audit_log INSERT（merge と同じ列順 / 同じ target_type='member'）
  const stmtAudit = db
    .prepare(
      `INSERT INTO audit_log
         (audit_id, actor_id, actor_email, action, target_type, target_id,
          before_json, after_json, created_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`,
    )
    .bind(
      auditId,                                    // ?1 audit_id
      actorAdminId as AdminId,                     // ?2 actor_id
      (actorAdminEmail ?? null) as AdminEmail | null, // ?3 actor_email
      "identity.dismiss" as AuditAction,           // ?4 action
      "member",                                    // ?5 target_type
      target,                                      // ?6 target_id（merge と同様 target を採用）
      auditBefore,                                 // ?7 before_json
      auditAfter,                                  // ?8 after_json
      dismissedAt,                                 // ?9 created_at
    );

  if (typeof db.batch !== "function") {
    throw new DismissAtomicBatchUnavailable();
  }
  await db.batch([stmtDismissal, stmtAudit]);

  return { dismissedAt };
}
```

### 2-4. 設計上の決定（merge との対称性）

| 観点 | merge | dismiss（本実装） | 根拠 |
|------|-------|-------------------|------|
| アトミック化 | `db.batch([alias, merge_audit, audit_log])` | `db.batch([dismissal, audit_log])` | 部分書き込み防止 |
| batch 非対応時 | `MergeAtomicBatchUnavailable` throw | `DismissAtomicBatchUnavailable` throw | 同一パターン |
| member 不在時 | `MergeIdentityNotFound` → 404 | `DismissIdentityNotFound` → 404 | 同一 HTTP surface |
| action 値 | `identity.merge` | `identity.dismiss` | 共通設計 BRIEF |
| target_id | targetMemberId | target | dismiss も「target に対する判断」として記録 |
| before_json | `{sourceMemberId, targetMemberId, syncJobId}` | `{sourceMemberId, targetMemberId}` | field 名を merge と統一 |
| after_json | `{aliasId, auditId, mergedAt}` | `{dismissalId, dismissedAt}` | dismiss metadata のみを記録し、reason は audit_log に含めない |
| reason redact | `redactIdentityReason` | `redactIdentityReason`（同関数を再利用） | PII 流出防止 |

### 2-5. merge との差異（重要）

- **merge は UNIQUE 制約違反を 409 へ変換**するが、**dismiss は ON CONFLICT で upsert** するため UNIQUE 違反は起きない。よって dismiss 側に `try/catch` での 409 変換は不要。
- dismiss は upsert（dismissal 1 行）だが、**audit_log は操作ごとに新 audit_id で append**（TC-D04）。再 dismiss 時は `dismissal_id` も `excluded.dismissal_id` に更新し、最新 audit payload の `dismissalId` と永続行を一致させる。merge と異なり「冪等な状態」ではなく「監査イベントの追記」として扱う。
- source / target member が `member_identities` に存在しない場合は `DismissIdentityNotFound` を throw し、route で 404 `MEMBER_NOT_FOUND` へ変換する。存在しない target_id に対する audit を残さない。

---

## 3. route 修正の差分方針

`apps/api/src/routes/admin/identity-conflicts.ts` の dismiss endpoint（91-110 行）。

```ts
// before
const out = await dismissIdentityConflict(
  ctx(c.env),
  ids.source,
  ids.target,
  claims.sub ?? user.memberId ?? "unknown-admin",
  parsed.data.reason,
);

// after（actorAdminEmail = user.email ?? null を追加。merge endpoint と同一の actor 解決）
const out = await dismissIdentityConflict(
  ctx(c.env),
  ids.source,
  ids.target,
  claims.sub ?? user.memberId ?? "unknown-admin",
  user.email ?? null,
  parsed.data.reason,
);
```

- `claims` / `user` は既に dismiss endpoint 内で `c.get("authClaims")` / `c.get("authUser")` 経由で取得済み（merge endpoint と同形）。追加取得は不要。
- actor 解決ロジック（`claims.sub ?? user.memberId ?? "unknown-admin"`）は merge endpoint と完全一致させ、ドリフトを防ぐ。

---

## 4. `DismissAtomicBatchUnavailable` クラスの配置

- 配置先: `apps/api/src/repository/identity-conflict.ts` 内（`dismissIdentityConflict` の直前に export class として定義）。
- merge の `MergeAtomicBatchUnavailable`（`identity-merge.ts` 内）と対称。
- route 側でこの例外をハンドルする必要はない（batch は本番 D1 では常に利用可能。in-memory / miniflare でも `batch` は提供される）。未対応環境のみ throw され、Hono のデフォルト error handler が 500 を返す。

---

## 5. エラーハンドリング・副作用の定義

| 状況 | 振る舞い |
|------|----------|
| 正常 | dismissal upsert + audit_log INSERT が batch で同時 commit。`{ dismissedAt }` を返す |
| batch 非対応環境 | `DismissAtomicBatchUnavailable` を throw（部分書き込みを起こさない。partial INSERT より fail-fast を優先） |
| 認可なし | route の `requireAdmin` ミドルウェアで 401。repository 関数に到達しないため副作用ゼロ（TC-D02） |
| 不正 conflictId | route の `parseConflictId` で 400。repository 未到達 |
| reason に PII | `redactIdentityReason` が `identity_conflict_dismissals.reason` を `[redacted]` 化し、`audit_log.after_json` には reason を含めない（TC-D03） |
| 二重 dismiss | dismissal は ON CONFLICT で 1 行更新、audit_log は 2 行 append（TC-D04）。エラーにしない |

---

## 6. GREEN 実行手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared build
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run apps/api/src/routes/admin/identity-conflicts.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run apps/api/src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm typecheck
```

期待: Phase 4 の TC-D01〜D04 / TC-A01〜A02 がすべて Green。typecheck が通る。

---

## 7. 完了条件

- [x] `dismissIdentityConflict()` を 6 引数 + D1 batch へ修正した
- [x] `DismissAtomicBatchUnavailable` を `identity-conflict.ts` に追加した
- [x] `DismissIdentityNotFound` を追加し、存在しない source/target で audit_log を書かない 404 surface にした
- [x] audit_log INSERT が merge と同じ列順 / `action='identity.dismiss'` / `target_type='member'` で記録される
- [x] before_json / after_json が共通設計 BRIEF の構造どおり
- [x] route の dismiss 呼び出しに `user.email ?? null` を追加した
- [x] Phase 4 の全 TC が Green になった（D1 focused spec 3 files / 28 tests PASS）
- [x] `pnpm --filter @ubm-hyogo/api typecheck` が通った
