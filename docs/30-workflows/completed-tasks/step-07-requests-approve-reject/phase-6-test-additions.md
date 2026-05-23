# Phase 6: テスト追加

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-5-implementation
**次 Phase**: phase-7-coverage

## 目的

phase-4 で確定した test case を 3 spec ファイルに展開し、assertion / mock 戦略を確定する。

## 共通 setup

- vitest + `@testing-library/react` + `@testing-library/user-event`
- HTML5 `<dialog>` API の polyfill（jsdom 非対応）:
  ```ts
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function () { this.open = true; });
    HTMLDialogElement.prototype.close     = vi.fn(function () { this.open = false; });
  });
  ```
- `useRouter` mock: `vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))`
- toast provider mock: spy on `toast()` import

## RequestQueuePanel.component.spec.tsx（modify）

```tsx
describe('RequestQueuePanel', () => {
  it('TC-P-01 initial render', () => { /* list + placeholder */ });
  it('TC-P-02 item select', async () => { /* user click → detail updated */ });
  it('TC-P-03 approve button → dialog open', async () => { /* showModal called */ });
  it('TC-P-04 reject button → dialog open with note', async () => { /* textarea required */ });
  it('TC-P-05 200 response → toast success + refresh', async () => {
    fetchMock.mockResolvedValueOnce({ status: 200, json: async () => ({ ok: true, resolvedAt: '...' }) });
    /* ... */
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
    expect(routerRefresh).toHaveBeenCalled();
  });
  it('TC-P-06 409 → toast already-resolved + refresh', async () => {
    fetchMock.mockResolvedValueOnce({ status: 409, json: async () => ({ ok: false, error: 'already_resolved', currentStatus: 'resolved' }) });
    /* ... */
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ message: '他の管理者が既に処理済みです' }));
    expect(routerRefresh).toHaveBeenCalled();
  });
  it('TC-P-07 404 note not found → toast not-found', async () => { /* ... */ });
  it('TC-P-08 400 unsupported note type / 422 invalid desiredState → solid toast (no refresh)', async () => { /* ... */ });
  it('TC-P-09 type prop filter', () => { /* ... */ });
  it('TC-P-10 busy disabled', async () => { /* ... */ });
});
```

## RequestQueueDetail.spec.tsx（add）

```tsx
describe('RequestQueueDetail', () => {
  it('TC-D-01 item=null → placeholder', () => {
    render(<RequestQueueDetail item={null} type="visibility_request" onApprove={vi.fn()} onReject={vi.fn()} busy={false} />);
    expect(screen.getByText('項目を選択してください')).toBeInTheDocument();
  });
  it('TC-D-02 item content render', () => { /* publicHandle / publishState / reason */ });
  it('TC-D-03 approve callback', async () => {
    const onApprove = vi.fn();
    render(<RequestQueueDetail item={mockItem} type="visibility_request" onApprove={onApprove} onReject={vi.fn()} busy={false} />);
    await user.click(screen.getByRole('button', { name: /承認/ }));
    expect(onApprove).toHaveBeenCalled();
  });
  it('TC-D-04 reject callback', async () => { /* 同上 */ });
  it('TC-D-05 busy disabled', () => { /* button[disabled] */ });
  it('TC-D-06 visibility_request label', () => { /* 公開申請 */ });
  it('TC-D-07 delete_request label', () => { /* 削除申請 */ });
});
```

## RequestConfirmDialog.spec.tsx（add）

```tsx
describe('RequestConfirmDialog', () => {
  it('TC-C-01 open=true → showModal called', () => {
    render(<RequestConfirmDialog kind="approve" open={true} onClose={vi.fn()} onSubmit={vi.fn()} busy={false} />);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });
  it('TC-C-02 open toggle re-showModal', () => { /* rerender */ });
  it('TC-C-03 ESC → onClose', async () => { /* keyboard escape */ });
  it('TC-C-04 cancel → onClose', async () => { /* user click cancel */ });
  it('TC-C-05 reject + empty note → validation error', async () => {
    const onSubmit = vi.fn();
    render(<RequestConfirmDialog kind="reject" open={true} onClose={vi.fn()} onSubmit={onSubmit} busy={false} />);
    await user.click(screen.getByRole('button', { name: /却下/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/却下理由を入力してください/)).toBeInTheDocument();
  });
  it('TC-C-06 reject + note → onSubmit(note)', async () => { /* user.type + submit */ });
  it('TC-C-07 approve + submit → onSubmit("")', async () => { /* ... */ });
  it('TC-C-08 isDestructive=true → warning style', () => { /* class contains destructive */ });
  it('TC-C-09 busy → disabled', () => { /* ... */ });
  it('TC-C-10 note > 500 chars → validation', async () => { /* ... */ });
});
```

## ローカル実行コマンド

```bash
mise exec -- pnpm test apps/web --run -- RequestQueuePanel.component.spec.tsx
mise exec -- pnpm test apps/web --run -- RequestQueueDetail.spec.tsx
mise exec -- pnpm test apps/web --run -- RequestConfirmDialog.spec.tsx
```

## 完了条件

3 spec ファイル合計 27 test case が全て green。
