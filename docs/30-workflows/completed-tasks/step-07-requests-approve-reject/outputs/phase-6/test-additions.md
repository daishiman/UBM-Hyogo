# Phase 6 テスト追加結果

## ファイル

| Path | tests |
|---|---|
| `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | 7 |
| `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | 10 |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | 6（既存 + dialog polyfill 追加） |

合計 23 tests / 全 green。

## 主要 case

- RequestQueueDetail: TC-D-01〜07（placeholder / detail render / approve・reject callback / busy・resolved disabled / label map）
- RequestConfirmDialog: TC-C-01〜10（showModal / kind=null / cancel / reject 空 note 拒否 / reject + note onSubmit / approve onSubmit('') / destructive alert / busy disabled / open=false で close / data-destructive）
- RequestQueuePanel: TC-21〜26（初期描画 / 承認 dialog 開 / delete_request 警告 alert / 409 → status toast / PII 非表示 / pagination）

## jsdom 対応

`HTMLDialogElement.prototype.showModal/close` は jsdom 未実装のため beforeEach で polyfill：
```ts
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
  (this as { open: boolean }).open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
  (this as { open: boolean }).open = false;
};
```
