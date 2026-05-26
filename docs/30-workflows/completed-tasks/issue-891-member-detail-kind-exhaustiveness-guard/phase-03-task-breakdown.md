# Phase 3: タスク分解

CONST_007 に従い、本仕様は **1 サイクルで完了するスコープ**として設計する。タスク分割はせず、1 つの実装単位として進める（並列分割の必要がない小規模スコープ）。

## タスクリスト

| # | タスク | 担当ファイル | 受け入れ条件 |
|---|--------|------------|-------------|
| T1 | `KIND_ROUTE` exhaustive マップ導入 | `apps/web/src/lib/adapters/member-detail.ts` | `satisfies Record<FieldKind, KindRoute>` で定義され、key を 1 件削るとコンパイル fail する |
| T2 | `DETAIL_KINDS` / `LINK_KINDS` 導出 set 追加 | 同上 | `KIND_ROUTE` から `=== "detail"` / `=== "links"` で filter した `ReadonlySet<FieldKind>` |
| T3 | `normalizeField` を route-aware 化 | 同上 | `url` は `sections` に含まれず `linkSections` に残り、`consent` / `system` / `unknown` は除外される |
| T4 | adapter spec に網羅性 assert 追加 | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | `FieldKindZ.options.every((k) => k in KIND_ROUTE)` |
| T5 | adapter spec に分類除外・link routing の挙動 assert 追加 | 同上 | `url` は `linkSections`、`consent` / `system` / `unknown` は除外 |
| T6 | fixture (`apps/web/src/fixtures/public-member-profile.ts`) 確認・必要なら微調整 | 同上 fixture | 既存 8 ケース green を維持できる kind 構成 |
| T7 | `MemberDetail` から既存 `MemberLinks` へ `linkSections` を接続 | `apps/web/src/components/public/MemberDetail.tsx` | link route が UI で消費される |
| T8 | typecheck / lint / unit test / build を実行 | n/a | 全 green |
| T9 | visual snapshot diff 確認、変動があれば意図的更新 | `apps/web/playwright/`配下の baseline | diff 内容が `url` route 移動または excluded kind 除外に起因することを記録 |

## 依存関係

T1 → T2 → T3 → (T4, T5, T6 は並列可) → T7 → T8 → T9

## 並列化

本仕様は単一 adapter 内の小規模変更につき並列化対象外。Phase 5 の手順は 1 つの sub-agent または 1 名の実装者で順次実行する。

## 先送りタスク（無し）

CONST_007 に従い、本仕様で発生する作業はすべて 1 サイクル内で完結させる。`url: "links"` を予約するだけでは公開リンクを失うため、既存 `MemberLinks` への接続も本仕様内で完了する。
