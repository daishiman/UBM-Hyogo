# Phase 05 — 実装計画 (CONST_005 必須項目)

## 変更対象ファイル一覧

| パス | 種別 |
| --- | --- |
| `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` | 新規 |
| `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` | 新規 |
| `apps/web/app/error.tsx` | 編集 |
| `apps/web/app/__tests__/error.component.spec.tsx` | 編集（assertion 維持） |
| `apps/web/app/login/error.tsx` | 編集 |
| `apps/web/app/login/__tests__/error.component.spec.tsx` | 新規 |
| `apps/web/app/profile/error.tsx` | 編集 |
| `apps/web/app/profile/__tests__/error.component.spec.tsx` | 新規 |
| `apps/web/app/(admin)/admin/error.tsx` | 編集 |
| `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` | 新規 |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | 編集（error boundary focus ガイド追記） |

## 主要シグネチャ

### hook

```ts
export function useAutoFocusOnMount<T extends HTMLElement>(
  ref: RefObject<T | null>,
): void;
```

### 呼び出し側パターン

```tsx
const headingRef = useRef<HTMLHeadingElement>(null);
useAutoFocusOnMount(headingRef);
// <h1 ref={headingRef} tabIndex={-1}>...</h1>
```

## 入出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `RefObject<HTMLElement \| null>` |
| 出力 | `void` |
| 副作用 | mount 時 `ref.current?.focus({ preventScroll: true })` 1 回 |
| エラー | throw しない（ref null → noop） |

## テスト方針

| spec | ケース |
| --- | --- |
| `useAutoFocusOnMount.spec.tsx` | C-1 mount 時 focus 1 回 / C-2 ref null noop / C-3 再 render で focus 再呼び出しなし |
| `error.component.spec.tsx` (root) | 既存 AC 維持（`focus({ preventScroll: true })` assert） |
| `login/error.component.spec.tsx` | h1 が tabIndex=-1 / focus 呼び出し |
| `profile/error.component.spec.tsx` | 同上 |
| `admin/error.component.spec.tsx` | 同上 |

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web vitest run src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx
mise exec -- pnpm --filter @ubm/web vitest run app/__tests__/error.component.spec.tsx app/login/__tests__ app/profile/__tests__ "app/(admin)/admin/__tests__"
```

## DoD (Definition of Done)

- [ ] `useAutoFocusOnMount` hook が `apps/web/src/lib/a11y/` 配下に存在
- [ ] hook 単体 spec 3 ケース全通過
- [ ] 4 boundary すべてで hook 経由の focus 呼び出しに統一
- [ ] 4 boundary component spec 全通過
- [ ] `pnpm typecheck` pass
- [ ] `pnpm lint` pass
- [ ] `bash scripts/verify-pr-ready.sh` pass
- [ ] 既存 root error component spec の AC が破壊されていない

## ロールバック方針

hook 抽出のみで API/D1/UI 文言変更なし → revert PR 1 本で完全復元可能。
