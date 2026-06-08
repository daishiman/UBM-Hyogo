# Phase 7: カバレッジ確認

> 変更ブロック（追加 2 関数 `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` + route `migrateTo` 分岐 + 新 error code）のカバレッジ対象範囲・分岐網羅・実測方針を記録する。
> 実装と focused D1 Vitest は本サイクルで完了済み。本 Phase は coverage 観点と focused evidence の境界を記録する。

## 1. カバレッジ対象範囲（変更ファイルに限定 / FB-BEFORE-QUIT-002）

カバレッジは「本タスクで追加した関数・route 分岐」のみを評価対象とする。広域（`apps/api/**` 全体）指定はしない（既存コードの未カバー行を巻き込まないため、変更ブロックの実測値を残す）。

| # | ファイル | カバレッジ対象 | 対象外（除外理由） |
|---|---------|---------------|-------------------|
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 新規 2 関数（`migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition`）+ 型 `ForceMigrateAndPhysicalDeleteTagResult` | 既存 `countMemberTagReferences`(`:210-216`) / `physicalDeleteTagDefinition`(`:223-237`) / `getTagDefinitionByIdRaw` / `reactivateTagDefinition`（issue-1070/1035 landed）は **再利用のみ・無変更**。型定義は非実行行 |
| 2 | `apps/api/src/routes/admin/tags.ts` | `DELETE /tags/:tagId/physical` の `migrateTo` 分岐追加（既存無指定経路は保持）+ `ForceMigrateAndPhysicalDeleteTagResult.reason`→error code switch + `ERROR_TO_STATUS` 3 行追加（`migration_target_not_found`/`migration_target_inactive`/`migration_target_same_as_source`）+ `appendTagAudit("admin.tag.references_migrated")` 呼び出し | 既存 `migrateTo` 無指定経路（`physicalDeleteTagDefinition` 直呼び・404/409/204）は issue-1070 landed の **無変更分**。GET/POST/PATCH/DELETE(logical)/reactivate route は無変更 |
| 3 | `apps/api/src/repository/auditLog.ts` | **対象外**（`AuditTargetType` は既に `"tag"` を含む。新 action `admin.tag.references_migrated` は `AuditAction = RepoBrand<string>` で enum 変更不要） | — |
| 4 | `docs/.../01-api-schema.md` | **対象外**（spec doc。実行行を生まない） | ドキュメント |

## 2. 追加 2 関数 + route 分岐の網羅表

各 reason 分岐・SQL 衝突パスを 1 ケース以上で網羅する。テストケース ID は Phase 4（repository）/ Phase 6（contract）と整合する。

### 2.1 repository 関数

| 対象 | concern | 分岐（branch） | カバーするケース | line / branch 目標 |
|------|---------|---------------|-----------------|-------------------|
| `migrateMemberTagReferences` | 参照付け替え + PK 衝突吸収 | (a) 全 member 非衝突（src のみ保有）→ 全件 dest へ移動 / (b) 一部 member が dest 既保有（衝突）→ `INSERT OR IGNORE` で重複生成せず src 行 DELETE / (c) src 参照 0 → `migratedCount=0`（no-op） | M-1 / M-2 / M-3 | 100% / 100%（3 分岐） |
| `forceMigrateAndPhysicalDeleteTagDefinition` | 検証 → 移行 → 再検証 → 削除の二段 | (a) src 不在 → `not_found` / (b) dest 不在 → `target_not_found` / (c) dest 非 active → `target_inactive` / (d) `src===dest` → `same_as_source` / (e) 正常 → 移行 + `count===0` 再検証 + 物理削除 → `{ok:true, migratedCount, row}` / (f) 移行後 `count!==0`（防御異常）→ `has_references`+`referenceCount` | F-1 / F-2 / F-3 / F-4 / F-5, F-6 / F-7 | 100% / 100%（6 分岐） |

> 合計 repository 分岐 = 9。各分岐に最低 1 ケース割当済（Phase 4 + Phase 6）。`forceMigrateAndPhysicalDeleteTagDefinition` の `has_references`（移行後も src 参照が残る）は DB-FK 不在前提の防御パスであり、通常の D1 batch 成功時には到達しない。実測で意図的に再現できない場合は branch coverage 計上から除外し、コメントで「移行 batch 失敗時の防御 guard・到達不能」を明示する。同様に `same_as_source` 等の早期検証は src 検証より前に判定するため、検証順は Phase 5 実装で固定する。

### 2.2 route endpoint（`DELETE /tags/:tagId/physical`）

| 対象 | concern | 分岐（branch） | カバーするケース | line / branch 目標 |
|------|---------|---------------|-----------------|-------------------|
| `migrateTo` 無指定 | issue-1070 既存経路（AC-7 退化防止） | (a) not_found → 404 / (b) refs>0 → 409 `tag_has_references`+`referenceCount` / (c) refs=0 → 204 + audit `physically_deleted` | C-R1 / C-R2 / C-R3（= 既存 regression を再固定） | 100% / 100%（3 分岐） |
| `migrateTo` 指定 | 強制移行経路（新規） | (a) `not_found` → 404 `tag_not_found` / (b) `target_not_found` → 404 `migration_target_not_found` / (c) `target_inactive` → 409 `migration_target_inactive`+`migrateTo` / (d) `same_as_source` → 400 `migration_target_same_as_source` / (e) 正常 → 204 + audit 2 件（`references_migrated` → `physically_deleted`） / (f) `has_references` → 409 `tag_has_references`+`referenceCount` | C-M1 / C-M2 / C-M3 / C-M4 / C-M5, C-M6, C-M7 / C-M8 | 100% / 100%（6 分岐） |

> 合計 route 分岐 = 10。`appendTagAudit` の action union 拡張（`admin.tag.references_migrated`）は型のみ（実行分岐は正常経路 C-M5 で網羅）。`ERROR_TO_STATUS` 追加 3 code は C-M2/C-M3/C-M4 で各 1 回通過。空白のみ `migrateTo`（trim 後に空文字 → 404 `migration_target_not_found`）境界は C-M0 で固定（移行・削除・audit なし）。

## 3. 変更行の branch を 100% で保護する実測方針（FB-Feedback-5）

以下の「変更ブロックに固有の分岐」を repository / contract test で **全網羅** し、coverage report の該当行 branch が 100% であることを実測値として残す:

- **SQL 衝突吸収 3 variant**: 非衝突のみ（M-1）/ 一部衝突（M-2・`INSERT OR IGNORE` のスキップ通過）/ 参照 0（M-3・`migratedCount=0`）の 3 経路。AC-2 の孤児化禁止に直結。
- **`migratedCount` 一致**: `DELETE FROM member_tags WHERE tag_id=src` の 移行前 source 参照数 が「src から消えた行数（衝突分含む元参照数）」と一致することを実測（FB-CRONVL-001 / Phase 2 §2.3）。
- **移行先検証 4 variant**: `not_found` / `target_not_found` / `target_inactive` / `same_as_source` の各 reason → 公開 error code（Phase 2 §2.8 変換表）への写像 4 経路。
- **二段 audit 件数**: 強制移行成功時のみ audit 2 件（`references_migrated` 先・`physically_deleted` 後）。検証失敗時は audit 0 件（append 分岐の false 側通過）。
- **AC-7 退化防止**: `migrateTo` 無指定経路の 404/409/204 + audit 1 件（`physically_deleted` のみ）が issue-1070 と完全一致（C-R1..C-R3）。
- **移行後再検証 guard**: 正常時は `count===0` を通過して削除（F-5）。`has_references`（F-7）は防御パスで到達不能時はコメント除外。

> 実装サイクルでは、これら分岐に各 1 ケース以上を割り当て、未通過 branch（coverage report の `Uncovered Line #s`）が変更ブロックに残らないことを確認する。残った場合は test を追加する。

## 4. カバレッジ取得コマンド（targeted・D1 config 必須）

全件実行は重い（FB-UI-02-2）ため、対象 spec のみで coverage を取得する:

```bash
mise exec -- pnpm exec vitest run --coverage --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

> 変更は既存 spec ファイル（`tagDefinitions.write.repository.spec.ts` / `tags.contract.spec.ts`）への **ケース追記** であり新 spec ファイルを増やさない（Phase 2 §2.7 contract surface 最小化方針に整合）。新規 repository 関数のテストは write repository spec に、強制移行 endpoint contract は既存 contract spec に追記する。

## 5. 想定カバレッジ・未到達分岐が無いことの確認手順

| 区分 | 想定 | 確認手順 |
|------|------|----------|
| repository 2 関数 line | 100%（防御 `has_references` 除く） | coverage report で `tagDefinitions.ts` の追加 2 関数行に未カバー無し |
| repository 9 分岐 | 100% | §2.1 の各 (a)..(f) に対応ケースが PASS していること |
| route `migrateTo` 分岐 line | 100% | coverage report で `DELETE /tags/:tagId/physical` handler の新分岐に未カバー無し |
| route 9 分岐 | 100% | §2.2 の各 variant（無指定 3 + 指定 6）に対応ケースが PASS |
| 未到達分岐 | 0（防御 `has_references` のみ除外） | report の `Uncovered Line #s` が変更ブロックに残らないこと。残れば §3 の対応 case を追加 |

確認手順:
1. §4 のコマンドで coverage 取得。
2. report の `tagDefinitions.ts` / `tags.ts` 行を確認し、追加 2 関数 + route `migrateTo` 分岐の `Uncovered Line #s` が空であることを確認。
3. `forceMigrateAndPhysicalDeleteTagDefinition` の `has_references` 防御パス（移行 batch 失敗時のみ到達）が D1 で意図再現できない場合のみ未到達を許容し、コメントで実行不能を明示する。
4. それ以外に未到達がある場合、§2/§3 の対応ケースを Phase 6 spec へ追記して再取得。

## 6. runtime boundary

focused D1 Vitest（`vitest.d1.config.ts`）の PASS を一次証跡とする。coverage 数値のフル取得はコストが高いため、本 wave では対象テスト PASS を主証跡とし、未通過 branch が疑われる場合のみ §4 の coverage command で追加取得する。staging runtime smoke / production 強制移行・physical delete（不可逆）/ PR は user-gated。

## 7. 成果物

| 成果物 | 内容 |
|--------|------|
| 分岐網羅表 | §2（repository 9 分岐 + route 9 分岐、各ケース対応付き） |
| カバレッジ取得方針 | §3 / §4（targeted・D1 config 必須・既存 spec へ追記） |
| 未到達分岐 0 の確認手順 | §5（防御 `has_references` のみ除外を明示） |
