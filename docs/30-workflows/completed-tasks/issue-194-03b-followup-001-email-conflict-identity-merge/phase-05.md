# Phase 5: 実装ランブック — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

本 Phase は本タスクの実装コードを対象とし、CONST_005 を満たす形で「変更対象ファイル / 関数シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD」を本仕様書に固定する。
**実装は既に完了済み**であり、本仕様書は完成済み実装と完全整合した「実装仕様書」である。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 5 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | implementation-complete |
| 上流 | 03b forms response sync 本体 / 04c admin backoffice API / 02a member identity-status repository |
| 下流 | 公開ディレクトリ重複解消運用 / 04c admin E2E |

## 目的

03b の `EMAIL_CONFLICT` follow-up を「admin による手動 identity merge 経路」として閉じる。
本 Phase は実装ランブックとして、migration 適用 → repository → service → route → web → schema 共有 の編集順序、
変更対象ファイル、関数シグネチャ、入出力、検証コマンド、DoD を確定する。

## 参照資料

- docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/index.md
- docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/phase-02.md
- docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/phase-04.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- apps/api/src/middleware/require-admin.ts
- apps/api/src/jobs/sync-forms-responses.ts (`classifyError()` の `EMAIL_CONFLICT` 分類)

## 実装順序（runbook）

```
Step 1: DDL migration 3 本を追加し staging へ適用
Step 2: shared schema (zod + maskResponseEmail helper) を packages/shared に追加
Step 3: detector helper (pure function) を apps/api/src/services/admin/ に追加
Step 4: identity-conflict repository (list / dismiss / parseConflictId)
Step 5: identity-merge repository (mergeIdentities / resolveCanonicalMemberId)
Step 6: route handler を追加し apps/api/src/index.ts に require-admin 配下で mount
Step 7: apps/web に admin page と IdentityConflictRow component を追加
Step 8: typecheck / lint / test 全 PASS を確認
```

各ステップ後にローカル `mise exec -- pnpm typecheck` を実行する。Step 1 の migration 適用後は
`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` で適用済を確認する。

## 詳細 runbook

### Step 1: DDL migration 3 本

| ファイル | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/migrations/0010_identity_merge_audit.sql` | 新規 | 不変条件 #13 audit logging 専用 |
| `apps/api/migrations/0011_identity_aliases.sql` | 新規 | source→target canonical 解決。`UNIQUE (source_member_id)` で二重 merge を抑止 |
| `apps/api/migrations/0012_identity_conflict_dismissals.sql` | 新規 | 「別人」マーク永続化。`UNIQUE (source_member_id, candidate_target_member_id)` |

実行コマンド:

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-staging --env staging
```

### Step 2: shared schema

`packages/shared/src/schemas/identity-conflict.ts` を新規作成し、以下を export する:

| シンボル | 種別 | 用途 |
| --- | --- | --- |
| `IdentityConflictMatchedFieldZ` / `IdentityConflictMatchedField` | zod / type | "name" \| "affiliation" |
| `IdentityConflictRowZ` / `IdentityConflictRow` | zod / type | 一覧 1 行（responseEmailMasked 含む） |
| `ListIdentityConflictsResponseZ` / `ListIdentityConflictsResponse` | zod / type | `{ items, nextCursor }` |
| `MergeIdentityRequestZ` / `MergeIdentityRequest` | zod / type | `{ targetMemberId, reason: 1〜500 }` |
| `MergeIdentityResponseZ` / `MergeIdentityResponse` | zod / type | `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` |
| `DismissIdentityConflictRequestZ` / `Response` | zod / type | `{ reason }` / `{ dismissedAt }` |
| `maskResponseEmail(email: string): string` | function | `u***@example.com` 形式に部分マスク（不変条件 #3） |

### Step 3: detector helper（pure function）

`apps/api/src/services/admin/identity-conflict-detector.ts`:

```ts
export type IdentitySnapshot = { memberId: string; name: string; affiliation: string };
export type EmailConflictRow = { sourceMemberId: string; name: string; affiliation: string };
export type ConflictCandidate = {
  sourceMemberId: string;
  candidateTargetMemberId: string;
  matchedFields: ("name" | "affiliation")[];
};
export function detectConflictCandidates(
  emailConflictRows: readonly EmailConflictRow[],
  existingIdentities: readonly IdentitySnapshot[],
): ConflictCandidate[];
```

判定ルール: `trim` + `NFKC` 正規化後に name AND affiliation の完全一致のみを candidate として返す。
自己 (`memberId === sourceMemberId`) と空文字は除外する。D1 を直接参照しない（不変条件 #5）。

### Step 4: identity-conflict repository

`apps/api/src/repository/identity-conflict.ts` 公開シグネチャ:

```ts
export async function listIdentityConflicts(
  c: DbCtx,
  cursor: string | null,
  limit: number,
): Promise<ListIdentityConflictsResponse>;

export async function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  reason: string,
): Promise<{ dismissedAt: string }>;

export async function isConflictDismissed(
  c: DbCtx, source: string, target: string,
): Promise<boolean>;

export const parseConflictId: (
  conflictId: string,
) => { source: string; target: string } | null;
```

実装要点:

- `member_identities × response_fields` を `stable_key='fullName'`/`'occupation'` で join し identity snapshot を抽出
- `identity_aliases` に登録済みの source は SQL 段で除外
- `detectConflictCandidates` で name+affiliation 一致を抽出後、`lastSubmittedAt` が新しい側を source に揃えて
  `${source}__${target}` を `conflictId` として正規化
- dismiss 済みペアは Set lookup で除外
- `responseEmail` は `maskResponseEmail()` で部分マスクして応答に含める
- pagination: `detectedAt desc + conflictId asc` で安定ソート、cursor は `conflictId` baseline
- `dismissIdentityConflict` は `INSERT ... ON CONFLICT(source, candidate_target) DO UPDATE` で upsert

### Step 5: identity-merge repository

`apps/api/src/repository/identity-merge.ts` 公開シグネチャ:

```ts
export class MergeConflictAlreadyApplied extends Error { readonly sourceMemberId: string }
export class MergeIdentityNotFound      extends Error { readonly memberId: string }
export class MergeSelfReference         extends Error { }

export async function mergeIdentities(
  c: DbCtx,
  args: {
    sourceMemberId: string;
    targetMemberId: string;
    actorAdminId: string;
    actorAdminEmail: string | null;
    reason: string;
  },
): Promise<MergeIdentityResponse>;

export async function resolveCanonicalMemberId(
  c: DbCtx,
  memberId: string,
): Promise<string>;
```

merge transaction:

1. `sourceMemberId === targetMemberId` を `MergeSelfReference` で弾く
2. source / target の `member_identities` 存在を SELECT で確認、不在なら `MergeIdentityNotFound`
3. `identity_aliases` に source が既登録なら `MergeConflictAlreadyApplied`
4. `reason` を PII redaction（email / 電話正規表現を `[redacted]` 置換、500 char 上限）
5. `EMAIL_CONFLICT` の最新 `sync_jobs.job_id` を引いて `syncJobId` を採取
6. **D1 transactional batch (`db.batch`) で 2 文 atomic apply**:
   - `INSERT INTO identity_aliases (alias_id, source_member_id, target_member_id, created_by, created_at, reason_redacted)`
   - `INSERT INTO identity_merge_audit (audit_id, actor_admin_id, source_member_id, target_member_id, reason, merged_at, sync_job_id)`
7. batch 失敗時、message に `UNIQUE|constraint` を含む場合は `MergeConflictAlreadyApplied` に翻訳
8. `audit_log` に `action='identity.merge'` / `target_type='member'` / `target_id=targetMemberId` で 1 行追記（`appendAuditLog`）
9. **raw `member_responses` / `response_fields` / `member_status` への UPDATE は一切発行しない（不変条件 #11）**

`resolveCanonicalMemberId` は `identity_aliases.source_member_id` を引いて target を返す。alias 不在時は引数 `memberId` をそのまま返す（passthrough）。

### Step 6: admin route handler

`apps/api/src/routes/admin/identity-conflicts.ts`:

```ts
export const createAdminIdentityConflictsRoute = (): Hono<{...}>;
//   GET    /identity-conflicts                  -> 200 ListIdentityConflictsResponse
//   POST   /identity-conflicts/:id/merge        -> 200 MergeIdentityResponse | 400/404/409
//   POST   /identity-conflicts/:id/dismiss      -> 200 { dismissedAt }
```

ハンドラ要点:

- `app.use("*", requireAdmin)` で route 全体を gate（不変条件 #11/#13）
- `ListQueryZ`: `cursor?: string`, `limit: number (1..100, default 50)`
- `:id` を `parseConflictId` で `{source, target}` に分解。失敗時 `400 BAD_CONFLICT_ID`
- merge: body の `targetMemberId` と path 由来 `target` の不一致は `400 TARGET_MEMBER_MISMATCH`
- exception → HTTP 翻訳:
  | exception | code | status |
  | --- | --- | --- |
  | `MergeConflictAlreadyApplied` | `ALREADY_MERGED` | 409 |
  | `MergeIdentityNotFound` | `MEMBER_NOT_FOUND` | 404 |
  | `MergeSelfReference` | `SELF_REFERENCE` | 400 |
  | zod parse 失敗 | `BAD_REQUEST` | 400 |
- `actorAdminId` は `c.get("authClaims").sub ?? c.get("authUser").memberId ?? "unknown-admin"`
- `actorAdminEmail` は `c.get("authUser").email ?? null`

`apps/api/src/index.ts` を編集し、`createAdminIdentityConflictsRoute()` を既存 admin router 配下に mount する（不変条件 #11 二段防御: layout-level admin gate + route-level `requireAdmin`）。

### Step 7: apps/web 追加

| ファイル | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 新規 | server component。`fetchAdmin<ListIdentityConflictsResponse>("/admin/identity-conflicts?cursor=...")` で proxy 取得、`IdentityConflictRow` を map。`force-dynamic` |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 新規 | client component。stage state machine: `idle → merge-confirm → merge-final → (POST merge)` / `idle → dismiss → (POST dismiss)`。失敗時はステータスとエラー code を inline 表示 |

POST 先は既存の generic admin proxy `app/api/admin/[...path]/route.ts` を経由する（個別 proxy route は新規追加しない）。
不変条件 #5 遵守（apps/web から D1 直アクセスなし、必ず apps/api 経由）。

### Step 8: ローカル検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @repo/api test -- identity-conflict identity-merge identity-conflict-detector
```

## 変更対象ファイル一覧

| パス | 種別 |
| --- | --- |
| `apps/api/migrations/0010_identity_merge_audit.sql` | 新規 |
| `apps/api/migrations/0011_identity_aliases.sql` | 新規 |
| `apps/api/migrations/0012_identity_conflict_dismissals.sql` | 新規 |
| `packages/shared/src/schemas/identity-conflict.ts` | 新規 |
| `apps/api/src/services/admin/identity-conflict-detector.ts` | 新規 |
| `apps/api/src/services/admin/identity-conflict-detector.test.ts` | 新規 |
| `apps/api/src/repository/identity-conflict.ts` | 新規 |
| `apps/api/src/repository/identity-merge.ts` | 新規 |
| `apps/api/src/repository/__tests__/identity-conflict.test.ts` | 新規 |
| `apps/api/src/repository/__tests__/identity-merge.test.ts` | 新規 |
| `apps/api/src/repository/__tests__/_setup.ts` | 編集 (新テーブル DDL を seed に追加) |
| `apps/api/src/routes/admin/identity-conflicts.ts` | 新規 |
| `apps/api/src/index.ts` | 編集 (route mount) |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 新規 |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 新規 |

> 注: 当初 spec で予定した `IdentityMergeConfirmDialog.tsx` および個別 proxy route 3 本は、
> 実装段階で `IdentityConflictRow` の stage state machine と generic `[...path]` proxy で代替済（DRY 化判断）。
> Phase 8 の Before/After に統合方針を記載。

## sanity check

- non-admin で 403、admin で 200 を返す（`requireAdmin` middleware）
- merge 後に `identity_aliases.source_member_id` が target を指す（integration test 検証済）
- raw `member_responses` / `response_fields` / `member_status` は merge 中に変更されない（grep で UPDATE 文不在を確認）
- `identity_merge_audit` / `audit_log` に各 1 行追加される（integration test 検証済）
- dismiss 後に同一 `(source, target)` ペアが GET 結果から消える（integration test 検証済）
- responseEmail は API 応答で部分マスクのみ表示（`maskResponseEmail` 経由）
- merge `reason` 内の email / 電話パターンは `[redacted]` に redaction される

## ローカル実行 / 検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @repo/api test
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
```

## 完了条件 (DoD)

- 上記「変更対象ファイル一覧」が全て配置完了 (新規 / 編集) かつ git に存在
- `pnpm typecheck` / `pnpm lint` / `@repo/api` test が all PASS
- DDL 0010 / 0011 / 0012 が staging に適用済
- sanity check 全項目が GO
- 不変条件 #1 / #3 / #5 / #11 / #13 のいずれにも違反していない

## 多角的チェック観点

- #1 schema 固定回避: identity merge メタは Google Form schema 外として `identity_aliases` / `identity_merge_audit` / `identity_conflict_dismissals` に分離
- #3 PII 取扱: responseEmail は `maskResponseEmail`、merge reason は `redactReason` で email / 電話を `[redacted]`
- #5 D1 直アクセスは apps/api 限定: apps/web は `fetchAdmin` proxy 経由のみ
- #11 本文 immutable: merge は INSERT only。既存 raw response テーブルへの UPDATE / DELETE は無し
- #13 admin audit logging: `identity_merge_audit` 専用テーブル + `audit_log.action='identity.merge'` の二重記録

## サブタスク管理

- [x] migration 0010 / 0011 / 0012 を追加
- [x] shared schema + maskResponseEmail を追加
- [x] detector pure function を追加
- [x] identity-conflict / identity-merge repository を追加
- [x] admin route + index.ts mount
- [x] apps/web page + IdentityConflictRow component
- [x] typecheck / lint / unit / integration test all green
- [x] outputs/phase-05/main.md を更新

## 成果物

- `outputs/phase-05/main.md`

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている (CONST_005)
- [x] 実装と完全整合した実装仕様書になっている
- [x] 03b 本体の復活ではなく follow-up 経路として閉じている

## 次 Phase への引き渡し

Phase 6 へ、AC、blocker、failure case 一覧、evidence path、approval gate を渡す。
