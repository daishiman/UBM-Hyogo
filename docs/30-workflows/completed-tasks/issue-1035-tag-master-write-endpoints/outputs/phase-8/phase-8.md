# Phase 8: リファクタリング

> GREEN 達成後に行う構造改善の方針を確定する。本タスクは新規 route + repository write の追加であり、**過剰抽象を避け**、既存前例（`tags-queue.ts` / `members.ts`）に倣える箇所のみ統一する。navigation drift は API task のため N/A。

## 1. リファクタリング項目（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| route 内 error→status 写像 | 各 endpoint で `return c.json({ ok:false, error:"tag_not_found" }, 404)` 等を個別 inline | `const ERROR_TO_STATUS: Record<string, number> = { tag_code_conflict: 409, tag_not_found: 404, invalid_query: 400, invalid_json: 400, invalid_body: 400, no_update_fields: 400 }` を module top に定義し、共通 `fail(c, code)` helper で `c.json({ ok:false, error:code }, ERROR_TO_STATUS[code] ?? 500)` を返す | `tags-queue.ts:33` の `ERROR_TO_STATUS` 前例に揃える。status のばらつき・写し間違いを構造的に排除。**採用**（前例あり・低コスト） |
| zod parse の共通化 | 各 endpoint で `const parsed = XxxZ.safeParse(...); if (!parsed.success) return ...` を繰り返し | parse 失敗時の `fail(c, "invalid_body")` 返却は上記 `fail` helper で 1 行化。**schema 自体の共通 wrapper は作らない** | schema は body/query で形が違い共通 wrapper は抽象過多になる。`fail` helper のみで重複は十分減る。**部分採用**（helper のみ） |
| audit append の重複 | POST/PATCH/DELETE で `requireProvider(c.var.auditLogProvider, "auditLogProvider").append({ actorId: asAdminId(...), actorEmail: adminEmail(...), action, targetType:"tag", targetId, before, after })` を 3 箇所反復 | actor 部分（`actorId`/`actorEmail`）の組み立てだけ `auditActor(c)` で抽出し、`action`/`targetId`/`before`/`after` は各 endpoint が渡す薄い helper `appendTagAudit(c, { action, targetId, before, after })` に集約 | actor 解決 + targetType 固定の定型部のみ抽出。before/after は endpoint 固有なので helper に隠さない（**過剰抽象を避ける**判断）。**採用**（重複 3 箇所 → 1 helper、可読性向上） |
| `SELECT_COLS` 再利用 | 新規 `getTagDefinitionByIdRaw` / `listTagDefinitionsPaged` で SELECT カラムを再記述 | 既存 `SELECT_COLS` 定数（read 3 関数が使用中）をそのまま流用し、`${SELECT_COLS} WHERE tag_id = ?1` / count クエリと組み合わせる | カラム列挙の重複・drift 防止。既存定数があるため**新規定義は不要**。**採用**（確認のみ・既存資産流用） |
| 存在確認の二重呼び出し削減（`getTagDefinitionByIdRaw`） | PATCH で「404 判定の事前 `getTagDefinitionByIdRaw`」と「`updateTagDefinition` 内部の再取得」が二重呼び出しになり得る | PATCH は事前に `getTagDefinitionByIdRaw` を 1 回呼び、before 値（label/category）取得と 404 判定を兼ねる。`updateTagDefinition` には取得済み before row を渡せる形にし、内部の重複 SELECT を 1 回に抑える（更新後 row は UPDATE 後の 1 回 SELECT のみ）。DELETE も `deactivateTagDefinition` が内部で `getTagDefinitionByIdRaw` を 1 回呼ぶ設計を維持し、route 側で重ねて呼ばない | 同一 tagId への SELECT を 1 リクエスト内で 2→1 に削減。before 値の取得と存在確認を 1 クエリで兼ねる。**採用**（D1 往復削減・正当な最適化） |

## 2. 不採用 / 据え置き判断（過剰抽象の回避）

| 候補 | 判断 | 理由 |
|------|------|------|
| zod schema 共通 wrapper（汎用 validator factory） | 不採用 | body/query で形が異なり、`fail` helper で重複は解消済み。factory は読み手の負荷を増やす |
| repository write 関数の汎用 `dynamicUpdate` builder | 不採用 | 更新対象が label/category の 2 列のみ。動的 SET は `updateTagDefinition` 内インラインで十分。builder 化は YAGNI |
| `crypto.randomUUID()` のラップ util | 不採用 | `auditLog.append` と同じく直呼びの既存慣例に揃える。1 箇所のみで util 不要 |

## 3. navigation drift 確認

本タスクは API endpoint 新設のみで UI 変更ゼロ（NON_VISUAL）。画面遷移・ルーティング（フロント）への影響なし。`apps/api/src/index.ts` の mount 追加は `/admin/tags` の HTTP routing であり、`/tags/queue`（既存 `adminTagsQueueRoute`）との順序のみ Phase 4 regression で確認済み。**navigation drift: N/A**。

## 4. リファクタ後の不変条件再確認

- error→status は `ERROR_TO_STATUS` 1 箇所で管理（写し間違い排除）。
- audit の `targetType:"tag"` 固定 + actor 解決は `appendTagAudit` helper に集約、before/after は endpoint 責務として明示保持。
- SQL 文字列の SELECT カラムは `SELECT_COLS` 単一定義。
- 同一リクエスト内の同一 tagId への重複 SELECT を 1 回に削減（before 取得と 404 判定を兼用）。

> いずれのリファクタも**外部 contract（status code / response shape / audit 件数）を不変**に保つ。Phase 4 の contract test が GREEN のまま通ることを GREEN 維持条件とする。
