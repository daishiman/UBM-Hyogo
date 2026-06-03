# Phase 7: カバレッジ確認 — issue-1036-bulk-member-tag-assign

> 実装区分: 実装仕様書 / VISUAL_ON_EXECUTION / implementation_mode: new
> 前 Phase: [phase-6-test-execution](outputs/phase-6/) 相当 / 次 Phase: [phase-8-refactor.md](phase-8-refactor.md)

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 対象 | 本タスクで **変更した行のみ**（Feedback BEFORE-QUIT-002 / Feedback5: 変更範囲限定） |
| 非対象 | 変更外ファイル・既存実装行・自動生成物（global coverage 目標は設定しない） |

## 目的

bulk tag 機能で **新規追加 / 変更した行** の line / branch を実測し、各 status 分岐
（assigned / unassigned / noop / skipped_deleted / tag_not_found）が網羅されていることを
証跡として残す。変更範囲外のファイルは coverage 評価の対象に含めない。

---

## 7-1. coverage 対象（変更範囲限定）

| # | 対象 | ファイル | 評価軸 |
|---|------|----------|--------|
| C-1 | `bulkApplyMemberTagsByAdmin` の全 status 分岐 | `apps/api/src/repository/memberTags.ts` | line / branch |
| C-2 | bulk endpoint（`POST /admin/members/tags/bulk`） | `apps/api/src/routes/admin/members.ts` | line / branch（zod 成功 / 失敗・成功 200） |
| C-3 | tag master read endpoint（`GET /admin/tags`） | `apps/api/src/routes/admin/tags.ts` または `members.ts` | line |
| C-4 | type-level write gate 追記行 | `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | typecheck 通過（line coverage 非対象・型検査で代替） |
| C-5 | BulkActionBar の**新規分岐**（tagMode / 実行 disabled / 結果集計 / 部分失敗リスト） | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | line / branch |
| C-6 | web API client 追加関数（`bulkApplyMemberTags` / `fetchTagMaster`） | `apps/web/src/features/admin/api/members.ts` | line |

> **変更外と明記**: 既存の publish/hide/soft-delete アクション本体、`assignTagToMemberByAdmin` /
> `unassignTagFromMemberByAdmin`、`getTagDefinitionMaster`、`MembersClientShell`、`TagPill` の
> 既存行は本タスクの coverage 対象外。これらは Phase 9 の regression（既存 spec green）で別途担保する。

---

## 7-2. status 分岐ごとの line / branch 実測手順

`bulkApplyMemberTagsByAdmin` の 5 status 分岐は、それぞれ専用 TC が叩く設計（Phase 4 で定義）。
各分岐が `coverage-final.json` 上で hit していることを確認する。

| status | 発火条件 | 担当 TC（Phase 4） | branch 確認点 |
|--------|----------|--------------------|---------------|
| `assigned` | op=assign + `INSERT OR IGNORE` の `changes > 0` | TC-assign-new | `changes > 0` の真側 |
| `unassigned` | op=unassign + `DELETE` の `changes > 0` | TC-unassign-existing | `changes > 0` の真側 |
| `noop` | assign で既存 / unassign で未存在（`changes = 0`） | TC-assign-existing-noop / TC-unassign-absent-noop | `changes > 0` の偽側（assign / unassign 双方） |
| `skipped_deleted` | member 不在 or `is_deleted = 1` | TC-deleted-member / TC-absent-member | member skip 判定の真側（不在・削除の両ケース） |
| `tag_not_found` | tagId ∉ active set | TC-unknown-tag | tag master 判定の真側 |

> branch 網羅の要点: `changes > 0` は assign 経路・unassign 経路の **両方** で真/偽を踏むこと
> （op で分岐するため、片方だけでは branch が埋まらない）。member skip は「不在」「is_deleted=1」の
> 2 経路を別 TC で踏み、`skipped_deleted` が両入力で hit することを確認する（Phase 3 D-1 確定済み）。

---

## 7-3. coverage 実行コマンド

### apps/api（repository + endpoint）

```bash
# repository helper + bulk endpoint + tag master read を含む API coverage
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
```

- 既存 script `test:coverage` は unit lane + d1 lane を実行し `scripts/coverage-merge.mjs` でマージする。
- bulk repository helper は d1 lane（実 D1 binding）でのみ `changes` を実測できるため、
  `members-tags-bulk.contract.spec.ts` / `memberTags.bulk.repository.spec.ts` が d1 lane に乗ることを確認する。
- 出力: `apps/api/coverage/coverage-final.json`。

### 変更ファイルに絞った確認（手動 grep）

```bash
# memberTags.ts の各 status 文字列リテラルが coverage 上で hit しているか確認
mise exec -- node -e '
const cov = require("./apps/api/coverage/coverage-final.json");
const f = Object.keys(cov).find(k => k.endsWith("repository/memberTags.ts"));
console.log(f ? "memberTags.ts: covered entry present" : "MISSING memberTags.ts in coverage");
'
```

### apps/web（BulkActionBar + API client）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

- 出力: `apps/web/coverage/coverage-final.json`。
- 対象は `BulkActionBar.tsx` の新規分岐 + `api/members.ts` の追加関数のみ。

---

## 7-4. coverage 目標（変更範囲限定）

| 軸 | 目標 | 根拠 |
|----|------|------|
| 変更行 line coverage | **100%**（C-1〜C-3, C-5, C-6 の追加/変更行） | 新規ロジックは全て TC で踏む設計のため未踏行は実装過剰のシグナル |
| branch coverage | **主要分岐網羅**（7-2 の全 status 分岐 + zod 成功/失敗 + 実行 disabled 条件） | 5 status × op 2 経路 + endpoint 入力検証 + UI disabled 条件を網羅 |
| 変更外行 | 評価対象外 | Feedback BEFORE-QUIT-002（変更範囲限定）。global 閾値での gate は設けない |

> 100% に届かない変更行が出た場合の扱い: (a) 到達不能な防御コードは TC 追加ではなく
> `/* c8 ignore */` 等の明示注記で除外可否を Phase 8 で判断、(b) 未テストの実分岐は Phase 4 へ
> TC を差し戻す。**自動生成物・型のみの行・型 gate ファイル（C-4）は line coverage 非対象**。

---

## 7-5. DoD

- [ ] `bulkApplyMemberTagsByAdmin` の 5 status 分岐すべてが coverage 上で hit（7-2 の TC 対応表で確認）
- [ ] `changes > 0` の真/偽が assign / unassign の両 op で踏まれている（branch 網羅）
- [ ] bulk endpoint の zod 成功 / 失敗（400）両分岐が hit
- [ ] `GET /admin/tags` の正常応答行が hit
- [ ] BulkActionBar の新規分岐（tagMode / 実行 disabled / 結果集計 / 部分失敗リスト）が hit
- [ ] 変更行 line coverage 100%（C-1〜C-3, C-5, C-6）／到達不能行は明示除外
- [ ] 変更外ファイルを coverage 評価に含めていないことを本書 7-1 で明記済み
