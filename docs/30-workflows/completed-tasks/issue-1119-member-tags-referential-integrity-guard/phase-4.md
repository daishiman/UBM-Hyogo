# Phase 4 — テスト作成（TDD Red）

> **[実装区分: 実装仕様書]**（`implementation_mode: new`）。command suite と expected result を先に固定し、実装前に失敗する（Red）状態を作る。

## 0. TDD Red 前の命名規則整合確認（FB-01 / FB-SDK-07-4）

テストを書く前に、Phase 1〜3 で確認した命名規則とテストパターンの整合を検証する。

| 確認項目 | 期待値 | 確認方法 |
|----------|--------|----------|
| 追加 read 関数名 | `detectOrphanMemberTags` / `countOrphanMemberTags`（camelCase・既存 `listTagsByMemberId` / `countMemberTagReferences` と一貫） | `grep -n "export async function" apps/api/src/repository/memberTags.ts` で既存命名を確認 |
| 型名 | `OrphanMemberTag`（PascalCase・既存 `MemberTagWithDefinition` と一貫） | 同上 |
| 禁止 prefix 非該当 | `detect` / `count` は `insert`/`update`/`delete`/`upsert`/`assign`/`bulk` のいずれにも該当しない | `memberTags.readonly.test-d.ts` の `WriteKeyword` / `AssignKeyword` 定義（`apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts:18-32`）と照合 |
| spec ファイル拡張子 | `*.spec.ts` のみ（invariant #8） | 新規ファイルは `memberTags.orphan.repository.spec.ts` |
| endpoint レスポンス key | `{ ok, count, orphans }`（Phase 2 §3.1 確定） | contract test の assertion を確定 key に固定 |

> **重要（実コード確認済の前提）**: `members.contract.spec.ts` の member_tags INSERT 箇所（`:109` / `:426`）には**直前に `tag_definitions` の `tag_a`/`tag_b` 定義（`:104` / `:421`）が既に存在する**。よって本 fixture は現時点で孤児を生まない。Phase 5 では「孤立 INSERT が残存していれば定義へ寄せる」が、残存しなければ「孤児 0 を維持していることの確認のみ」とする（差分が無い場合もその事実を記録する）。

## 1. テストケース一覧表

### 1.1 orphan repository spec（新規: `apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts`）

| TC-ID | 対象 | 入力（seed） | 期待値 |
|-------|------|--------------|--------|
| TC-R01 | `detectOrphanMemberTags` | tag_definitions に `tag_eng` 定義 + member_tags に `(m1, tag_eng)`（健全）+ `(m1, tag_ghost)`（tag_definitions 不在＝孤児） | 返り値長 1・要素 `{ memberId:"m1", tagId:"tag_ghost", source:"manual", assignedAt: 文字列, assignedBy: 値 or null }` |
| TC-R02 | `detectOrphanMemberTags`（健全のみ） | tag_definitions に `tag_eng` 定義 + member_tags に `(m1, tag_eng)` のみ（孤児なし） | 空配列 `[]`（健全行は除外される） |
| TC-R03 | `countOrphanMemberTags` | TC-R01 と同 seed（孤児 1 件） | `1` を返す（`detect` の長さと一致） |
| TC-R04 | `countOrphanMemberTags`（健全のみ） | TC-R02 と同 seed（孤児なし） | `0` を返す |
| TC-R05 | `detectOrphanMemberTags`（tag_definitions 空） | tag_definitions 0 行 + member_tags に `(m1, tag_x)`・`(m1, tag_y)` | 全行が孤児として返る（長さ 2）。`NOT IN (空集合)` が全件 true になる挙動を baseline 化 |
| TC-R06 | `detectOrphanMemberTags`（複数孤児ソート） | member_tags に `(m2, tag_z)`・`(m1, tag_z)`・`(m1, tag_a)`（いずれも定義不在） | `ORDER BY member_id, tag_id` により `[(m1,tag_a),(m1,tag_z),(m2,tag_z)]` の順で返る |
| TC-R07 | `countOrphanMemberTags`（一致不変条件） | 任意 seed | `countOrphanMemberTags(c)` == `detectOrphanMemberTags(c).length` が常に成立（同一 WHERE 句の整合） |

> seed は既存 spec（`tagDefinitions.write.repository.spec.ts`）の `setupD1()` + `env.db.prepare(...).run()` パターンを踏襲する。`assigned_by` は NULL ケースも含めて検証する（`{assignedBy: string | null}` 型の網羅）。

### 1.2 tags.contract spec 追加（編集: `apps/api/src/routes/admin/tags.contract.spec.ts`）

既存 `seedTags()` ヘルパ（`:28-37`）と `adminAuthHeader()` / `makeEnv()` を再利用する。`GET /admin/tags/orphans` のケースを `:tagId` 系 it ブロックの後段に追加する。

| TC-ID | 対象 | 入力 | 期待値 |
|-------|------|------|--------|
| TC-C01 | `GET /admin/tags/orphans`（孤児なし） | `seedTags()` のみ（健全 tag のみ・member_tags なし） | `status 200` / body `{ ok: true, count: 0, orphans: [] }` |
| TC-C02 | `GET /admin/tags/orphans`（孤児あり） | `seedTags()` + member_tags に `(m1, tag_ghost, 'manual')`（定義不在） | `status 200` / `body.ok === true` / `body.count === 1` / `body.orphans[0].tagId === "tag_ghost"` / `body.orphans[0].memberId === "m1"` |
| TC-C03 | route 登録順序（capture 回避） | TC-C02 と同 seed | `/tags/orphans` が `/tags/:tagId` 系に capture されず `count` キーを持つ JSON を返す（`"count" in body` を assert）。`orphans` が `:tagId="orphans"` 扱いされていないことを保証 |
| TC-C04 | 認証（既存パターン踏襲・任意） | header なしで request | 既存 admin route の 401/403 挙動に従う（既存 contract の認証ケースと同等。新規 assertion は最小限） |

### 1.3 既存 fixture 緑維持（確認のみ: `apps/api/src/routes/admin/members.contract.spec.ts`）

| TC-ID | 対象 | 期待値 |
|-------|------|--------|
| TC-F01 | 既存「GET /members?tag=code-a&tag=code-b は tag code AND で hit」（`:418`） | fixture 既定義のまま `status 200` / `total === 1` / `members[0].memberId === "m1"` が不変 |
| TC-F02 | 既存「member 一覧の tag 表示」系（`:104-109` 周辺） | tag_definitions 定義済の現状を維持し既存 assertion が緑のまま |
| TC-F03 | fixture 由来孤児 0 件 | 全 members.contract spec 実行後、`member_tags.tag_id NOT IN (SELECT tag_id FROM tag_definitions)` が 0 件（孤児を新たに生まないこと） |

### 1.4 readonly type guard 緑維持（確認のみ・編集なし: `memberTags.readonly.test-d.ts`）

| TC-ID | 対象 | 期待値 |
|-------|------|--------|
| TC-T01 | `WriteExports` が `never` | `detect*`/`count*` 追加後も `insert`/`update`/`delete`/`upsert` prefix 0 件のまま `never` |
| TC-T02 | `UnauthorizedAssignExports` が `never` | `assign*` allow list 不変（`detect`/`count` は `assign` prefix 非該当ゆえ影響なし） |
| TC-T03 | typecheck green | `pnpm --filter @ubm-hyogo/api typecheck` がパス |

## 2. 検証コマンド（Red 確認）

```bash
# 実装前に実行 → orphan repository spec / contract spec の新規ケースが FAIL（関数・endpoint 未実装）することを確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.contract.spec.ts
```

期待される Red の内訳:

- `memberTags.orphan.repository.spec.ts`: `detectOrphanMemberTags` / `countOrphanMemberTags` が未 export → import error または ReferenceError で全 TC FAIL。
- `tags.contract.spec.ts` の `GET /admin/tags/orphans` ケース: endpoint 未登録 → 404 が返り `count` キー不在で assertion FAIL。
- `members.contract.spec.ts`: 現状緑（fixture 既定義のため Red にはならない。回帰 baseline として実行のみ）。

## 3. 期待結果サマリー（Phase 5 後に Green へ）

| spec | Red（実装前） | Green（実装後） |
|------|---------------|------------------|
| orphan repository spec | FAIL（関数未実装） | PASS（TC-R01〜R07） |
| tags.contract（orphans） | FAIL（endpoint 未登録） | PASS（TC-C01〜C04） |
| members.contract（fixture） | PASS（既定義） | PASS（TC-F01〜F03 不変） |
| readonly type guard | PASS | PASS（TC-T01〜T03 不変） |

## 完了条件（Phase 4）

- [ ] TDD Red 前の命名規則整合（§0）を確認した
- [ ] orphan repository spec の TC-R01〜R07 を設計した（健全除外 / 孤児検出 / count 一致 / tag_definitions 空 / ソート / assigned_by NULL 網羅）
- [ ] tags.contract の TC-C01〜C04（`{ok,count,orphans}` / 孤児 0 / 孤児あり / 登録順 capture 回避）を設計した
- [ ] members.contract の TC-F01〜F03（fixture 確認のみ・孤児 0）を設計した
- [ ] readonly type guard TC-T01〜T03 の typecheck green 方針を明記した
- [ ] 検証コマンドで Red を確認する手順を記載した
- [ ] 出力: [outputs/phase-4/test-design.md](outputs/phase-4/test-design.md)
