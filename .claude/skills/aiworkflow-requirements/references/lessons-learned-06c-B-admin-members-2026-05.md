# Lessons Learned — 06c-B admin members follow-up

## L-06CB-001: `docs-only / outputs_contract_only` ラベルは AC で再判定する

`06c-B-admin-members` は当初 `docs-only / outputs_contract_only / remaining-only` で立った
follow-up だったが、AC（admin 検索 / `q` / `tag` / `zone` / `sort` / `density` / `page` / drawer 詳細 /
delete / restore / role 表示 / audit）を満たすには `apps/api`、`apps/web`、`packages/shared`
の実コード変更が必要だった。Phase 12 review でラベルだけを信用すると「未着手として close-out」または
「missing implementation を docs-only のまま放置」という二択の事故が起きるため、ラベルが docs-only でも
AC が runtime 挙動を要求している場合は `implemented-local / implementation` に再分類し、同 wave で
コードまで実装してから skill を同期する。

## L-06CB-002: admin members の filter 語彙は code 側 `published|hidden|deleted` を正本にする

仕様書側に残っていた `filter=active|hidden|deleted` は stale で、`apps/api/src/routes/admin/members.ts` /
`apps/web/src/components/admin/MembersClient.tsx` / `member_status` の実装語彙はすべて
`published|hidden|deleted` に統一されている。仕様文言と実装語彙が衝突した場合、admin の
`member_status` 系では code を canonical とし、`api-endpoints.md` 側を current に書き換える。
逆方向（仕様優先で API を書き換え）にすると `member_status` migration / publish-state PATCH /
public directory の hidden 判定まで巻き戻る。

## L-06CB-003: list response shape は `{ total, members }` 互換を保ち、`page/pageSize` は additive 拡張で入れる

仕様の `{ items, total, page, pageSize }` を新規 contract として強制すると admin web の
list consumer（`MembersClient` + Server fetch）と既存 API テスト 14 件すべてに breaking change が
波及する。代わりに既存の `{ total, members }` を保持し、`page` / `pageSize` を optional フィールドとして
末尾に追加した。同じ判断基準: list / detail の admin response は **既存 key を残す → 新 key を additive
で増やす** が原則で、`items` のような alias rename は scope-out。

## L-06CB-004: detail UI は `/admin/members` 右ドロワー、別 route `/admin/members/[id]` は作らない

仕様には `/admin/members/[id]` 記述があったが、`11-admin-management.md` と既存実装は drawer 詳細を
正本としている。別 route を新設すると admin sidebar、deep link、戻るボタン挙動、Playwright の
selector 全てを二重化する必要があり、role mutation / profile direct edit と同じく scope out すべき。
admin detail 系 follow-up は `MemberDrawer` の表示要件として AC に書き、URL は list URL の query state
（`?selected=memberId`）として表現する。

## L-06CB-005: workflow 契約は `:memberId`、handler ローカル変数 `id` は spec に漏らさない

API endpoint 表記が `:id` / `:memberId` で揺れていた。skill / workflow 契約は `:memberId` に統一し、
`apps/api` の Hono handler が context.req.param で `id` として受けるのは route-local 変数として残す。
artifact inventory / `api-endpoints.md` / phase-12 documents で `:id` を残すと downstream の e2e
spec、curl runbook、staging smoke fixture が `id` 想定でハードコードされ、後段で URL 生成 helper
が「`/admin/members/{member_id}` か `/admin/members/{id}` か」分岐する。spec は常に
`:memberId` に揃え、handler ローカルは leak させない。

## L-06CB-006: audit table 名は単数形 `audit_log` を canonical にし、plural を撤回する

仕様の一部に plural の `audit_logs` 表記が残っていたが、D1 migration / repository / `auditAppend()` /
admin notes / dashboard recent actions すべて `audit_log` 単数形を使う。spec を plural のまま放置すると
admin members の delete / restore / role 表示 / dashboard recent actions / member detail の audit 表示
すべての SQL が `no such table: audit_logs` で 500 を返す。skill 側は `audit_log` 単数形のみを
canonical とし、plural 表記を見つけたら同じ wave で全置換する。

## L-06CB-007: runtime visual evidence は 06c-B 内で完結させず 08b/09a に委譲する

admin members の screenshot 取得は staging admin Google account + sanitized D1 fixture が前提で、
06c-B 単体では再現できない。Phase 11 visual evidence を 06c-B に閉じ込めようとすると placeholder
画像を `outputs/phase-11/screenshots/` に置く必要があり、それを実測 PASS と誤認するリスクが残る。
admin UI 系 follow-up の visual evidence は **08b admin Playwright E2E / 09a staging smoke** に委譲し、
06c-B 側は `VISUAL_ON_EXECUTION` ラベルで「実 evidence は downstream gate で取得」と明示する。
