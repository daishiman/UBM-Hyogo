# Phase 1: 要件定義

## 目的

Issue #987（identity-conflicts の操作を `/admin/audit` 監査ログから追跡可能にする）について、最新コード調査の結果を正本として、解くべき残課題を「dismiss が audit_log に記録されない一点」へ収束させ、実装スコープ・受入条件・対象ファイル・命名規則を固定する。

---

## メタ情報

| 項目 | 値 |
| ---- | -- |
| workflow_id | `issue-987-identity-conflicts-audit-log-admin-ui` |
| task_type | implementation |
| visual_category | NON_VISUAL |
| implementation_mode | `new`（current branch に未実装。dismiss → audit_log の記録は存在しない） |
| 実装区分 | 実装仕様書（コード変更を伴う） |
| 由来 Issue | #987（**CLOSED のまま**。本仕様書は CLOSED Issue 由来の後付け仕様書として作成する） |
| issue_closed_reason | merge 側が既に解決済みで Issue が一括 CLOSE されたが、dismiss 側の監査追跡という残課題は未解決 |
| spec_purpose | Issue #987 の残課題（dismiss の監査ログ欠落）を実装可能な単一責務タスクへ落とし込む |

> **Issue #987 が CLOSED のままタスク仕様書を作る理由**: Issue 本文は「merge / dismiss 両方が監査ログに見えない」という**古い前提**で書かれているが、最新コードでは merge は既に audit_log へ記録済み（後述）。Issue を再 OPEN せず、残課題のみを本ワークフローで実装可能化する。Issue 状態は CLOSED 維持とする。

---

## 根本問題（最新コード調査の確定結果）

### 解決済み: merge は既に audit_log に記録されている

- `apps/api/src/repository/identity-merge.ts:119-167` の `mergeIdentities()` は D1 `db.batch([...])` で次の 3 INSERT をアトミック実行する。
  - `identity_aliases`
  - `identity_merge_audit`
  - `audit_log`（`action='identity.merge'`, `actor_id`, `actor_email`, `target_type='member'`, `target_id=targetMemberId`, `before_json`, `after_json`）
- `apps/api/src/routes/admin/identity-conflicts.ts:69-74` の merge endpoint は `actorAdminEmail: user.email ?? null` を repository へ渡している。
- → 既存 `/admin/audit` UI で `action=identity.merge` フィルタにより閲覧可能。**既に解決済み**。

### 未解決の根本問題: dismiss は audit_log に記録されない

- `apps/api/src/repository/identity-conflict.ts:179-202` の `dismissIdentityConflict()` は `identity_conflict_dismissals` テーブルへ単一 INSERT（upsert）するのみで、**audit_log に記録しない**。
- `apps/api/src/routes/admin/identity-conflicts.ts:91-110` の dismiss endpoint は `actorAdminEmail` を repository へ渡していない（merge endpoint との非対称）。
- → dismiss 操作が `/admin/audit` から追跡不可。**これが Issue #987 の唯一の未解決残課題**。

### 真の論点（1文固定）

> 「却下（dismiss）操作を、合併（merge）と同じ atomicity・同じ監査契約で audit_log に残し、`/admin/audit` から時系列追跡可能にする」

---

## スコープ

### 含む

1. `apps/api/src/repository/identity-conflict.ts` の `dismissIdentityConflict()` を merge と対称化する。
   - シグネチャに `actorAdminEmail: string | null` を追加。
   - 単一 INSERT を D1 `db.batch([...])` 化し、`identity_conflict_dismissals` upsert + `audit_log` INSERT をアトミック実行する。
   - `db.batch` 非対応環境向けに専用 Error `DismissAtomicBatchUnavailable` を throw する（merge の `MergeAtomicBatchUnavailable` パターン踏襲）。
2. `apps/api/src/routes/admin/identity-conflicts.ts` の dismiss endpoint（91-110行）で `dismissIdentityConflict` 呼び出しに `user.email ?? null` を追加する（merge endpoint と対称）。
3. 上記の回帰テスト（`*.spec.ts` / `*.contract.spec.ts`）追加。

### 含まない（スコープ外）

| 項目 | 理由 | 引き継ぎ |
| ---- | ---- | -------- |
| UI（apps/web）変更 | 既存 `/admin/audit` UI が `action=identity.dismiss` を自由入力フィルタで閲覧可能なため新規 UI ゼロ | 不要 |
| `AuditLogPanel` への identity.merge / identity.dismiss プリセット選択肢追加 | 根本解決に不要な軽微 UX 改善 | Phase 12 未タスク候補 |
| 新規マイグレーション | `audit_log` は既存 `apps/api/migrations/0003_auth_support.sql`、スキーマ変更ゼロ | 不要 |
| 既存 endpoint surface 変更 | `POST /identity-conflicts/:id/dismiss`、成功戻り値 `{dismissedAt}` を不変に保つ。存在しない member は merge と同じ 404 `MEMBER_NOT_FOUND` に正規化する | — |
| Google Form 仕様変更 / D1 schema 変更 | UI prototype alignment 不変条件 #1 で禁止 | — |

---

## 受入条件（AC）

| ID | 受入条件 |
| -- | -------- |
| AC-1 | dismiss 実行時に `audit_log` へ `action='identity.dismiss'`, `actor_id`, `actor_email`, `target_type='member'`, `target_id`, `before_json`, `after_json`, `created_at` の 1 行が記録される。 |
| AC-2 | `identity_conflict_dismissals` への upsert と `audit_log` INSERT が `db.batch` により**アトミック**に実行される（片方のみ commit されない）。 |
| AC-3 | dismiss endpoint が `actorAdminEmail`（`user.email ?? null`）を repository へ渡し、`audit_log.actor_email` に反映される（merge endpoint と対称）。 |
| AC-4 | `before_json` に `sourceMemberId` / `targetMemberId` を、`after_json` に `dismissalId` / `dismissedAt` を格納する。自由記述 reason は `identity_conflict_dismissals.reason` に redaction 済みで保存し、`audit_log.after_json` には含めない。 |
| AC-5 | `db.batch` 非対応環境では `DismissAtomicBatchUnavailable` を throw する。 |
| AC-6 | 既存 endpoint surface（パス・戻り値 `{dismissedAt}`）は不変。存在しない source/target member は merge と同じく 404 `MEMBER_NOT_FOUND` で返し、dismissal / audit_log を書かない。 |
| AC-7 | `/admin/audit` UI で `action=identity.dismiss` フィルタ／`targetId`（target member 単位）フィルタにより dismiss 操作が時系列閲覧可能（既存 UI の再確認のみ。コード変更不要）。 |

---

## 対象ファイル inventory

| パス | 区分 | 役割 |
| ---- | ---- | ---- |
| `apps/api/src/repository/identity-conflict.ts` | 修正 | `dismissIdentityConflict()` のシグネチャ拡張 + source/target 存在確認 + `db.batch` 化 + audit_log INSERT。`DismissAtomicBatchUnavailable` / `DismissIdentityNotFound` 追加。`redactIdentityReason` import（identity-merge.ts から）。`AuditAction` brand 利用。 |
| `apps/api/src/routes/admin/identity-conflicts.ts` | 修正 | dismiss endpoint で `dismissIdentityConflict` 呼び出しに `user.email ?? null` を追加。`DismissIdentityNotFound` を 404 `MEMBER_NOT_FOUND` へ変換。 |
| `apps/api/src/repository/identity-merge.ts` | 参照のみ | `redactIdentityReason` の export 元 / `MergeAtomicBatchUnavailable` の対称パターン参照元。 |
| `apps/api/src/repository/_shared/brand.ts` | 参照のみ | `auditAction(s)` ヘルパ / `AuditAction` 型。 |
| `apps/api/migrations/0003_auth_support.sql` | 参照のみ | `audit_log` の既存スキーマ（変更なし）。 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 参照のみ | `action` 自由入力フィルタ等を持つ既存 UI（変更なし）。 |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 参照のみ | 監査ログ閲覧画面（変更なし）。 |
| dismiss 回帰テスト（`identity-conflict.spec.ts` 等） | 新規/拡張 | audit_log 記録 / atomicity / actorAdminEmail 反映 / batch 非対応 throw を検証。 |

---

## 既存命名規則の記録

| 種別 | 規則 | 例 |
| ---- | ---- | -- |
| repository 関数 | camelCase | `dismissIdentityConflict`, `mergeIdentities`, `isConflictDismissed`, `parseConflictId` |
| audit action 値 | ドット区切り小文字 | `identity.merge`, `attendance.add` → dismiss は **`identity.dismiss`** |
| D1 列名 | snake_case | `actor_id`, `actor_email`, `target_type`, `target_id`, `before_json`, `after_json`, `created_at` |
| Error クラス | PascalCase + 用途接尾辞 | `MergeAtomicBatchUnavailable`, `MergeIdentityNotFound` → dismiss は **`DismissAtomicBatchUnavailable`** |
| brand 型 | PascalCase / ヘルパは camelCase | `AuditAction` / `auditAction(s)` |
| test ファイル | `*.spec.ts` / `*.contract.spec.ts` のみ（`*.test.ts` 禁止 = CLAUDE.md 不変条件 #8） | `identity-conflict.spec.ts` |

> **FB-01（仕様書 vs 実装クラス名ズレ検出）**: 本仕様書のクラス名・関数名は最新コード（identity-conflict.ts / identity-merge.ts / brand.ts）と突合済み。ズレなし。

---

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| -------- | ---- | ---- |
| current branch に実装が存在する | **No** | dismiss → audit_log の記録は未実装 → 通常の実装 Phase（`implementation_mode: new`、RED/GREEN サイクル） |
| upstream（dev/main）にマージ済み | No | 未マージ。再実装が必要 |
| 前提タスク（依存タスク）が完了済み | Yes | merge 側の audit_log 記録（既存実装）/ `redactIdentityReason` / `audit_log` スキーマ / `/admin/audit` UI はすべて完了済み。依存解消タスク不要 |

→ **implementation_mode = `new`**（Phase 4 = RED テスト設計、Phase 5 = GREEN 実装）。

---

## タスク分類の明示

- **実装仕様書（コード変更を伴う）**: `apps/api` のコードを変更する。
- **NON_VISUAL**: UI/UX 変更なし（apps/web のコードは参照のみ・変更なし）。Phase 11 は screenshot 不要、自動テスト結果 + 既存 `/admin/audit` UI での再現確認を代替証跡とする。
- 不変条件: CLAUDE.md #5（D1 直アクセスは apps/api 限定）/ #13（audit logging）を満たす。apps/web からの D1 直接アクセス禁止を継続。
