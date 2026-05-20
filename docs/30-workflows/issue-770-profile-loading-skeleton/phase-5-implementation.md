# Phase 5: 実装手順

## 0. 事前確認

```bash
mise exec -- node -v   # v24.15.0
grep -nE "color-surface-2|surface-bg-2" apps/web/src/styles/tokens.css apps/web/src/styles/globals.css
grep -rn "profile-loading" apps/web 2>/dev/null   # data-page 命名衝突確認（空であること）
test -f apps/web/vitest.setup.ts && grep "jest-dom" apps/web/vitest.setup.ts
```

期待:
- `--ubm-color-surface-bg-2` / `--color-surface-2: var(--ubm-color-surface-bg-2);` が存在
- `data-page="profile-loading"` の grep 結果が空（命名重複なし）
- `vitest.setup.ts` に `@testing-library/jest-dom/vitest` import あり

## 1. Step 1: `apps/web/app/profile/loading.tsx` 置換

現実装を Phase 2 §3.1 の snippet で全置換する。

```tsx
import type { ReactElement } from "react";

export default function ProfileLoading(): ReactElement {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-3xl space-y-6 px-6 py-12"
      data-page="profile-loading"
    >
      <span className="sr-only">マイページを読み込み中</span>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-8 w-48 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-4/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-3/6 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
    </main>
  );
}
```

> 既存ファイル冒頭のコメント `// 06b: /profile streaming 用 placeholder。` は本タスクで責務が明示化されるため削除する。

## 2. Step 2: `apps/web/app/profile/loading.spec.tsx` 新規作成

Phase 4 §3 の snippet をそのまま作成する。`.test.tsx` ではなく `.spec.tsx` であること（不変条件 #8 / lefthook `block-test-suffix`）。

## 3. Step 3: 型 / lint

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

両方 PASS まで反復修正（最大 3 サイクル / CONST_007 範囲内）。

## 4. Step 4: テスト実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- app/profile/loading.spec.tsx
```

全 TC PASS を確認。

## 5. Step 5: HEX 直書き grep（task-18 gate 先回り）

```bash
grep -nE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/app/profile/loading.tsx
```

ヒットなしを確認。ヒットがあれば必ず token utility に置換してから commit する。

## 6. Step 6: 完了報告ファイル更新

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md` の `スコープ確定ノート` を `status: pending` → `implemented_local_runtime_pending` に更新
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` の i07 行を `implemented_local_runtime_pending` に更新
- parallel-07 spec §4.5 行頭に消し込みコメント `// implemented by issue-770` を追記（既存記法に合わせる）

## 7. DoD（Definition of Done）

- [ ] `apps/web/app/profile/loading.tsx` が Phase 2 §3.1 と一致する
- [ ] `<main>` が `role="status"` / `aria-busy="true"` / `aria-live="polite"` を持つ
- [ ] `.sr-only` で「マイページを読み込み中」が render される
- [ ] `bg-surface-2` を持つ skeleton block が 6 個 (avatar + heading + KV4)
- [ ] `motion-safe:animate-pulse` 適用（reduced-motion 尊重）
- [ ] `data-page="profile-loading"` 付与
- [ ] HEX 直書きなし（grep ヒット 0 件）
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @ubm-hyogo/web test -- app/profile/loading.spec.tsx` 全 PASS
- [ ] localhost 目視（Phase 11）で skeleton 表示と CLS 整合を確認済み
- [ ] parallel-07 spec §4.5 / i07 spec / integration-fixes index の状態更新済み
