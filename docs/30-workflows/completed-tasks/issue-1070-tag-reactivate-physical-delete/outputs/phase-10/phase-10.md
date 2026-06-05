# Phase 10: 最終レビュー / Gate 判定

> AC-1..AC-6 を実装箇所・テストへ写像して達成可否を確認し、既存 contract 非破壊・4 条件最終判定・実装着手前の残課題を確定する。MINOR 指摘は Phase 12 unassigned-task-detection へ切り出す。本タスクは spec_created（仕様確定）であり、local 実装・検証は後続 03.実装 サイクルおよび Phase 11 証跡で行う。

## 成果物

reactivate + physical delete 設計（Phase 2-3 で凍結した実装契約 SSOT）の最終レビュー結果。AC 最終写像表・既存 contract 非破壊確認・4 条件最終判定・残課題（スコープ外の理由明記）・未タスク候補予告。

## 1. AC 最終写像チェックリスト（AC → 実装箇所 → 検証テスト）

| AC | 内容 | 実装箇所 | 検証テスト | 判定 |
|----|------|---------|-----------|------|
| AC-1 | reactivate / physical を同一 endpoint に混ぜず contract 分離 | `routes/admin/tags.ts`：`POST /tags/:tagId/reactivate`（action sub-resource）+ `DELETE /tags/:tagId/physical`（静的セグメント分離）。既存 `PATCH /tags/:tagId` / `DELETE /tags/:tagId`（論理）は不変 | `tags.lifecycle.contract.spec.ts`：両 endpoint の独立 contract / `tags.contract.spec.ts`：論理 DELETE 非破壊 | ✅ 写像済 |
| AC-2 | reactivate: `active=0→1`、not_found / code conflict を明確化 | `repository.reactivateTagDefinition`（`getTagDefinitionByIdRaw`→null=404 / 既 active=idempotent no-op / `UPDATE active=1 WHERE active=0`）。UNIQUE `code` 非接触のため code conflict 構造的不在 | lifecycle contract：200 復帰 / 404 / 既 active で audit 0 / repository：active=0→1 + 既 active no-op の `changed` 算出 | ✅ 写像済 |
| AC-3 | physical delete: `member_tags` 参照ありの扱い仕様化 | `repository.physicalDeleteTagDefinition`（`countMemberTagReferences>0`→`{ok:false, reason:"has_references", referenceCount}`）+ route が 409 `tag_has_references`+`referenceCount`。DB-FK 不在のため application-level count が唯一の防壁 | lifecycle contract：参照あり→409+referenceCount / repository：参照あり tag は行残存 + member_tags 不変（孤児化禁止） | ✅ 写像済 |
| AC-4 | physical delete: user approval marker + runbook | `governance_mutation_user_gate=true` / `outputs/phase-12/physical-delete-runbook.md` / Phase 13 user approval marker。production mutation のみ user-gated | Phase 9 §6 安全性レビュー / Phase 12 runbook | ✅ 写像済 |
| AC-5 | audit に reactivate / physical delete の before/after + actor | `appendTagAudit`（`targetType:"tag"`）に `admin.tag.reactivated`（`{active:false}→{active:true}`）/ `admin.tag.physically_deleted`（削除前 full row→`null`）。state 変化時のみ append | lifecycle contract：復帰/削除成功で audit 1 / no-op reactivate・409 physical で audit 0 | ✅ 写像済 |
| AC-6 | Issue #1035 の logical delete regression が退化しない | 既存 `DELETE /tags/:tagId`（active=0）・`GET /admin/tags` の available `active=1` filter を無変更で維持。physical を別パス `/physical` に分離し干渉させない | `tags.contract.spec.ts`（regression）：論理 DELETE 204+active=0 / available filter 固定 | ✅ 写像済 |

## 2. 既存 contract 非破壊の最終確認

| 既存 contract | 非破壊根拠 | 固定手段 |
|--------------|-----------|---------|
| `DELETE /admin/tags/:tagId`（論理・active=0） | physical を静的セグメント `/physical` に分離。Hono は `/tags/:tagId/physical` を `:tagId` パラメータより具体的なパスとして別解決（prefix 衝突なし） | `tags.contract.spec.ts` regression で 204+active=0 を固定 |
| `POST /admin/tags`（create） | reactivate は `POST /tags/:tagId/reactivate` の別パス。create 本文 schema・409 `tag_code_conflict` 不変 | 既存 contract spec 維持 |
| `PATCH /admin/tags/:tagId`（label/category） | reactivate を PATCH に混ぜないため no-op / audit 条件が明確に保たれる。PATCH 本文 schema 不変 | 既存 contract spec 維持 |
| `GET /admin/tags`（available `active=1` filter） | reactivate で active=1 に戻った tag が available に再出現する想定挙動を維持。filter ロジック無変更 | regression で reactivate 後 available 再出現を確認 |
| `auditLog` append/export | `AuditAction` = `RepoBrand<string>`（enum なし）のため新 action 追加で brand 型変更不要。`AuditTargetType` は `"tag"` 既存 | `auditLog.repository.spec.ts` regression |

> 新 endpoint は既存 `adminTagsRoute` 内追加で `index.ts` の mount 行は増えず（再利用）、migration 不要・`apps/web` 非接触。外部 surface への破壊変更ゼロ。

## 3. 4 条件最終判定

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | reactivate 経路の欠落（一度 deactivate した tag を API で復活できない）を解消。physical delete で誤作成 tag を安全に完全削除し `code` を解放。logical のみでは復活不能・code 占有残存という運用課題を解決 |
| 実現性 | PASS | issue-1035 の create/update/deactivate + audit + contract test に完全な前例。`reactivateTagDefinition` は `deactivateTagDefinition` の対称形。migration 不要・brand 型変更不要・route literal union 拡張のみ |
| 整合性 | PASS | logical delete regression 保持。参照ガード（application-level count）で孤児化禁止。physical/logical の code 占有差を spec 明記。DB-FK 不在を application-level count で補完 |
| 運用性 | PASS | audit 記録で監査運用。physical delete は不可逆 → runbook + `governance_mutation_user_gate=true` で保護。reactivate は idempotent で再送安全 |

## 4. blocker 判定（CONST_007 充足）

- 変更対象は `apps/api` の repository 1 ファイル編集（lifecycle 3 関数 + 型）+ route 1 ファイル編集（2 endpoint + audit union + `ERROR_TO_STATUS`）+ spec 1 節 + test 2 ファイル新規。**外部依存・前提タスク待ちは無い**（親 issue-1035 完了済）。
- 設計上の未確定点（reactivate code conflict 不在 / 参照ガード方式 / physical-logical 分離）は Phase 3 で解消・凍結済み。
- routing 衝突（`/tags/:tagId` vs `/tags/:tagId/physical`）は静的セグメント優先 + regression test で解消方針確定済み。
- → **本サイクル内で全 AC を 1 実装サイクルで完了できる。blocker 無し（CONST_007 充足）**。physical delete の production runtime mutation のみ user-gated（コード/test は本サイクルで完了）。

## 5. 実装着手前の残課題（スコープ外・理由明記）

| # | 残課題 | スコープ外の理由 | 実施時期 / 場所 |
|---|--------|-----------------|----------------|
| R-1 | **physical delete 強制移行 migration**（参照あり tag を強制削除する場合の member_tags 移行） | 参照あり tag の強制削除 + member_tags 移行は **不可逆かつ運用合意が必要**。本サイクルは 409 拒否 + runbook 記載に留め孤児化を作らない方が安全。CONST_007 例外条件①②（合意未済の仕様分岐）に該当 | 要件確定後の **別 Issue** / 新 migration + runbook |
| R-2 | **admin UI からの reactivate / physical delete 導線**（`apps/web`） | 本 issue の AC に UI は含まれない（NON_VISUAL / API only）。inline-create UI は followup-001（#1068）の関心事 | #1068 系の別タスク / `apps/web` |
| R-3 | **`member_tags` への DB-level FOREIGN KEY 追加** | 現行 schema は FK なし。FK 追加は既存 seed/ingest 影響評価が必要で、本サイクルは application-level guard を正本とする | 要評価後の別 migration |

## 6. 未タスク候補の予告（Phase 12 unassigned-task-detection へ）

上記 R-1..R-3 は MINOR（本 AC を阻害しない）であり、Phase 12 の `unassigned-task-detection.md` に未タスク候補として登録する。`code` rename（followup-002 / #1069）は別関心事として既に切り出し済み。本サイクルでは R-1..R-3 を**実装しない**。

## 7. Gate 判定

| Gate | 判定 | 備考 |
|------|------|------|
| Gate-A（設計レビュー） | **PASS** | Phase 3 で AC 網羅・4 条件・既存 contract 非破壊を確定し実装契約を凍結 |
| Gate-B（品質保証） | **pending** | spec_created。focused D1 Vitest / typecheck / lint は実装後に Phase 11 で実測（Gate-B 証跡） |
| Gate-C（最終レビュー） | **PASS（設計）** | AC 最終写像・残課題切り出し完了。実装後の最終確認は実装サイクルで再判定 |

## 8. runtime boundary

本 Phase は設計最終レビュー。実装・focused D1 Vitest・typecheck・lint は後続 03.実装 サイクルで実施し Phase 11 に記録する。staging deploy / runtime smoke / **physical delete の production mutation** / commit / push / PR / Issue #1070 状態変更（CLOSED 維持）は user-gated。
