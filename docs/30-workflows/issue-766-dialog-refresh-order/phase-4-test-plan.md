# Phase 4: テスト計画

## 1. テスト対象 / 種別

| ファイル | 種別 | テスト戦略 |
|---------|------|-----------|
| `VisibilityRequestDialog.component.spec.tsx` | component test (vitest + RTL) | `useRouter` モック → 副作用呼び出し順序 assertion |
| `DeleteRequestDialog.component.spec.tsx` | component test | 同上 |
| `RequestActionPanel.component.spec.tsx` | component test | parent からの `router.refresh` 発火を assert: **呼ばれない** |

## 2. テストケース一覧

### TC-D1: VisibilityRequestDialog 成功時の副作用順序

- 前提: `requestVisibilityChange` モックが `{ ok: true, accepted: <QueueAccepted> }` を返す
- 操作: dialog open → 申請ボタン click → submit resolve
- 期待: callOrder が `["refresh","onSubmitted","onClose"]` に厳密一致

### TC-D2: DeleteRequestDialog 成功時の副作用順序

- 前提: `requestDelete` モックが `{ ok: true, accepted: <QueueAccepted> }` を返す
- 操作: 不可逆 checkbox check → 申請ボタン click → submit resolve
- 期待: callOrder が `["refresh","onSubmitted","onClose"]` に厳密一致

### TC-D3: VisibilityRequestDialog エラー時に refresh が発火しない

- 前提: `requestVisibilityChange` が `{ ok: false, code: "SERVER" }` を返す
- 期待: `router.refresh` mock の呼び出し回数 = 0

### TC-D4: DeleteRequestDialog エラー時に refresh が発火しない

- 同上 (delete 版)

### TC-D5: DUPLICATE_PENDING_REQUEST 時の挙動

- 前提: `{ ok: false, code: "DUPLICATE_PENDING_REQUEST" }` を返す
- 期待: `router.refresh` mock の呼び出し回数 = 0 / `onSubmitted` は server-shaped accepted で呼ばれる / `onClose` は呼ばれない (既存挙動維持)

### TC-P1: RequestActionPanel から parent 由来 refresh が起きない

- 前提: `useRouter` の `refresh` を vi.fn() でモック
- 操作: dialog 子を render → onSubmitted を直接 invoke
- 期待: `router.refresh` mock 呼び出し回数 = 0

## 3. モック方針

```ts
// 共通: useRouter mock
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

// 呼び出し順序検証用
const callOrder: string[] = [];
const refresh = vi.fn(() => callOrder.push("refresh"));
const onSubmitted = vi.fn(() => callOrder.push("onSubmitted"));
const onClose = vi.fn(() => callOrder.push("onClose"));
```

## 4. 実行コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 5. 完了判定

- TC-D1 ～ TC-D5, TC-P1 すべて PASS
- 既存テストの green を維持 (regression なし)
