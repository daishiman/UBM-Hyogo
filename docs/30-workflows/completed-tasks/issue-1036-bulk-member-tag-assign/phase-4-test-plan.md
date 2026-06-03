# Phase 4: テスト作成（TDD Red）

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 前提 | Phase 1/2/3 完了（D-1/D-2/D-3 確定済み） |
| Phase 区分 | テスト作成（TDD Red）。実装前に失敗する spec を確定する |
| 対象 AC | AC-1〜AC-7 |
| 実行ポリシー | このフェーズでは **テストのみ追加**し RED を確認する。実装は Phase 5 |

> 本タスクは `implementation_mode = new`。Phase 4 で RED テストを置き、Phase 5 で GREEN を作る。
> 設計の確定値はすべて Phase 2（A-1〜A-4 / B-1〜B-3）と Phase 3（D-1/D-2/D-3）に従う。

## テストファイル一覧

| パス | 種別 | 対象 | lane |
|------|------|------|------|
| `apps/api/src/routes/admin/members-tags-bulk.contract.spec.ts` | 新規 | `POST /admin/members/tags/bulk` の contract（status/audit/冪等/ルート順序） | lane-A |
| `apps/api/src/repository/__tests__/memberTags.bulk.repository.spec.ts` | 新規 | `bulkApplyMemberTagsByAdmin` の status 分岐 / batchId / N+1 回避 | lane-A |
| `apps/api/src/routes/admin/tags-master.contract.spec.ts` | 新規 | `GET /admin/tags`（tag master read）の shape / active-only | lane-A |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | 編集 | type-level write gate に `bulkApplyMemberTagsByAdmin` を allow list 明示 | lane-A |
| `apps/web/src/features/admin/components/_members/__tests__/BulkActionBar.spec.tsx` | 新規 or 編集 | tag picker / op 切替 / 実行 / 部分失敗表示 / 既存アクション regression | lane-B |

> 不変条件 #8: 新規テストは `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止）。
> `*.test-d.ts` は type-level test の慣例 suffix で既存 `memberTags.readonly.test-d.ts` を踏襲（vitest typecheck 対象であり禁止 suffix ではない）。

## テスト基盤・規約（既存に揃える）

- API contract / repository test: `// @vitest-environment node` + `setupD1` / `InMemoryD1`（`apps/api/src/repository/__tests__/_setup.ts`）。`createAdminMembersRoute()` を `app.request(path, init, makeEnv(env))` で叩く既存パターン（`members.tags.contract.spec.ts` 準拠）。
- admin auth: `adminAuthHeader()` / `TEST_AUTH_SECRET`（`./_test-auth`）。未認証ケースは header を外して 401 を期待。
- web component test: Testing Library（`render` / `screen` / `fireEvent` / `waitFor` / `cleanup`）+ `jest-axe`。`vi.mock("next/navigation", …)` で `useRouter().refresh` を stub。
- web mutation mock: **`useAdminMutation` を `vi.mock` で差し替え、option を捕捉して `trigger` を制御する**（`MemberDrawer.tags.spec.tsx` の `mut` パターン準拠）。`vi.stubGlobal("window")` は禁止。`window.api` 系を触る必要がある場合は `Object.defineProperty(window, "api", { configurable: true, value: … })` を使う。
- API client（`bulkApplyMemberTags` / `fetchTagMaster`）は `vi.mock("../../../api/members", …)` でモジュール mock。

## A. API contract テストケース — `members-tags-bulk.contract.spec.ts`

seed は `members.tags.contract.spec.ts` と同等にする:

- member: `m1`（is_deleted=0）, `m2`（is_deleted=0）, `m_del`（is_deleted=1）
- tag_definitions: `tag_eng`(active=1) / `tag_mgr`(active=1) / `tag_inact`(active=0)
- `audit_log` 行数は `SELECT COUNT(*) … WHERE target_type='member' AND target_id=? AND action=?` で検証。

各 TC は `POST /members/tags/bulk`（body `{ memberIds, tagIds, op }`）を叩く。レスポンスは `{ ok:true, batchId, results:[{memberId,tagId,status}] }`（部分失敗も含めて 200）。

| TC | 入力（memberIds / tagIds / op） | 期待 HTTP | 期待 results.status | 期待 audit |
|----|----|----|----|----|
| TC-A-01: assign 成功 | `[m1]` / `[tag_eng]` / assign | 200 | `assigned`×1 | `admin.member.tag_assigned`(target m1)=1、after_json に `tagId/source:"manual"/batchId` |
| TC-A-02: unassign 成功 | 事前に m1×tag_eng 付与 → `[m1]` / `[tag_eng]` / unassign | 200 | `unassigned`×1 | `admin.member.tag_unassigned`(m1)=1、before_json に `tagId/batchId` |
| TC-A-03: noop（assign 再送・冪等 AC-5） | TC-A-01 を 2 回連続。2 回目 `[m1]`/`[tag_eng]`/assign | 200 | 2回目=`noop`×1 | `tag_assigned`(m1) は **2 回目で増えず 1 件のまま** |
| TC-A-04: noop（unassign 未存在・冪等） | 未付与状態で `[m1]`/`[tag_eng]`/unassign | 200 | `noop`×1 | `tag_unassigned`(m1)=0（mutation 無し） |
| TC-A-05: skipped_deleted（is_deleted=1） | `[m_del]` / `[tag_eng]` / assign | 200 | `skipped_deleted`×1 | audit 0（mutation 無し） |
| TC-A-06: skipped_deleted（member 不在 D-1） | `[no_such]` / `[tag_eng]` / assign | 200 | `skipped_deleted`×1（results に行が**返る**） | audit 0 |
| TC-A-07: tag_not_found（未登録 tag） | `[m1]` / `[tag_missing]` / assign | 200 | `tag_not_found`×1 | audit 0 |
| TC-A-08: tag_not_found（inactive tag） | `[m1]` / `[tag_inact]` / assign | 200 | `tag_not_found`×1（active=0 は不可視） | audit 0 |
| TC-A-09: 混在ケース（AC-2/AC-4） | `[m1, m_del, no_such]` / `[tag_eng, tag_missing]` / assign | 200 | m1×tag_eng=`assigned` / m1×tag_missing=`tag_not_found` / m_del×(両tag)=`skipped_deleted` / no_such×(両tag)=`skipped_deleted`。member skip は tag より先判定（skip 行は tag 評価しない＝`tag_not_found` ではなく `skipped_deleted`） | `tag_assigned`(m1)=1 のみ（実 mutation した item だけ・AC-3） |
| TC-A-10: audit 行数アサート（AC-3） | `[m1, m2]` / `[tag_eng, tag_mgr]` / assign（全新規） | 200 | `assigned`×4 | `tag_assigned`=4（m1×2 + m2×2）。`noop`/`skip`/`not_found` は audit を増やさないことを別途確認 |
| TC-A-11: op 不正 body → 400 | body `{memberIds:[m1],tagIds:[tag_eng],op:"toggle"}` | 400 | — | audit 0 |
| TC-A-12: memberIds 空 → 400 | `[]` / `[tag_eng]` / assign | 400 | — | — |
| TC-A-13: tagIds 空 → 400 | `[m1]` / `[]` / assign | 400 | — | — |
| TC-A-14: memberIds 上限超過 → 400 | memberIds=201 件 / `[tag_eng]` / assign | 400 | — | — |
| TC-A-15: tagIds 上限超過 → 400 | `[m1]` / tagIds=51 件 / assign | 400 | — | — |
| TC-A-16: 不正 JSON → 400 | body=`"{"`（壊れた JSON） | 400 | — | — |
| TC-A-17: ルート誤マッチ無し（D-2） | `POST /members/tags/bulk` が **404 や `:memberId="tags"` 系ハンドラに落ちず** 200 + `results` を返す。さらに既存 `POST /members/m1/tags`（単一）が引き続き 200 を返すことを同 spec で確認 | 200 | bulk=`assigned`、単一=既存 shape | — |
| TC-A-18: 未認証 → 401 | header を外して `POST /members/tags/bulk` | 401 | — | — |

補足アサート:
- 全 TC で `body.batchId` が非空 string（`expect.stringMatching(/.+/)`）。
- TC-A-10 では「同一 batchId が全 audit 行の after_json に入る」ことを `SELECT after_json …` で 1 件抽出し JSON.parse して確認（batchId 相関・D-3）。

## B. repository unit テストケース — `memberTags.bulk.repository.spec.ts`

`setupD1` で `bulkApplyMemberTagsByAdmin(c, {memberIds, tagIds, op}, actor)` を直接呼ぶ。audit は repository では append しない設計か route で append する設計かを Phase 2 に従い確認する。

> **設計整合チェック**: Phase 2 A-1 のアルゴリズムは audit append を helper 内で行う記述（手順 4）。一方既存単一経路は route 側で append。Phase 5 実装時にどちらに寄せるか確定する。**本タスクの確定方針: audit append は `bulkApplyMemberTagsByAdmin` helper 内に閉じる**（bulk は item 単位で実 mutation を判定でき、route で再判定するとロジック二重化するため）。よって repository spec で audit 行数も検証する。`actor` は helper に渡す。

| TC | 入力 | 期待 status | 補足アサート |
|----|------|------------|-------------|
| TC-R-01: assign 新規 | m1×tag_eng / assign | `assigned` | member_tags に 1 行 INSERT（source='manual'）。audit `tag_assigned` 1 件 |
| TC-R-02: assign 既存（冪等） | 事前付与済 m1×tag_eng / assign | `noop` | 行数不変・audit 増えない（`meta.changes=0`） |
| TC-R-03: unassign 既存 | 付与済 m1×tag_eng / unassign | `unassigned` | DELETE 1 行・audit `tag_unassigned` 1 件 |
| TC-R-04: unassign 未存在（冪等） | 未付与 m1×tag_eng / unassign | `noop` | audit 増えない |
| TC-R-05: skipped_deleted（is_deleted=1） | m_del×tag_eng / assign | `skipped_deleted` | 書き込み無し・audit 無し |
| TC-R-06: skipped_deleted（member 不在 D-1） | no_such×tag_eng / assign | `skipped_deleted` | results に行が返る・書き込み無し |
| TC-R-07: tag_not_found（未登録/inactive） | m1×tag_missing, m1×tag_inact / assign | `tag_not_found`×2 | 書き込み無し |
| TC-R-08: batchId 付与 | 任意 | — | `result.batchId` が非空・`crypto.randomUUID()` 形式（uuid 正規表現）。全 audit 行の相関 id が同一 batchId |
| TC-R-09: 直積順序（member skip 優先） | `[m_del]`×`[tag_eng, tag_missing]` / assign | `skipped_deleted`×2 | member skip 時は tag を評価しない（`tag_not_found` を返さない） |
| TC-R-10: N+1 回避（事前一括取得） | `[m1, m2]`×`[tag_eng, tag_mgr]` / assign | `assigned`×4 | `c.db.prepare` の呼び出し回数を spy し、tag master 取得=1 回・member 存在/削除取得=1 回（memberIds をまとめて IN 句で 1 クエリ）であることを assert。INSERT は item 数ぶん（直積分）だが SELECT は事前一括であることを確認 |
| TC-R-11: results 件数 = memberIds × tagIds | `[m1, m2]`×`[tag_eng, tag_mgr]` | length=4 | 直積で全 item が results に並ぶ（skip/noop 含め欠落しない） |

> TC-R-10 の spy: `vi.spyOn(env.db, "prepare")` で SQL 文字列を記録し、`member_status` JOIN / `tag_definitions` の SELECT がそれぞれ高々 1 回であることを `expect(...).toBe(1)` で検証する。

## C. tag master read テストケース — `tags-master.contract.spec.ts`

`GET /admin/tags`。mount 先（`/admin` 直下）は Phase 5 で既存 router 構成を確認して確定（D-2）。spec は最終 mount に合わせて path を書く。

| TC | 入力 | 期待 |
|----|------|------|
| TC-T-01: 200 + `{ available }` shape | GET `/admin/tags` | 200、`body.available` が `TagRef[]`（`{tagId, code, label, category}`） |
| TC-T-02: active-only | 同上 | `available.map(code)` に `engineer`/`manager` を含み `inactive` を含まない |
| TC-T-03: 並び順 | 同上 | category ASC, label ASC（`getTagDefinitionMaster` の ORDER BY 準拠） |
| TC-T-04: 未認証 → 401 | header なし | 401 |

## D. type-level gate テスト — `memberTags.readonly.test-d.ts`（編集）

既存 gate は `insert*/update*/delete*/upsert*` 接頭辞 export を禁止し、`assign*` は allow list（`assignTagsToMember` / `assignTagToMemberByAdmin`）のみ許可する。`bulkApplyMemberTagsByAdmin` は `bulk*` 接頭辞で write keyword にも `assign*` にも該当しないため既存 gate に抵触しない。本タスクでは **不変条件 #13 第3経路の write 入口を明示参照**する追加 it を入れる。

| TC | 期待 |
|----|------|
| TC-D-01: write keyword gate 不変 | `expectTypeOf<WriteExports>().toEqualTypeOf<never>()` が引き続き成立（新 helper 追加後も `insert*/update*/delete*/upsert*` export が増えていない） |
| TC-D-02: 未許可 assign export が増えていない | `expectTypeOf<UnauthorizedAssignExports>().toEqualTypeOf<never>()` 維持 |
| TC-D-03: bulk helper が allow list 入口として存在 | `expectTypeOf<ModuleExports["bulkApplyMemberTagsByAdmin"]>().not.toBeAny()` を追加。コメントで「不変条件 #13 第3経路（bulk admin manual write）」と明示 |
| TC-D-04: 既存 admin manual helper が存在（regression） | `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` の `.not.toBeAny()` 維持 |

> bulk helper を `bulk*` 命名にしたことで write keyword gate を機械的に通過する（命名規則と gate の整合は Phase 3 R3 で PASS 済み）。意図は「gate を回避する裏口」ではなく、第3経路を type で**明示**することにある。`bulk*` を将来 write keyword gate に加えるかは scope-out（必要時に gate 拡張の別レビュー）。

## E. web component テストケース — `BulkActionBar.spec.tsx`

`bulkApplyMemberTags` / `fetchTagMaster` を `vi.mock("../../../api/members", …)` で差し替え、`useAdminMutation` を `mut` パターンで差し替える。`selectedIds`（props）+ ユーザー操作で `bulkApplyMemberTags(selectedIds, [...selectedTagIds], op)` が呼ばれることを引数まで assert する。

| TC | シナリオ | 期待 |
|----|----------|------|
| TC-B-01: tag picker 描画 | `fetchTagMaster` が `available=[tag_eng, tag_mgr]` を返す + `selectedIds=["m1"]` | `TagPill`（`role=button`）が available 件数ぶん描画され、初期は全て `aria-pressed=false` |
| TC-B-02: pill toggle | tag_eng の pill を click → 再 click | 1 回目 `aria-pressed=true`、2 回目 `false`（`selectedTagIds` の追加/削除） |
| TC-B-03: op 切替 | assign/unassign の切替 control を操作 | 既定 assign。unassign に切替後、実行ボタンラベルが「…を解除」に変わる |
| TC-B-04: 実行で bulkApplyMemberTags 呼び出し（引数アサート） | `selectedIds=["m1","m2"]`、tag_eng 選択、op=assign で実行ボタン click | mock が `(["m1","m2"], ["tag_eng"], "assign")` で 1 回呼ばれる。`useAdminMutation` の `trigger` 経由（不変条件 #10） |
| TC-B-05: 部分失敗集計表示 | mock が `results=[{m1,tag_eng,assigned},{m_del,tag_eng,skipped_deleted},{m2,tag_missing,tag_not_found}]` を返す | status 別件数（assigned=1 / skipped_deleted=1 / tag_not_found=1）が表示。skip/not_found は member×tag 単位リスト（`data-testid` 付き）に出る |
| TC-B-06: 実行後 onComplete | 実行成功 | `onComplete` が 1 回呼ばれる（一覧 refresh 契約） |
| TC-B-07: disabled 条件 | selectedTagIds 空、または selectedIds 空、または busy 中 | 実行ボタン `disabled=true` |
| TC-B-08: 既存 publish アクション regression（AC-6） | 既存 publish/hide/soft-delete ボタンが描画され click で既存 API（`patchMemberStatus`/`deleteMember`）を呼ぶ | 既存挙動不変（tag セクション追加で壊れない） |
| TC-B-09: publish-hide-soft-delete regression（a11y） | bulk bar 全体を `axe` 検査 | violations 0 |
| TC-B-10: 実行ボタンラベル | selectedIds=2 件 / tag 1 件 / assign | 「2人 × 1タグ を付与」相当のラベル（人数×タグ数を反映） |

> mock 方針の固定: `bulkApplyMemberTags` は `vi.fn()` をモジュール mock の値に割り当て、`beforeEach` で `mockReset` + 既定 resolve 値を設定。`useAdminMutation` は `trigger` が捕捉した callback を実行する `mut` 構造（`MemberDrawer.tags.spec.tsx` 準拠）。`fetchTagMaster` は `mockResolvedValue({ available: [...] })`。

## RED 確認コマンド

package 名は `apps/api/package.json` = `@ubm-hyogo/api`、`apps/web/package.json` = `@ubm-hyogo/web`。

```bash
# API contract（bulk endpoint）
mise exec -- pnpm --filter @ubm-hyogo/api test -- members-tags-bulk
# API repository unit
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.bulk
# tag master read
mise exec -- pnpm --filter @ubm-hyogo/api test -- tags-master
# type-level gate（typecheck モード）
mise exec -- pnpm --filter @ubm-hyogo/api test -- --typecheck memberTags.readonly
# web component
mise exec -- pnpm --filter @ubm-hyogo/web test -- BulkActionBar
```

> 期待: 上記すべてが Phase 4 時点で **FAIL（RED）**。`bulkApplyMemberTagsByAdmin` / endpoint / API client / BulkActionBar の tag セクションが未実装のため import/参照エラーまたはアサート失敗になる。RED を確認してから Phase 5 に進む。

## 実行タスク

1. API contract spec（TC-A-01〜18）を作成し RED 確認。
2. repository unit spec（TC-R-01〜11）を作成し RED 確認。
3. tag master read spec（TC-T-01〜04）を作成し RED 確認。
4. type-level gate spec に TC-D-03 を追加し RED（または未実装参照エラー）確認。
5. web component spec（TC-B-01〜10）を作成し RED 確認。
6. RED 確認コマンドの出力を Phase 5 の GREEN 比較基準として記録。

## 成果物

- `apps/api/src/routes/admin/members-tags-bulk.contract.spec.ts`（新規）
- `apps/api/src/repository/__tests__/memberTags.bulk.repository.spec.ts`（新規）
- `apps/api/src/routes/admin/tags-master.contract.spec.ts`（新規）
- `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`（編集）
- `apps/web/src/features/admin/components/_members/__tests__/BulkActionBar.spec.tsx`（新規 or 編集）
- `phase-4-test-plan.md`（本書）

## 完了条件 (DoD)

- [ ] AC-1〜AC-7 に対応する RED テストがすべて存在する
- [ ] 5 ファイルが作成/編集され、対応コマンドで FAIL（RED）する
- [ ] status 5 値（assigned/unassigned/noop/skipped_deleted/tag_not_found）の各分岐に TC がある
- [ ] 冪等（AC-5）の audit 不変アサートがある（TC-A-03 / TC-R-02 / TC-R-04）
- [ ] ルート誤マッチ無し（D-2）の TC がある（TC-A-17）
- [ ] 上限境界（200/50・超過）の TC がある（TC-A-14/15）
- [ ] web mock 方針（`useAdminMutation` mock / `vi.stubGlobal("window")` 禁止）が記述されている
- [ ] RED 確認コマンドが実 package 名で記載されている
