# Phase 7: カバレッジ確認

> 正本: `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/DESIGN-BRIEF.md` §6 / §7。
> [Feedback BEFORE-QUIT-002/5] coverage 対象を **本サイクルで変更した関数に限定** して明示する。
> 全体 coverage 閾値の充足ではなく、変更関数の line/branch 100% を狙う。

## 0. coverage 実行（focused / D1）

```bash
mise exec -- pnpm exec vitest run --coverage --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
```

> coverage は **変更ファイルの変更関数** を読み取り対象とする。D1 config 必須（unit config では本 spec 群が exclude）。

## 1. coverage 対象（変更ファイル・変更関数に限定）

| ファイル | 対象関数 | 目標 line | 目標 branch | 根拠テスト |
| --- | --- | --- | --- | --- |
| `apps/api/src/repository/tagDefinitions.ts` | `updateTagDefinition`（discriminated union 化後） | 100% | 100% | R-1..R-6 |
| `apps/api/src/routes/admin/tags.ts` | PATCH `/tags/:tagId` ハンドラ | 100% | 100% | C-1..C-6 / Phase 6 §2 |

### 1.1 `updateTagDefinition` の分岐網羅（100% branch）

| 分岐 | 入力 | 期待 reason/ok | テスト |
| --- | --- | --- | --- |
| not_found | 不存在 tagId | `{ok:false, reason:"not_found"}` | R-4 |
| stale（CAS mismatch） | `expectedCode` ≠ 現 code | `{ok:false, reason:"stale"}` | R-3 |
| CAS 一致で通過 | `expectedCode` = 現 code | `{ok:true}` | R-3 補助 / Phase6 §2.4 |
| no-op（sets 空） | 全フィールド undefined | `{ok:true, row:current}` | （R-6 補助・空 input） |
| code rename 成功 | `code` のみ | `{ok:true, row.code===新}` | R-1 |
| label/category 成功 | `label`/`category` | `{ok:true}` | R-6 |
| code_conflict（UNIQUE） | 既存 code へ rename | `{ok:false, reason:"code_conflict"}` | R-2 |
| 非 UNIQUE エラー throw | （isUniqueError=false） | throw（上位委譲） | 設計上の枝。直接テストは困難なため `isUniqueError` 分岐の true 側（R-2）で代表 |

### 1.2 PATCH ハンドラの分岐網羅（100% branch）

| 分岐 | 入力 | HTTP | テスト |
| --- | --- | --- | --- |
| invalid_json | 非 JSON body | 400 `invalid_json` | （既存回帰・現行 spec で担保） |
| no_update_fields | 空 body / expectedCode のみ | 400 `no_update_fields` | Phase6 §2.2 |
| invalid_body | CODE_RE 違反 | 400 `invalid_body` | Phase6 §2.3 |
| tag_not_found（before 不在） | 不存在 tagId | 404 | C-4 |
| code_conflict map | 既存 code | 409 `tag_code_conflict` | C-2 |
| stale map | CAS mismatch | 409 `tag_stale_conflict` | C-3 |
| code 変更 audit | code 変化 | 200 + `admin.tag.code_renamed` | C-1 / C-5 |
| label/category audit | label/category 変化 | 200 + `admin.tag.updated` | C-6 |
| code+label 両方 | 両変化 | 200 + audit 2 行 | Phase6 §2.1 |
| 200 正常 return | 成功 | 200 `rowBody(after)` | C-1 / C-6 |

> rename 成功 / code_conflict / stale / not_found / label-only の全分岐がテストで踏まれ、line/branch 100% を満たす。

## 2. coverage 対象外（非変更ファイル・明示）

以下は本サイクルで **変更しない** ため coverage 目標の対象外（既存テストの担保範囲を維持するのみ）。

| ファイル/関数 | 理由 |
| --- | --- |
| `apps/api/src/repository/auditLog.ts`（`append` 等） | 非変更。`AuditAction = RepoBrand<string>` で型拡張不要。Reg-2 は round-trip 確認のみで関数本体は不変 |
| `apps/api/src/repository/tagDefinitions.ts` の `createTagDefinition` / `deactivateTagDefinition` / `listTagDefinitionsPaged` / `findByCode` / `getTagDefinitionByIdRaw` 等 | 非変更（`getTagDefinitionByIdRaw` / `isUniqueError` は再利用のみ） |
| `apps/api/src/routes/admin/tags.ts` の POST / GET / DELETE ハンドラ | 非変更（回帰非破壊のみ確認） |
| `apps/web` 全般 | スコープ外（apps/web 非接触・HEX 直書き 0 は自明） |

## 3. DoD への寄与

- 変更 2 関数（`updateTagDefinition` / PATCH ハンドラ）の line/branch カバレッジ 100% を focused coverage で確認。
- 非変更ファイルは対象外として明示し、全体閾値の上げ下げを目的にしない。
- `verify:static-manifest` PASS（drift あれば regen）を Phase 5 と連動して確認。
- commit / push / PR / staging deploy / Issue 状態変更は user-gated。
