# Phase 1: 要件定義

## 成果物

Issue #1070（= issue-1035 followup-003）の reactivate + physical delete 運用要件を、現行コードを正本として実装可能な要件へ確定する。

## 1.1 現行コード調査（一次証跡）

| 観点 | 現状 | 出典 |
|------|------|------|
| tag master lifecycle | `create` / `update`(label,category) / `deactivate`(active=0 論理削除) のみ | `apps/api/src/repository/tagDefinitions.ts:89-154` |
| reactivate 関数 | **未実装** | grep `reactivat` → repository / route ヒット 0 |
| physical delete | **未実装**（`DELETE FROM tag_definitions` 不在） | grep `DELETE FROM tag_definitions` → 0 |
| route lifecycle | `GET` / `POST` / `PATCH` / `DELETE`(論理) のみ | `apps/api/src/routes/admin/tags.ts:110-203` |
| audit action union | `admin.tag.created` / `updated` / `deactivated` | `tags.ts:92` |
| `member_tags` FK | **DB-level FOREIGN KEY なし**。`PRIMARY KEY (member_id, tag_id)` のみ | `apps/api/migrations/0002_admin_managed.sql:43-51` |
| `AuditTargetType` | 既に `"tag"` を含む | `apps/api/src/repository/auditLog.ts:8-15` |
| `AuditAction` | `RepoBrand<string>`（enum なし） | `apps/api/src/repository/_shared/brand.ts:27` |

### 結論（問題の解決状況）

- Issue #1070 の 2 つの成果物（reactivate endpoint / physical delete）は **どちらも未実装**。別タスクでも解消されていない。
- よって **Issue は未解決・対応必要**。Issue は CLOSED だが、本仕様は CLOSED を維持したまま作成する（reopen しない）。

## 1.2 Issue の現行コードへの最適化

Issue 本文は issue-1035 の logical-delete contract を前提とするが、issue-1035 は landed 済み。以下を現行コードに合わせて最適化する。

1. **AC-3 の参照整合**: `member_tags` に `tag_definitions` への DB-FK が無いため、`ON DELETE RESTRICT/CASCADE` は使えない。physical delete のガードは **アプリ層 `COUNT(*) FROM member_tags WHERE tag_id`** とし、`>0` は 409 拒否（孤児化禁止）。
2. **AC-2 の code conflict**: reactivate は `tag_id` で同一 row の `active` を戻すだけで UNIQUE `code` 列に触れないため、**code conflict は構造的に発生しない**。Issue が言及する code conflict は「reactivate しようとした tag の code が、deactivate 中に別の active tag に再利用されていた場合」を懸念しているが、現行 create は `code` UNIQUE 制約で active/inactive を問わず重複を弾く（論理削除 row も UNIQUE 占有を維持）ため、deactivate 中に同 code の別 tag は作成できない。よって reactivate 時 code conflict 不在を **根拠付きで spec 化** する。
3. **physical と logical の違い**: logical delete は `code` UNIQUE を占有し続ける（再利用不可）。physical delete は row を消すため `code` を解放する（再作成可能）。この違いが「両 lifecycle op が必要」な運用根拠。

## 1.3 受け入れ基準（実装写像）

| ID | 受け入れ基準 | 実装写像 |
|----|-------------|----------|
| AC-1 | reactivate / physical を別 endpoint に分離 | `POST /admin/tags/:tagId/reactivate` + `DELETE /admin/tags/:tagId/physical` |
| AC-2 | reactivate: active=0→1、not_found / code conflict を明確化 | `reactivateTagDefinition`：404 / idempotent no-op / active 復帰。code conflict 不在を根拠付き明記 |
| AC-3 | physical delete: 参照ありの扱い仕様化 | `countMemberTagReferences>0` → 409 `tag_has_references`、削除せず |
| AC-4 | physical delete: user approval marker + runbook | `physical-delete-runbook.md` + Phase 13 user approval marker、`governance_mutation_user_gate=true` |
| AC-5 | audit に before/after + actor | `admin.tag.reactivated` / `admin.tag.physically_deleted` を state 変化時のみ append |
| AC-6 | logical delete regression 維持 | 既存 `DELETE /admin/tags/:tagId`(active=0) + available `active=1` filter を regression test で固定 |

## 1.4 非機能・制約

- D1 直接アクセスは `apps/api` に閉じる（CLAUDE.md invariant #5）。
- 新 migration 不要（schema 変更なし）。
- `apps/web` 非接触（NON_VISUAL）。
- physical delete production runtime は不可逆 → user-gated（`references/non-visual-irreversible-task-rules.md` 適用）。

## 1.5 単一責務分解

| 責務 | 配置 | 種別 |
|------|------|------|
| reactivate 永続化 | `tagDefinitions.ts#reactivateTagDefinition` | 新規 |
| 参照件数取得 | `tagDefinitions.ts#countMemberTagReferences` | 新規 |
| physical delete 永続化（ガード込み） | `tagDefinitions.ts#physicalDeleteTagDefinition` | 新規 |
| reactivate endpoint | `tags.ts` `POST /tags/:tagId/reactivate` | 新規 |
| physical delete endpoint | `tags.ts` `DELETE /tags/:tagId/physical` | 新規 |
| audit action 拡張 | `tags.ts` `appendTagAudit` union + ERROR_TO_STATUS | 編集 |
| 正本 spec 同期 | `specs/01-api-schema.md` | 編集 |
