# Phase 6: 検証コマンド / 手動確認手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 区分 | 実装 (検証) |
| 想定所要 | 0.25 人日 |

## 目的

Phase 5 の実装が SSOT / 不変条件 / quality gate を満たすことを、コマンドと手動確認で検証する。

## 6.1 ローカル検証コマンド

```bash
# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# unit / component test
mise exec -- pnpm test apps/web --run -- useConfirmDialog
mise exec -- pnpm test apps/web --run -- ConfirmDialog
mise exec -- pnpm test apps/web --run -- MeetingPanel
mise exec -- pnpm test apps/web --run -- MeetingAttendancePanel

# coverage（追加コード ≥ 80%）
mise exec -- pnpm test apps/web --coverage --run -- useConfirmDialog ConfirmDialog MeetingPanel MeetingAttendancePanel

# design token gate
mise exec -- pnpm verify:design-tokens

# test suffix gate
mise exec -- pnpm verify:test-suffix

# build
mise exec -- pnpm build

# e2e smoke (admin meetings 動線)
mise exec -- pnpm e2e:smoke
```

## 6.2 不変条件 grep gate

```bash
# 直接 fetch が admin meetings UI に残っていないこと
rg -n "fetch\(" apps/web/app/\(admin\)/admin/meetings || echo "OK: no direct fetch"

# legacy useAdminMutation 参照が増えていないこと（diff）
git diff --stat dev...HEAD -- apps/web | rg "lib/useAdminMutation" && echo "WARN: legacy ref touched"

# API path 整合 (UI alias /attendances)
rg -n "/api/admin/meetings/.+/attendance(?!s)" apps/web && echo "WARN: legacy singular UI path used" || echo "OK: attendances alias"

# HEX 直書きなし
rg -n "#[0-9a-fA-F]{6}\b" apps/web/src/components/ui/ConfirmDialog.tsx && echo "WARN" || echo "OK"
```

## 6.3 手動確認手順 (`pnpm dev` 起動後)

1. `http://localhost:3000/admin/meetings` にログイン後アクセス
2. 「開催日を追加」フォームで title / heldOn / note を入力 → 「追加」
   - 期待: toast "開催日を追加しました" / list に新規 entry
3. 任意の開催日で会員を選択 → 「出席を追加」
   - 期待: toast "出席を追加しました" / select の対象 option が disabled になる
4. 出席者リストの「削除」ボタン押下
   - 期待: **confirm dialog 出現** (title "出席を削除しますか？")
5. dialog の「キャンセル」押下
   - 期待: dialog が閉じる / mutation 未発火 / 出席者は維持
6. 再度「削除」→「削除する」押下
   - 期待: mutation 発火 / dialog 閉じる / 出席者リストから消える / toast
7. 開催日の `<details>` 内「開催日を削除」押下
   - 期待: confirm dialog (title "この開催日を削除しますか？" / description に soft delete 文言)
8. dialog でキャンセル → 「削除する」
   - 期待: mutation 発火 / `router.refresh()` で一覧再取得 / toast
9. `/admin/meetings/<sessionId>` 詳細画面へ遷移
10. 候補リストで「出席登録」押下
    - 期待: toast "出席を登録しました" / button が「登録済」表示
11. 同 button をもう一度押下
    - 期待: toast "既に出席登録済み" / `useAdminMutation.trigger` 呼ばれず (Network tab で確認)
12. (任意) 削除済 member を含む候補で API 422 をモック → 「削除済み会員は登録できません」toast

## 6.4 a11y 手動確認

- confirm dialog open 時に DevTools の Accessibility tree で `role=dialog`, `aria-modal=true`, `aria-labelledby` が見えること
- ESC で dialog が閉じること
- backdrop クリックで閉じること
- submit 中はキャンセル / 削除 button が disabled になること

## 完了条件

- [ ] 6.1 のコマンドすべて exit 0
- [ ] 6.2 の grep gate すべて WARN なし
- [ ] 6.3 の手動シナリオすべて期待どおり
- [ ] 6.4 の a11y チェック PASS
- [ ] API path grep が現行 UI alias `/attendances` と整合

## リスク

- e2e smoke が dialog の追加で既存 selector を壊した場合 → `data-testid` は維持しているため selector は不変。
  smoke が破損する場合は selector 仕様ずれを Phase 11 で記録し fix する。
