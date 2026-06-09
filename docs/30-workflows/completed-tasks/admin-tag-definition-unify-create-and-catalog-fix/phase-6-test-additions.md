# Phase 6 — テスト追加

> 正本: [`_shared-context.md`](./_shared-context.md) / [`phase-4-test-plan.md`](./phase-4-test-plan.md) / [`phase-5-implementation.md`](./phase-5-implementation.md)。
> 本 Phase は **失敗パス・回帰 guard・補助テスト**を確定する。実コードは本サイクルで実装済みで、focused Vitest は local GREEN。ブラウザ runtime visual / commit / PR / push のみ user-gated。

## 1. 追加テストファイル一覧

| # | テストファイル | 対象 | 区分 |
|---|--------------|------|------|
| T-1 | `apps/web/src/features/admin/api/__tests__/tags.create.spec.ts` | `createTag()` web api fn | 失敗パス |
| T-2 | `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx` | 作成フォーム（重複/検証）を統合パネル経由で検証 | 失敗パス + 補助 |
| T-3 | `apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts` | `normalizeTagDefinitionList` / `filterTagDefinitions` / `countTagDefinitions` 純関数 | 異常入力 + 境界 |
| T-4 | `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx` | 統合パネル（停止中トグル境界 / 作成反映 / lifecycle 回帰 guard） | 補助 + 回帰 guard |
| T-5 | `apps/web/app/(admin)/admin/tag-master/page.spec.tsx`（既存更新） | server page → 統合パネル受け渡し・防御正規化 | 回帰 guard |
| T-6 | `apps/web/app/(admin)/admin/tags/catalog/page.spec.tsx`（既存更新 or 新規） | catalog redirect | 回帰 guard |
| T-7 | `apps/web/src/components/shell/__tests__/shell-config.spec.ts`（既存更新） | nav 整理（`tag-catalog` 除去 / `タグ定義` ラベル） | 回帰 guard |

> `*.spec.{ts,tsx}` のみ（不変条件 #7）。`*.test.*` は禁止。

## 2. 各ケースの意図

### T-1: `createTag()`（失敗パス中心）

| ケース | 意図 | 期待 |
|--------|------|------|
| C-1-1 成功 201 | 正常系。`active: true` を含む `TagDefinitionItem` を返す | `{ tagId, code, label, category, active: true }`。rowBody の `active` 欠落時は `true` デフォルト（AC-4） |
| C-1-2 **409 `tag_code_conflict`** | 重複コード。`TagCreateError(code:"tag_code_conflict", status:409)` を throw | error.code === `"tag_code_conflict"`（AC-5 で UI が捕捉する契約） |
| C-1-3 **401** | 未認証。既存パターンに従い `AuthRequiredError` を throw（fail-closed・不変条件 #11 整合） | 401 を握り潰さず投げ、UI は再認証導線へ |
| C-1-4 400 `invalid_body` | クライアント検証を抜けた不正 body。`TagCreateError(code:"invalid_body")` | status 400・code 保持 |
| C-1-5 非 JSON / 壊れた body | `bodyText` を保持し、code は null。例外を投げるが情報を欠損させない | `TagCreateError(code:null)`・`bodyText` 非空 |

> POST 先は既存 proxy `POST /api/admin/tags`（_shared-context 3.3）。新 endpoint を叩かないこと（不変条件 #1）を fetch mock の URL assertion で固定する。

### T-2: `TagDefinitionCreateForm`（重複エラー表示 + クライアント検証）

| ケース | 意図 | 期待 |
|--------|------|------|
| C-2-1 **重複エラー表示** | `createTag` が `tag_code_conflict` 409 を投げたとき、フォーム内に `role="alert"` で「同じコードのタグが既にあります。別のコードを指定してください。」を表示し、一覧を壊さない（AC-5） | alert テキスト表示・`onCreated` 未呼出・親 items 不変 |
| C-2-2 **code パターン違反を送信前に弾く** | `CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/` 違反（大文字・先頭 `_`・記号・65 文字）でクライアント検証 fail。fetch を呼ばない（AC-6） | 送信ボタン無効 or バリデーションメッセージ・`createTag` 未呼出 |
| C-2-3 label/category 必須 | 空 label / 空 category で送信不可（AC-6） | 必須エラー表示・送信抑止 |
| C-2-4 成功 → `onCreated(item)` | 正常作成で親へ通知（一覧 prepend + 選択の契機）（AC-4） | `onCreated` が作成 item で 1 回呼ばれる |
| C-2-5 FormField 経由検証 | input が `FormField` 経由であること（不変条件 #5）。直接 `<input>` を増やさない | `FormField` ラベル紐付け（accessible name）で取得可能 |
| C-2-6 ロック解放 | 成功 / 失敗 / キャンセル全経路で送信ボタンの loading が解除される（`finally` 単一出口・FB-STATE-DETAIL-003） | 失敗後も再送信可能 |

### T-3: `tagDefinitionView` 純関数（異常入力 + 境界）

`normalizeTagDefinitionList`（防御正規化 / クラッシュ根絶の核）:

| ケース | 入力 | 期待 |
|--------|------|------|
| C-3-1 | `undefined` | `{ total: 0, items: [] }`（AC-2） |
| C-3-2 | `null` | `{ total: 0, items: [] }` |
| C-3-3 | `{}`（items 欠落） | `items: []`・`total: 0` |
| C-3-4 | `{ items: null }` | `items: []`（**旧クラッシュ再現入力**。`reduce` 前に空配列へ畳む） |
| C-3-5 | `{ items: "x" }`（非配列） | `items: []`（型不正を安全値へ・WEEKGRD-02） |
| C-3-6 | `{ items: [正常2件], total 欠落 }` | `total = items.length`（2）。`total` 非数も length へフォールバック |
| C-3-7 | item 内 `active` 欠落 / 非 boolean | `active` を boolean に safe-coerce（欠落時の既定は実装で確定。view 仕様に明記） |
| C-3-8 | item 内 `code` 等が非 string | string へ safe-coerce（欠落は空文字 or skip。実装で確定し本テストで固定） |

`filterTagDefinitions`（境界）:

| ケース | 入力 | 期待 |
|--------|------|------|
| C-3-9 | `showInactive: false` | active のみ返す（AC-10 既定） |
| C-3-10 | `showInactive: true` | active + inactive 全件 |
| C-3-11 | `query` = code/label/category 部分一致 | 大小文字無視で該当のみ。空 query は全件 |
| C-3-12 | 空配列 | 空配列（例外なし） |

`countTagDefinitions`（**reduce を閉じ込めた純関数 / 件数チップの源泉**）:

| ケース | 入力 | 期待 |
|--------|------|------|
| C-3-13 | 空配列 | `{ active: 0, inactive: 0, total: 0 }`（**0 件の reduce で落ちないこと = クラッシュ class 根絶の回帰 guard**） |
| C-3-14 | active 2 / inactive 1 | `{ active: 2, inactive: 1, total: 3 }` |
| C-3-15 | 全 inactive | `{ active: 0, inactive: N, total: N }` |

### T-4: `TagDefinitionPanel`（停止中トグル境界 + 作成反映 + lifecycle 回帰 guard）

| ケース | 意図 | 期待 |
|--------|------|------|
| C-4-1 **0 件でエラーバウンダリに落ちない** | `initial = { total: 0, items: [] }` で描画。EmptyState「該当するタグはありません」（AC-1） | クラッシュなし・EmptyState 表示 |
| C-4-2 **停止中トグル境界 OFF（既定）** | 既定で active のみ一覧表示。inactive 行は非表示（AC-10・Q2） | inactive 行が DOM に無い |
| C-4-3 **停止中トグル境界 ON** | トグル ON で inactive を含む全件表示 | inactive 行が出現 |
| C-4-4 件数チップ常時表示 | 有効 N / 停止中 M / 全体 T を `countTagDefinitions` から表示。トグル状態に依らず常時表示（AC-10） | 3 チップ表示・トグルで件数不変 |
| C-4-5 **作成成功で一覧へ即時反映 + 選択** | `onCreated(item)` 後、items に prepend され、その行が選択状態（AC-4） | 新規行表示・selectedId = 新 tagId |
| C-4-6 編集（PATCH）反映 | 編集成功で該当行が map 更新される | 更新後 label が一覧に反映 |
| C-4-7 **lifecycle 停止（deactivate）回帰 guard** | `tagCatalogLifecycle.ts` の descriptor / `applyLifecycleSuccess` を再利用し、停止後に状態バッジが「停止中」へ。新規 lifecycle ロジックを生やさない | active=false へ・既存ヘルパー経由 |
| C-4-8 **完全削除 使用中(409 referenceCount) 表示の回帰 guard** | physical-delete で API が `referenceCount` 付き 409 を返したとき、`parseTagLifecycleError` 経由で「N 件で使用中のため削除できません」相当を表示し、一覧を壊さない（Phase 3 リスク表・既存挙動の退行防止） | referenceCount 文言表示・items 不変・ConfirmDialog から戻れる |
| C-4-9 完全削除 ConfirmDialog | destructive 確認を経由（即時削除しない） | ConfirmDialog 経由でのみ DELETE 発火 |

> C-4-7 / C-4-8 は **新規機能ではなく既存 lifecycle 挙動の回帰 guard**。統合で旧 `TagCatalogPanel` を吸収するため、同等カバレッジを新パネル側へ移送する（カバレッジ後退防止・Phase 7 と整合）。

### T-5: `tag-master/page.spec.tsx`（server page 回帰 guard・既存更新）

| ケース | 意図 | 期待 |
|--------|------|------|
| C-5-1 | GET `/admin/tags` の `{ items, total }` を **`normalizeTagDefinitionList` 通過後** `TagDefinitionPanel` に渡す（旧 `TagMasterPanel` から差替） | 統合パネルに正規化済み view を渡す |
| C-5-2 | API が `items` 欠落 envelope を返しても server page が防御し、panel へ `{ items: [], total: 0 }` を渡す（AC-2） | server 側でも防御正規化が効く |
| C-5-3 | 既存 `page.spec.tsx:33` の `TagMasterPanel` 期待を `TagDefinitionPanel` へ更新（旧参照を残さない・FB-TASK-01/02） | 旧 component 名の assertion 消滅 |

### T-6: `tags/catalog/page.spec.tsx`（redirect 回帰 guard）

| ケース | 意図 | 期待 |
|--------|------|------|
| C-6-1 | catalog page が `/admin/tag-master` へ `redirect()` する（AC-8） | `next/navigation.redirect` が `/admin/tag-master` で呼ばれる |
| C-6-2 | 旧 `TagCatalogPanel` を import / 描画しない | catalog page から `TagCatalogPanel` 参照消滅 |

> 既存 `TagCatalogPanel.component.spec.tsx`（_shared-context grep で確認済み）は redirect 化に伴い **削除 or 内容差替**。describe.skip で温存しない（FB-TASK-01/02）。

### T-7: `shell-config.spec.ts`（nav 整理回帰 guard・既存更新）

| ケース | 意図 | 期待 |
|--------|------|------|
| C-7-1 | admin group の tag 関連が `タグ定義`(`/admin/tag-master`) / `タグキュー`(`/admin/tags`) の 2 本（AC-7） | `tag-catalog` エントリが items に存在しない |
| C-7-2 | `tag-master` の label が `タグ定義`（旧「タグ管理」から改称） | label 文字列 assertion |
| C-7-3 | `タグキュー`(`/admin/tags`) は不変（AC-11） | href / label 維持 |
| C-7-4 | `ShellNavItemId` union / icon resolver から `tag-catalog` 除去後も型・解決が成立 | typecheck green + icon resolver に `tag-catalog` 参照なし |

## 3. 現サイクルの境界（local GREEN / runtime visual pending）

本ワークフローは `implemented_local_runtime_pending`。上記テストは仕様として確定し、対応する実コードも本サイクルで実装済み。focused vitest / typecheck / lint / design token gate は local PASS。`*.spec` 命名・FormField 経由・既存 lifecycle ヘルパー再利用は本 Phase で契約として固定済み。ブラウザ runtime visual evidence と commit / PR / push は user-gated。
