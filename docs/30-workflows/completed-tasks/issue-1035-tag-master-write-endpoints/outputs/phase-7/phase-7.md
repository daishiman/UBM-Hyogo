# Phase 7: カバレッジ確認

> 変更ブロックのカバレッジ対象範囲・目標・実測方針を記録する。実装と focused D1 Vitest は Phase 11 で完了済み。

## 1. カバレッジ対象範囲（変更ファイルに限定 / FB-BEFORE-QUIT-002）

カバレッジは「本タスクで変更したファイルの変更ブロック」のみを評価対象とする。広域（`apps/api/**` 全体）指定はしない（FB-Feedback-5: 既存コードの未カバー行を巻き込まないため、変更ブロックの実測値を残す）。

| # | ファイル | カバレッジ対象 | 対象外（除外理由） |
|---|---------|---------------|-------------------|
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 新規 write/read 5 関数（`createTagDefinition` / `updateTagDefinition` / `deactivateTagDefinition` / `listTagDefinitionsPaged` / `getTagDefinitionByIdRaw`） | 既存 read 3 関数（`listAllTagDefinitions` / `listByCategory` / `findByCode`）は無変更。不変条件 #13 コメント改訂は非実行行 |
| 2 | `apps/api/src/routes/admin/tags.ts` | 新規 4 endpoint（GET/POST/PATCH/DELETE）+ zod schema + error 写像 | — |
| 3 | `apps/api/src/repository/auditLog.ts` | **対象外**（`AuditTargetType` union に `"tag"` を追加する型追加のみ。実行行を生まないため coverage 計測対象にならない） | union 追加は型定義 |
| 4 | `apps/api/src/index.ts` | **対象外**（`adminTagsRoute` の import + `app.route("/admin", adminTagsRoute)` の mount 1 行のみ。endpoint contract test の起動経路で間接的に通過するが、行カバレッジ目標は課さない） | mount のみ |

## 2. 関数 / endpoint ごとの concern と dependency edge

| 対象 | concern | dependency edge | line 目標 | branch 目標 |
|------|---------|-----------------|----------|------------|
| `createTagDefinition` | INSERT + UNIQUE 衝突写像 | `DbCtx` → D1 `INSERT`、`crypto.randomUUID()`、catch `/UNIQUE/i` | 100% | 100%（UNIQUE catch / 非 UNIQUE 再throw の 2 分岐） |
| `updateTagDefinition` | label/category の部分更新（動的 SET） | `getTagDefinitionByIdRaw`（不在判定）→ `UPDATE` → 再取得 | 100% | 100%（不在=null / label のみ / category のみ / 両方 / 両方 undefined の no-op） |
| `deactivateTagDefinition` | 論理削除 + 冪等 changed フラグ | `getTagDefinitionByIdRaw` → `UPDATE ... WHERE active=1` の `meta.changes` 判定 | 100% | 100%（不在=null / 既 active=0 → changed:false / active=1→0 → changed:true） |
| `listTagDefinitionsPaged` | pagination + search（LIKE） | count クエリ + LIMIT/OFFSET クエリ | 100% | 100%（q あり / q なし / page 境界 / pageSize 上限 clamp） |
| `getTagDefinitionByIdRaw` | id 単一取得（active フィルタ無し） | D1 `SELECT ... WHERE tag_id` | 100% | 100%（hit / miss=null） |
| `GET /tags` | query parse + 一覧 | `ListTagsQueryZ.safeParse` → `listTagDefinitionsPaged` | 100% | 100%（parse 成功 / 失敗 400 `invalid_query`） |
| `POST /tags` | 作成 + 409 + audit | JSON parse / `CreateTagBodyZ` / `createTagDefinition` / audit append | 100% | 100%（invalid_json / invalid_body / code_conflict 409 / 成功 201 + audit） |
| `PATCH /tags/:tagId` | 更新 + 404 + 変化時のみ audit | `getTagDefinitionByIdRaw`（404）→ `updateTagDefinition` → audit | 100% | 100%（no_update_fields 400 / not-found 404 / 値変化あり audit 1 / no-op 同値 audit 0） |
| `DELETE /tags/:tagId` | 論理削除 + 冪等 audit + 204 | `deactivateTagDefinition` → changed 時のみ audit → 204 | 100% | 100%（not-found 404 / active=1→0 changed audit 1 / 既 inactive 再送 audit 0 / 204） |

## 3. 変更行の branch を 100% で保護する実測方針（FB-Feedback-5）

以下の「変更ブロックに固有の分岐」を contract / repository test で**全網羅**し、coverage report の該当行 branch が 100% であることを実測値として残す:

- **code 衝突 catch**: UNIQUE 違反 → `code_conflict` → 409 / 非 UNIQUE error → 再 throw（500）の 2 経路
- **active1→0 vs 既 active=0**: `deactivateTagDefinition` の `changed` true/false 2 経路（audit 件数 1/0 に直結）
- **q 有無**: `listTagDefinitionsPaged` の `WHERE (? IS NULL OR ...)` 両分岐
- **page 境界**: page=1 / 最終 page / 範囲外 page（空 items + 正しい total）
- **not-found**: PATCH/DELETE の `getTagDefinitionByIdRaw`=null → 404
- **no-op PATCH 同値更新**: before==after で audit append しない（branch 通過確認）

> 実装サイクルでは、これら分岐に各 1 ケース以上を割り当て、未通過 branch（カバレッジ report の `Uncovered Line #s`）が変更ブロックに残らないことを確認する。残った場合は test を追加する。

## 4. カバレッジ取得コマンド（targeted）

全件実行は重い（FB-UI-02-2）ため、対象 spec のみで coverage を取得する:

```bash
mise exec -- pnpm exec vitest run --coverage \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
```

AC-7 regression（`members.tags.contract.spec.ts`）と audit regression（`auditLog.repository.spec.ts`）は Phase 9 の品質保証 で別途実行する（カバレッジ計測対象は本タスクの新規変更ブロックに限定するため、ここでは含めない）。

## 5. runtime boundary

focused D1 Vitest は Phase 11 で PASS。coverage 数値のフル取得はコストが高いため本 wave では対象テスト PASS を一次証跡とし、未通過 branch が疑われる場合は §4 の coverage command で追加取得する。staging runtime smoke / PR は user-gated。
