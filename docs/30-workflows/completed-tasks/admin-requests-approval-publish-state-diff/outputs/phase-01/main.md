# Phase 1 成果物: 要件定義（確定記録）

> 状態: completed（仕様書作成のみ・コード実装なし）。本ファイルは Phase 1 で確定した要件の記録。

## 1. Issue #1188 現行コード再検証（未解決・有効）

`_shared-context.md` §0.1 の再検証結果を確定記録とする。現行コード（branch `feat/admin-requests-approval-publish-state-diff` = `origin/dev` HEAD `596ee399c` と同一基点）を実 Read で再検証し、Issue #1188 は **未解決・有効**と確定した。

| 検証項目 | 結果（現行コード） | 結論 |
| --- | --- | --- |
| `RequestQueueDetail.tsx:57-58` | `公開状態: {publishState}, 削除済: {isDeleted ? "はい" : "いいえ"}` を現在値のみ列挙 | before→after diff 未実装 |
| `RequestQueueDetail.tsx:70-73` | `申請内容` として `summarizePayload`（`desiredState: hidden` 等）を別 dd に表示 | 現在値と目標値が分離・diff 強調なし |
| `RequestConfirmDialog.tsx:92-94` | `isDestructive && destructiveMessage` の汎用 `<p role="alert">` のみ | 具体遷移の提示なし |
| `RequestQueuePanel.tsx:143-148` | `destructiveMessage` は汎用文言 | 何から何へ変わるかを提示しない |
| 他コンポーネントでの解決 | `grep -rn "変更前\|変更後\|→.*変更"` = 0 件 | 別タスクでも未解決 |
| diff 入力 3 値 | `publishState` / `isDeleted` / `desiredState` がクライアント type に存在 | API 変更不要 |

判定: 本タスク仕様書を作成する。Issue は OPEN のまま据え置き（commit/PR/Issue 操作は全て user-gated）。

## 2. inventory（対象ファイル）

### 表現層コンポーネント（全て `apps/web/src/components/admin/`）

| コンポーネント | ファイル | 行数 | 役割 | 改修区分 |
| --- | --- | --- | --- | --- |
| RequestQueueDetail | RequestQueueDetail.tsx | 96 | 申請詳細パネル（dl で会員/種別/申請内容） | 編集（主役・diff 行新設 + helper 追加） |
| RequestConfirmDialog | RequestConfirmDialog.tsx | 125 | 二段階確認ダイアログ（HTML5 `<dialog>`） | 編集（92 行表示条件緩和） |
| RequestQueuePanel | RequestQueuePanel.tsx | 240 | 申請一覧 + 詳細 + ダイアログ統括 | 編集（`destructiveMessage` 文言生成） |

### CSS / テスト

| パス | 行数 | 改修区分 |
| --- | --- | --- |
| apps/web/src/styles/globals.css | — | 編集（`[data-diff-side]` / `[data-diff-kind]` クラス追加） |
| apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx | 137 | 編集（diff 行 assertion 追加） |
| apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx | 194 | 編集（92 行緩和追従） |
| apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx | 141 | 編集（`destructiveMessage` 具体化 assertion） |

## 3. 命名規則（current 規則に整合）

| 対象 | 規則 | 本タスクでの新規 surface |
| --- | --- | --- |
| コンポーネント | PascalCase | （新規 component なし） |
| 純粋関数 | camelCase | `formatPublishStateLabel` / `buildPublishStateDiff` |
| CSS フック | `data-*` 属性 + `.admin-*` 風クラス | `data-diff-side` / `data-diff-kind` / `.admin-state-diff` |
| テストファイル | `*.spec.tsx`（`*.test.tsx` 禁止・不変条件 #8） | （既存 spec 追従。新規切る場合も `*.spec.tsx`） |

## 4. 受入条件（AC-1〜AC-10）

`_shared-context.md` §6 を正本として転記。各 AC が test または gate で検証可能であることを確認済み。

- AC-1: `visibility_request` で `publishState`（変更前）→ `desiredState`（変更後）が `公開 → 非公開` 遷移として 1 箇所に強調表示 → **test 検証可**（`data-diff-side`/`data-diff-kind="visibility"`）。
- AC-2: `delete_request` は「在籍 → 退会（論理削除）」のレコード状態遷移として表現され混同しない → **test 検証可**（`data-diff-kind="delete"`）。
- AC-3: publishState 生値が日本語ラベル（公開/会員限定/非公開/不明）へ変換され英語値が露出しない → **test 検証可**（`formatPublishStateLabel`）。
- AC-4: diff 強調色が `tokens.css` OKLch トークン経由で `design-tokens.md` と整合 → **gate（verify-design-tokens）+ token 名実在確認**。
- AC-5: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件で `verify-design-tokens` PASS → **gate**。
- AC-6: 新規 primitive 追加 0 件（`data-diff-side` 属性 + 既存 primitive）→ **gate（primitive catalog 差分なし）+ レビュー**。
- AC-7: 新 endpoint/D1 schema/projection 拡張なし。`git diff --name-only -- apps/api packages/shared` が空 → **gate**。
- AC-8: 承認確認ダイアログが visibility で具体遷移文言、delete で既存退会文言 → **test 検証可**（`destructiveMessage`）。
- AC-9: a11y — diff 矢印は `aria-hidden="true"`、before/after の意味はテキストで担保。既存 aria 不変 → **test 検証可**。
- AC-10: 既存 3 spec が green を維持し、note_type 別 diff assertion が PASS。ルート/API パス/既存セレクタ不変 → **test 検証可**。

## 5. VISUAL タスク宣言

本タスクは VISUAL（UI 変更あり）。Phase 11 で 3 ケースの screenshot を取得する: `TEST-NOTE-V01`（public→hidden）/ `V02`（hidden→public）/ `D01`（delete）。screenshot capture は staging 承認済み admin 画面で user-gated（Gate-C）。

## 6. 使用データ 3 値の限定宣言

diff に使ってよいのは `memberSummary.publishState` / `memberSummary.isDeleted` / `requestedPayload.desiredState` の 3 値のみ。`AdminRequestListItemZ.memberSummary` は `.strict()`（拡張すると schema 違反）であり projection 拡張は invariant 違反として禁止する。

## 7. スコープ外（本質的に別責務・CONST_007 の先送りではない）

- 承認時 publish_state 遷移ロジック（`inferDesiredPublishState` / `resolveRequestAtomic`）の変更。
- 新 endpoint 追加・D1 schema 変更・GET `/admin/requests` projection 拡張。
- `apps/web` からの D1 直接アクセス。
- `/admin/requests` 以外の画面への波及・新規 UI primitive 追加。
- API / Google Form 仕様の変更。

## 8. 完了状態

Phase 1 の要件定義は確定。全 AC が test / gate にマップ可能であることを確認した。Phase 2（設計）へ引き渡す。
