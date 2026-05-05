# Phase 2: 設計 — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 2 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |
| taskType | implementation-spec / implemented |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

admin route / merge service / DDL / admin UI / shared schema の構造、env、依存関係、関数シグネチャを
**実コードから抽出**して確定する。CONST_005 を満たすため、変更対象ファイル・関数シグネチャ・入出力・
テスト方針・ローカル実行コマンド・DoD を本 Phase に明記する。

## 実行タスク

1. module 設計と endpoint 契約を確定する。完了条件: shared schema と route handler の I/O が一意に決まる（実装と一致）。
2. merge transaction の対象テーブル / 列 / 操作順を確定する。完了条件: atomic 性と不変条件 #11 を破らない手順が固まる。
3. 重複候補判定 helper の入出力を確定する。完了条件: 第一段階の判定式が pure function として表現できる。

## 参照資料

- apps/api/src/routes/admin/identity-conflicts.ts
- apps/api/src/repository/identity-conflict.ts
- apps/api/src/repository/identity-merge.ts
- apps/api/src/services/admin/identity-conflict-detector.ts
- apps/api/migrations/0010_identity_merge_audit.sql / 0011_identity_aliases.sql / 0012_identity_conflict_dismissals.sql
- packages/shared/src/schemas/identity-conflict.ts
- apps/web/app/(admin)/admin/identity-conflicts/page.tsx
- apps/web/src/components/admin/IdentityConflictRow.tsx

## 多角的チェック観点

- #1 schema 固定回避（admin-managed merge メタ分離）
- #3 PII 取扱（responseEmail マスク / merge reason redaction）
- #5 D1 直アクセス apps/api 限定（apps/web は generic proxy 経由）
- #11 管理者も他人本文を直接編集しない
- #13 admin audit logging（独立テーブル + audit_log の二重ガード）
- 単一 D1 transactional batch 内で alias / merge_audit を整合させる。

## サブタスク管理

- [x] refs を確認する
- [x] AC と evidence path を対応付ける
- [x] blocker / approval gate を明記する
- [x] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- 変更対象ファイル一覧と新規 / 編集の区別が確定している（実装結果と一致）
- 主要 type / 関数シグネチャが実コードと一致して列挙されている
- merge transaction の SQL ステップ順序が確定している
- DDL 3 本のカラム定義が実 migration と一致している
- ローカル実行コマンドが列挙されている

## 追加セクション（Phase 2）

### Mermaid 構造図

```mermaid
flowchart LR
  Browser -->|cookie| WebMiddleware[apps/web (admin)/layout.tsx<br/>admin role gate]
  WebMiddleware --> AdminListPage["/admin/identity-conflicts page (Server Component)"]
  AdminListPage -->|fetchAdmin| GenericProxy["apps/web /api/admin/[...path] proxy"]
  GenericProxy -->|forward cookie| ApiRequireAdmin[apps/api requireAdmin]
  ApiRequireAdmin --> ListRoute[GET /admin/identity-conflicts]
  ApiRequireAdmin --> MergeRoute[POST /admin/identity-conflicts/:id/merge]
  ApiRequireAdmin --> DismissRoute[POST /admin/identity-conflicts/:id/dismiss]
  ListRoute --> ConflictRepo[(identity-conflict repo<br/>+ detector pure fn)]
  MergeRoute --> MergeService[identity-merge repository<br/>D1 transactional batch]
  DismissRoute --> ConflictRepo
  MergeService --> D1[(D1: identity_aliases<br/>identity_merge_audit<br/>audit_log)]
  ConflictRepo --> D1Read[(D1: member_identities<br/>response_fields<br/>identity_conflict_dismissals<br/>identity_aliases<br/>sync_jobs)]
```

### env / dependency matrix

| 項目 | 値 |
| --- | --- |
| 新規 env | なし |
| 既存利用 env | AUTH_SECRET / DB binding |
| 新規依存ライブラリ | なし（zod / hono は既存） |
| 影響パッケージ | apps/api, apps/web, packages/shared |

### 変更対象ファイル一覧（実装結果）

| パス | 種別 | 状態 |
| --- | --- | --- |
| `apps/api/migrations/0010_identity_merge_audit.sql` | 新規 | 実装済 |
| `apps/api/migrations/0011_identity_aliases.sql` | 新規 | 実装済 |
| `apps/api/migrations/0012_identity_conflict_dismissals.sql` | 新規 | 実装済 |
| `apps/api/src/services/admin/identity-conflict-detector.ts` | 新規 | 実装済（pure fn） |
| `apps/api/src/services/admin/identity-conflict-detector.test.ts` | 新規 | 実装済（unit 5 ケース） |
| `apps/api/src/repository/identity-conflict.ts` | 新規 | 実装済 |
| `apps/api/src/repository/__tests__/identity-conflict.test.ts` | 新規 | 実装済（integration 5 ケース） |
| `apps/api/src/repository/identity-merge.ts` | 新規 | 実装済 |
| `apps/api/src/repository/__tests__/identity-merge.test.ts` | 新規 | 実装済（integration 6 ケース） |
| `apps/api/src/repository/__tests__/_setup.ts` | 編集 | 実装済（in-memory D1 TABLES に 3 テーブル追加） |
| `apps/api/src/routes/admin/identity-conflicts.ts` | 新規 | 実装済（Hono route） |
| `apps/api/src/index.ts` | 編集 | 実装済（`app.route("/admin", createAdminIdentityConflictsRoute())` を mount） |
| `packages/shared/src/schemas/identity-conflict.ts` | 新規 | 実装済（zod schema + `maskResponseEmail`） |
| `packages/shared/src/schemas/index.ts` | 編集 | 実装済（re-export） |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 新規 | 実装済（Server Component / cursor pagination） |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 新規 | 実装済（Client Component / 二段階確認 stage state） |
| `apps/web/app/api/admin/[...path]/route.ts` | 既存流用 | generic proxy が `/admin/identity-conflicts` を中継 |

> **設計差分メモ**: 仕様初版で別ファイルだった `[id]/page.tsx` 詳細ページ / `IdentityMergeConfirmDialog.tsx` /
> 個別 proxy ファイル群は、実装時に Row コンポーネント内 stage state（`idle`→`merge-confirm`→`merge-final`→`dismiss`）と
> 既存 generic proxy `[...path]` で十分と判断し作成していない。複雑度を下げる方向への合理化であり AC は維持される。

### 主要 type / 関数シグネチャ（実装と一致）

```ts
// packages/shared/src/schemas/identity-conflict.ts
export type IdentityConflictMatchedField = "name" | "affiliation";

export type IdentityConflictRow = {
  conflictId: string;             // `${sourceMemberId}__${targetMemberId}` 動的生成
  sourceMemberId: string;
  candidateTargetMemberId: string;
  matchedFields: IdentityConflictMatchedField[];
  detectedAt: string;             // ISO8601 (source の lastSubmittedAt)
  responseEmailMasked: string;    // "u***@example.com"
  syncJobId: string | null;       // 最新 EMAIL_CONFLICT job_id
};

export type ListIdentityConflictsResponse = {
  items: IdentityConflictRow[];
  nextCursor: string | null;
};

export type MergeIdentityRequest = {
  targetMemberId: string;          // 統合先（残す側）。conflictId の target と一致必須
  reason: string;                  // min(1).max(500)
};

export type MergeIdentityResponse = {
  mergedAt: string;
  targetMemberId: string;
  archivedSourceMemberId: string;
  auditId: string;
};

export type DismissIdentityConflictRequest = { reason: string }; // min(1).max(500)
export type DismissIdentityConflictResponse = { dismissedAt: string };

export function maskResponseEmail(email: string): string;
```

```ts
// apps/api/src/services/admin/identity-conflict-detector.ts (pure fn)
export type EmailConflictRow = { sourceMemberId: string; name: string; affiliation: string };
export type IdentitySnapshot = { memberId: string; name: string; affiliation: string };
export type ConflictCandidate = {
  sourceMemberId: string;
  candidateTargetMemberId: string;
  matchedFields: ("name" | "affiliation")[];
};
export function detectConflictCandidates(
  emailConflictRows: readonly EmailConflictRow[],
  existingIdentities: readonly IdentitySnapshot[],
): ConflictCandidate[];
// 正規化: trim + NFKC、空欄スキップ、自己除外、name+affiliation 完全一致のみ candidate。

// apps/api/src/repository/identity-conflict.ts
export function listIdentityConflicts(
  c: DbCtx,
  cursor: string | null,
  limit: number,
): Promise<ListIdentityConflictsResponse>;
export function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  reason: string,
): Promise<{ dismissedAt: string }>;
export function isConflictDismissed(c: DbCtx, source: string, target: string): Promise<boolean>;
export function parseConflictId(conflictId: string): { source: string; target: string } | null;

// apps/api/src/repository/identity-merge.ts
export function mergeIdentities(
  c: DbCtx,
  args: {
    sourceMemberId: string;
    targetMemberId: string;
    actorAdminId: string;
    actorAdminEmail: string | null;
    reason: string;
  },
): Promise<MergeIdentityResponse>;
export function resolveCanonicalMemberId(c: DbCtx, memberId: string): Promise<string>;
export class MergeConflictAlreadyApplied extends Error { sourceMemberId: string }
export class MergeIdentityNotFound extends Error { memberId: string }
export class MergeSelfReference extends Error {}

// apps/api/src/routes/admin/identity-conflicts.ts (Hono mount via createAdminIdentityConflictsRoute)
//   GET    /admin/identity-conflicts            -> 200 ListIdentityConflictsResponse
//   POST   /admin/identity-conflicts/:id/merge   -> 200 MergeIdentityResponse
//                                                | 400 BAD_REQUEST | 400 BAD_CONFLICT_ID
//                                                | 400 TARGET_MEMBER_MISMATCH | 400 SELF_REFERENCE
//                                                | 404 MEMBER_NOT_FOUND | 409 ALREADY_MERGED
//   POST   /admin/identity-conflicts/:id/dismiss -> 200 { dismissedAt } | 400
```

### merge transaction 操作順序（D1 transactional batch / 実装と一致）

1. `sourceMemberId === targetMemberId` の場合 `MergeSelfReference` を投げる。
2. `member_identities` で source / target の存在を SELECT し、不在なら `MergeIdentityNotFound`。
3. `identity_aliases` で source の既存 alias を SELECT し、存在すれば `MergeConflictAlreadyApplied`。
4. `sync_jobs` から最新 `EMAIL_CONFLICT` の `job_id` を取得（メタ用、なければ null）。
5. `db.batch([...])` で次 2 文を atomic に実行:
   - `INSERT INTO identity_aliases(alias_id, source_member_id, target_member_id, created_by, created_at, reason_redacted) VALUES (?, ?, ?, ?, ?, ?)`
   - `INSERT INTO identity_merge_audit(audit_id, actor_admin_id, source_member_id, target_member_id, reason, merged_at, sync_job_id) VALUES (?, ?, ?, ?, ?, ?, ?)`
   - batch 中で UNIQUE 違反が出たら `MergeConflictAlreadyApplied` に再分類。
   - `db.batch` 未実装環境では `MergeAtomicBatchUnavailable` として失敗させ、逐次 `run()` fallback は持たない。
6. `appendAuditLog(c, { action: "identity.merge", targetType: "member", targetId: targetMemberId, before, after })` を実行。
7. `MergeIdentityResponse { mergedAt, targetMemberId, archivedSourceMemberId, auditId }` を返す。

raw `member_responses` / `response_fields` / `member_status` は **更新しない**（不変条件 #11）。
canonical 解決は `resolveCanonicalMemberId(memberId)` が `identity_aliases.source_member_id` 一致時に
`target_member_id` を返し、未登録ならそのまま `memberId` を返す。

### DDL: identity_merge_audit（実装ファイル `0010_identity_merge_audit.sql`）

| カラム | 型 | NOT NULL | 備考 |
| --- | --- | --- | --- |
| audit_id | TEXT PRIMARY KEY | YES | uuid v4 |
| actor_admin_id | TEXT | YES | admin user id |
| source_member_id | TEXT | YES | 統合元 |
| target_member_id | TEXT | YES | 統合先 |
| reason | TEXT | YES | redaction 済（PII 置換後） |
| merged_at | TEXT | YES | ISO8601 |
| sync_job_id | TEXT | NO | 紐づく EMAIL_CONFLICT の sync_jobs row |

INDEX: `idx_identity_merge_audit_target(target_member_id, merged_at)`, `idx_identity_merge_audit_source(source_member_id)`

### DDL: identity_aliases（実装ファイル `0011_identity_aliases.sql`）

| カラム | 型 | NOT NULL | 備考 |
| --- | --- | --- | --- |
| alias_id | TEXT PRIMARY KEY | YES | uuid v4 |
| source_member_id | TEXT | YES | canonical target に寄せる側（UNIQUE） |
| target_member_id | TEXT | YES | 残す側 |
| created_by | TEXT | YES | admin user id |
| created_at | TEXT | YES | ISO8601 |
| reason_redacted | TEXT | YES | PII redaction 済み理由 |

CONSTRAINT: `UNIQUE (source_member_id)` で二重 merge 抑止。
INDEX: `idx_identity_aliases_target(target_member_id)`

### DDL: identity_conflict_dismissals（実装ファイル `0012_identity_conflict_dismissals.sql`）

| カラム | 型 | NOT NULL | 備考 |
| --- | --- | --- | --- |
| dismissal_id | TEXT PRIMARY KEY | YES | uuid v4 |
| source_member_id | TEXT | YES | 別人として確定した側 |
| candidate_target_member_id | TEXT | YES | 同名で除外した候補 |
| dismissed_by | TEXT | YES | admin user id |
| reason | TEXT | YES | admin 入力 |
| dismissed_at | TEXT | YES | ISO8601 |

CONSTRAINT: `UNIQUE (source_member_id, candidate_target_member_id)` で再検出抑止。
INDEX: `idx_identity_conflict_dismissals_source(source_member_id)`

### 入出力 / 副作用サマリ

| route | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| GET /admin/identity-conflicts | `cursor?`, `limit?`(1..100, default 50) | `ListIdentityConflictsResponse` | なし（読み取りのみ） |
| POST /admin/identity-conflicts/:id/merge | `MergeIdentityRequest` | `MergeIdentityResponse` | `identity_aliases` INSERT / `identity_merge_audit` INSERT (`db.batch`) / `audit_log` append |
| POST /admin/identity-conflicts/:id/dismiss | `DismissIdentityConflictRequest` | `{ dismissedAt }` | `identity_conflict_dismissals` INSERT or UPDATE (`ON CONFLICT(source, candidate) DO UPDATE`) |

`:id` は `${source}__${target}` 形式。merge は body の `targetMemberId` が path の target と一致しない場合 `400 TARGET_MEMBER_MISMATCH`。

### 候補判定の入力源（list 実装の補足）

仕様初版では「`sync_jobs.error_json` から source memberId を取り出す」想定だったが、実機では
`sync_jobs.error_json` に source memberId が記録されていないため、`listIdentityConflicts` は次の入力源で候補を構成する:

- `member_identities` × `response_fields(stable_key='fullName' | 'occupation')` を結合し identity の name / affiliation を引く
- `identity_aliases.source_member_id` 登録済の identity は除外（merge 済み source）
- `identity_conflict_dismissals` 登録済の `(source, target)` ペアは除外
- detector を「全 identity 相互比較」で適用し、`lastSubmittedAt` が新しい側を `source`、古い側を `target` に正規化
- `syncJobId` は最新の `EMAIL_CONFLICT` job_id を共通メタとして付与

### テスト方針（Phase 4 で詳細）

- 追加テストファイル（実装済）:
  - `apps/api/src/services/admin/identity-conflict-detector.test.ts` (unit 5)
  - `apps/api/src/repository/__tests__/identity-conflict.test.ts` (integration 5)
  - `apps/api/src/repository/__tests__/identity-merge.test.ts` (integration 6)
- 追加見送り: contract / E2E は manual smoke (Phase 11) に寄せる（Phase 4 にて理由明記）。

### ローカル実行 / 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --no-coverage \
  apps/api/src/services/admin/identity-conflict-detector.test.ts \
  apps/api/src/repository/__tests__/identity-merge.test.ts \
  apps/api/src/repository/__tests__/identity-conflict.test.ts
```

### DoD（Phase 2 ベース）

- 上記ファイル一覧の新規 / 編集が漏れなく実装される（実装済み）
- 関数シグネチャと shared schema が単一情報源として参照可能（実コードと一致）
- merge transaction が D1 transactional batch で alias / audit を atomic に記録
- DDL 3 本が migration として追加され、`bash scripts/cf.sh d1 migrations apply` で適用可能
- ローカル実行コマンド全 PASS（unit 5 + integration 11 = 16 ケース all green）

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装後も deploy / commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 3 へ、AC、blocker、evidence path、approval gate を渡す。
