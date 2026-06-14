# Phase 3 成果物: 設計レビュー（確定記録）

> 状態: completed。Phase 2 設計を 4 条件でレビューし、残判断を決着させた最終設計の記録。

## 1. 4 条件レビュー結果

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | ◯ | 承認時の before→after 可視化で誤承認リスク・確認コストを低減。Issue #1188 の課題に直結 |
| 実現性 | ◯ | 既存 API response の 3 値 + 既存トークン + `data-diff-side` 属性で 1 サイクル完了可能。新 endpoint / primitive / token 不要 |
| 整合性 | ◯ | 責務は `apps/web/src/components/admin/` に閉じ、`apps/api` diff 0。invariant #5 / ui-prototype #1/#2/#3 を遵守 |
| 運用性 | ◯ | focused vitest（note_type 別 diff）+ verify-design-tokens で回帰保護。VISUAL は staging capture（user-gated）で確認 |

総合判定: **PASS**。全条件 ◯。

## 2. 残判断 1: ダイアログ diff 表示（AC-8）→ 案 A 採用

`RequestQueuePanel.tsx` の `destructiveMessage` 生成箇所で具体遷移文言を組み立てる（案 A）。`RequestConfirmDialog` に props は追加しない（案 B 不採用・readonly 契約変更回避）。

**決定の補足**: 現行 92-94 行は `isDestructive && destructiveMessage` 条件で表示するため、`visibility_request`（`isDestructive=false`）では文言が出ない。AC-8 を満たすため **92 行の表示条件を `destructiveMessage`（中身があれば表示）単独へ緩める**。`isDestructive` は `<p role="alert">` の警告トーン制御に限定する。これにより delete=警告トーン + 退会文言、visibility=通常トーン + 遷移文言を出し分ける。`RequestConfirmDialog.spec.tsx` の該当 assertion を追従更新する（AC-10）。

## 3. 残判断 2: 申請内容 dd → 案 A 採用

`visibility_request` のとき `申請内容`（`desiredState: hidden` の生表示）を diff 行へ統合し、生の英語値を画面から除去する（AC-3 整合）。`delete_request` は申請内容 dd を残す（payload 空のため理由等のみ）。`summarizePayload`（12-20 行）は delete の理由表示等に役割を限定する。

## 4. a11y レビュー

- 矢印 `<span aria-hidden="true"> → </span>` は装飾扱い。before/after span はテキストで意味担保。
- dl 構造で screen reader は「公開状態の変更、公開 非公開」相当を連続読み上げ。意味は伝わる。
- 既存 `aria-label="申請詳細"`（45 行）/ `aria-labelledby`（46 行）は不変。

## 5. invariant レビュー

| invariant | 状態 |
| --- | --- |
| 3 値限定（publishState/isDeleted/desiredState） | ◯ buildPublishStateDiff は 3 値のみ参照 |
| projection 不拡張 | ◯ API 変更なし |
| 新規 primitive ゼロ | ◯ `data-diff-side` 属性 + globals.css のみ |
| HEX ゼロ | ◯ `var(--ubm-color-*)` のみ |

## 6. 最終設計確定サマリ

- diff 行を `RequestQueueDetail` の dl に新設（`data-diff-side` span + `aria-hidden` 矢印 + `data-diff-kind`）。
- `formatPublishStateLabel` / `buildPublishStateDiff` を追加（fail-soft・throw しない）。
- visibility は申請内容 dd を diff 行へ統合、delete は残す。
- `destructiveMessage` を具体遷移文言生成へ（案 A）。`RequestConfirmDialog` 92 行を `destructiveMessage` 単独表示へ緩和。
- CSS は既存トークンのみ。新規 primitive / token / API 変更なし。

Phase 4（テスト作成）へ引き渡す。
