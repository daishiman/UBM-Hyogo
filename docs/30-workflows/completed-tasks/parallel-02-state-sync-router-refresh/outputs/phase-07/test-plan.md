# Phase 07: テスト計画 / 実行結果

## 新規テストケース

### VisibilityRequestDialog.component.spec.tsx

- TC-NEW-V-01: 202 応答時に `router.refresh()` が 1 回呼ばれる
- TC-NEW-V-02: 呼出順 `router.refresh → onSubmitted → onClose` の固定
- TC-NEW-V-03: 409 (DUPLICATE_PENDING_REQUEST) 時、`router.refresh()` が呼ばれない
- TC-NEW-V-04: 422 (INVALID_REQUEST) 時、`router.refresh()` が呼ばれない
- TC-NEW-V-05: 5xx (SERVER) 時、`router.refresh()` が呼ばれない

### DeleteRequestDialog.component.spec.tsx

- TC-NEW-D-01..05: 上記と同種の 5 ケースを退会申請側で実装

### RequestActionPanel.component.spec.tsx (non-regression)

- TC-NEW-P-01: `onSubmitted` 経由で `router.refresh()` が呼ばれないこと（dialog ローカル一本化検証）

## non-regression 検証

- TC-U-05..11, TC-A-01..03, TC-U-21, TC-A-06 を全件 green 維持

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test
```

## 実行結果

- Test Files 83 passed | 1 skipped (84)
- Tests 561 passed | 1 skipped (562)
- Duration 194s
- 全 spec が緑、新規テストケースを含む

## DoD

- AC-4 / AC-5 / AC-6 / AC-8 を満たす
