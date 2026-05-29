# Implementation Guide

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 12 / 13                     |
| 名称      | 実装ガイド                  |
| 状態      | implemented_local_evidence_captured |
| 作成日    | 2026-05-28                  |

## Part 1: 概念説明（初学者向け）

ホームページ（`/`）には、画面の一番上に共通のヘッダー（`PublicHeader`）が表示されています。今までは「ログインしているかどうか」に関係なく同じヘッダーが出ていました。

別タスク（Task A）でこのヘッダーが「ログイン状態を受け取って表示を変える部品」に作り変わります。例えるなら「お店の入り口で、常連さん用とお客さん用で挨拶を変える看板」に変わるイメージです。

このタスク（Task B）では、ホームページから看板に「どんなお客さんですか」を伝える役割を追加します。具体的には、ページを表示する前に「ログイン状態」を1回だけ調べて、ヘッダーに渡します。

「なぜ必要か」: Task A で看板の入力欄が変わるので、ホームページ側もその入力欄に値を入れないと、看板が動かなくなる（ビルドエラー / 表示エラー）からです。

「何をするか」:
1. `getAuthView` という関数を呼んで「ログイン状態」を取得する
2. その結果を `<PublicHeader authView={...} />` というかたちでヘッダーに渡す

### 今回作ったもの

- `AuthView` という「guest / member / admin だけを表す安全な表示用の型」
- `getAuthView()` という「セッションから表示状態を作る helper」
- `PublicHeader authView` と root `/` の配線、およびそれを確認する focused tests

## Part 2: 技術的詳細（開発者向け）

### 変更対象ファイル

| #   | パス                                              | 種別          |
| --- | ------------------------------------------------- | ------------- |
| 1   | `apps/web/src/lib/auth-view/index.ts`             | 新規          |
| 2   | `apps/web/src/components/public/PublicHeader.tsx` | 編集          |
| 3   | `apps/web/app/(public)/layout.tsx`                | 編集          |
| 4   | `apps/web/app/page.tsx`                           | 編集          |
| 5   | `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 新規 |
| 6   | `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | 編集 |
| 7   | `apps/web/app/__tests__/page.spec.tsx`            | 新規          |

### APIシグネチャ

```ts
// apps/web/src/lib/auth-view/index.ts (Task A/B shared)
export type AuthView =
  | { kind: "guest" }
  | { kind: "member"; profileHref: string }
  | { kind: "admin"; profileHref: string; adminHref: string }
  ;

export async function getAuthView(): Promise<AuthView>;
```

### 使用例

```tsx
const authView = await getAuthView();

return <PublicHeader authView={authView} />;
```

### diff（実装の中心）

```diff
+ import { getAuthView } from "../src/lib/auth-view";

  export const revalidate = 60;

  export default async function HomePage() {
+   const authView = await getAuthView();
    // ...既存 data fetch（getStats, listMembersRaw 等）...
    return (
      <>
-       <PublicHeader />
+       <PublicHeader authView={authView} />
        <Hero ... />
        ...
        <PublicFooter />
      </>
    );
  }
```

### test diff（要点）

```ts
vi.mock("../../src/lib/auth-view", () => ({ getAuthView: vi.fn() }));
vi.mock("../../src/lib/api/public", () => ({
  PUBLIC_API_REVALIDATE: { stats: 60, members: 60 },
  getStats: vi.fn(async () => ({ totalMembers: 0, publishedMembers: 0, recentMeetings: [] })),
  listMembersRaw: vi.fn(async () => ({ items: [] })),
}));

// TC-01 guest
(getAuthView as any).mockResolvedValue({ kind: "guest" });
// TC-02 member
(getAuthView as any).mockResolvedValue({ kind: "member", profileHref: "/profile" });
```

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run app/__tests__/page.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web build
```

### エラーハンドリング

`getAuthView()` は session 取得に失敗した場合も公開ページ全体を壊さず、
`{ kind: "guest" }` に fail-closed する。root page 側は catch せず、
表示用の `authView` を受け取って `PublicHeader` に渡すだけにする。

### エッジケース

| ケース                       | 挙動                                          |
| ---------------------------- | --------------------------------------------- |
| session が null              | `data-auth-state="guest"` + `/login` link     |
| `authView.kind === "guest"`  | `data-auth-state="guest"` + `/login` link     |
| `authView.kind === "member"` | `data-auth-state="member"` + `/profile` link  |
| `authView.kind === "admin"`  | member CTA + `/admin` link                    |

### 設定項目と定数一覧

| 名前               | 値    | 由来                                     |
| ------------------ | ----- | ---------------------------------------- |
| `revalidate`       | `60`  | 既存（変更しない）                       |
| `connection()`     | 既存  | 既存（変更しない）                       |
| `generateMetadata` | 既存  | 既存（変更しない）                       |

### テスト構成

| Path | Focus |
| --- | --- |
| `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | guest / member / admin の決定論的変換 |
| `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | `data-auth-state` と CTA 出し分け |
| `apps/web/app/__tests__/page.spec.tsx` | root `/` が `getAuthView()` の結果を渡すこと |

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `outputs/phase-11/manual-test-result.md`（focused Vitest log + grep gate + typecheck/lint/build log）を参照。
