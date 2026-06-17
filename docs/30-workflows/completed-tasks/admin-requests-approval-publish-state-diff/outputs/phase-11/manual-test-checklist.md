# Phase 11 — 手動テストチェックリスト

> ステータス: `implemented_local_runtime_pending`。ローカル component evidence は PASS。認証済み staging visual capture 後に runtime 目視項目を [x] へ更新する。

---

## 1. diff 行表示（Before → After）

- [ ] `visibility_request` の詳細パネルで `変更前 → 変更後`（例 `公開 → 非公開`）が 1 箇所に強調表示される（AC-1）
- [ ] before（現在値 `publishState`）と after（目標値 `desiredState`）が同一行で結びつき、別々の dd に分離していない
- [ ] before=中立トーン / after=accent トーンで視覚的に区別される
- [ ] TEST-NOTE-V01 で `公開 → 非公開`、TEST-NOTE-V02 で `非公開 → 公開` が描画される

## 2. note_type 別の意味軸分岐

- [ ] `delete_request` では公開状態 diff ではなく「在籍 → 退会（論理削除）」のレコード状態遷移として表現される（AC-2）
- [ ] `visibility_request` の公開状態 diff と `delete_request` のレコード状態遷移が混同されない
- [ ] TEST-NOTE-D01 で公開状態 diff 文言（`公開 → 非公開` 等）が出ない

## 3. 日本語ラベル変換

- [ ] publishState の生値（`public` / `member_only` / `hidden` / `unknown`）が日本語ラベル（公開 / 会員限定 / 非公開 / 不明）へ変換される（AC-3）
- [ ] 生の英語値が画面に露出しない（`formatPublishStateLabel` 経由）
- [ ] 未知値が「不明」へ fail-soft し、throw しない

## 4. 承認確認ダイアログの具体文言

- [ ] `visibility_request` 承認時に `公開 → 非公開 に変更します` 相当の具体遷移文言が提示される（AC-8）
- [ ] `delete_request` 承認時は既存の退会・論理削除文言が維持される
- [ ] TEST-NOTE-V02 でダイアログに `非公開 → 公開` 相当の具体遷移が表示される

## 5. アクセシビリティ（矢印 aria-hidden）

- [ ] diff の矢印 `→` に `aria-hidden="true"` が付与され、装飾として扱われる（AC-9）
- [ ] before/after の意味がテキスト span で担保され、screen reader が「変更前 公開、変更後 非公開」相当を連続読み上げできる
- [ ] 既存 `aria-label="申請詳細"` 等の aria が不変

## 6. デザイントークン（HEX 0 件）

- [ ] diff の強調色がすべて `tokens.css` の OKLch トークン（`var(--ubm-color-*)`）由来である（AC-4）
- [ ] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が対象ファイルに 0 件で `verify-design-tokens` が PASS（AC-5）
- [ ] 新規トークンを追加していない（既存 accent / text-secondary / warn で賄う）

## 7. 既存機能不変（Regression Guard）

- [ ] 新規 primitive を増やさず、`data-diff-side` 属性 + 既存 primitive で構成（AC-6）
- [ ] 新 endpoint 追加 / D1 schema 変更 / GET `/admin/requests` projection 拡張なし（AC-7・`git diff --name-only -- apps/api packages/shared` が空）
- [ ] ルート `/admin/requests` / API パス / 既存 data-* / テストセレクタが不変（AC-10）
- [ ] 既存 3 spec（`RequestQueueDetail` / `RequestConfirmDialog` / `RequestQueuePanel.component`）が green を維持
- [ ] 申請一覧・承認/却下・ダイアログの既存導線が挙動不変
