# Phase 1: 要件定義

[実装区分: 実装仕様書]
**判定根拠:** issue #891 の目的（`FieldKindZ` 拡張時の分類漏れを型 or テストで fail させる）達成には `apps/web/src/lib/adapters/member-detail.ts` のコード変更（`KIND_ROUTE` 導入・filter 適用）と adapter spec 追加が不可欠。docs-only では達成不能。

## 背景

issue-827 (#827) の followup として登録された issue-891 は元々「`DISPLAYABLE_KINDS` allowlist と `FieldKindZ` enum の二重管理が silent skip を生む」問題に対する exhaustiveness guard を提案するものだった。issue クローズ後の現行コードを確認したところ、想定と現実が乖離している。

**現行 `apps/web/src/lib/adapters/member-detail.ts` (2026-05-25 時点)** の挙動:

- `DISPLAYABLE_KINDS` allowlist は**存在しない**
- `normalizeField` は `field.visibility !== "public"` 除外と `FieldKindZ.safeParse` 不合格時の null 化のみを行う
- `FieldKindZ` enum (`shortText` / `paragraph` / `date` / `radio` / `checkbox` / `dropdown` / `url` / `consent` / `system` / `unknown`) を通過した kind は**すべて** `NormalizedSection.fields` に残る
- `MemberLinks` component は存在するが、adapter が link 用 field を分離していないため `MemberDetail` から利用できない
- 結果として `url` / `consent` / `system` / `unknown` の kind を持つ field も `MemberDetailSections` の KV row として render されるか、単純除外では公開リンクが失われる

つまり issue-891 が「silent skip」と呼んでいた問題は、現在は「**silent over-render**」と「単純除外時の link data loss」として現れている。さらに `FieldKindZ` が拡張されても adapter 側は分類を持たないため、新 kind が detail / links / excluded のどこへ流れるかをコンパイル時に検証できない。

## ゴール

1. `FieldKindZ` の全 kind を **exhaustive な `KIND_ROUTE` マップ**（`satisfies Record<FieldKind, KindRoute>`）で分類する。
2. adapter の `normalizeField` を route ごとに再利用し、detail は `KIND_ROUTE[kind] === "detail"`、links は `KIND_ROUTE[kind] === "links"` のみ通すよう変更する。
3. `FieldKindZ` に新 kind が追加されたら、`KIND_ROUTE` への追記漏れが `pnpm typecheck` で fail することを保証する。
4. 追加 unit test で `FieldKindZ.options` 全件が `KIND_ROUTE` に存在することを runtime にも検証する。
5. 既存 adapter 挙動（公開 detail に出ていた kind 群）を**意図的に修正**する: `url` は detail から除外して `linkSections` に残し、`consent` / `system` / `unknown` は除外する。`shortText` / `paragraph` / `date` / `radio` / `checkbox` / `dropdown` のみが detail に残る。

## 非ゴール

- `FieldKindZ` enum 自体の変更
- `MemberLinks` の新規 component 開発（既存 component を `linkSections` へ接続するのみ）
- `MemberDetailSections` のレイアウト変更
- API endpoint / D1 schema / Google Form schema の変更（不変条件で禁止）

## 入出力

| 項目 | 内容 |
|------|------|
| 入力 | `PublicMemberProfile`（zod 検証済み） |
| 出力 | `MemberDetailProps`（`sections` は `KIND_ROUTE === "detail"`、`linkSections` は `KIND_ROUTE === "links"` のみ） |
| 副作用 | なし（pure function 維持） |

## 受け入れ条件

- `apps/web/src/lib/adapters/member-detail.ts` で `KIND_ROUTE` が `satisfies Record<FieldKind, "detail" | "links" | "excluded">` で定義されている
- `MemberDetailProps.linkSections` が追加され、`MemberDetail` が既存 `MemberLinks` へ渡している
- `KIND_ROUTE` から 1 行コメントアウトすると `pnpm typecheck` が fail することをローカル証跡で示せる
- `member-detail.spec.ts` が `FieldKindZ.options.every((k) => k in KIND_ROUTE)` を assert している
- 既存 8 ケースが全件 green のままで、新規ケース（exhaustiveness / kind 振り分け）が green
- `pnpm --filter @ubm-hyogo/web build` が成功する
- visual snapshot baseline に変更が発生する場合は本仕様の意図的修正（`url` を links へ移し、`consent` / `system` / `unknown` を detail から除く）に起因することを明記して再撮影する
