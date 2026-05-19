# Phase 8: リファクタ

## 1. 本タスク内で行うリファクタ

**なし。**

理由: parent spec の横展開メモが「共通 hook `useAutoFocusOnMount(ref)` は i05/i06 完了後に refactor として抽出」と明示しているため、i05 単独で hook 抽出を行うと scope 拡大になる。

## 2. 後続 refactor タスク（本仕様書 scope 外）

| ID | 内容 | 着手条件 |
|---|---|---|
| R-1 | `useAutoFocusOnMount(ref: RefObject<HTMLElement>)` を `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` に抽出 | i05 (#768) と i06 (root error focus) が両方完了 |
| R-2 | `login/error.tsx` / root `error.tsx` を hook 利用に置換 | R-1 完了後 |
| R-3 | hook の Vitest 単体テスト追加 | R-1 と同 PR |

## 3. 本タスクで触らないコード

- `apps/web/app/login/page.tsx`
- `apps/web/app/login/_components/**`
- `apps/web/app/login/layout.tsx`（存在する場合）
- root `apps/web/app/error.tsx`（i06 で対応）

## 4. コード品質チェック

```bash
mise exec -- pnpm lint
mise exec -- pnpm typecheck
```

両方 PASS を維持。

## 5. 不要 import / 不要 export チェック

- `LoginErrorProps` interface は `export` を保持（テストファイルから type import 可能にするため）
- `loading.tsx` は default export のみ
