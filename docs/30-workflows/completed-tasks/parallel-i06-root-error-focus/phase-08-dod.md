---
phase: 8
title: DoD (Definition of Done)
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 8 — DoD

[実装区分: 実装仕様書]

## 1. 実装 DoD

- [x] `apps/web/app/error.tsx` L4 に `useRef` import が追加されている
- [x] `RouteError` 本体に `const headingRef = useRef<HTMLHeadingElement>(null);` が追加されている
- [x] 既存 `useEffect` 末尾に `headingRef.current?.focus({ preventScroll: true });` が追加されている
- [x] `<h1>` に `ref={headingRef} tabIndex={-1}` が付与されている
- [x] それ以外の JSX / className / 文言 / logger.error 呼び出しに変更がない

## 2. テスト DoD

- [x] `apps/web/app/error.spec.tsx` が存在する（新規 or 既存に 2 ケース追記）
- [x] TC-01（focus 移譲）が PASS
- [x] TC-02（digest 表示）が PASS
- [x] `it.skip` / `it.todo` が 0 件

## 3. 品質ゲート DoD

- [x] `pnpm typecheck` exit 0
- [x] `pnpm lint` exit 0
- [x] `pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx` 2 PASS
- [x] `grep -nE '#[0-9a-fA-F]{3,8}' apps/web/app/error.tsx` 0 件
- [x] `grep -nE '\\b(bg|text)-\\[#' apps/web/app/error.tsx` 0 件

## 4. ドキュメント DoD

- [x] 本 workflow root（`docs/30-workflows/parallel-i06-root-error-focus/`）の Phase 1-13 が揃っている
- [x] source spec（`ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md`）との内容整合
- [x] CLAUDE.md 不変条件 1-4（UI prototype alignment）に違反していない

## 5. acceptance criteria 達成確認

- [x] `parallel-07` spec section 4.3「Root error.tsx focus 管理」DoD が達成されている

## 6. 完了条件（最終）

上記 §1〜§5 すべて check 済かつ `git diff --name-status` が対象ファイルのみを含む:

```
 M apps/web/app/error.tsx
 A apps/web/app/error.spec.tsx
 A docs/30-workflows/parallel-i06-root-error-focus/**/*
```

`apps/web/app/error.tsx` の semantic changes は `useRef` import、`headingRef` 生成、`focus({ preventScroll: true })` 呼び出し、`h1` の `ref/tabIndex` 付与の 4 件に限定する。
