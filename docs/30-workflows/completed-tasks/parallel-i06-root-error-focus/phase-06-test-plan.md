---
phase: 6
title: テスト計画
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 6 — テスト計画

[実装区分: 実装仕様書]

## 1. テストランナー

repo root の `vitest.config.ts` を `--root=../..` で参照する既存パターンに従う。
`apps/web` workspace の `package.json` scripts:

```
"test": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts apps/web"
```

実行コマンド:

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx
```

## 2. テスト対象 / 検証観点

| Case ID | 観点 | 期待 |
|---------|------|------|
| TC-01 | mount 直後の focus 移譲 | `document.activeElement === <h1>` |
| TC-02 | digest 表示 regression | digest が DOM に出現 |

## 3. 詳細仕様

### TC-01 — mount focus

```tsx
it("マウント直後に h1 へ自動 focus が当たる", () => {
  render(<RouteError error={new Error("boom")} reset={() => {}} />);
  const heading = screen.getByRole("heading", { level: 1 });
  expect(heading).toHaveFocus();
});
```

- `@testing-library/react` の `render` は jsdom / happy-dom 環境で element を mount し、useEffect も同期実行される。
- `toHaveFocus` は `@testing-library/jest-dom` matcher（既存 setup で global expand 済と想定）。

### TC-02 — digest 表示

```tsx
it("digest が渡された場合は画面に表示する", () => {
  const err = Object.assign(new Error("boom"), { digest: "abc123" });
  render(<RouteError error={err} reset={() => {}} />);
  expect(screen.getByText(/abc123/)).toBeInTheDocument();
});
```

## 4. 前提セットアップ確認

実装着手前に以下を確認する:

| 項目 | 確認コマンド | 期待 |
|------|------------|------|
| jest-dom matcher 拡張 | `grep -r "@testing-library/jest-dom" apps/web vitest.config.ts` | setup 済 |
| jsdom / happy-dom | `grep -E "environment\|jsdom\|happy-dom" vitest.config.ts` | DOM 環境設定済 |

セットアップが未整備の場合は、本 Phase 仕様内で setup ファイルを補完すること（CONST_007 により別タスク先送り禁止）。

## 5. coverage 期待

| ファイル | before | after |
|----------|--------|-------|
| `apps/web/app/error.tsx` | 0%（未テスト） | line 100% 想定 |

`pnpm -F "@ubm-hyogo/web" test:coverage` は本タスクの DoD ではないが、後続 Phase 11 の参考値として記録可能。

## 6. skip / todo 禁止

`it.skip` / `it.todo` / `describe.skip` は本 spec で使用しない（quality-gates §7.3 準拠）。
