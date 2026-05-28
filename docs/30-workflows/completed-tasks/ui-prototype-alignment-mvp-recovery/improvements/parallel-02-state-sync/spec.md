# parallel-02-state-sync 実装仕様書

[実装区分: 実装仕様書]

## 1. 目的

マイページ profile component における mutation (visibility-request / delete-request) 成功後に、pending request の状態が `RequestPendingBanner` で即座に反映される状態を実現する。

**課題**: 現在、dialog で submit → mutation 成功 → dialog close だが、`RequestActionPanel` に渡される `pendingRequests` prop の更新遅延により、banner が即時反映されない。これは page を reload した後に初めて pending 状態が sticky 表示される（S1: server state を正本にしている）。

## 2. スコープ (G2-1)

単一の改善: mutation 成功直後に `router.refresh()` を呼び出す。

- **対象者**: client component `RequestActionPanel` の `onSubmitted` callback
- **時点**: dialog 内 `VisibilityRequestDialog` / `DeleteRequestDialog` の mutation 成功直後

## 3. 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | 修正 | `onSubmit` 内で mutation 成功時に `onSubmitted` コールバック直後 (`onClose` 前) に `router.refresh()` を挿入 |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | 修正 | 同上 |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | 確認のみ | `onSubmitted` callback は既に存在 (行 57-60)；引数 `QueueAccepted` は使用していないため、そのまま |
| `apps/web/app/profile/page.tsx` | 確認のみ | `dynamic = "force-dynamic"` + `revalidate = 0` で SSR 常時実行、`router.refresh()` 対応確認済み |

## 4. 設計

### 4.1 mutation 後の revalidation 戦略

**現状フロー**:
1. dialog の `onSubmit` → `requestVisibilityChange()` / `requestDelete()` (client API helper)
2. ✓ API endpoint (`POST /api/me/visibility-request`, `POST /api/me/delete-request`) が 202 Accepted を返す
3. ✓ client helper が success → `onSubmitted(QueueAccepted)` を呼ぶ（line 78, 69）
4. dialog が close

**改善**: step 3 の `onSubmitted` callback 内で `router.refresh()` を呼ぶ。

```typescript
// RequestActionPanel.tsx line 57-60
const onSubmitted = () => {
  // pending は server state を正本にし、送信後は再取得して durable な banner を表示する（S1）
  router.refresh();  // ← 既に存在（実装済み）
};
```

**確認**:
- `router.refresh()` は Client Component からのみ呼び出し可能 ✓ (RequestActionPanel は "use client")
- Page component の `dynamic = "force-dynamic"` により、`router.refresh()` → server side re-fetch → `/me/profile` の `pendingRequests` 再取得 → 新しい `pendingRequests` prop が `RequestActionPanel` に流入 ✓

**失敗時（catch block）**:
- mutation 失敗（409 DUPLICATE_PENDING_REQUEST など）→ `onSubmitted()` を呼んで banner を表示するが、`router.refresh()` は**呼ばない**
  - 理由: server state を既に持っている場合（409）、または error として扱う場合、refresh は不要
  - toast や error message のみで対応

### 4.2 banner 即時反映

- `/me/profile` endpoint が pending request 情報を含む `pendingRequests` object を返す（server state の正本）
- `router.refresh()` → Next.js Server Component `ProfilePage` の再実行 → `fetchAuthed<MeProfileResponse>("/me/profile")` が新しい state を取得
- `pendingRequests` prop が `RequestActionPanel` に流入 → `RequestPendingBanner` が render される
- banner は `aria-live="polite"` なため screen reader でも読み上げられる

## 5. 関数シグネチャ

### VisibilityRequestDialog.tsx

**変更前**:
```typescript
const onSubmit = async () => {
  // ...
  try {
    const res = await requestVisibilityChange({...});
    if (res.ok) {
      onSubmitted(res.accepted);
      onClose();
    } else {
      // error handling
    }
  } catch (err) {
    // error handling
  } finally {
    setPending(false);
  }
};
```

**変更後**: `onSubmitted` callback の定義を確認して、`router.refresh()` の挿入位置を決定。
- Option A: dialog 内で `useRouter()` → `router.refresh()` を呼ぶ（ローカル）
- Option B: `onSubmitted` callback の引数に `router` を渡す（parent 責務）

**採用**: Option A（ローカル処理）
- 理由: dialog component は既に client logic を持っており、banner 反映は dialog の成功要件
- parent (`RequestActionPanel`) の `onSubmitted` は generic callback（複数 dialog が共有可能）

**変更後コード（race condition 回避のため呼び出し順序固定）**:
```typescript
const router = useRouter(); // file 冒頭で宣言

const onSubmit = async () => {
  try {
    const res = await requestVisibilityChange({...});
    if (res.ok) {
      router.refresh();         // 1) Server Component 再fetch を先に発火
      onSubmitted(res.accepted); // 2) parent に通知（任意のローカル state 更新）
      onClose();                 // 3) dialog を閉じる（unmount は最後）
    } else {
      // error handling
    }
  } catch (err) {
    // error handling
  } finally {
    setPending(false);
  }
};
```

**順序の根拠**: `onClose()` を先に呼ぶと dialog component が unmount され、その後の `router.refresh()` が「unmounted component から navigation API 呼び出し」warning を出す可能性がある。`refresh()` は同期 API で即座に scheduling されるため、close 前に呼んでも UX 上の遅延は無い。

### DeleteRequestDialog.tsx

VisibilityRequestDialog と同じパターン。同じ順序固定ルールを適用。

## 6. 入出力・副作用

| 時点 | 入力 | 処理 | 出力 | 副作用 |
|------|------|------|------|--------|
| dialog submit 前 | user input (reason text, confirmed checkbox) | validation | error toast or proceed | local state: `[pending, error]` |
| mutation 送信中 | Request body (desiredState, reason) | `fetch` to `/api/me/*/request` | 202 Accepted or error status | `pending: true` |
| mutation 成功 | QueueAccepted response | `onSubmitted(res.accepted)` → **`router.refresh()`** | 202 response body | server state 再fetch → banner 表示 |
| mutation 失敗 | error code (409, 422 など) | `onSubmitted()` を呼ぶか、error message を表示 | error toast | rollback: dialog open のまま or close |

## 7. テスト方針

### 既存テスト

`RequestActionPanel.component.spec.tsx` では：
- TC-U-08..11 で pending state の display を検証
- `useRouter` mock は既存 (vi.mock at top)

### 追加 test case: mutation 成功後に router.refresh が呼ばれることをモック検証

```typescript
// VisibilityRequestDialog.component.spec.tsx (新規テストケース)
describe("mutation 成功後 router.refresh を呼ぶ", () => {
  it("visibility-request mutation 成功 → router.refresh が呼ばれる", async () => {
    const mockRouter = { refresh: vi.fn() };
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    
    // mock fetch で 202 response
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({
          queueId: "q_123",
          type: "visibility_request",
          status: "pending",
          createdAt: new Date().toISOString(),
        }), { status: 202 })
      )
    );
    
    const onSubmitted = vi.fn();
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={true}
        onClose={vi.fn()}
        onSubmitted={onSubmitted}
      />
    );
    
    fireEvent.click(screen.getByTestId("visibility-submit"));
    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });
});
```

### Playwright E2E (手動検証)

1. profile page にアクセス
2. "公開を停止する" button click
3. dialog open → reason 入力 → "申請を送信" click
4. API で 202 Accepted が返ることを確認（DevTools Network）
5. dialog close
6. `RequestPendingBanner` が即座に表示されることを確認（再 fetch 完了後）

## 8. ローカル実行コマンド

```bash
# typecheck
mise exec -- pnpm typecheck

# unit test: RequestActionPanel + dialogs
mise exec -- pnpm --filter @ubm-hyogo/web test -- RequestActionPanel
mise exec -- pnpm --filter @ubm-hyogo/web test -- VisibilityRequestDialog
mise exec -- pnpm --filter @ubm-hyogo/web test -- DeleteRequestDialog

# e2e (existing playwright suite)
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile

# dev server (manual verification)
pnpm install && pnpm --filter @ubm-hyogo/web dev
# then navigate to http://localhost:3000/profile
```

## 9. DoD (Definition of Done)

- [ ] `VisibilityRequestDialog.tsx` で mutation 成功時に `router.refresh()` を呼ぶ
- [ ] `DeleteRequestDialog.tsx` で mutation 成功時に `router.refresh()` を呼ぶ
- [ ] visibility-request mutation 成功後、`RequestPendingBanner` (visibility_request type) が即座に表示される
- [ ] delete-request mutation 成功後、`RequestPendingBanner` (delete_request type) が即座に表示される
- [ ] mutation 失敗（409, 422 など）の場合、banner は変化しない（rollback: dialog open のまま, or error message 表示）
- [ ] 既存テスト (`RequestActionPanel.component.spec.tsx`) が壊れない
- [ ] 新規テスト (mutation 成功 → router.refresh call) が green

## 10. リスク・制約

### 既知リスク

1. **ISR 環境の場合**: Page が ISR で設定されていた場合、`router.refresh()` が機能しない
   - 対策: `page.tsx` で `revalidate = 0` を確認 ✓ (line 25)

2. **race condition**: dialog close と server re-fetch が同時進行する可能性
   - 対策: dialog close 前に `router.refresh()` を呼ぶ順序で回避（既に確認済み）

3. **nested pending**: visibility と delete が同時 pending の場合
   - 対策: banner は両方表示される（independent）；button は両方 disabled（既に実装済み）

### 制約

- mutation は client helper (`requestVisibilityChange`, `requestDelete`) を通す（API endpoint は route handler 経由）
- `router.refresh()` は Client Component `RequestActionPanel`（または dialog）からのみ呼び出し
- server state (pendingRequests) はロック・同期機構なし；複数 mutation 並列実行時の競合は API Worker 側で 409 で断定
