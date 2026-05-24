# Phase 1: 要件定義

[実装区分: 実装仕様書]
**判定根拠:** issue #827 (UT-DSF-05) の受け入れ基準に「adapter は pure function (unit test green)」「visibility filter 二重防御動作確認」が含まれ、これらは `apps/web/src/lib/adapters/member-detail.ts` の新規作成および `MemberDetailSections.tsx` / `page.tsx` の編集を必須とするコード変更を伴う。

## 背景

issue #827 (UT-DSF-05) は当初「serial-06: Google Form 実回答 → `/(public)/members/[id]` MemberDetail 描画」を範囲としていた。issue クローズ後も以下のギャップが残存している:

- pure function adapter `apps/web/src/lib/adapters/member-detail.ts` が存在しない（page.tsx が `PublicMemberProfile` shape を直接 props として primitives に渡している）
- UI 側に `visibility === "public"` の二重防御 filter が無い（API builder.ts:287 が `["public"]` フィルタ済みだが、UI 層の defense-in-depth が未整備）
- adapter unit test が未整備
- unknown field の silent skip が zod parse 黙示で、明示的な adapter 層の責務になっていない

## ゴール

1. `MemberDetailSections` を含む public 会員詳細描画のデータ正規化を pure function adapter 層に集約する。
2. UI 層で `visibility === "public"` の二重防御 filter を適用する。
3. unknown `kind` の silent skip を adapter の明示責務にする。
4. 既存の Playwright visual snapshot が再撮影不要であること（render 結果不変が前提）。

## 非ゴール

- 新規 API endpoint 追加（issue 不変条件: API surface 不変）
- `PublicMemberProfileZ` schema 変更
- D1 直接アクセス（不変条件 #5）
- `ProfileHero` / `MemberTags` / `MemberLinks` / `MemberActivity` の primitives 変更
- 6 セクションのレイアウト/順序変更
- visual snapshot baseline 更新

## 入出力

| 項目 | 内容 |
|------|------|
| 入力 | `PublicMemberProfile` (zod 検証済み) |
| 出力 | adapter が返す `MemberDetailViewModel` (sections / activity 分離済み, public filter 適用済み) |
| 副作用 | なし（pure function） |
