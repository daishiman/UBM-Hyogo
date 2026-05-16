# Phase 6: 実装手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装手順 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | completed |

## 目的

Phase 5 計画に基づき、各ファイルの行レベル変更手順を擬似コード形式で明示する。

## 6-1. VisibilityRequestDialog.tsx の変更手順

### Step 1: import 追加

ファイル先頭の import ブロックに以下を追加:

```ts
import { useRouter } from "next/navigation";
```

### Step 2: router 宣言

`VisibilityRequestDialog` 関数 component 内、`const titleId = useId();` の直後に追加:

```ts
const router = useRouter();
```

### Step 3: success branch 編集

`onSubmit` 内、現状:

```ts
if (res.ok) {
  onSubmitted(res.accepted);
  onClose();
}
```

を以下に変更:

```ts
if (res.ok) {
  router.refresh();
  onSubmitted(res.accepted);
  onClose();
}
```

### Step 4: failure branch は変更しない

`else { ... }` および `catch (err) { ... }` ブロックには **触らない**。`router.refresh()` を追加してはならない。

## 6-2. DeleteRequestDialog.tsx の変更手順

VisibilityRequestDialog.tsx と同じ 4 ステップ。

### Step 1: import 追加

```ts
import { useRouter } from "next/navigation";
```

### Step 2: router 宣言

`const titleId = useId();` の直後に:

```ts
const router = useRouter();
```

### Step 3: success branch 編集

```ts
if (res.ok) {
  router.refresh();
  onSubmitted(res.accepted);
  onClose();
}
```

### Step 4: failure branch は変更しない

## 6-3. VisibilityRequestDialog.component.spec.tsx の変更手順

### Step 1: useRouter mock セットアップ

ファイル先頭の `import` 群の後に追加:

```ts
import { useRouter } from "next/navigation";
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));
```

### Step 2: 既存テストに影響を与えない default mock

`describe` ブロック先頭の `beforeEach` または各テスト冒頭で:

```ts
beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
});
```

### Step 3: 新規テストケース追加（describe 末尾）

```ts
it("202 → router.refresh が onSubmitted/onClose より先に 1 回呼ばれる", async () => {
  const refresh = vi.fn();
  vi.mocked(useRouter).mockReturnValue({
    refresh,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
  mockFetch(202, {
    queueId: "q1",
    type: "visibility_request",
    status: "pending",
    createdAt: "now",
  });
  const onSubmitted = vi.fn();
  const onClose = vi.fn();
  render(
    <VisibilityRequestDialog
      desiredState="hidden"
      open={true}
      onClose={onClose}
      onSubmitted={onSubmitted}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByTestId("visibility-submit"));
  });
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  expect(onSubmitted).toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});

it("409 失敗時 router.refresh は呼ばれない", async () => {
  const refresh = vi.fn();
  vi.mocked(useRouter).mockReturnValue({
    refresh,
    push: vi.fn(), replace: vi.fn(), back: vi.fn(),
    forward: vi.fn(), prefetch: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
  mockFetch(409, { error: "DUPLICATE_PENDING_REQUEST" });
  render(
    <VisibilityRequestDialog
      desiredState="hidden"
      open={true}
      onClose={vi.fn()}
      onSubmitted={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByTestId("visibility-submit"));
  await screen.findByRole("alert");
  expect(refresh).not.toHaveBeenCalled();
});
```

## 6-4. DeleteRequestDialog.component.spec.tsx の変更手順

VisibilityRequestDialog spec と同じ 3 ステップ。`fireEvent.click` の前に `delete-confirm-checkbox` のチェックを忘れない:

```ts
fireEvent.click(screen.getByTestId("delete-confirm-checkbox"));
fireEvent.click(screen.getByTestId("delete-submit"));
```

`type: "delete_request"` の queue payload を mock する。

## 6-5. 実装後チェックリスト

- [ ] 4 ファイル全てに変更が反映されている
- [ ] failure branch には変更がない（diff で `else` / `catch` 行が触られていない）
- [ ] `useRouter` import が `next/navigation` からのみ
- [ ] 既存 6 ケース（Visibility） + Delete 既存 + RequestActionPanel が green
- [ ] 新規 2 ケース（success / 409 失敗時 not called）× 2 dialog = 計 4 ケースが green

## 実行タスク

- [ ] 4 ファイルの行レベル変更手順を明記する
- [ ] 実装後チェックリストを作成する
- [ ] `outputs/phase-06/implementation-steps.md` を作成する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/implementation-steps.md | 行レベル擬似コード + チェックリスト |

## 完了条件

- [ ] 4 ファイル分の手順が記録されている
- [ ] 実装後チェックリストが提示されている

## 次 Phase

- 次: 7 (テスト計画)
- 引き継ぎ事項: 新規テストケース仕様 / mock 戦略
