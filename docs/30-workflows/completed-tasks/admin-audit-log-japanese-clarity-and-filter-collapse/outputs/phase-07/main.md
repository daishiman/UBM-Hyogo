# Phase 7 — カバレッジ方針・実測記録欄（main.md）

> 変更ファイル / ブロックに限定したカバレッジを測定し（[Feedback BEFORE-QUIT-002]）、describe helper の branch 100% を必達とする。

## 1. カバレッジ範囲限定方針（[Feedback BEFORE-QUIT-002]）

- 計測対象は **本タスクで変更した監査ログ component のみ**に限定する。全体一律 `--coverage` 閾値は適用しない。
- 対象ファイル: `auditGlossary.ts` / `AuditLogPanel.tsx` / `AuditLogCard.tsx` / `auditAppliedFilters.ts`。
- 特に純ロジックである `auditGlossary.ts`（3 helper）と `auditAppliedFilters.ts`（チップ生成）を `--coverage.include` で限定計測する。

## 2. 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \
  --coverage \
  --coverage.include='apps/web/src/components/admin/auditGlossary.ts' \
  --coverage.include='apps/web/src/components/admin/auditAppliedFilters.ts' \
  --coverage.reporter=text --coverage.reporter=json-summary
```

## 3. 変更ブロック line/branch 実測記録欄（[Feedback 5]）

| ファイル / 関数 | branch（実測） | line（実測） | 必達 | 備考 |
| --- | --- | --- | --- | --- |
| `describeAuditAction`（登録済 / 未登録） | ___ / 2 | ___% | branch 100%（2/2） | TC-E-01（未登録）+ 正常系（登録済） |
| `describeAuditTargetType`（登録済 / 未登録 / null） | ___ / 3 | ___% | branch 100%（3/3） | TC-E-02（null）+ 未登録 + 登録済 |
| `describeAuditField`（登録済 / 未登録） | ___ / 2 | ___% | branch 100%（2/2） | TC-E-06（未登録）+ 正常系（登録済） |
| `toAppliedFilterChips`（各 hasValue 分岐 + period 3 分岐 + limit fallback） | ___ / ___ | ___% | 既存 + 日本語化分岐 | TC-E-05 / TC-E-09 + period 境界 |
| `AuditLogPanel` の `advancedHasValue`（全空 / 値あり） | ___ / 2 | ___% | 両分岐 | TC-E-07 / TC-E-08 |

> 実装後に実測値を `___` に転記する。branch 100% を満たさない場合は Phase 4/5 に差し戻す。

## 4. details open 分岐の実測

- 詳細フィルタ全空（`advancedHasValue === false` → `<details>` に open なし）/ 値あり（`true` → open）の両分岐が TC-E-07 / TC-E-08 で実行されることを確認する。
- jsdom は `details.open` プロパティを反映するため、属性アサートで分岐到達を確認できる。

## 5. 既存 spec 追従状況

- 既存に監査ログ component の spec があれば、日本語化後の DOM（h3 / Chip / dt ラベル / FormField label）に追従させる。
- 既存 spec が英語ラベル（`"action"` / `"auditId"` 等）をアサートしていた場合は日本語ラベルへ更新する（追従）。

## 6. 未カバー AC 0 件の宣言

- `outputs/phase-07/ac-matrix.md` で AC-1〜AC-12 を全て TC または grep gate にマップし、空セルが 0 件であることを確認する。
- 本 main.md の最終宣言: **未カバー AC = 0 件**（ac-matrix.md にて全 AC がトレースされる）。
