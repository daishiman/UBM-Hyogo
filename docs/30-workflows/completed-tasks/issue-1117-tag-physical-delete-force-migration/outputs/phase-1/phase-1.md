# Phase 1: 要件定義

## 成果物

Issue #1117（= issue-1070 followup-001）の「参照付き tag の強制移行 + 物理削除」運用要件を、現行コードを正本として実装可能な要件へ確定する。

## 1.1 現行コード調査（一次証跡）

| 観点 | 現状 | 出典 |
|------|------|------|
| physical delete | 実装済み（参照ありは 409 拒否のみ） | `apps/api/src/repository/tagDefinitions.ts:223-237` |
| 参照件数取得 | `countMemberTagReferences` 実装済み | `tagDefinitions.ts:210-216` |
| 強制移行（参照付き tag を別 tag へ寄せてから物理削除） | **着手前 baseline では不在** | grep `migrate` / `reassign` / `forceMigrat` → 着手前 `apps/api/src` ヒット 0 |
| route physical delete | `DELETE /admin/tags/:tagId/physical`（参照ありは `failWithBody("tag_has_references")`） | `apps/api/src/routes/admin/tags.ts:268-289` |
| error code map | `tag_has_references: 409`（`tag_not_found` ほか） | `tags.ts:59` |
| audit 記録 | `appendTagAudit(c,{action,targetId,before,after})` + `auditLog.ts` | `tags.ts` / `apps/api/src/repository/auditLog.ts:112` |
| audit action union | `admin.tag.created`/`updated`/`deactivated`/`reactivated`/`physically_deleted` | `tags.ts` `appendTagAudit` 呼び出し |
| `member_tags` FK | **DB-level FOREIGN KEY なし**。`PRIMARY KEY (member_id, tag_id)` のみ + `idx_member_tags_member` | `apps/api/migrations/0002_admin_managed.sql:43-51,85-86` |
| `AuditTargetType` | 既に `"tag"` を含む | `apps/api/src/repository/auditLog.ts` |
| `AuditAction` | `RepoBrand<string>`（enum なし） | `apps/api/src/repository/_shared/brand.ts` |
| migrations 最新番号 | `0025_backfill_member_status.sql` | `apps/api/migrations/` |

### 結論（問題の解決状況）

- Issue #1117 の成果物（強制移行経路 = 参照付き tag を別 tag へ寄せてから物理削除）は、着手前 baseline では存在しなかった。別タスクでも解消されていなかったため、本サイクルで local 実装した。
- physical delete 自体（issue-1070）は landed 済みだが、参照ありは **常に 409 で拒否** され、移行して消す経路は存在しない。
- よって **Issue は未解決・対応必要**。Issue は CLOSED だが、本仕様は CLOSED を維持したまま作成する（reopen しない）。

## 1.2 Issue の現行コードへの最適化

Issue 本文は issue-1070 land 前後の前提を含むが、issue-1070 は landed 済み。以下を現行コードに合わせて最適化する（詳細は `index.md` §「Issue の現行コードへの最適化」O1-O5）。

1. **方式確定（O1）**: 移行先 tag は実行時に運用者が選ぶ可変値であり、固定 DDL migration では表現不能。**専用 endpoint 方式に確定**（`DELETE /admin/tags/:tagId/physical?migrateTo=<dest>`）。新 schema migration は作らない。
2. **参照整合（O2）**: `member_tags` に DB-FK が無いため `ON DELETE` は使えない。移行・ガードは全て application-level SQL。`(member_id, dest)` PK 衝突は `INSERT OR IGNORE`+`DELETE` で吸収。
3. **退化防止（O3）**: 移行は既存 409 拒否経路の **前段** に積む。`migrateTo` 未指定時は完全に既存挙動（AC-7 regression）。
4. **audit（O4）**: 新 action `admin.tag.references_migrated` を追加。`AuditAction` は `RepoBrand<string>` で enum 変更不要。
5. **移行先検証（O5）**: not_found / 非 active / `src===dest` を実行前に検証し、新エラーコードで拒否。

## 1.3 受け入れ基準（実装写像）

| ID | 受け入れ基準 | 実装写像 |
|----|-------------|----------|
| AC-1 | 移行先指定で `src` 参照を `dest` へ全件移行 | `migrateMemberTagReferences(c, src, dest)` → `{migratedCount}` |
| AC-2 | `(member_id, dest)` PK 衝突を孤児なしで吸収 | `INSERT OR IGNORE`+`DELETE` で dest 集約 |
| AC-3 | 移行後 `src` 参照 0 のときのみ物理削除 | `countMemberTagReferences(src)===0` 再検証 → `physicalDeleteTagDefinition(src)` |
| AC-4 | 移行・削除を audit 記録 | `admin.tag.references_migrated` + `admin.tag.physically_deleted` |
| AC-5 | 移行先不在 / 非 active / `src===dest` を明示拒否 | `migration_target_not_found`(404) / `migration_target_inactive`(409) / `migration_target_same_as_source`(400) |
| AC-6 | runbook に逆移行ロールバック方針 | `force-migration-runbook.md` |
| AC-7 | issue-1070 の 409 拒否経路が退化しない | `migrateTo` 未指定は既存挙動保持。contract regression test |

## 1.4 非機能・制約

- D1 直接アクセスは `apps/api` に閉じる（CLAUDE.md invariant #5）。
- 新 migration 不要（schema 変更なし・移行は runtime データ操作）。
- `apps/web` 非接触（NON_VISUAL）。
- 強制移行・physical delete production runtime は不可逆 → user-gated（`references/non-visual-irreversible-task-rules.md` 適用）。
- 移行と削除は単一の論理操作境界で扱い、各ステップ後に参照件数を再検証する（DB-FK 不在のすり抜け対策）。

## 1.5 単一責務分解

| 責務 | 配置 | 種別 |
|------|------|------|
| 参照移行（衝突吸収込み） | `tagDefinitions.ts#migrateMemberTagReferences` | 新規 |
| 移行先 tag 検証 | `tagDefinitions.ts#validateMigrationTarget`（または route 前段で `getTagDefinitionByIdRaw` 利用） | 新規 |
| 強制移行 + 物理削除の二段オーケストレーション | `tagDefinitions.ts#forceMigrateAndPhysicalDeleteTagDefinition` | 新規 |
| physical delete endpoint への `migrateTo` 分岐 | `tags.ts` `DELETE /tags/:tagId/physical` | 編集 |
| error code 追加 | `tags.ts` `ERROR_TO_STATUS` | 編集 |
| audit action 追加 | `tags.ts` `appendTagAudit` 呼び出し | 編集 |
| 正本 spec 同期 | `specs/01-api-schema.md` | 編集 |

## 1.6 命名規則の確認（FB-01 / FB-SDK-07-4）

- repository 関数: camelCase（既存 `countMemberTagReferences` / `physicalDeleteTagDefinition` に一致）。新規も `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` で一貫。
- error code: snake_case 文字列（既存 `tag_has_references` / `tag_not_found` に一致）。新規 `migration_target_not_found` / `migration_target_inactive` / `migration_target_same_as_source`。
- audit action: `admin.tag.<verb>` ドット区切り（既存 `admin.tag.physically_deleted` に一致）。新規 `admin.tag.references_migrated`。
- query param: camelCase（Hono `c.req.query("migrateTo")`）。

## 1.7 タスク分類

- **タスク種別**: NON_VISUAL（API only / `apps/web` 非接触）。Phase 11 は screenshot 不要、focused D1 Vitest / typecheck / lint を代替証跡とする。
- **implementation_mode**: `new`（issue-1070 の physical delete 拒否経路に強制移行の前段を追加）。

## 1.8 targeted test ファイルリスト（FB-UI-02-2）

全件 `pnpm test` ではなく以下を対象指定で実行する:

- `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts`
- `apps/api/src/routes/admin/tags.contract.spec.ts`
