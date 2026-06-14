# Phase 4 成果物: test-plan（TC-XX 一覧）

> 状態: completed。正常系テストケース（TDD Red）。異常系・境界値は Phase 6 の TC-E-XX。

## 1. テストケース一覧（正常系 TC-XX）

| ID | 対象 | 入力 fixture | 操作 | 期待 | 配置 spec | AC |
| --- | --- | --- | --- | --- | --- | --- |
| TC-01 | `RequestQueueDetail` diff 行（visibility） | V01（publishState=public, desiredState=hidden） | render | `[data-diff-kind="visibility"]` が存在し、`[data-diff-side="before"]`=「公開」/ `[data-diff-side="after"]`=「非公開」 | RequestQueueDetail.spec.tsx | AC-1, AC-3 |
| TC-02 | `RequestQueueDetail` diff 行（visibility 逆方向） | V02（publishState=hidden, desiredState=public） | render | before=「非公開」/ after=「公開」/ kind=visibility | RequestQueueDetail.spec.tsx | AC-1, AC-3 |
| TC-03 | `RequestQueueDetail` diff 行（delete） | D01（delete_request） | render | `[data-diff-kind="delete"]` が存在し、before=「在籍」/ after=「退会（論理削除）」 | RequestQueueDetail.spec.tsx | AC-2 |
| TC-04 | delete で公開状態 diff 非露出 | D01 | render | `[data-diff-kind="visibility"]` が DOM に存在しない（混同なし） | RequestQueueDetail.spec.tsx | AC-2 |
| TC-05 | 生英語値の非露出 | V01 | render | 画面テキストに `hidden` / `public` / `member_only` の生英語が現れない（dt/dd 内） | RequestQueueDetail.spec.tsx | AC-3 |
| TC-06 | 矢印 a11y | V01 | render | `.admin-state-diff__arrow` が `aria-hidden="true"` を持つ。before/after はテキストで意味担保 | RequestQueueDetail.spec.tsx | AC-9 |
| TC-07 | 既存 aria 不変 | V01 | render | `aria-label="申請詳細"` 等の既存 aria が不変 | RequestQueueDetail.spec.tsx | AC-9, AC-10 |
| TC-08 | `formatPublishStateLabel` 写像 | （直接呼び出し） | unit | `public`→「公開」/ `member_only`→「会員限定」/ `hidden`→「非公開」 | RequestQueueDetail.spec.tsx（or helper spec） | AC-3 |
| TC-09 | `buildPublishStateDiff` visibility | V01/V02 item | unit | `{ kind:"visibility", before, after }` を返す（日本語ラベル） | RequestQueueDetail.spec.tsx | AC-1, AC-3 |
| TC-10 | `buildPublishStateDiff` delete | D01 item | unit | `{ kind:"delete", before:"在籍", after:"退会（論理削除）" }` | RequestQueueDetail.spec.tsx | AC-2 |
| TC-11 | `destructiveMessage` visibility 文言 | V01 item / approve | render（Panel） | 「公開状態を『公開』から『非公開』へ変更します。会員へ即時反映されます。」がダイアログに表示 | RequestQueuePanel.component.spec.tsx / RequestConfirmDialog.spec.tsx | AC-8 |
| TC-12 | `destructiveMessage` delete 文言 | D01 item / approve | render（Panel） | 既存退会・論理削除文言が表示され、警告トーン（`role="alert"`）維持 | RequestQueuePanel.component.spec.tsx / RequestConfirmDialog.spec.tsx | AC-8 |

## 2. 既存 spec green 維持（追従）

| 追従 ID | 対象 | 期待 |
| --- | --- | --- |
| TC-R-01 | RequestQueueDetail.spec.tsx 既存 assertion | 会員/種別表示が green 維持 |
| TC-R-02 | RequestConfirmDialog.spec.tsx 既存 assertion | 92 行緩和後も既存表示が green。`isDestructive=false`+`destructiveMessage` あり で文言が表示される（更新） |
| TC-R-03 | RequestQueuePanel.component.spec.tsx 既存 assertion | 承認/却下フローが green 維持 |

## 3. Red 前提

TC-01〜TC-12 は実装前のため全て fail（Red）。Phase 5 実装で Green 化。TC-R-01〜TC-R-03 は既存 green の維持 + 緩和に伴う更新。

## 4. セレクタ正本（Phase 2 diff-design.md 由来）

| セレクタ | 用途 |
| --- | --- |
| `[data-diff-kind="visibility"]` | 公開状態遷移行 |
| `[data-diff-kind="delete"]` | レコード状態遷移行 |
| `[data-diff-side="before"]` | 変更前ラベル |
| `[data-diff-side="after"]` | 変更後ラベル |
| `.admin-state-diff__arrow[aria-hidden="true"]` | 装飾矢印 |
