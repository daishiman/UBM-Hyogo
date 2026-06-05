# Phase 3: 設計レビュー（Gate-A）

Phase 2 設計を 4 条件 + AC 網羅 + 既存 contract 非破壊で検証する。本 Phase 完了をもって Gate-A passed とし、実装契約を凍結する。

## 3.1 AC 網羅レビュー

| AC | 設計対応 | 判定 |
|----|----------|------|
| AC-1 endpoint 分離 | reactivate=POST sub-resource / physical=DELETE `/physical`。PATCH・logical DELETE と非混在 | PASS |
| AC-2 reactivate + conflict | `reactivateTagDefinition` 404/no-op/復帰。code conflict 不在を根拠付き明記（UNIQUE code 非接触） | PASS |
| AC-3 参照ガード | DB-FK 不在 → `countMemberTagReferences>0` で 409 拒否・孤児化禁止 | PASS |
| AC-4 user gate + runbook | `governance_mutation_user_gate=true` / runbook / Phase 13 approval marker | PASS |
| AC-5 audit | reactivated / physically_deleted を state 変化時のみ append、before/after + actor | PASS |
| AC-6 logical regression | 既存 `DELETE /tags/:tagId`(active=0) 不変・regression test 固定 | PASS |

## 3.2 既存 contract 非破壊レビュー

- `app.delete("/tags/:tagId")`（論理）と `app.delete("/tags/:tagId/physical")` は Hono のルーティングで別解決。`/physical` は静的セグメントで `:tagId` パラメータと衝突しない（より具体的なパスが優先）。**regression test で `/tags/:tagId` の 204+active=0 を固定** して保証する。
- `POST /tags/:tagId/reactivate` は既存 `POST /tags`（create）と異なるパス。衝突なし。
- `PATCH /tags/:tagId`（label/category）は不変。reactivate を PATCH に混ぜないため no-op/audit 条件が明確に保たれる。

## 3.3 4 条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | reactivate 経路の欠落を解消。physical delete で誤作成 tag を安全に完全削除（code 解放）。logical のみでは復活不能・code 占有が残る運用課題を解決 |
| 実現性 | PASS | issue-1035 の create/update/deactivate + audit + contract test に完全な前例。`reactivateTagDefinition` は `deactivateTagDefinition` の対称形。migration 不要。`AuditAction` brand 型変更不要 |
| 整合性 | PASS | logical delete regression 保持。参照ガードで孤児化禁止。physical/logical の code 占有差を spec に明記。route literal union のみ型拡張 |
| 運用性 | PASS | audit 記録で監査運用。physical delete は不可逆 → runbook + user gate で保護。reactivate は idempotent で再送安全 |

## 3.4 リスクと対策（設計確定）

| リスク | 影響 | 対策（設計に反映済み） |
|--------|------|------------------------|
| physical delete で member_tags 孤児化 | 高 | 参照>0 は **削除前に 409 拒否**。強制移行は別 migration/runbook（本サイクル外・理由明記） |
| logical delete contract 破壊 | 高 | physical を別パス `/physical` に分離。既存 `DELETE /tags/:tagId` regression test 維持 |
| reactivate と available list 不整合 | 中 | `tag_id` を正に active=1 へ戻す。`GET /admin/tags` / available list の active filter を regression test で確認 |
| AI が physical delete を自動実行 | 高 | `governance_mutation_user_gate=true`、production mutation は Phase 13 user-gated、runbook に user approval marker |
| reactivate 時 code conflict 誤実装 | 低 | UNIQUE code 非接触で構造的に発生しない旨を spec 化（spurious 409 path を作らない） |

## 3.5 凍結する実装契約（SSOT）

1. repository 追加: `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` / `PhysicalDeleteTagDefinitionResult`。
2. route 追加: `POST /tags/:tagId/reactivate` / `DELETE /tags/:tagId/physical`、audit union + `tag_has_references:409`。
3. test: `tagDefinitions.lifecycle.repository.spec.ts`（D1）/ `tags.lifecycle.contract.spec.ts`。regression: `tags.contract.spec.ts`。
4. spec doc: `specs/01-api-schema.md` に reactivate / physical delete + 参照ガード不変条件。
5. migration 不要・`apps/web` 非接触。

**Gate-A: PASS。** 実装契約を凍結し Phase 4 以降へ進む。
