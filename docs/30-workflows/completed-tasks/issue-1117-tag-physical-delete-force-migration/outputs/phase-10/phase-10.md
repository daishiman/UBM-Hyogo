# Phase 10: 最終レビュー / Gate 判定

> AC-1..AC-7 を実装箇所・テストへ写像して達成可否を確認し、既存 contract 非破壊（特に issue-1070 の `migrateTo` 無指定経路の退化防止）・4 条件最終判定・残課題・DoD を確定する。本タスクは `implemented_local_evidence_captured` であり、local 実装・検証は Phase 11 証跡で確認済み。

## 成果物

強制移行 + 物理削除設計（Phase 2-3 で凍結した実装契約 SSOT）の最終レビュー結果。AC 最終写像表・既存 contract 非破壊確認・4 条件最終判定・残課題（スコープ外の理由明記）・DoD・未タスク候補予告・Gate 判定。

## 1. AC 最終写像チェックリスト（AC → 実装箇所 → 検証テスト）

| AC | 内容 | 実装箇所 | 検証テスト | 判定 |
|----|------|---------|-----------|------|
| AC-1 | 移行先指定で `src` 参照を `dest` へ全件移行 | `repository.migrateMemberTagReferences(c,src,dest)`：`INSERT OR IGNORE INTO member_tags (...) SELECT ...,?dest,... FROM member_tags WHERE tag_id=?src` → `DELETE FROM member_tags WHERE tag_id=?src` を実行 → `{sourceReferenceCount,migratedCount}`（移行前 src 参照数） | `tagDefinitions.write.repository.spec.ts`：M-1 非衝突全件移動 / `tags.contract.spec.ts`：C-M5 204 + 移行件数 | ✅ 写像済 |
| AC-2 | `(member_id,dest)` PK 衝突を孤児なしで吸収 | `INSERT OR IGNORE` で衝突 member の dest 行を冪等確保（重複生成なし）→ `DELETE` で src 行一掃 → dest 側に集約。DB-FK 不在のため application-level SQL で完結 | repository spec M-2：衝突 member が dest に 1 行集約・src 行全消去・member_tags 件数整合 | ✅ 写像済 |
| AC-3 | 移行完了後 `src` 参照 0 のときのみ物理削除 | `forceMigrateAndPhysicalDeleteTagDefinition`：移行後 `countMemberTagReferences(src)===0` 再検証 → 0 のとき既存 `physicalDeleteTagDefinition(src)` 呼び出し（内部 guard で二重保証）。非 0 は `has_references` で中断 | repository spec F-5（正常二段）/ F-7（防御 has_references）/ contract C-M5（204）/ C-M8（409） | ✅ 写像済 |
| AC-4 | 移行・物理削除を audit 記録（件数・src/dest・実行者） | `appendTagAudit`（`targetType:"tag"`・actor 解決済み）に `admin.tag.references_migrated`（`{tag_id:src,dest,referenceCount}`→`{migratedCount,deleted:true}`）+ `admin.tag.physically_deleted`（full row→null）を成功時のみ 2 件 append | contract spec C-M5/C-M6/C-M7：audit 2 件 + 順序 + before/after shape。検証失敗時 audit 0 | ✅ 写像済 |
| AC-5 | 移行先不在 / 非 active / `src===dest` を明示拒否 | route `migrateTo` 分岐：`not_found`→404 `tag_not_found` / `target_not_found`→404 `migration_target_not_found` / `target_inactive`→409 `migration_target_inactive`+`migrateTo` / `same_as_source`→400 `migration_target_same_as_source`（Phase 2 §2.8 変換表）。`ERROR_TO_STATUS` 3 行追加 | contract spec C-M1/C-M2/C-M3/C-M4：各 status + error code | ✅ 写像済 |
| AC-6 | runbook に逆移行ロールバック方針を明文化 | `outputs/phase-12/force-migration-runbook.md`（移行前 `member_tags` snapshot 保全・逆移行 dest→src 手順・user approval marker）。`governance_mutation_user_gate=true` | Phase 9 §7 安全性レビュー / Phase 12 runbook | ✅ 写像済 |
| AC-7 | issue-1070 の 409 `tag_has_references` 拒否経路が退化しない | route handler 冒頭で raw query と trim 済み値を分け、`migrateTo` 未指定時だけ issue-1070 既存経路（404 / 409 `tag_has_references`+`referenceCount` / 204 + audit 1 件）を完全保持。強制移行経路と物理分離 | contract regression C-R1/C-R2/C-R3：無指定経路を issue-1070 と完全一致で固定 | ✅ 写像済 |

## 2. 既存 contract 非破壊の最終確認

| 既存 contract | 非破壊根拠 | 固定手段 |
|--------------|-----------|---------|
| `DELETE /admin/tags/:tagId/physical`（`migrateTo` 無指定・issue-1070） | handler 冒頭で raw query と trim 済み値を分け、未指定だけ既存経路をそのまま実行。空文字は 404 `migration_target_not_found` で副作用なし、空白付き ID は trim 後の値で強制移行する。新分岐は無指定経路に一切干渉しない | `tags.contract.spec.ts` regression（C-R1..C-R3）と trim contract で固定 |
| `DELETE /admin/tags/:tagId`（論理・active=0） | 強制移行は同 `/physical` パスの query 分岐であり論理 DELETE パスに非接触 | 既存 contract spec 維持 |
| `POST /admin/tags`（create）/ `PATCH /admin/tags/:tagId` / `POST /tags/:tagId/reactivate` | 本タスクで無変更 | 既存 contract spec 維持 |
| `auditLog` append/export | `AuditAction` = `RepoBrand<string>`（enum なし）のため新 action `admin.tag.references_migrated` 追加で brand 型変更不要。`AuditTargetType` は `"tag"` 既存 | contract spec の audit 2 件 assert |
| `member_tags` schema | 移行は application-level SQL のみ。DDL 変更・FK 追加なし | 新 migration ゼロ |

> 新 endpoint path・新 spec ファイルを増やさず既存 `adminTagsRoute` の `DELETE /tags/:tagId/physical` に query 分岐を足すのみ。`index.ts` mount 行・migration は増えない。外部 surface への破壊変更ゼロ。

## 3. 4 条件最終判定

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | 誤付与 tag の参照を正しい tag へ寄せてから完全削除する運用需要を満たす。issue-1070 では参照ありが常に 409 で arrest され、移行して消す経路が無かった課題を解消 |
| 実現性 | PASS | issue-1070 の physical delete + audit + contract test に完全な前例。`migration` 不要・brand 型変更不要・新 path 不要。SQL は標準 `INSERT OR IGNORE`/`DELETE` を `c.db.batch` 原子実行 |
| 整合性 | PASS | issue-1070 の 409 拒否経路を早期 return で温存（AC-7）。`INSERT OR IGNORE`+`DELETE` + 移行後 `COUNT=0` 再検証で孤児化禁止。状態所有権は repository に集約。DB-FK 不在を application-level SQL で補完 |
| 運用性 | PASS | audit に移行件数/src/dest/actor 記録。runbook に逆移行ロールバック（AC-6）。強制移行・物理削除の production mutation は user gate で不可逆操作を保護。冪等：再実行は src 不在で 404 |

## 4. blocker 判定（CONST_007 充足）

- 変更対象は `apps/api` の repository 1 ファイル編集（2 関数 + 型追加）+ route 1 ファイル編集（`migrateTo` 分岐 + audit union + `ERROR_TO_STATUS` 3 行）+ spec 1 節 + 既存 spec 2 ファイルへのケース追記。**外部依存・前提タスク待ちは無い**（親 issue-1070 完了済・`countMemberTagReferences` / `physicalDeleteTagDefinition` / `getTagDefinitionByIdRaw` landed）。
- 設計上の未確定点（移行 SQL 戦略 / 衝突吸収 / 移行先検証 / `migratedCount` 算出 / AC-7 退化防止）は Phase 2-3 で解消・凍結済み。
- `migrateTo` 無指定経路と強制移行経路の干渉は早期 return + regression test で解消方針確定済み。
- → **本サイクル内で全 AC を 1 実装サイクルで完了できる。blocker 無し（CONST_007 充足）**。強制移行・physical delete の production runtime mutation のみ user-gated（コード/test は本サイクルで実装可能）。

## 5. 実装着手前の残課題（スコープ外・理由明記）

| # | 残課題 | スコープ外の理由 | 実施時期 / 場所 |
|---|--------|-----------------|----------------|
| R-1 | **`member_tags` への DB-level FOREIGN KEY 追加** | スキーマ変更を伴う独立した大規模関心事。本サイクルの強制移行は application-level SQL で完結し FK 追加不要。既存 seed/ingest 影響評価が必要。CONST_005 例外①②（独立大規模・合意未済の仕様分岐） | 要評価後の **別 Issue** / 新 migration |
| R-2 | **admin UI からの強制移行 / 物理削除導線**（`apps/web`） | 本 issue の AC に UI は含まれない（NON_VISUAL / API only）。issue-1070 followup の別関心事 | followup 別タスク / `apps/web` |
| R-3 | **複数 dest への分割移行 / 条件付き移行** | 本 issue は単一 dest への全件移行のみが AC。条件分岐移行は合意未済の仕様拡張 | 要件確定後の別 Issue |

## 6. MINOR 指摘 / 未タスク候補の予告（Phase 12 unassigned-task-detection へ）

- 上記 R-1..R-3 は MINOR（本 AC を阻害しない）であり、Phase 12 の `unassigned-task-detection.md` に未タスク候補として登録する。本サイクルでは R-1..R-3 を **実装しない**。
- 設計起因の **MINOR 指摘: 0 件**（Phase 2-3 で contract を全凍結済み。`has_references` 防御パスの到達不能性は Phase 7 §2.1 でコメント除外方針確定済みであり仕様欠陥ではない）。

## 7. DoD（Definition of Done）

本タスク（実装サイクル）の完了条件。local 実装後の実測は Phase 11 で証跡化する。

| # | DoD 項目 | 判定基準 | 証跡 Phase |
|---|---------|---------|-----------|
| D-1 | ビルド成功 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` がエラー 0 | Phase 11 |
| D-2 | focused test PASS | `tagDefinitions.write.repository.spec.ts` + `tags.contract.spec.ts`（D1 config）が全 PASS（M-* / F-* / C-M* / C-R* 全ケース） | Phase 11 |
| D-3 | typecheck / lint 0 | `pnpm --filter @ubm-hyogo/api typecheck` + `pnpm lint` が共に違反 0 | Phase 11 |
| D-4 | AC 全充足 | AC-1..AC-7 が §1 写像表どおり実装・テストで担保 | Phase 11 |
| D-5 | 正本 spec 同期 | `docs/00-getting-started-manual/specs/01-api-schema.md` に `?migrateTo` endpoint・新 error code 3 種・新 audit action がコードと文字列一致で記載 | Phase 9 §6 / Phase 12 |
| D-6 | 孤児化禁止 / AC-7 退化防止 | 移行後 `COUNT=0` 再検証 + 衝突吸収が repository test で確認、`migrateTo` 無指定経路の 409 が regression test で固定 | Phase 11 |
| D-7 | HEX 直書きなし | 変更ファイルに HEX / `bg-[#...]` が 0 hit（Phase 9 §5） | Phase 11 |
| D-8 | runbook 作成 | `outputs/phase-12/force-migration-runbook.md`（逆移行手順 + user approval marker） | Phase 12 |
| D-9 | 不可逆 mutation の user gate 維持 | 強制移行・物理削除の production runtime mutation / commit / push / PR / Issue 状態変更を本サイクルで実行しない | Phase 13（user-gated） |

> 本サイクルは **`implemented_local_evidence_captured`**。D-1..D-8 は local 実装・証跡・runbook まで完了。D-9 の commit / push / PR と staging / production runtime は user-gated。Issue #1117 は CLOSED を維持する。

## 8. Gate 判定

| Gate | 判定 | 備考 |
|------|------|------|
| Gate-A（設計レビュー） | **PASS** | Phase 3 で AC-1..AC-7 網羅・4 条件・既存 contract 非破壊（AC-7 退化防止含む）を確定し実装契約を凍結 |
| Gate-B（品質保証） | **passed** | focused D1 Vitest 2 files / 25 tests、typecheck、lint は Phase 11/12 証跡で PASS |
| Gate-C（最終レビュー） | **PASS（設計）** | AC 最終写像・残課題切り出し・DoD 確定完了。実装後の最終確認は実装サイクルで再判定 |

> **blocker: 無し**。設計起因 MINOR 0 件。R-1..R-3 はスコープ外として Phase 12 へ切り出し。

## 9. runtime boundary

本 Phase は設計最終レビュー。実装・focused D1 Vitest・typecheck・lint・grep gate は本サイクルで実施し Phase 11/12 に記録済み。staging deploy / runtime smoke / **強制移行・physical delete の production mutation**（不可逆）/ commit / push / PR / Issue #1117 状態変更（CLOSED 維持）は user-gated。
