# Phase 8: リファクタリング

**[実装区分: 実装仕様書]**

> GREEN 達成後に行う構造改善の方針を確定する。本タスクは既存 `apps/api/src/repository/tagDefinitions.ts` / `apps/api/src/routes/admin/tags.ts` への **後方互換拡張**（PATCH body に `code?` / `expectedCode?` 追加、戻り値を discriminated union 化、専用 audit action 追加）であり、**過剰抽象を避け**、親タスク `issue-1035-tag-master-write-endpoints` で確立済みの既存パターン（`ERROR_TO_STATUS` / `appendTagAudit` / `SELECT_COLS`）に倣える箇所のみ統一する。navigation drift は API task のため N/A（NON_VISUAL）。

## 1. リファクタリング項目（対象 / Before / After / 理由）  — [Feedback RT-03]

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `updateTagDefinition` の戻り値型 | `Promise<TagDefinitionRow \| null>`（null = not_found のみ表現。code_conflict / stale を区別できない） | `Promise<UpdateTagDefinitionResult>` の discriminated union（`{ok:true; row}` / `{ok:false; reason:"not_found"}` / `"code_conflict"` / `"missing_expected_code"` / `"stale"`） | AC-2 が「`tag_code_conflict` と `tag_stale_conflict` を**別々の** error code で返す」を要求。null 1 値では 2 種の 409 と CAS token 欠落を分離できない。reason 文字列を型で一元化し、route 側の result map を網羅的（exhaustive）にする。**採用**（AC-2 充足の前提・低コスト） |
| route の error→status 写像 | `ERROR_TO_STATUS` に `tag_stale_conflict` が無い（issue-1035 時点では rename 不在） | `ERROR_TO_STATUS` に `tag_stale_conflict: 409` を 1 行追加（既存 map を拡張） | 既存 `ERROR_TO_STATUS` 定数（issue-1035 で導入済）の拡張に閉じる。status のばらつき・写し間違いを構造的に排除。**採用**（既存資産流用・1 行追加） |
| audit append helper の action union | `appendTagAudit` の `action` 型が `"admin.tag.created" \| "admin.tag.updated" \| "admin.tag.deactivated"` | `"admin.tag.code_renamed"` を union に追加（targetType `"tag"` 固定 / actor 解決ロジックは不変） | AC-4 の専用 action を既存 helper の型拡張だけで吸収。`auditLog.ts` の `AuditAction` は `RepoBrand<string>`（enum なし）なので repository 側は型変更不要（DESIGN-BRIEF §4 注記）。**採用**（既存 helper 流用・型 1 行拡張） |
| `getTagDefinitionByIdRaw` 再利用 | 新規 atomic CAS でも before row 取得は既存関数を流用 | rename パスは `current = getTagDefinitionByIdRaw(tagId)` を 1 回呼んで「not_found 判定 + CAS の expectedCode 事前突合 + audit の before.code 取得」を兼ね、実 UPDATE は `WHERE tag_id AND code` で atomic に行う | before 値取得と存在確認を 1 クエリで兼用しつつ、競合検知は UPDATE の WHERE で保証する。**採用**（既存資産流用・整合性向上） |

## 2. 不採用 / 据え置き判断（過剰抽象の回避）

| 候補 | 判断 | 理由 |
|------|------|------|
| SET 句動的構築の共通化（`createTagDefinition` と `updateTagDefinition` で統合） | **不採用（統合しない）** | 両者は SET 句構築が似て見えるが**責務が違う**。`createTagDefinition` は全列 INSERT（必須 3 列固定）、`updateTagDefinition` は partial update（label/category/code を「指定されたものだけ」動的 SET）で、空フィールド時の `{ok:true, row:current}` early return（no-op）や CAS WHERE 構築も update 固有。共通 builder 化すると update 固有分岐が builder に漏れ、読み手の負荷を増やす。各関数内インラインで十分（YAGNI） |
| reason 文字列の重複（repository の `reason` と route の error code） | **型で一元化（部分採用）** | `UpdateTagDefinitionResult` の `reason` literal union を repository の唯一の真実とし、route は switch/map で `not_found`→`tag_not_found` / `code_conflict`→`tag_code_conflict` / `stale`→`tag_stale_conflict` へ写像する。reason は repository 語彙、error code は API 語彙で**意図的に分離**（route が境界変換責務を持つ）。文字列の散在は型 union への集約で防ぐが、別語彙ゆえ 1 対 1 の自動同一化はしない。**部分採用** |
| `expectedCode` CAS の汎用 optimistic-lock util 化 | 不採用 | CAS は code rename 1 箇所だけで、事前チェックと `UPDATE ... WHERE tag_id AND code` の組み合わせに閉じる。汎用化はコスト過多（YAGNI）。`updateTagDefinition` 内インラインで十分 |
| UNIQUE 衝突判定の wrap util | 不採用 | 既存 `isUniqueError(err)`（issue-1035 で導入済）をそのまま try/catch 内で流用。新規ラッパー不要 |

## 3. 「リファクタ対象なし」判断の明記

本サイクルは**新規ファイルを追加しない**（DESIGN-BRIEF §4 は全件 edit）。構造の新設がないため、抽出すべき新規共通化対象は限定的である。上記 §1 の 4 項目はいずれも「既存パターンへの整合（拡張）」であり、**新たな抽象レイヤーの導入はゼロ**。過剰抽象化を避ける観点から、SET 句動的構築の create/update 統合は §2 のとおり**意図的に見送る**。これにより、本タスクのリファクタは「discriminated union 導入」と「既存定数/helper の 1 行拡張」に閉じる。

## 4. navigation drift 確認

本タスクは API endpoint（PATCH `/admin/tags/:tagId`）の body 後方互換拡張のみで、UI 変更ゼロ（NON_VISUAL）。画面遷移・フロントルーティングへの影響なし。`apps/web` は非接触（admin tag master の専用 CRUD UI は現状未整備でスコープ外）。**navigation drift: N/A**。

## 5. リファクタ後の不変条件再確認

- `updateTagDefinition` の戻り値は discriminated union（`UpdateTagDefinitionResult`）で、not_found / code_conflict / missing_expected_code / stale / success を型で網羅。
- error→status は `ERROR_TO_STATUS`（`tag_stale_conflict: 409` 追加済）1 箇所で管理。
- audit の `targetType:"tag"` 固定 + actor 解決は既存 `appendTagAudit` helper に集約、action union に `admin.tag.code_renamed` 追加、before/after の `{code}` は endpoint 責務として明示保持。
- before 取得・not_found 判定・CAS 事前突合を `getTagDefinitionByIdRaw` で兼用し、rename の競合検知は `UPDATE ... WHERE tag_id AND code` で atomic に保証。

> いずれのリファクタも**外部 contract（既存 status code / 既存 response shape / 既存 audit 件数）を後方互換に保つ**。code/expectedCode を送らない PATCH は issue-1035 と同一挙動（`admin.tag.updated` のみ）。Phase 4 の contract test（C-6 / Reg-1 / Reg-2）が GREEN のまま通ることを GREEN 維持条件とする。
