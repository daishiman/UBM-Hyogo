# Implementation Guide — 06c-B-admin-members

> 仕様書のラベルは `docs-only` だが、目的（admin members の検索/フィルタ・論理削除/復元・audit 表示の実コード接続）の達成には実装が必要と判断し、CONST_006 に従いこのワークツリーで実装まで完了させた。

## Part 1: 中学生レベルの説明

このタスクは、学校の職員室にある名簿を見るための手順書を作る作業です。名簿を勝手に書き換えたり、関係ない人が見たりできないように、入口の鍵、探し方、記録の残し方を先に決めます。

なぜ必要かというと、管理者が会員を探したり、退会扱いにしたり、役割を確認したりするときに、誰が何をしたかを後から確認できないと困るからです。消したように見せる場合も、ノートを破るのではなく斜線を引くように、元に戻せる形で記録を残します。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| admin guard | 職員室の鍵 |
| query parameter | 図書館の検索カード |
| delete | 名簿に斜線を引くこと |
| audit log | 防犯カメラの記録 |
| API | 事務員にお願いする窓口 |

## Part 2: 実装サマリ（actual code changes）

### Endpoint contract（apps/api）

`GET /api/admin/members?filter&q&zone&tag&sort&density&page` →
`{ total: number, members: AdminMemberListItem[], page: number, pageSize: number }`

| param | 型 | default | 失敗時 |
| --- | --- | --- | --- |
| `filter` | `published \| hidden \| deleted` | 全件 | 不正 → **400** (旧契約互換) |
| `q` | trim + 連続空白正規化 + 最大 200 字 | "" | >200 → **422** |
| `zone` | `all \| 0_to_1 \| 1_to_10 \| 10_to_100` | `all` | 範囲外 → **422** |
| `tag` | repeated, AND（最大 5 件） | `[]` | — |
| `sort` | `recent \| name` | `recent` | 範囲外 → **422** |
| `density` | `comfy \| dense \| list` | `comfy` | 範囲外 → **422** |
| `page` | 1-based 整数 | `1` | 0 / 非整数 → **422**, 過大 → 200 + 空配列 |

`GET /api/admin/members/:memberId` は既存。詳細 viewmodel に `audit[]` を含む（`listByTarget(audit_log, "member", memberId, 50)` の結果）。

`POST /api/admin/members/:memberId/delete` / `POST /.../restore` は既存（07-edit-delete 準拠）。delete は `{ reason }` 必須。`audit_log` に `admin.member.deleted` / `admin.member.restored` を append する。

### 検索 SQL の組み立て

- `q` は `LOWER(...) LIKE LOWER(?) ESCAPE '\'` で `response_email` および `json_extract(answers_json, '$.<field>')` を以下のキーに対して OR 検索: `fullName / nickname / occupation / location / businessOverview / skills / canProvide / selfIntroduction`
- `zone` は `json_extract(answers_json, '$.ubmZone') = ?`
- `tag` 複数指定は 12-search-tags と同じ tag code 語彙で受け、各 tag を `member_tags` + `tag_definitions.code` の `EXISTS` でラップして AND 連結
- `sort=name` は `ORDER BY json_extract(answers_json, '$.fullName') ASC, last_submitted_at DESC`
- `page` は `LIMIT 50 OFFSET (page-1)*50`
- `total` は別 query で `COUNT(DISTINCT mi.member_id)` を返す

### Web UI（apps/web）

- `/admin/members` (Server Component) は `AdminMemberSearch` を URL から復元し、`fetchAdmin(/admin/members?...)` で内部 API を叩く（cookie forwarding のみ、不変条件 #5）
- `MembersClient` (Client) はキーワード input、zone/sort/density select、filter ボタン群、選択タグ表示、ページング nav を実装
- `MemberDrawer` は既存実装で audit log + delete/restore + role 表示を備える（変更不要）

### packages/shared 追加

- `packages/shared/src/admin/search.ts`
  - `AdminMemberSearchZ` zod schema、`AdminMemberSearch` 型
  - `ADMIN_SEARCH_LIMITS` (Q_LIMIT=200, TAG_LIMIT=5, PAGE_SIZE=50)
  - `toAdminApiQuery()` で URLSearchParams を組み立てる helper
- `AdminMemberListView` を `page?` / `pageSize?` を含む形に拡張（後方互換）

### 不変条件への適合

- #4 / #11: 本タスクで本文編集 endpoint・UI を追加していない
- #5: apps/web は `INTERNAL_API_BASE_URL` 経由の `fetchAdmin` のみ。D1 直参照は無し
- #13: delete / restore は既存 `auditAppend()` で actor / target / action / before / after を保存

### Test 追加

`apps/api/src/routes/admin/members.test.ts` に以下を追加（合計 14 ケース、全 pass）:

- `sort=invalid` / `density=invalid` / `zone=invalid` → 422
- `q` 201 文字 → 422
- `q=Test` で `fullName` LIKE hit
- `q=NoMatch` で 0 件
- `page=99999` で 200 + 空配列
- `page=0` で 422
- `tag=tag_a&tag=tag_b` で AND 条件動作

### Quality gate

- `mise exec -- pnpm typecheck` ✅
- `mise exec -- pnpm lint` ✅ (exit 0、新規 lint warning は既存 string-literal 警告 2 件のみ、これは事前から発生)
- 関連 vitest スイート（`members.test.ts` 14 件 / `member-delete.test.ts` 3 件 / `member-status.test.ts` 既存）が pass

### スクリーンショット evidence

実 staging 環境への deploy / smoke はスコープ外（仕様書 phase-11 で「実測は実装担当者が後段で行う」と規定）。本実装サイクルでは画像取得は行わない。
