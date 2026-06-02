# Phase 6: テスト拡充

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 前提 | Phase 5 の GREEN（Phase 4 spec が全て green）が成立していること |
| Phase 区分 | テスト拡充。fail path / 回帰 guard / 境界 / 冪等の追加検証で堅牢性を上げる |
| 対象 AC | AC-2（部分失敗の正確さ）/ AC-4（skip 継続）/ AC-5（再送冪等）/ AC-6（既存 regression） |

> Phase 4 が「各 status 単独 + 基本混在」を確定したのに対し、Phase 6 は **複合 fail path・再送相関・境界ちょうど・既存単一経路 regression** を厚くする。追加先は Phase 4 で作成した spec ファイルに追記する（新規ファイルは作らない）。

## 1. 部分失敗の複合ケース（AC-2 / AC-4）

追加先: `apps/api/src/routes/admin/members-tags-bulk.contract.spec.ts`

seed: `m1`(active) / `m2`(active) / `m_del`(is_deleted=1) / `no_such`(不在) / tag `tag_eng`(active) / `tag_inact`(active=0) / `tag_missing`(未登録)。

| TC | 入力（memberIds × tagIds / op） | 期待 results（直積） | audit |
|----|----|----|----|
| TC-A6-01: deleted + not_found + assigned 同時混在 | `[m1, m_del, no_such]` × `[tag_eng, tag_missing]` / assign | m1×tag_eng=`assigned` / m1×tag_missing=`tag_not_found` / m_del×tag_eng=`skipped_deleted` / m_del×tag_missing=`skipped_deleted` / no_such×tag_eng=`skipped_deleted` / no_such×tag_missing=`skipped_deleted` | `tag_assigned`(m1)=1 のみ |
| TC-A6-02: noop + assigned 混在 | 事前に m1×tag_eng 付与 → `[m1, m2]` × `[tag_eng]` / assign | m1×tag_eng=`noop`（既存）/ m2×tag_eng=`assigned`（新規） | `tag_assigned`=1（m2 のみ。m1 は noop で増えない・AC-3） |
| TC-A6-03: unassign の混在 | m1×tag_eng のみ付与済 → `[m1, m2]` × `[tag_eng]` / unassign | m1×tag_eng=`unassigned` / m2×tag_eng=`noop`（未付与） | `tag_unassigned`=1（m1 のみ） |
| TC-A6-04: deleted + inactive tag 混在 | `[m_del]` × `[tag_inact]` / assign | m_del×tag_inact=`skipped_deleted`（member skip が tag 評価より優先・D-1 / TC-R-09） | audit 0（`tag_not_found` を返さない） |
| TC-A6-05: results 件数 = 直積 | `[m1, m2, m_del]` × `[tag_eng, tag_missing]` / assign | `results.length === 6`（欠落なし・全 item が status 付きで返る） | — |

repository 側でも同等を追加（`memberTags.bulk.repository.spec.ts`）:

| TC | 検証 |
|----|------|
| TC-R6-01: 複合 fail path の status 配列 | helper 直呼びで TC-A6-01 と同じ results 集合を返す（順序は memberId×tagId 直積順） |
| TC-R6-02: member skip 優先 + inactive | TC-A6-04 を helper 単体で確認（skip 行は tag を評価しない） |

## 2. 再送冪等の追加検証（AC-5）

追加先: `members-tags-bulk.contract.spec.ts` / `memberTags.bulk.repository.spec.ts`

| TC | シナリオ | 期待 |
|----|----------|------|
| TC-A6-06: 2 回連続 bulk → 2 回目全 noop | `[m1, m2]` × `[tag_eng, tag_mgr]` / assign を 2 回。 | 1 回目 `assigned`×4。2 回目 `noop`×4。member_tags の行数は 1 回目で 4、2 回目で **増えない** |
| TC-A6-07: 再送で audit 不変 | TC-A6-06 の前後で `tag_assigned` 行数を比較 | 1 回目=4、2 回目実行後も **4 のまま**（再送で audit 増えない） |
| TC-A6-08: assign → unassign → assign のサイクル | `[m1]`×`[tag_eng]` で assign→unassign→assign | 各回 `assigned`/`unassigned`/`assigned`。audit は実 mutation 回数ぶん（assign 2 + unassign 1）。最終 batchId は毎回異なる |
| TC-A6-09: batchId は実行ごとに一意 | 2 回の bulk の `batchId` を比較 | 2 つが異なる UUID（同一 bulk 内の audit 行は同一 batchId で相関するが、別 bulk 間は別 id） |

## 3. 既存単一 endpoint 回帰 guard（AC-6）

追加先: 既存 `members.tags.contract.spec.ts` は変更せず全 green を Phase 9 で確認。本 Phase では bulk spec 内に **共存 regression** を 1 件加える。

| TC | 検証 |
|----|------|
| TC-A6-10: bulk 追加後も単一 POST/DELETE/GET が不変 | 同一 `createAdminMembersRoute()` インスタンスで `POST /members/m1/tags`（単一・200）→ `POST /members/tags/bulk`（200）→ `GET /members/m1/tags`（assigned に単一・bulk 両方の tag が反映）を順に叩き、互いに干渉しないことを確認 |
| TC-A6-11: ルート順序の固定（D-2 回帰） | `POST /members/tags/bulk` と `POST /members/:memberId/tags` がともに正しいハンドラに到達する（bulk が `:memberId="tags"` を奪わない／単一が bulk に吸われない）。両 path の status を 1 spec で assert |

## 4. 上限境界（200/50 ちょうど・超過）

追加先: `members-tags-bulk.contract.spec.ts`

| TC | 入力 | 期待 |
|----|------|------|
| TC-A6-12: memberIds ちょうど 200 | memberIds=200 件（うち seed 済みは一部、残りは不在 → skipped_deleted）/ `[tag_eng]` / assign | 200。zod を通る。results.length=200 |
| TC-A6-13: memberIds 201（超過） | memberIds=201 件 | 400 |
| TC-A6-14: tagIds ちょうど 50 | `[m1]` / tagIds=50 件（一部 tag_not_found）/ assign | 200。results.length=50 |
| TC-A6-15: tagIds 51（超過） | `[m1]` / tagIds=51 件 | 400 |
| TC-A6-16: 直積最大（200×50=10000）の境界 | memberIds=200（多くは不在）/ tagIds=50 / assign | 200。results.length=10000。実 mutation は seed 済み active member×active tag のぶんのみ。タイムアウトしない（loop が完了する。test timeout を 30000ms 確保） |

> TC-A6-16 は重い。`it(..., 30000)` で timeout 余裕を持たせ、N+1 回避（事前一括 SELECT）の効果で 1 query+直積 INSERT に収まることを担保する。10000 件が許容時間を超える場合は seed 済み件数を絞って「上限 shape」のみ確認する（実 mutation は数件）。

## 5. tag master read の補助検証

追加先: `tags-master.contract.spec.ts`

| TC | 検証 |
|----|------|
| TC-T6-01: tag 0 件でも 200 + `{ available: [] }` | tag_definitions を seed しない | 200・空配列（落ちない） |
| TC-T6-02: bulk と read の整合 | `GET /admin/tags` の available に含まれる tagId のみが bulk で `assigned` になり得る | read で見えない（inactive）tag は bulk で `tag_not_found`（TC-A-08 と整合） |

## 6. web 部分失敗表示の拡充（AC-2 UI 反映）

追加先: `BulkActionBar.spec.tsx`

| TC | シナリオ | 期待 |
|----|----------|------|
| TC-B6-01: 複合 results の集計表示 | mock results = assigned×2 / skipped_deleted×3 / tag_not_found×1 / noop×1 | 各 status の件数が表示。skipped_deleted=3 件・tag_not_found=1 件が member×tag 単位リスト（`data-testid`）に列挙 |
| TC-B6-02: 全 noop（再送）表示 | mock results = noop×4 | 「変更なし」相当の集計（assigned=0）。失敗リストは空。`onComplete` は呼ばれる |
| TC-B6-03: op=unassign の表示 | op 切替で unassign 実行、results = unassigned×2 / noop×1 | unassigned=2 件表示。ラベルが「解除」系 |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- members-tags-bulk
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.bulk
mise exec -- pnpm --filter @ubm-hyogo/api test -- tags-master
mise exec -- pnpm --filter @ubm-hyogo/web test -- BulkActionBar
# 既存 regression（AC-6）
mise exec -- pnpm --filter @ubm-hyogo/api test -- members.tags.contract
```

## 完了条件 (DoD)

- [ ] 複合 fail path（deleted + tag_not_found + noop + assigned 同時混在）TC が green（TC-A6-01/02/03/04）
- [ ] member skip 優先（tag 評価より先）の回帰 TC が green（TC-A6-04 / TC-R6-02）
- [ ] 再送冪等（2 回連続 → 2 回目全 noop + audit 不変）TC が green（TC-A6-06/07）
- [ ] batchId が実行ごとに一意・同一 bulk 内で相関する TC が green（TC-A6-09）
- [ ] 既存単一 endpoint と bulk の共存 regression が green（TC-A6-10/11）
- [ ] 上限境界（200/50 ちょうど green・超過 400）TC が green（TC-A6-12〜16）
- [ ] tag master read の補助 TC が green（TC-T6-01/02）
- [ ] web 部分失敗表示の複合 TC が green（TC-B6-01〜03）
- [ ] 既存 `members.tags.contract.spec.ts` regression 無し
- [ ] 追加テストは既存 Phase 4 spec ファイルへの追記で、新規ファイルを増やしていない
