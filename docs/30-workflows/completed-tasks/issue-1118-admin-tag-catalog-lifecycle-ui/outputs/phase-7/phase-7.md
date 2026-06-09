# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]` / status: `completed`

本 Phase は focused test と typecheck の local evidence を取得済み。line/branch coverage の全体実測は未取得だが、変更面の回帰 guard は focused tests で固定した。

## 7.1 カバレッジ対象範囲（限定）[Feedback BEFORE-QUIT-002]

カバレッジは**本タスクで新規追加・変更したファイル/ブロックに限定**する。既存 component / API / 共有 helper のカバレッジ低下は本タスクの責務外（非退化は AC-5 で別途保護）。

| 対象 | 種別 | カバレッジ目標 | 備考 |
|------|------|----------------|------|
| `apps/web/src/components/admin/tagCatalogLifecycle.ts` | 新規・pure | **line/branch 100%**（pure helper は全分岐到達可能） | 副作用なし・最重要 |
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | 新規・client | state machine 主要遷移を component test で網羅 | submitting/confirm/409/404/idempotent |
| `apps/web/src/components/admin/TagCatalogRow.tsx` | 新規・presentational | active/inactive の operation 出し分けを網羅 | descriptor data-driven |
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | 新規・server | smoke（成功時 panel / 失敗時 error 分岐） | server fetch は mock |

**対象外（カバレッジ計測しない）**: `globals.css`（CSS・gate は `verify-design-tokens`）、admin nav 定義（additive 1 行追加・到達性は AC-0 component/e2e で担保）、既存 `useAdminMutation` / `ConfirmDialog` / `safeServerFetch`（再利用・既存テスト済み）。

## 7.2 concern × test カバレッジ表（AC-0..AC-9）

| AC | concern | 保護する test ケース | test ファイル |
|----|---------|---------------------|---------------|
| AC-0 | catalog route が GET /admin/tags を消費し一覧表示 | `page` が `safeServerFetch` 成功時 `TagCatalogPanel` を、失敗時 `AdminSectionErrorClient` を描画 / panel が items を行として render | `TagCatalogPanel.component.spec.tsx`（行 render）/ page smoke |
| AC-1 | inactive 行から reactivate 成功で active + 一覧反映 | inactive 行に「棚に戻す」ボタンが出る → click → `onOp("reactivate", item)` → trigger 呼出 → 成功で `router.refresh` 呼出 | `TagCatalogPanel.component.spec.tsx` / `TagCatalogRow.component.spec.tsx` |
| AC-2 | physical delete は confirm なしに実行されない | physical ボタン click → ConfirmDialog open のみ（mutation **未呼出**） / onCancel → idle・未呼出 / onConfirm → trigger 呼出 | `TagCatalogPanel.component.spec.tsx` |
| AC-3 | 409 tag_has_references の referenceCount 表示 | trigger が status=409 body=`{error:"tag_has_references",referenceCount:N}` を throw → 当該行に「N 人に使用中のため削除不可」表示 | `TagCatalogPanel.component.spec.tsx` + `tagCatalogLifecycle.spec.ts`（parse） |
| AC-4 | 3 操作の視覚的・文言的区別 | descriptor 確定値（buttonLabel/intent/requiresConfirm）の単体検証 / active=true 行=[logical,physical] / active=false 行=[reactivate,physical] | `tagCatalogLifecycle.spec.ts` / `TagCatalogRow.component.spec.tsx` |
| AC-5 | 既存 tag picker / TagQueuePanel 非退化 | （additive のため）新規ファイルが既存を import 改変しないことを構造的に担保。本タスクの新規 test は既存 spec を変更しない | 構造（grep）+ 既存 spec 不変 |
| AC-6 | reactivate 冪等を error 扱いしない | 既 active への reactivate が 200 + 現 row → success 扱い・エラーバナー非表示 | `TagCatalogPanel.component.spec.tsx` |
| AC-7 | 404 tag_not_found が読める形で表示 | trigger が status=404 → `parseTagLifecycleError` not_found → 「既に削除済みです」表示・操作詰まらない | `TagCatalogPanel.component.spec.tsx` + `tagCatalogLifecycle.spec.ts` |
| AC-8 | desktop/mobile で崩れない | （視覚）Phase 11 で desktop/mobile screenshot 取得。component test は DOM 構造（操作ボタン・dialog・409 メッセージの存在）を固定 | Phase 11 visual + component spec |
| AC-9 | OKLch token のみ・HEX 禁止 | `verify-design-tokens` gate（Phase 9）。test ではなく gate で保護 | gate（Phase 9） |

## 7.3 branch カバレッジ重点（pure helper・100% 目標）

`tagCatalogLifecycle.ts` の以下分岐を `tagCatalogLifecycle.spec.ts` で**全到達**させる。

### parseTagLifecycleError の 3 分岐

| 入力 | 期待 | test ケース |
|------|------|-------------|
| status=409 & body.error==="tag_has_references" | `{ kind:"tag_has_references inline error", referenceCount:N }` | `referenceCount` を body から抽出すること |
| status=404 & body.error==="tag_not_found" | `{ kind:"not_found" }` | — |
| 上記以外（500 / 400 / 409 だが error 不一致 / body parse 不能） | `{ kind:"other", message }` | body が非 JSON のときも throw せず other に落ちること |

> 境界: 409 だが body が `tag_has_references` でない場合・body が空/非 JSON の場合も `other` に安全に落ちることを 1 ケース追加（防御的 parse）。

### availableOps の 2 分岐

| 入力 | 期待 |
|------|------|
| `active===true` | `["logical_delete", "physical_delete"]` |
| `active===false` | `["reactivate", "physical_delete"]` |

### lifecycleDescriptor / statusLabel

| 関数 | 検証 |
|------|------|
| `lifecycleDescriptor("reactivate")` | method=POST / intent=neutral / requiresConfirm=false / endpoint=`/admin/tags/{id}/reactivate` |
| `lifecycleDescriptor("logical_delete")` | method=DELETE / intent=caution / requiresConfirm=false / endpoint=`/admin/tags/{id}` |
| `lifecycleDescriptor("physical_delete")` | method=DELETE / intent=destructive / **requiresConfirm=true** / endpoint=`/admin/tags/{id}/physical` / confirmDescription に「元に戻せない」を含む |
| `statusLabel(true)` / `statusLabel(false)` | 「有効」 / 「停止中」 |

### component の physical confirm 有無 2 分岐

| 経路 | 期待 |
|------|------|
| requiresConfirm=true の op（physical）| ConfirmDialog を経由（confirm 前は mutation 未呼出・AC-2） |
| requiresConfirm=false の op（reactivate/logical）| ConfirmDialog を経由せず直接 trigger |

## 7.4 変更行カバレッジ実測の取得方法（user-gated runtime/staging cycleで実行）

実コード着地後、focused に対象ファイルのみ計測する。

```bash
# pure helper（100% 目標）+ component を focused 実行 + カバレッジ
mise exec -- pnpm --filter web exec vitest run \
  src/components/admin/__tests__/tagCatalogLifecycle.spec.ts \
  src/components/admin/__tests__/TagCatalogPanel.component.spec.tsx \
  src/components/admin/__tests__/TagCatalogRow.component.spec.tsx \
  --coverage \
  --coverage.include='src/components/admin/tagCatalogLifecycle.ts' \
  --coverage.include='src/components/admin/TagCatalogPanel.tsx' \
  --coverage.include='src/components/admin/TagCatalogRow.tsx'
```

合格基準:
- `tagCatalogLifecycle.ts`: **line 100% / branch 100%**（全分岐を 7.3 で網羅済み）。
- `TagCatalogPanel.tsx` / `TagCatalogRow.tsx`: state machine の主要遷移（submitting/confirm/409/404/idempotent/出し分け）が test で到達。未到達分岐があれば理由を Phase 9 に記録。

## 7.5 完了条件（Phase 7）

- カバレッジ対象を新規 4 ファイルに限定明示した（BEFORE-QUIT-002）。
- AC-0..AC-9 が各 test ケースで保護される対応表を固定した。
- pure helper の 3 分岐（parseTagLifecycleError）・2 分岐（availableOps）・physical confirm 有無を branch 重点として明記した。
- focused test / typecheck を実行済み。coverage report の数値取得は user-gated runtime evidence ではなく任意の追加 QA とする。
