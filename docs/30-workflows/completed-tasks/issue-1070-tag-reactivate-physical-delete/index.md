# issue-1070 — tag master reactivate + physical delete 運用要件（実装仕様書）

> **実装区分: 実装仕様書**（コード実装を伴う。CONST_004 デフォルト準拠）
> tag master (`tag_definitions`) の **reactivate endpoint** と **physical delete（参照ガード付き）** を `apps/api` に追加する実装仕様。Issue #1070（= followup-003）の AC-1..AC-6 を route / repository / audit / 正本 spec / focused D1 Vitest へ写像する。physical delete は不可逆操作のため `physical deletion 2-stage`（コードは参照ガード込みで実装可能・production runtime mutation のみ user-gated）として設計する。commit / push / PR / staging runtime / production tag 物理削除 / Issue 状態変更は user-gated。

## 実装区分の判定根拠（CONST_004）

- Issue #1070 のラベルは `type:requirements`（要件タスク）だが、AC-1..AC-6 は **endpoint contract・repository 関数・audit・参照整合ガード** を要求しており、コード変更なしでは目的（reactivate 経路の提供・physical delete の安全な実現）を達成できない。
- よって **デフォルトの実装仕様書** として作成する（ラベルより実態優先）。
- physical delete の **production 実行のみ** が不可逆かつ user-gated。endpoint コード・参照ガード・audit・tests は本サイクルで実装可能であり、先送りしない（CONST_007 準拠）。

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | `TASK-ISSUE-1070-TAG-REACTIVATE-PHYSICAL-DELETE` |
| Issue | [#1070](https://github.com/daishiman/UBM-Hyogo/issues/1070)（**CLOSED 維持**・reopen しない） |
| source unassigned-task | `docs/30-workflows/completed-tasks/task-issue-1035-followup-003-tag-reactivate-physical-delete.md` |
| 親ワークフロー | `issue-1035-tag-master-write-endpoints`（completed） |
| 分類 | implementation / API endpoint / admin tag master lifecycle |
| 視覚証跡 | NON_VISUAL（API only / `apps/web` 非接触） |
| 不可逆区分 | `physical deletion 2-stage`（`references/non-visual-irreversible-task-rules.md` 適用） |
| workflow_state | `implemented_local_evidence_captured`（local 実装・focused D1 Vitest・typecheck・lint・正本 spec 同期完了） |
| implementation_mode | `new`（既存 read-only repository + logical-delete route に lifecycle write を追加） |
| governance_mutation_user_gate | `true` |

## 真の論点（要件レビュー一次結論）

1. **問題は未解決・対応必要**: 現行コード（`tagDefinitions.ts` / `routes/admin/tags.ts`）を精査した結果、reactivate 関数・physical delete（`DELETE FROM tag_definitions`）はいずれも **未実装**。tag master の lifecycle は `deactivateTagDefinition`（`active=0` 論理削除）のみで、一度棚から下げた tag を API 経由で復活させる経路が存在しない。別タスクでも解消されていない（全ブランチ grep で `reactivat` / `physical` / `DELETE FROM tag_definitions` のヒット 0）。
2. **Issue の現行コード最適化**: Issue #1070 本文は issue-1035 の logical delete contract を前提とするが、その後 issue-1035 は landed 済み（`deactivateTagDefinition` / `DELETE /admin/tags/:tagId` が実在）。本仕様は **現行コードを正本** として AC を写像する。特に AC-3 の「`member_tags` 参照整合」は、`member_tags` に `tag_definitions` への **DB-level FOREIGN KEY が存在しない**（`PRIMARY KEY (member_id, tag_id)` のみ・`migrations/0002_admin_managed.sql:43`）ため、`ON DELETE` に頼れず **アプリ層の参照件数ガードが必須** である点を設計核心とする。
3. **責務境界**: route → repository（既存 admin tag route の慣例に一致・use-case 層なし）。`apps/web` 非接触。新 migration 不要（schema 変更なし）。
4. **reactivate と physical delete を同一 endpoint に混ぜない（AC-1）**: reactivate は `POST /admin/tags/:tagId/reactivate`（action sub-resource）、physical delete は `DELETE /admin/tags/:tagId/physical`（既存 logical `DELETE /admin/tags/:tagId` と分離）。PATCH(label/category) / logical DELETE の no-op・audit 条件を曖昧化させない。
5. **4 条件評価**: 価値性=PASS（reactivate 経路の欠落解消・誤作成 tag の安全な完全削除）／実現性=PASS（issue-1035 の create/update/deactivate + audit + contract test に完全な前例・migration 不要）／整合性=PASS（logical delete regression を保持・参照ガードで孤児化禁止・`code` 解放は physical のみ）／運用性=PASS（audit 記録・physical delete は runbook + user gate で不可逆操作を保護）。

## スコープ（Issue #1070 AC-1..AC-6）

| AC | 内容 | 本仕様の確定方針 |
|----|------|------------------|
| AC-1 | reactivate と physical delete を同一 endpoint に混ぜず contract 分離 | reactivate=`POST /admin/tags/:tagId/reactivate`、physical=`DELETE /admin/tags/:tagId/physical`。既存 PATCH / logical DELETE は不変 |
| AC-2 | reactivate は `active=0` の tag を `active=1` に戻し、code conflict / not_found を明確に扱う | `reactivateTagDefinition`：not_found→404、既に active→idempotent no-op（audit 発火せず）、active=0→active=1 して audit。`code` は不変なので reactivate 時の code conflict は構造的に発生しない（同一 row を戻すだけ）→根拠を spec に明記 |
| AC-3 | physical delete は `member_tags` 参照ありの扱い（拒否 or 明示移行）が仕様化 | `member_tags WHERE tag_id` を count し、`>0` なら **409 `tag_has_references`** で拒否（孤児化禁止）。強制移行は別 migration/runbook を要求（本サイクル外・runbook に明記） |
| AC-4 | physical delete 実装時は user approval marker + runbook を持つ | production tag 物理削除 runtime は user-gated。`outputs/phase-12/physical-delete-runbook.md` + `outputs/phase-13/` user approval marker を規定 |
| AC-5 | audit に reactivate / physical delete の before/after + actor が残る | `admin.tag.reactivated`（before `{active:false}` / after `{active:true}`）、`admin.tag.physically_deleted`（before = 削除前 full row / after `null`）。state 変化時のみ append |
| AC-6 | Issue #1035 の logical delete regression が退化しない | 既存 `DELETE /admin/tags/:tagId`（active=0）・available list の `active=1` filter を regression test で維持 |

## スコープ外（理由を明記・CONST_007）

- **`member_tags` 強制移行 migration**: physical delete で参照ありの tag を強制削除する場合の member_tags 移行は **不可逆かつ運用合意が必要** なため、本サイクルでは 409 拒否 + runbook 記載に留める（孤児化を作らない方が安全）。実施時期=要件確定後の別 Issue、実施場所=新 migration + runbook。CONST_005 例外条件①②に該当（合意未済の仕様分岐）。
- **admin UI からの reactivate / physical delete 導線**（`apps/web`）: issue-1035 followup-001（#1068）の関心事。本 issue の AC に UI は含まれない。
- **`code` rename**: followup-002（#1069）の別関心事。

## 実装・検証結果（2026-06-03）

| 項目 | 結果 |
|------|------|
| API repository | `apps/api/src/repository/tagDefinitions.ts` に `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` + `PhysicalDeleteTagDefinitionResult` を追加 |
| API route | `apps/api/src/routes/admin/tags.ts` に `POST /admin/tags/:tagId/reactivate` / `DELETE /admin/tags/:tagId/physical`、`tag_has_references:409`、audit action 2 件を追加 |
| 正本 API spec | `docs/00-getting-started-manual/specs/01-api-schema.md` の不変条件 #13 / endpoint / 冪等性 / audit action を同期 |
| focused D1 Vitest | PASS: 2 files / 15 tests |
| API typecheck | PASS: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| repo lint | PASS: `mise exec -- pnpm lint` |
| user-gated 残 | staging runtime smoke、production tag 物理削除 mutation、commit、push、PR、Issue state change |

## Phase 一覧

| Phase | 名称 | 出力 |
|-------|------|------|
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` |
| 5 | 実装 | `outputs/phase-5/phase-5.md` |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント同期 | `outputs/phase-12/main.md` ほか strict 7 + runbook |
| 13 | commit-pr-release | `outputs/phase-13/phase-13.md`（user-gated） |

## 正本順位（衝突時）

1. 本 workflow の `outputs/phase-{1,2,3}/*.md`（設計確定）
2. `docs/00-getting-started-manual/specs/01-api-schema.md`（不変条件 #13 / tag master endpoints）
3. 既存実装コード（`apps/api/src/repository/tagDefinitions.ts`・`routes/admin/tags.ts`・`repository/memberTags.ts`・`repository/auditLog.ts`）

## 関連タスク

| ID | 関係 | 状態 |
|----|------|------|
| issue-1035-tag-master-write-endpoints | 親（tag master CRUD・logical delete） | completed |
| issue-1035 followup-001 (= #1068) | 兄弟（admin tag inline-create UI） | spec_created |
| issue-1035 followup-002 (= #1069) | 兄弟（tag `code` rename） | spec_created |
| issue-1035 followup-003 (= #1070) | **本タスク**（reactivate + physical delete） | implemented_local_evidence_captured |
