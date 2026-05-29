# Phase 5: 実装

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 5 / 13                      |
| 名称      | 実装                        |
| 状態      | completed                   |
| 作成日    | 2026-05-28                  |

## 1. 変更対象ファイル

| #   | パス                                              | 種別          | 説明                                  |
| --- | ------------------------------------------------- | ------------- | ------------------------------------- |
| 1   | `apps/web/app/page.tsx`                           | 編集          | `getAuthView` import + await + props 配線 |
| 2   | `apps/web/app/__tests__/page.spec.tsx`            | 編集 or 新規  | Phase 4 のテスト追加                     |

## 2. 実装差分（diff 方針）

`apps/web/app/page.tsx`:

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

> `connection()` / `revalidate = 60` / `generateMetadata` は不変。

## 3. canUseTool 適用範囲と制約

該当なし（本 task は Claude Code SDK callback フローではない）。

## 4. 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run app/__tests__/page.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## 5. 完了条件

- 上記 4 コマンド全て green
- `grep -n "PublicHeader\s*/>" apps/web/app/page.tsx` が 0 件（旧 `<PublicHeader />` が残らない）
- `grep -n "await getAuthView" apps/web/app/page.tsx` が 1 件
- Phase 4 TC-01 / TC-02 が GREEN

## 6. workflow_state 昇格条件

Phase 5 完了時点で `artifacts.json.metadata.workflow_state` を `implemented_local_evidence_captured` に昇格済。phase status は `completed`。

## 7. 依存

- **前提**: Task A/B 共通の `apps/web/src/lib/auth-view/index.ts` (`getAuthView`) と `PublicHeader` authView props 化が同 wave で投入済。
