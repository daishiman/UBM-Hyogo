# Phase 4 出力 — テスト設計詳細（全テストケース）

タスク: `task-issue-1119-member-tags-referential-integrity-guard`
種別: 実装仕様書 / `implementation_mode: new` / NON_VISUAL

## 1. TDD Red 前の前提確認結果

| 項目 | 結果 |
|------|------|
| 追加関数命名 | `detectOrphanMemberTags` / `countOrphanMemberTags`（既存 camelCase 規約と一貫） |
| 追加型命名 | `OrphanMemberTag`（既存 `MemberTagWithDefinition` と一貫） |
| 禁止 prefix 非該当 | `detect`/`count` は insert/update/delete/upsert/assign/bulk のいずれにも非該当（readonly type guard 非破壊） |
| fixture 現状 | `members.contract.spec.ts` の member_tags INSERT（`:109`/`:426`）は直前に tag_definitions 定義（`:104`/`:421`）あり → 現時点で孤児なし |

## 2. orphan repository spec（`memberTags.orphan.repository.spec.ts`・新規）

`// @vitest-environment node` + `setupD1()` 利用。`tagDefinitions.write.repository.spec.ts` の構造を踏襲。

### TC 詳細

| TC-ID | 対象 | seed | 操作 | 期待値 | edge case |
|-------|------|------|------|--------|-----------|
| TC-R01 | detect（孤児あり） | tag_definitions: `tag_eng` / member_tags: `(m1,tag_eng,manual,admin@example.com)`, `(m1,tag_ghost,manual,admin@example.com)` | `detectOrphanMemberTags(ctx)` | 長さ 1・`{memberId:"m1",tagId:"tag_ghost",source:"manual",assignedAt:expect.any(String),assignedBy:"admin@example.com"}` | 健全行 tag_eng が除外される |
| TC-R02 | detect（孤児なし） | tag_definitions: `tag_eng` / member_tags: `(m1,tag_eng)` のみ | `detectOrphanMemberTags(ctx)` | `[]` | 健全のみ → 空配列 |
| TC-R03 | count（孤児あり） | TC-R01 と同 | `countOrphanMemberTags(ctx)` | `1` | detect.length と一致 |
| TC-R04 | count（孤児なし） | TC-R02 と同 | `countOrphanMemberTags(ctx)` | `0` | — |
| TC-R05 | detect（定義空） | tag_definitions: 0 行 / member_tags: `(m1,tag_x)`,`(m1,tag_y)` | `detectOrphanMemberTags(ctx)` | 長さ 2（全行孤児） | `NOT IN (空集合)` の SQLite 挙動を baseline 化 |
| TC-R06 | detect（ソート） | member_tags: `(m2,tag_z)`,`(m1,tag_z)`,`(m1,tag_a)`（全定義不在） | `detectOrphanMemberTags(ctx)` | `[(m1,tag_a),(m1,tag_z),(m2,tag_z)]` 順 | `ORDER BY member_id, tag_id` 決定性 |
| TC-R07 | count == detect.length | 任意（TC-R01 / TC-R05 双方） | 両関数 | `count === detect.length` | 同一 WHERE 句の整合不変条件 |

### assigned_by NULL 網羅

TC-R05 では `member_tags` を `assigned_by` 省略（NULL）で INSERT し、`detect` の要素 `assignedBy === null` を検証する（型 `string | null` の網羅）。

## 3. tags.contract spec 追加（`tags.contract.spec.ts`・編集）

既存 `seedTags()` / `adminAuthHeader()` / `makeEnv()` を再利用。

| TC-ID | 入力 | リクエスト | 期待値 |
|-------|------|-----------|--------|
| TC-C01 | `seedTags()` のみ（member_tags なし） | `GET /tags/orphans` + admin header | `status 200` / `{ ok:true, count:0, orphans:[] }` |
| TC-C02 | `seedTags()` + member_tags `(m1,tag_ghost,'manual')` | `GET /tags/orphans` | `status 200` / `body.ok===true` / `body.count===1` / `body.orphans[0].tagId==="tag_ghost"` / `body.orphans[0].memberId==="m1"` |
| TC-C03 | TC-C02 と同 | `GET /tags/orphans` | `"count" in body === true`（`:tagId="orphans"` に capture されていない）。レスポンスが orphans 構造であること |
| TC-C04 | header なし | `GET /tags/orphans` | 既存 admin route の未認証挙動（401/403）に準拠（最小確認） |

## 4. members.contract fixture（`members.contract.spec.ts`・編集／条件付き）

| TC-ID | 対象 | 期待値 |
|-------|------|--------|
| TC-F01 | 「GET /members?tag=code-a&tag=code-b は tag code AND で hit」（`:418`） | `status 200` / `total===1` / `members[0].memberId==="m1"`（不変） |
| TC-F02 | member 一覧 tag 表示系（`:104-109`） | 既存 assertion 緑維持 |
| TC-F03 | fixture 孤児 0 | seed 完了時 `member_tags.tag_id NOT IN (tag_definitions)` が 0 件 |

> 現状 fixture は孤児を生まないため、F01/F02 は差分ゼロで緑維持確認。F03 は孤児 0 を担保する回帰観点。

## 5. readonly type guard（`memberTags.readonly.test-d.ts`・確認のみ）

| TC-ID | 期待値 |
|-------|--------|
| TC-T01 | `WriteExports` が `never`（detect/count 追加後も insert/update/delete/upsert 0 件） |
| TC-T02 | `UnauthorizedAssignExports` が `never`（assign allow list 不変） |
| TC-T03 | `pnpm --filter @ubm-hyogo/api typecheck` PASS |

## 6. Red 期待値

| spec | 実装前（Red） |
|------|----------------|
| orphan repository spec | import error / ReferenceError で全 TC FAIL |
| tags.contract（orphans） | endpoint 未登録 → 404 / count キー不在で assertion FAIL |
| members.contract | 現状緑（回帰 baseline・Red にならない） |
| readonly type guard | 緑（変更なし） |
