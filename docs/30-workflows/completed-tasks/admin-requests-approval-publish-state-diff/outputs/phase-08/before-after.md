# Phase 8 出力: Before / After 構造比較

> 状態: `completed`（仕様書作成のみ）。下表は実装者が改修時に参照する Before/After 指針であり、実装完了を主張するものではない。

## リファクタ Before/After テーブル

| # | 対象 | Before | After | 理由 | 挙動不変の確認方法 |
| --- | --- | --- | --- | --- | --- |
| 1 | helper 共有配置 | `formatPublishStateLabel` / `buildPublishStateDiff` が未存在（生値 `publishState` を `RequestQueueDetail.tsx:57` で直表示）。diff 文言は各所でインライン組み立て想定 | `apps/web/src/components/admin/requestPublishStateDiff.ts` を新設し純粋関数を集約。`RequestQueueDetail` と `RequestQueuePanel` が単一実装を import | 詳細パネル diff とダイアログ文言で同じ写像を共有し drift を排除。依存方向を両 component → helper の一方向に保つ | helper の unit test（`requestPublishStateDiff.spec.ts` 想定）で `formatPublishStateLabel` の写像と `buildPublishStateDiff` の note_type 分岐を検証。既存 3 spec が全 PASS |
| 2 | `summarizePayload` 重複解消 | `RequestQueueDetail.tsx:12-20` の `summarizePayload` 内に `desiredState` の unknown-narrowing がインライン。`buildPublishStateDiff` でも同抽出が必要 | `extractDesiredState(payload: unknown): string \| null` を helper に切り出し、`summarizePayload` 跡地と `buildPublishStateDiff` が共有 | 同一の narrowing ロジックが 2 箇所に分岐する重複を解消。`visibility_request` の `desiredState` 生英語表示を diff 行へ統合（AC-3） | `RequestQueueDetail.spec.tsx` で `desiredState: hidden` の生英語が画面に出ないこと、diff 行（`公開 → 非公開`）が出ることを assertion |
| 3 | 命名一貫性 | diff 識別子の命名規約が未確定（実装者により `data-diff` / クラス名が揺れるリスク） | 命名規約表（`PublishStateDiff` / `data-diff-side` / `data-diff-kind` / `.admin-state-diff`）を固定し 3 ファイル + globals.css で統一 | CSS セレクタ・spec セレクタ・型名が食い違う drift を防止 | `grep -rn "data-diff-side\|data-diff-kind\|admin-state-diff\|PublishStateDiff" apps/web/src/components/admin/` で識別子が一貫 |
| 4 | diff 行 DOM 統合 | 現在値 `公開状態: {publishState}`（`RequestQueueDetail.tsx:57`）と申請内容 `desiredState`（70-73 行）が別々の dd に分離。承認遷移として結びついていない | `種別`（60-61 行）直後に `<dt>公開状態の変更</dt><dd>` diff 行（`data-diff-side` span + `aria-hidden` 矢印）を新設。`visibility_request` は申請内容 dd を diff 行へ統合 | 「何から何へ変わるか」を 1 箇所に強調表示し認知負荷を低減（AC-1 / AC-2） | `RequestQueueDetail.spec.tsx` で note_type 別（V01 public→hidden / V02 hidden→public / D01 在籍→退会）の diff DOM を assertion。会員サマリの現在値表示・既存 `aria-label="申請詳細"` は不変 |
| 5 | ダイアログ文言の helper 共有 | `RequestQueuePanel.tsx:143-148` の `destructiveMessage` が「公開状態を申請内容に応じて変更します。」の汎用文言 | `buildPublishStateDiff(dialogItem)` の結果から `公開状態を「公開」から「非公開」へ変更します。` を組み立て（helper 共有・props 非追加） | 詳細パネルとダイアログで同一の日本語ラベル写像を使い文言 drift を排除（AC-8） | `RequestQueuePanel.component.spec.tsx` で `visibility_request` の具体遷移文言、`delete_request` の既存退会文言を assertion |

## 不変性チェックリスト（リファクタ後も維持）

- [ ] `apps/api` / `packages/shared` の diff が 0（`git diff --name-only -- apps/api packages/shared` が空）
- [ ] 新規追加は helper（`requestPublishStateDiff.ts`）のみで `components/ui/` の primitive は増えない（AC-6）
- [ ] CSS は `var(--ubm-color-*)` 経由のみで HEX を増やさない（AC-5）
- [ ] 既存 testid / `aria-label="申請詳細"` / ルート `/admin/requests` / API パスが不変（AC-10）
- [ ] diff 入力は 3 値（`publishState` / `isDeleted` / `desiredState`）に限定され projection を拡張しない（AC-7）
