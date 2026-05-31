# issue-982-drawer-tag-pill-editing-followup-002 — tag master (`tag_definitions`) write endpoints + pagination/search

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-982-drawer-tag-pill-editing-followup-002 |
| 分類 | implementation / API endpoint / admin CRUD |
| 優先度 | 低 (priority:low) |
| 規模 | 中 (scale:medium) |
| ステータス | unassigned |
| 発見元 | issue-982-drawer-tag-pill-editing Phase 12 unassigned-task-detection (scope-out 候補: tag master write + pagination/search) |
| 発見日 | 2026-05-30 |
| 親ワークフロー | issue-982-drawer-tag-pill-editing |
| visualEvidence | VISUAL_ON_EXECUTION |

## 背景

親ワークフロー issue-982 で `MemberDrawer` の tag pill 編集（member への手動付与 / 解除）を `member_tags` 経由で実装し、`MemberDrawer` の `ALL_TAGS` ハードコードを `GET /admin/members/:memberId/tags` の `available` 一覧（tag master read）に置換した。ただし tag master そのもの（`tag_definitions`: PK `tag_id`、UNIQUE `code`、`label`、`category`、`active`）は **read のみ**を開放し、master の作成 / rename / 無効化（write）は `/admin/tags` 側の別責務として明示的に scope 外にした。

`apps/api/src/repository/memberTags.ts` には tag master の read 関数（`getTagDefinitionMaster` / `findTagDefinitionById`）しか存在せず、`tag_definitions` への write 関数は無い。`apps/api/src/routes/admin/tags-queue.ts` は AI / Google Form 由来提案の resolve（queue）専用で、master 自体を CRUD する route も無い。結果として「member に付けたい tag が master に無い」場合に admin が tag を新規作成する導線が drawer 内に存在せず、UX が途切れる。あわせて、master 件数が増えた際の一覧 pagination / search も将来 consideration として記録されている。

本仕様は tag master 管理（write + 検索/ページング）を将来タスクとして形式化する。

## 概要

`tag_definitions` への管理者 CRUD API（作成 / rename・category 変更 / 無効化）を `/admin/tags` 配下に新設し、一覧 GET に pagination + search を載せる。論理削除（`active=0`）を採用して既存 `member_tags`（assigned 済 row）は保持する。各 write 操作に audit action（`admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated`）を併設する。

## 苦戦箇所【記入必須】

- 親 workflow（issue-982）は tag master を read だけ開放したため、drawer の available 一覧に「member に付けたい tag」が無いとき、admin がその場で tag を新規作成して付与する導線が drawer 内に存在しない。tag 編集 UI と tag master 管理 UI が分断され、UX が途切れる（master 整備のために別画面へ離脱が必要）。drawer 内 inline create を出すか、`/admin/tags` 画面へ誘導するかで導線設計が割れる。
- master の rename / 無効化が `member_tags` の既存 row（assigned 済 tag）に与える影響の整合方針が未確定。`active=0` にした tag を既存 member が保持し続けるのか（`listTagsByMemberId` / `listAssignedTagsForMember` は `td.active = 1` で JOIN フィルタしているため、無効化すると assigned 済でも一覧から消える）、それとも無効化時に既存 member_tags を一括解除するのかを先に決めないと、表示と実データが乖離する。
- `code` は UNIQUE 制約。rename（厳密には `code` 変更）と既存 code の衝突をどう返すか（409 `tag_code_conflict`）と、`label` / `category` のみ変更は衝突対象外という線引きが必要。`code` を immutable（作成後固定）にして rename は `label` / `category` のみへ限定する案も検討対象。
- 論理削除（`active=0`）と物理削除（行 DELETE）の判断。`member_tags` が FK 的に参照しているため物理削除は既存 assignment を壊す。MVP では論理削除一本にして物理削除は出さない方が安全だが、誤作成 tag の整理（reactivate / 完全削除）要件が出た場合の拡張余地を残すか要検討。

## 目的

- tag master を admin が CRUD できる API を新設し、issue-982 で残った「master 管理導線の不在」を解消する
- 一覧に pagination + search を載せ、master 件数増加に耐える
- 論理削除（`active=0`）で既存 `member_tags`（assigned 済）を保持し、表示と実データの整合を維持する
- 各 write を `admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated` audit に残す

## スコープ

含む:

- `apps/api/src/routes/admin/tags.ts` 系 endpoint 新設
  - `GET /admin/tags`（一覧 + pagination + search）
  - `POST /admin/tags`（作成。`code` UNIQUE 違反 409）
  - `PATCH /admin/tags/:tagId`（rename = `label` / `category` 変更、`code` の扱いは設計確定後）
  - `DELETE /admin/tags/:tagId`（論理削除 = `active=0`）
- `apps/api/src/repository/memberTags.ts`（または新 `tagDefinitions.ts`）へ master write 関数を追加（不変条件 #13 の type-level write gate / `memberTags.readonly.test-d.ts` の allow list 整合を含む）
- audit action 3 件追加（`admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated`）
- apps/api route + repository test（CRUD / `code` UNIQUE 409 / 論理削除後の既存 member_tags 保持 / pagination + search / audit row）
- `/admin/tags` 画面側で master CRUD を行う UI（drawer 連携の導線含む）
- Playwright visual: tag master 管理画面状態の baseline 追加

含まない:

- member への tag 付与 / 解除（issue-982 本体で実装済。`member_tags` 経路）
- tag に紐づく公開フィルタロジックの再設計
- 物理削除 / reactivate（誤作成 tag の整理要件が確定するまで保留）
- tag の AI 提案 queue（`tags-queue` resolve 経路。別責務）

## 受入条件 (Acceptance Criteria)

- AC-1: `POST /admin/tags { code, label, category }` で `tag_definitions` に row が persist され、既存 `code` との衝突は 409 `tag_code_conflict` を返す
- AC-2: `PATCH /admin/tags/:tagId { label?, category? }` で `label` / `category` を更新できる（`code` の変更可否は設計確定後の AC を追加）
- AC-3: `DELETE /admin/tags/:tagId` は論理削除（`active=0`）で行を残し、当該 tag を assigned 済の既存 `member_tags` row は保持される
- AC-4: `GET /admin/tags` が pagination（`page` / `pageSize` など）と search（`code` / `label` 部分一致）を受理し、`total` と `items` を返す
- AC-5: write 操作で audit action `admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated` が actor + tagId で 1 件記録される
- AC-6: D1 への直接アクセスは `apps/api` に閉じる（`apps/web` は `/api/admin/...` proxy 経由のみ。D1 binding 直参照禁止）
- AC-7: 既存 `GET /admin/members/:memberId/tags`（issue-982）の response shape に regression が無い（`available` は `active=1` 全件のまま）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 無効化した tag が assigned 済 member の一覧から消えて表示乖離 | 論理削除方針（`active=0`）と read JOIN フィルタ（`td.active = 1`）の挙動を AC-3 で明文化し、無効化 = 既存 assignment 保持・新規付与不可と定義する |
| `code` UNIQUE 違反でクラッシュ | INSERT 前に既存 `code` を検証し 409 `tag_code_conflict` で返す。`code` immutable 案も評価 |
| 物理削除で既存 `member_tags` を破壊 | MVP は論理削除のみ。物理削除はスコープ外 |
| 不変条件 #13 の write gate（type-level test）に新 write 関数が引っかかる | master write は `member_tags` ではなく `tag_definitions` 対象。`memberTags.readonly.test-d.ts` allow list / 不変条件 #13 の文面整合を事前確認し、必要なら #13 自体の変更レビューを通す |
| audit ログ漏れ | route test で各 write の audit row 1 件を必ず assert |

## 検証方法

- apps/api: route test（CRUD、`code` UNIQUE 409、論理削除後の既存 `member_tags` 保持、pagination + search、audit 3 種）、repository test
- apps/web: `/admin/tags` master CRUD インタラクション spec、drawer からの導線 spec
- Playwright visual: tag master 管理画面の baseline 追加

## 上流前提

- issue-982（drawer tag pill editing）が `member_tags` 経路 + `GET/POST/DELETE /admin/members/:memberId/tags` を実装済（既完了）
- 不変条件 #13（2026-05 再定義）の 2 write 経路（queue resolve / admin manual member_tags）が確立済。本タスクは master（`tag_definitions`）write を追加するため、#13 の対象範囲（member_tags の write のみを規定）との整合確認を上流前提とする
- `admin.*` audit log provider が apps/api admin 経路に配線済

## 関連参照

- `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/`（index.md / detection.md = 本候補の出典）
- `apps/api/src/repository/memberTags.ts`（tag master read 関数の現状。master write は無い）
- `apps/api/src/routes/admin/tags-queue.ts`（既存 tag queue resolve のみ）
- `apps/api/src/routes/admin/members.ts`（issue-982 の member_tags write endpoint）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（`tag_definitions` schema / 不変条件 #13 / `/admin/members/:memberId/tags` 契約）
- `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`（write keyword 禁止 type-level gate / allow list）

## GitHub Issue

- Issue: 起票予定（本サイクル Phase 3 で作成）
- labels: `priority:low`, `scale:medium`, `type:followup`, `area:api`, `area:web`, `area:admin-ui`, `wave:2-plus`, `unassigned`
