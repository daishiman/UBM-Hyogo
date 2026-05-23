# Phase 4: テスト計画

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-3-design-review
**次 Phase**: phase-5-implementation

## 目的

3 spec ファイルの test case 一覧を確定し、phase-6 (test-additions) で記述する内容を pre-allocate する。

## 対象 spec ファイル

| Path | 種別 |
|---|---|
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | modify (既存に case 追加 / 一部 refactor) |
| `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | add |
| `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | add |

## RequestQueuePanel.component.spec.tsx

| TC | ケース | 期待 |
|---|---|---|
| TC-P-01 | initial render | list と detail (item=null 時の placeholder) が描画される |
| TC-P-02 | item 選択 | detail 部に選択 item の内容が反映される |
| TC-P-03 | approve button | `RequestConfirmDialog` が kind='approve' で open |
| TC-P-04 | reject button | `RequestConfirmDialog` が kind='reject' で open / textarea が必須 |
| TC-P-05 | 200 response | toast 成功 + list 更新（mutation 後の `router.refresh()` 呼び出し） |
| TC-P-06 | 409 `already_resolved` response | toast「他の管理者が既に処理済みです」 + `router.refresh()` |
| TC-P-07 | 404 `note not found` / `member_status_not_found` response | toast「対象が見つかりません」 + `router.refresh()` |
| TC-P-08 | 400 `unsupported note type` / 422 `invalid desiredState in request payload` response | 固有 toast（refresh しない） |
| TC-P-09 | filter params (type, cursor) | `type` prop 切替で表示 item が変わる |
| TC-P-10 | busy 中 | dialog ボタン disabled |

## RequestQueueDetail.spec.tsx

| TC | ケース | 期待 |
|---|---|---|
| TC-D-01 | item=null | placeholder「項目を選択してください」表示 |
| TC-D-02 | item 渡し | publicHandle / publishState / reason / payload summary 表示 |
| TC-D-03 | approve button click | `onApprove` callback 呼び出し |
| TC-D-04 | reject button click | `onReject` callback 呼び出し |
| TC-D-05 | busy=true | approve / reject button が disabled |
| TC-D-06 | type='visibility_request' label | 「公開申請」label 表示 |
| TC-D-07 | type='delete_request' label | 「削除申請」label 表示 |

## RequestConfirmDialog.spec.tsx

| TC | ケース | 期待 |
|---|---|---|
| TC-C-01 | open=true | `dialog.showModal()` が呼ばれる |
| TC-C-02 | open=false → true 切替 | `showModal()` が再度呼ばれる |
| TC-C-03 | ESC キー | `onClose` callback 呼び出し |
| TC-C-04 | cancel button | `onClose` callback 呼び出し |
| TC-C-05 | kind='reject' + note="" + submit | validation error 表示 / `onSubmit` 呼ばれない |
| TC-C-06 | kind='reject' + note="理由" + submit | `onSubmit('理由')` 呼び出し |
| TC-C-07 | kind='approve' + submit | `onSubmit('')` 呼び出し |
| TC-C-08 | isDestructive=true | 警告色 class / 警告文言 |
| TC-C-09 | busy=true | submit / cancel disabled |
| TC-C-10 | note > 500 文字 | validation error |

## test runtime

- vitest + @testing-library/react
- HTML5 `<dialog>` API の `showModal` / `close` は jsdom に存在しないため mock または polyfill が必要（phase-6 で対応）

## ローカル実行コマンド

```bash
mise exec -- pnpm test apps/web --run -- RequestQueuePanel.component.spec.tsx
mise exec -- pnpm test apps/web --run -- RequestQueueDetail.spec.tsx
mise exec -- pnpm test apps/web --run -- RequestConfirmDialog.spec.tsx
```

## coverage 目標

- line / branch coverage ≥ 80%（phase-7 で計測）
