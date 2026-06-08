# Phase 8: リファクタリング

> GREEN 達成後に行う構造改善の方針を確定する。本タスクは強制移行（force-migration）+ 物理削除の二段経路を `apps/api` の既存 admin tag route / repository に **追加** するものであり、**過剰抽象を避け**、親 issue-1070 で確立済みの前例（`countMemberTagReferences` / `physicalDeleteTagDefinition` / `getTagDefinitionByIdRaw` / `appendTagAudit` / `fail` / `failWithBody` / `rowBody` / `ERROR_TO_STATUS` / `PhysicalDeleteTagDefinitionResult` 判別共用体）を再利用できる箇所のみ統一する。新規 primitive は増やさない。navigation drift は API task のため N/A。

## 成果物

強制移行 + 物理削除実装後に適用する構造改善の確定方針。いずれも **外部 contract（status code / response shape / audit 件数 / 既存 `migrateTo` 無指定経路）を不変** に保ち、Phase 4 / Phase 6 の contract・write repository test が GREEN のまま通ることを GREEN 維持条件とする。

## 1. リファクタリング項目（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 既存 `physicalDeleteTagDefinition` の再利用 | 強制移行の二段目（移行後の元 tag 削除）を `forceMigrateAndPhysicalDeleteTagDefinition` 内で `DELETE FROM tag_definitions` を再記述すると、issue-1070 のガード（not_found / has_references / DELETE）が二重実装になり drift する | `forceMigrateAndPhysicalDeleteTagDefinition` の削除段は **既存 `physicalDeleteTagDefinition(c, src)` をそのまま呼ぶ**。移行で参照を 0 にした後にこの関数が再度 `countMemberTagReferences` を実行 → 0 なら `{ok:true, row}` を返す。元 tag の削除ロジックは 1 箇所（issue-1070 実装）に集約 | 削除ガード・SQL の重複ゼロ。AC-3「参照 0 のときのみ削除」を既存関数の guard で **構造的に二重保証**（移行後再検証 + physical 内部の count）。**採用**（既存資産流用・低コスト） |
| 参照件数取得の再利用 | 移行後の `src` 参照 0 再検証で `SELECT COUNT(*) FROM member_tags` を新たに書く | 既存 `countMemberTagReferences(c, src)` をそのまま呼ぶ。移行 batch 後にこの関数で `=== 0` を確認し、非 0 なら `has_references` 防御 return | COUNT クエリの重複と drift を防止。DB-FK 不在の防壁（application-level count）を 1 関数に集約。**採用** |
| 移行先 tag の検証 | 移行先 not_found / inactive / same を検証するため `getTagDefinitionByIdRaw` 相当の SELECT を新規記述しがち | 既存 `getTagDefinitionByIdRaw(c, dest)`（active 問わず取得・`SELECT_COLS` 流用）で dest row を 1 回取得し、`row===null`→`target_not_found`、`row.active===0`→`target_inactive` を判定。`src===dest` は SELECT 前の文字列比較で即 `same_as_source` | カラム列挙・取得ロジックの重複と drift を防止。dest 存在確認と active 判定を 1 クエリで兼ねる。**採用**（既存資産流用） |
| route `migrateTo` 分岐の可読性 | `DELETE /tags/:tagId/physical` handler に無指定経路と強制移行経路を混在で書くと、どの条件で二段 audit に到達するか追いにくい | handler 冒頭で `rawMigrateTo` と trim 済み `migrateTo` を分け、**空文字は 404 `migration_target_not_found`、未指定だけ既存経路、値ありだけ強制移行経路**に分離する。Phase 2 §2.4 の構造を踏襲 | 既存経路（AC-7）の不変性と入力正規化の境界が明確。空白付き ID は正規化し、空文字は副作用なしで拒否する。**採用**（可読性向上・regression 安全） |
| 内部 `reason` → 公開 error code の一貫変換 | route で各 reason を個別に inline `c.json(...)` 直書きすると status 数値や error 文字列がばらつく | 内部 `ForceMigrateAndPhysicalDeleteTagResult.reason`（`not_found`/`target_not_found`/`target_inactive`/`same_as_source`/`has_references`）を route の `switch` で **公開 error code（Phase 2 §2.8 変換表）へ 1 対 1 写像** し、status は `ERROR_TO_STATUS` 単一管理に揃える。`migration_target_inactive`（`migrateTo` 同梱）・`tag_has_references`（`referenceCount` 同梱）の payload 拡張が必要な分岐のみ `failWithBody` を使う | 内部理由と公開 contract を分離（FB-SDK-07-2）しつつ、status 数値の写し間違いを `ERROR_TO_STATUS` で排除。`switch` の網羅性で reason 取りこぼしを型レベルで検出。**採用**（既存定数拡張のみ・新規定義なし） |
| audit ヘルパの再利用 | 強制移行で 2 件の audit（移行 + 削除）を inline で `requireProvider(...).append(...)` 直書きすると定型が重複 | 既存 `appendTagAudit(c, { action, targetId, before, after })` を **そのまま 2 回呼ぶ**（`admin.tag.references_migrated` → `admin.tag.physically_deleted`）。action の literal union に `"admin.tag.references_migrated"` を足すだけ。actor 解決・`targetType:"tag"` 固定は helper 側に既存集約済み | 既存資産流用で重複ゼロ。新規 audit helper を作らない。before/after は endpoint 固有なので helper に隠さない（過剰抽象を避ける判断を踏襲）。**採用**（前例あり・低コスト） |
| 移行 SQL の原子実行 | `INSERT OR IGNORE` と `DELETE` を 2 回の `.run()` で別々に発行すると、途中失敗で部分移行（dest に複製済みだが src 未削除）が残る | Phase 2 §2.3 の 2 ステップを `c.db.batch([insertStmt, deleteStmt])` で **単一原子実行**。`migratedCount` は 移行前 source 参照数 から取得 | 部分移行・孤児を構造的に防止（AC-2）。batch は D1 標準 API で新規 primitive ではない。**採用** |

## 2. 不採用 / 据え置き判断（過剰抽象の回避）

| 候補 | 判断 | 理由 |
|------|------|------|
| `migrateMemberTagReferences` と `physicalDeleteTagDefinition` を 1 関数へ統合 | 不採用 | 移行（`member_tags` 操作）と削除（`tag_definitions` 操作）は別テーブル・別責務。`forceMigrateAndPhysicalDeleteTagDefinition` がオーケストレーションとして両者を順に呼ぶ構成（オーケストレータ + 単機能 2 関数）の方が、各関数を独立にテスト可能（Phase 4 M-* / 既存 physical テスト流用）。統合すると単体テスト粒度が落ちる。YAGNI |
| `migrateTo` 無指定経路を強制移行経路と共通化（`destTagId?` optional 1 関数） | 不採用 | 無指定経路は issue-1070 の landed contract で **退化禁止（AC-7）**。optional 引数で 1 関数に寄せると分岐が増え既存経路の regression リスクが上がる。route の早期 return（§1）で分離する方が安全 |
| `ForceMigrateAndPhysicalDeleteTagResult` を汎用 `RepoResult<T, E>` へ一般化 | 不採用 | 判別共用体は本タスク 1 箇所。汎用 Result 型導入は repository 全体の戻り値規約変更になりスコープ（追加のみ）を逸脱。既存 `PhysicalDeleteTagDefinitionResult` と同形の局所判別共用体に留める |
| 移行先検証の汎用 `validateTagTarget` builder | 不採用 | 検証は dest tag の not_found / inactive / same の 3 条件のみで `forceMigrateAndPhysicalDeleteTagDefinition` 内インラインで十分。builder 化は読み手負荷を増やす。`getTagDefinitionByIdRaw` 直呼びで足る |
| audit before/after の差分計算 util | 不採用 | `references_migrated` は `{tag_id,dest,referenceCount}`→`{migratedCount,deleted:true}` 固定、`physically_deleted` は full row→null 固定で差分計算不要。`appendTagAudit` に明示渡しする既存慣例に揃える |

## 3. navigation drift 確認

本タスクは API endpoint の query 分岐追加のみで UI 変更ゼロ（NON_VISUAL）。画面遷移・ルーティング（フロント）への影響なし。`apps/api/src/index.ts` は既存 `adminTagsRoute` mount を再利用し、新 path を増やさず既存 `DELETE /tags/:tagId/physical`（issue-1070）に `migrateTo` query 分岐を足すだけ（mount 行・path surface は増えない）。**navigation drift: N/A**。

## 4. リファクタ後の不変条件再確認

- `migrateTo` 無指定経路は issue-1070 の挙動（404/409 `tag_has_references`+`referenceCount`/204 + audit `physically_deleted` 1 件）を **完全保持**（AC-7）。早期 return で物理分離。
- 強制移行は `migrateMemberTagReferences`（移行・batch 原子実行・衝突吸収）→ `countMemberTagReferences(src)===0` 再検証 → `physicalDeleteTagDefinition(src)`（既存ガード再利用）の二段で、孤児化禁止と「参照 0 のときのみ削除」を二重保証。
- 元 tag の削除ロジック・参照 count・dest 取得は **既存 1 関数ずつに集約**（`physicalDeleteTagDefinition` / `countMemberTagReferences` / `getTagDefinitionByIdRaw`）、新規重複ゼロ。
- audit は `appendTagAudit` 1 helper を 2 回呼ぶ（`references_migrated` → `physically_deleted`）。`targetType:"tag"` 固定・actor 解決済み。before/after は endpoint 責務として明示保持。
- 内部 `reason` → 公開 error code は route `switch` で 1 対 1 写像、status は `ERROR_TO_STATUS` 単一管理（3 code 追加）。
- 新規 primitive（汎用 Result 型・validate builder・統合 set 関数）は **増やさない**。

> いずれのリファクタも **外部 contract を不変** に保つ（無指定経路の退化ゼロを含む）。Phase 4（write repository test）/ Phase 6（contract test 拡充）が GREEN のまま通ることを GREEN 維持条件とする。本タスクの実装は既存パターン踏襲が中心であり、上記以外の追加リファクタは不要。
