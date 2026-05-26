# Implementation Guide

## Part 1: 中学生レベル説明

会員プロフィールの項目には、短い文章、長い文章、日付、URL、同意、システム用などの種類がある。
この変更では、すべての種類について「詳細欄に出す」「リンク用に回す」「表示しない」を表で決める。
新しい種類が増えたときに表へ書き忘れると、型検査やテストが失敗して気付ける。

## Part 2: 技術者向け要約

`FieldKindZ` から導いた `FieldKind` を key とする `KIND_ROUTE` を `satisfies Record<FieldKind, KindRoute>` で定義する。
`DETAIL_KINDS` / `LINK_KINDS` はこの map から導出し、`normalizeField(field, routeKinds)` を detail / links の両方で使う。
テストは `FieldKindZ.options` と `KIND_ROUTE` key の完全一致、`consent` / `system` / `unknown` が `sections` と `linkSections` の双方から除外されること、および `url` が `sections` ではなく `linkSections` に残ることを検証する。

## Part 3: 変更ファイル

| ファイル | 変更 |
| --- | --- |
| `apps/web/src/lib/adapters/member-detail.ts` | `KIND_ROUTE` / `DETAIL_KINDS` / `LINK_KINDS` / route-aware normalizer / test internals |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | exhaustiveness と分類除外のテスト追加 |
| `apps/web/src/components/public/MemberDetail.tsx` | `linkSections` を既存 `MemberLinks` へ接続 |

## Part 4: 実装手順

1. `FieldKind` 型定義の直後に `KindRoute` と `KIND_ROUTE` を置く。
2. `DETAIL_KINDS` / `LINK_KINDS` を `KIND_ROUTE` から導出する。
3. `normalizeField` を route set 引数つきにし、`sections` / `linkSections` を生成する。
4. `MemberDetail` で `linkSections` を `MemberLinks` へ渡す。
5. `__testInternals` は test 専用として export し、production code から参照しない。

## Part 5: 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts
mise exec -- pnpm typecheck
ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build
```

## Part 6: 既知制限

visual baseline 更新は、必要になった場合でも commit / PR と同じく user-gated とする。
`activity` は `FieldKindZ` ではなく attendance 由来の別データとして扱うため、`KindRoute` には含めない。
