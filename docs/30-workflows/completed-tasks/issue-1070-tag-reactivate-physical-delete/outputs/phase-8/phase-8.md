# Phase 8: リファクタリング

> GREEN 達成後に行う構造改善の方針を確定する。本タスクは tag master lifecycle（reactivate + physical delete）を `apps/api` の既存 admin tag route / repository に **追加** するものであり、**過剰抽象を避け**、親 issue-1035 で確立済みの前例（`appendTagAudit` / `fail` / `rowBody` / `ERROR_TO_STATUS` / `SELECT_COLS` / `getTagDefinitionByIdRaw`）に倣える箇所のみ統一する。新規 primitive は増やさない。navigation drift は API task のため N/A。

## 成果物

reactivate / physical delete 実装後に適用する構造改善の確定方針。いずれも **外部 contract（status code / response shape / audit 件数）を不変** に保ち、Phase 4 / Phase 6 の contract・lifecycle test が GREEN のまま通ることを GREEN 維持条件とする。

## 1. リファクタリング項目（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| reactivate ⇄ deactivate の対称性 | `deactivateTagDefinition`（`active=1→0`）と `reactivateTagDefinition`（`active=0→1`）が別々に書かれ、内部の「取得 → ガード付き UPDATE → 再取得 → `changed` 算出」手順が重複 | 両者を **共通 UPDATE active パターン** に揃える。`getTagDefinitionByIdRaw` で current 取得 → 既に目標 state なら `changed:false` で no-op return → `UPDATE ... SET active=? WHERE tag_id=?1 AND active=?` → 再取得 → `result.meta.changes` で `changed` 算出、という同一骨格を両関数で揃え、`WHERE active=<反対値>` のみが差分になるよう構造を統一する。**共通 helper への抽出はしない**（active 0/1 の方向と guard 値が逆なだけの 2 関数。helper 化は読み手の負荷を増やす）。**部分採用**（骨格統一のみ・抽出せず） |
| physical delete の guard→delete 順序明確化 | hard delete のガード（存在確認・参照件数）と `DELETE FROM` が 1 関数内に混在し、読み手が「どの条件で削除に到達するか」を追いにくい | `physicalDeleteTagDefinition` を **早期 return のガード段 → 削除段** の 2 段で明示する。①`getTagDefinitionByIdRaw` が null → `{ ok:false, reason:"not_found" }`、②`countMemberTagReferences>0` → `{ ok:false, reason:"has_references", referenceCount }`、③両ガード通過時のみ `DELETE FROM tag_definitions` → `{ ok:true, row:current }`。`PhysicalDeleteTagDefinitionResult` の判別共用体で「到達条件」を型レベルでも自明化する。**採用**（孤児化禁止の安全順序を構造で固定・可読性向上） |
| route の audit ヘルパ再利用 | 新規 2 endpoint で audit append を inline 記述すると、`requireProvider(...).append({ actorId, actorEmail, action, targetType:"tag", targetId, before, after })` の定型が再び重複 | 既存 `appendTagAudit(c, { action, targetId, before, after })` を **そのまま再利用** し、`action` の literal union に `"admin.tag.reactivated"` / `"admin.tag.physically_deleted"` を足すだけにする。actor 解決・`targetType:"tag"` 固定は helper 側に既存集約済み。before/after は endpoint 固有なので helper に隠さない（**過剰抽象を避ける**判断を踏襲） | 既存資産流用で重複ゼロ。新規 audit helper を作らない。**採用**（前例あり・低コスト） |
| error→status 写像 | physical delete の 409 を inline で `c.json({ ok:false, error:"tag_has_references" }, 409)` と直書きすると status のばらつきが再発 | 既存 `ERROR_TO_STATUS` に `tag_has_references: 409` を追加し、`tag_not_found: 404` 等と同じく `fail(c, code)` 経由に揃える。ただし `tag_has_references` は **`referenceCount` を本文に含める** 必要があるため、この 1 endpoint のみ `c.json({ ok:false, error:"tag_has_references", referenceCount }, 409)` を明示し、status の数値だけ `ERROR_TO_STATUS` と一致させる（数値 drift 防止） | status 数値の単一管理（写し間違い排除）を維持しつつ、payload 拡張が必要な分岐だけ明示。**採用**（既存定数拡張のみ・新規定義なし） |
| `getTagDefinitionByIdRaw` / `SELECT_COLS` 再利用 | reactivate / physical の前提確認・before snapshot 取得で SELECT を再記述しがち | 既存 `getTagDefinitionByIdRaw`（active 問わず取得）と `SELECT_COLS` 定数をそのまま流用。reactivate の current 取得・physical の削除前 snapshot 取得・両者の 404 判定をこの 1 関数で兼ねる | カラム列挙・取得ロジックの重複と drift を防止。既存資産があるため**新規定義は不要**。**採用**（確認のみ・既存資産流用） |
| 同一リクエスト内の重複 SELECT 削減 | reactivate / physical で「事前 404 判定の取得」と「結果 row の再取得」が二重 SELECT になり得る | physical delete は **削除前 `getTagDefinitionByIdRaw` の 1 回** を 404 判定と audit before snapshot の両方に兼用（削除後は SELECT しない＝row は消えている）。reactivate は idempotent no-op 時に current をそのまま返し、UPDATE 発行時のみ更新後 row を 1 回再取得する | D1 往復を不要に増やさない。before 取得と存在確認を 1 クエリで兼ねる。**採用**（D1 往復削減・正当な最適化） |

## 2. 不採用 / 据え置き判断（過剰抽象の回避）

| 候補 | 判断 | 理由 |
|------|------|------|
| `reactivate`/`deactivate` を `setTagActive(c, tagId, target)` 1 関数へ統合 | 不採用 | route 側の audit action（`reactivated` / `deactivated`）・before/after 値・既存 endpoint 配線が方向で異なる。統合すると呼び出し側で方向分岐が増え、既存 `deactivateTagDefinition` の contract を触ることになり regression リスクが上がる。骨格統一（§1）で重複は十分減る。YAGNI |
| physical delete ガードの汎用 `referenceGuard` builder | 不採用 | 参照ガードは `member_tags WHERE tag_id` の 1 種類のみ。builder 化は読み手負荷を増やす。`countMemberTagReferences` の直呼びで十分 |
| `PhysicalDeleteTagDefinitionResult` を汎用 `RepoResult<T, E>` へ一般化 | 不採用 | 判別共用体は physical delete 1 箇所のみ。汎用 Result 型を導入すると repository 全体の戻り値規約変更になり、本タスクスコープ（追加のみ）を逸脱する |
| audit before/after の差分計算 util | 不採用 | reactivate は `{active:false}→{active:true}` 固定、physical は full row→null 固定で差分計算不要。`appendTagAudit` に before/after を明示渡しする既存慣例に揃える |

## 3. navigation drift 確認

本タスクは API endpoint 新設のみで UI 変更ゼロ（NON_VISUAL）。画面遷移・ルーティング（フロント）への影響なし。`apps/api/src/index.ts` は既存 `adminTagsRoute` mount を再利用し、新 endpoint は同 route 内 `app.post("/tags/:tagId/reactivate")` / `app.delete("/tags/:tagId/physical")` の追加であり mount 行は増えない。既存 `DELETE /tags/:tagId`（論理）との解決順は Phase 3 §3.2 で「静的セグメント `/physical` 優先」を確認済み・Phase 4/6 regression で固定する。**navigation drift: N/A**。

## 4. リファクタ後の不変条件再確認

- reactivate / deactivate は **同一 UPDATE active 骨格**（guard 値と方向のみ差分）で、idempotent no-op 時は `changed:false`・audit 非発火を維持。
- physical delete は **guard（not_found → has_references）→ delete** の早期 return 順序を構造で固定し、孤児化禁止（参照>0 は削除前拒否）を保証。
- audit は `appendTagAudit` 1 helper に集約（`targetType:"tag"` 固定・actor 解決済み）、before/after は endpoint 責務として明示保持。
- error→status 数値は `ERROR_TO_STATUS` 単一管理（`tag_has_references:409` 追加）。`referenceCount` payload が必要な 409 のみ本文を明示拡張。
- SQL の SELECT カラムは `SELECT_COLS` 単一定義、前提確認は `getTagDefinitionByIdRaw` に集約。
- 新規 primitive（汎用 Result 型・set-active helper・reference guard builder）は**増やさない**。

> いずれのリファクタも**外部 contract を不変**に保つ。Phase 4（test 作成）/ Phase 6（lifecycle test 拡充）の contract test が GREEN のまま通ることを GREEN 維持条件とする。
