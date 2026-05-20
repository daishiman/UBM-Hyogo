---
phase: 2
title: アーキテクチャ — React focus 管理パターン
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 2 — アーキテクチャ

[実装区分: 実装仕様書]

## 1. 選定パターン

**useRef + useEffect で programmatic focus 移譲** を採用する。

### 採用理由

| 観点 | 採用案 (useRef + useEffect) | 不採用案 (autoFocus 属性) |
|------|------------------------|----------------------|
| 対象要素 | h1（非フォーム要素）に適用可能 | input/button 系のみ |
| Next.js App Router 互換 | Client Component 内で副作用として完結 | React DOM 上 heading に autoFocus は noop |
| `preventScroll` | サポート | 非対応 |
| テスト容易性 | `@testing-library/react` で `toHaveFocus` 検証 | 同左 |

### 不採用案

- `useLayoutEffect`: paint 前に focus を当てる必要はなく、useEffect で十分。useLayoutEffect は SSR で warning を出すリスクがある。
- ref callback (`ref={(el) => el?.focus()}`): error が複数回 throw された場合 ref callback が複数回呼ばれ、副作用順序が `logger → focus` で固定できない。

## 2. 副作用順序

同一 `useEffect`（deps `[error]`）内で以下の順序を固定する:

```
1. logger.error({ event, digest, err })   // 観測ログ
2. headingRef.current?.focus(...)         // a11y focus 移譲
```

`logger.error` を先に置く理由: focus 移譲は副作用が DOM に出るため throw する可能性がゼロではない。ログ送出を先に行うことで観測性を保証する。

## 3. コンポーネント階層への影響

- root `app/layout.tsx`: 変更なし
- route group layout (`(public)/layout.tsx` 等): 変更なし
- `app/error.tsx`: 内部実装の変更のみ（external contract = Props 型は不変）
- 子ツリー: 影響なし

## 4. 依存

- React 19 (`useRef`, `useEffect`) — 既存導入済
- `@testing-library/react` — 既存テストで利用中
- `vitest` + happy-dom or jsdom — repo root の `vitest.config.ts` で構成済（要 Phase 6 で確認）

## 5. アーキテクチャ判断ログ

| 判断 | 内容 |
|------|------|
| AD-01 | focus 移譲は React effect で行い、CSS `:focus` 自動付与には頼らない |
| AD-02 | `preventScroll: true` を必須とする（既存 scroll 位置の維持のため） |
| AD-03 | `tabIndex={-1}` のみ付与（`tabIndex={0}` は tab order を汚すため不採用） |
