# Phase 12 実装ガイド — dismiss 操作の監査ログ対称化（Issue #987）

本ガイドは 2 パート構成。Part 1 は専門知識がなくても分かる説明、Part 2 は実装者向けの技術詳細。

---

## Part 1: 中学生でも分かる説明

### なぜ必要か（先に理由）

「監査ログ（かんさログ）」とは、**誰が・いつ・何をしたかを記録しておくノート**のことです。たとえばクラスで誰かが掲示板の張り紙を貼り替えたとき、「5月29日 田中さんが貼り替えた」とノートに書いておけば、あとから「これ誰がやったの？」と聞かれてもすぐ分かりますよね。それが監査ログです。

このサイトには会員データがあり、ときどき「同じ人が 2 つの会員登録をしてしまった（=別アカウントになってしまった）」という問題が起きます。管理者はそれを見て、次の 2 つのどちらかを選びます。

- **merge（マージ＝統合）**: 「この 2 つは同じ人だ」とまとめる操作。
- **dismiss（ディスミス＝却下）**: 「この 2 つは別人だ。間違いではない」とマークして、もう警告を出さないようにする操作。

ここで問題がありました。**merge（統合）したときはノートに記録されていた**のに、**dismiss（別人マーク）したときはノートに何も書かれていなかった**のです。だから後から「誰がこの 2 人を『別人』と判断したの？」と確認しようとしても、記録が無くて追えませんでした。

### 何をするか

dismiss の操作も、merge と同じように**監査ログのノートに書き残すようにします**。これで管理画面の `/admin/audit`（監査ログを見る画面）から、「誰が・いつ・どの会員を『別人』と判断したか」を時系列で確認できるようになります。

たとえるなら、**「統合した記録だけノートに書いて、別人と判断した記録はノートに書いていなかった」という片手落ちの状態を直して、両方ともきちんとノートに書く**ようにする作業です。

### 用語ミニ辞典

- **audit_log（監査ログ）**: 操作の記録ノート。データベース上の 1 つの表。
- **merge / dismiss**: 上で説明した「統合」「別人マーク」の操作。
- **D1 batch（ディーワン バッチ）**: 複数の書き込みを「まとめて、全部成功か全部失敗か」にする仕組み。途中で片方だけ書かれて壊れるのを防ぐ。
- **actor（アクター）**: その操作をした人（=管理者）。

---

## Part 2: 技術者向け実装詳細

### 対象ファイル

| ファイル | 変更内容 |
| --- | --- |
| `apps/api/src/repository/identity-conflict.ts` | `dismissIdentityConflict()` を D1 `db.batch` 化し `audit_log` INSERT を追加。`actorAdminEmail: string \| null` 引数を追加。`DismissAtomicBatchUnavailable` Error を追加 |
| `apps/api/src/routes/admin/identity-conflicts.ts` | dismiss endpoint（`POST /identity-conflicts/:id/dismiss`）で `user.email ?? null` を repository へ配線 |

UI 変更なし（`/admin/audit` の既存 `AuditLogPanel` をそのまま活用）。新規 migration なし（`audit_log` は既存 `apps/api/migrations/0003_auth_support.sql`）。

### 既存実装の対比（grep 確認前提）

merge は `apps/api/src/repository/identity-merge.ts:119-167` で D1 `db.batch` を用い `identity_aliases` / `identity_merge_audit` / `audit_log` の 3 INSERT をアトミック実行している。`audit_log` への INSERT 列順は以下:

```sql
INSERT INTO audit_log
  (audit_id, actor_id, actor_email, action, target_type, target_id,
   before_json, after_json, created_at)
VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)
```

dismiss はこの列順・brand 付与パターン（`AdminId` / `AdminEmail | null` / `AuditAction`）をそのまま踏襲し対称化する。`AuditAction` brand は `apps/api/src/repository/_shared/brand.ts:27` の `RepoBrand<string, "AuditAction">`。

### 新シグネチャ

現状（`apps/api/src/repository/identity-conflict.ts:179`）:

```ts
export async function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  reason: string,
): Promise<{ dismissedAt: string }>;
```

変更後:

```ts
export async function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  actorAdminEmail: string | null,
  reason: string,
): Promise<{ dismissedAt: string }>;
```

> route の外形互換を優先し、レスポンスは既存どおり `{ dismissedAt }` に留める。`dismissalId` は `audit_log.after_json` にのみ残す。

### D1 batch 構造

```ts
const dismissalId = crypto.randomUUID();
const auditLogId = crypto.randomUUID();
const dismissedAt = new Date().toISOString();
const reasonRedacted = redactIdentityReason(reason);

const auditBefore = JSON.stringify({
  sourceMemberId: source,
  targetMemberId: target,
});
const auditAfter = JSON.stringify({
  dismissalId,
  dismissedAt,
});

const stmts = [
  c.db
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
    .bind(dismissalId, source, target, actorAdminId, reasonRedacted, dismissedAt),
  c.db
    .prepare(
      `INSERT INTO audit_log
         (audit_id, actor_id, actor_email, action, target_type, target_id,
          before_json, after_json, created_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`,
    )
    .bind(
      auditLogId,
      actorAdminId as AdminId,
      (actorAdminEmail ?? null) as AdminEmail | null,
      "identity.dismiss" as AuditAction,
      "member",
      target,
      auditBefore,
      auditAfter,
      dismissedAt,
    ),
];

if (typeof c.db.batch !== "function") {
  throw new DismissAtomicBatchUnavailable();
}
await c.db.batch(stmts);
return { dismissedAt };
```

### audit_log 列マッピング表

| 列 | 値 | 備考 |
| --- | --- | --- |
| `audit_id` | `crypto.randomUUID()` | dismissal_id とは別 UUID |
| `actor_id` | `actorAdminId as AdminId` | claims.sub または fallback |
| `actor_email` | `(actorAdminEmail ?? null) as AdminEmail \| null` | route から配線 |
| `action` | `"identity.dismiss" as AuditAction` | 新規 audit action（merge は `identity.merge`） |
| `target_type` | `"member"` | merge と対称 |
| `target_id` | `target`（candidate target member id） | merge は targetMemberId |
| `before_json` | `{ sourceMemberId, targetMemberId }` | merge の payload shape と対称 |
| `after_json` | `{ dismissalId, dismissedAt }` | reason は audit_log payload に入れず PII 混入を避ける |
| `created_at` | `dismissedAt` | dismissal_at と同一値 |

### before_json / after_json の型

```ts
type DismissAuditBefore = {
  sourceMemberId: string; // = source
  targetMemberId: string; // = target
};

type DismissAuditAfter = {
  dismissalId: string;
  dismissedAt: string;           // ISO 8601
};
```

### エラーハンドリング / エッジケース

| ケース | 挙動 |
| --- | --- |
| `c.db.batch` が関数でない（互換性なし） | `DismissAtomicBatchUnavailable` を throw（merge の `MergeAtomicBatchUnavailable` と対称） |
| source / target member 不在 | `DismissIdentityNotFound` を throw。route は 404 `MEMBER_NOT_FOUND` を返し、dismissal / audit_log は書かない |
| 再 dismiss（同 source/target で 2 回目） | `identity_conflict_dismissals` は `ON CONFLICT ... DO UPDATE` で最新 `dismissal_id` / actor / reason / dismissed_at へ更新。audit_log は新規行が追加され、最新行の `after_json.dismissalId` は永続行と一致する |
| `actorAdminEmail` 不在（email を持たないトークン等） | `null` を許容し fail-closed しない。`actor_id` は必須なので route の fallback（`claims.sub ?? user.memberId ?? "unknown-admin"`）を維持 |
| `redactIdentityReason` | reason の PII を redact 済み文字列にして `identity_conflict_dismissals.reason` に格納。`audit_log.after_json` には reason を含めず、dismissal metadata のみにする |

### route 配線（`apps/api/src/routes/admin/identity-conflicts.ts` dismiss endpoint）

現状（91-110 行付近）は `dismissIdentityConflict(ctx, source, target, actorAdminId, reason)` を呼ぶ。`actorAdminEmail` を追加配線する:

```ts
const claims = c.get("authClaims");
const user = c.get("authUser");
const out = await dismissIdentityConflict(
  ctx(c.env),
  ids.source,
  ids.target,
  claims.sub ?? user.memberId ?? "unknown-admin",
  user.email ?? null,          // ← 追加（merge endpoint と対称）
  parsed.data.reason,
);
return c.json(out, 200);
```

endpoint の外形（path / request body schema `DismissIdentityConflictRequestZ` / status 200 / 戻り値 `{ dismissedAt }`）は不変。内部の監査記録のみ追加する。

### `/admin/audit` での閲覧契約

既存 `AuditLogPanel`（`apps/web/src/components/admin/AuditLogPanel.tsx`）と audit query API の既存フィルタで、追加実装なしに以下が成立する:

- `action=identity.dismiss` フィルタで dismiss 履歴を時系列に抽出可能。
- `targetId`（= candidate target member id）でのフィルタ可能。
- `actorEmail`（= 操作した管理者）でのフィルタ可能。

### テスト

| ファイル | 追加検証 |
| --- | --- |
| `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` | dismiss 後に `audit_log` へ `action='identity.dismiss'` / `target_id=target` / `actor_email` が記録されること |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | `action=identity.dismiss` フィルタで上記行が取得できること |

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は D1 lane focused Vitest（上記 contract / repository spec）を参照。
