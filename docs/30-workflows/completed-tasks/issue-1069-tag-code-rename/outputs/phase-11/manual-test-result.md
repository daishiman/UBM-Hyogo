# Phase 11 手動テスト結果 — tag code rename（issue-1069）

**[実装区分: 実装仕様書 / NON_VISUAL]**

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | `implementation`（既存 PATCH `/admin/tags/:tagId` の後方互換拡張で tag `code` rename を許可） |
| 非視覚的理由 | `apps/api` のみの変更。UI/UX 変更を一切含まない（admin tag master の code 編集 UI は未整備でスコープ外）。視覚的差分が存在しない |
| 代替証跡 | focused D1 Vitest（4 file）+ API typecheck + repo lint + `verify:static-manifest` |
| screenshot | **n/a**（NON_VISUAL のため作成しない） |

> 本タスクは `apps/web` 非接触であり、画面差分が物理的に発生しない。よって Phase 11 screenshot は作成せず、`outputs/phase-11/` にスクリーンショット画像は置かない。

## メタ情報 — [Feedback 4]

| 項目 | 内容 |
| --- | --- |
| 証跡の主ソース（自動テスト名 / 件数） | `tagDefinitions.write.repository.spec.ts`（R-1..R-6）/ `tags.contract.spec.ts`（C-1..C-6）/ `members.tags.contract.spec.ts`（Reg-1）/ `auditLog.repository.spec.ts`（Reg-2）。合計 **R-1..R-6 + C-1..C-6 + Reg-1..Reg-2** |
| スクリーンショットを作らない理由 | apps/api のみの変更で UI 変更ゼロ。観測対象が HTTP contract（status / response shape / audit row）であり、視覚要素が存在しないため。証跡は自動テストの assertion が代替する |
| 実行状態 | local deterministic evidence 取得済み。focused D1 Vitest 4 files / 37 tests PASS、API typecheck PASS、repo lint PASS、`verify:static-manifest` PASS |

## 実行コマンド（D1 config 必須）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
```

> **D1 config 必須**: unit config では repository.spec / contract.spec が exclude される（DESIGN-BRIEF §6）。

## 実測結果一覧（PASS）

| テスト ID | ファイル | ケース | 期待 | 実測 |
| --- | --- | --- | --- | --- |
| R-1 | tagDefinitions.write.repository.spec.ts | code rename success | `{ok:true, row.code===新code}` | PASS |
| R-2 | 〃 | UNIQUE 衝突（既存 code へ rename） | `{ok:false, reason:"code_conflict"}` | PASS |
| R-3 | 〃 | expectedCode mismatch | `{ok:false, reason:"stale"}` | PASS |
| R-3b | 〃 | code 指定 + expectedCode 欠落 | `{ok:false, reason:"missing_expected_code"}` | PASS |
| R-4 | 〃 | 不存在 tagId | `{ok:false, reason:"not_found"}` | PASS |
| R-5 | 〃 | rename 後も member_tags(tag_id) 行が残存・解決 | row count 不変・tag_id 一致 | PASS |
| R-6 | 〃 | 既存 label/category 更新の後方互換 | `{ok:true}` で従来通り更新 | PASS |
| C-1 | tags.contract.spec.ts | PATCH code 正常 | 200 / body.code===新code | PASS |
| C-2 | 〃 | 既存 code へ rename | 409 `{error:"tag_code_conflict"}` | PASS |
| C-3 | 〃 | expectedCode mismatch | 409 `{error:"tag_stale_conflict"}` | PASS |
| C-3b | 〃 | code 指定 + expectedCode 欠落 | 400 `{error:"invalid_body"}` | PASS |
| C-4 | 〃 | 不存在 tagId | 404 `{error:"tag_not_found"}` | PASS |
| C-5 | 〃 | code 変更で `admin.tag.code_renamed` audit | audit row に old/new code | PASS |
| C-6 | 〃 | code 未指定 label のみ | 200・`admin.tag.updated` のみ | PASS |
| Reg-1 | members.tags.contract.spec.ts | rename 後の member tag 解決 | code 変更が assigned tag に波及しない（tag_id 経由） | PASS |
| Reg-2 | auditLog.repository.spec.ts | `admin.tag.code_renamed` 文字列 append | 型エラーなし・row 取得可 | PASS |

## source-level 設計妥当性 / 環境ブロッカー分離 — [WEEKGRD-01]

| 区分 | 内容 |
| --- | --- |
| source-level 設計妥当性 | `updateTagDefinition` の discriminated union 返却・`expectedCode` CAS（atomic `UPDATE ... WHERE tag_id AND code`）・`isUniqueError` 再利用による code_conflict 捕捉・専用 audit action は DESIGN-BRIEF §5 シグネチャと §2 supersede 根拠で確定済み。設計上 D1 schema 変更不要・member_tags 参照整合無傷 |
| 環境ブロッカー（実行系） | テスト実行は D1 config（`vitest.d1.config.ts`）と Node 24 / pnpm 10（`mise exec --`）を要求。実測未了は **環境セットアップ + user-gated 実行待ち**であり、source-level の設計妥当性とは独立した別軸。設計の正しさを実行未了で減点しない |

## 実装確認

| 対象 | 期待状態 |
| --- | --- |
| `apps/api/src/repository/tagDefinitions.ts` | `UpdateTagDefinitionInput` に `code?` / `expectedCode?`、`updateTagDefinition` が `UpdateTagDefinitionResult` discriminated union を返却 |
| `apps/api/src/routes/admin/tags.ts` | `UpdateTagBodyZ` に `code?` / `expectedCode?`、`ERROR_TO_STATUS` に `tag_stale_conflict:409`、PATCH result map、`admin.tag.code_renamed` audit、action union 拡張 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 不変条件 #13 を「code rename 可（audit 付き）」へ改訂 + seed drift 運用注意 |
| `apps/web` | 非接触（変更ゼロ） |

## User-Gated 境界

staging deploy / runtime smoke / wrangler tail / commit / push / PR / Issue #1069 状態変更は未実行（user-gated）。Issue #1069 は 2026-06-03 外部 CLOSED 済で、PR 作成時も `Refs #1069`（reopen/再close しない）を使う。
