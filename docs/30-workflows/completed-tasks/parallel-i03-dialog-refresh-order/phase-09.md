# Phase 09: 受入確認

## AC チェックリスト

| AC | 確認方法 | 状態 |
|----|---------|------|
| AC-1: VisibilityRequestDialog で順序成立 | spec の `expect(callOrder).toEqual(...)` PASS | completed |
| AC-2: DeleteRequestDialog で順序成立 | 同上 | completed |
| AC-3: RequestActionPanel から refresh 撤去 + import clean | grep `router.refresh` が 0 件 / lint clean | completed |
| AC-4: 2 dialog spec に order assertion 追加 | spec diff 確認 | completed |
| AC-5: RequestActionPanel spec で parent 非発火 assert | `expect(refresh).not.toHaveBeenCalled()` PASS | completed |
| AC-6: typecheck / lint / test 全 PASS | コマンド実行ログ | completed |
| AC-7: dialog props / mutation API シグネチャ不変 | Phase 03 review + diff 確認 | completed |
| AC-8: PR base = dev、user approval gate | Phase 13 PR summary | pending_user_approval |

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components

# 撤去確認 (parent 側に router.refresh が残らないこと)
grep -n "router.refresh" apps/web/app/profile/_components/RequestActionPanel.tsx || echo "OK: no residue"
```

## 受入結論

3 dialog/parent + 3 spec 変更は AC-1〜AC-7 を満たし、受入完了。AC-8 の commit / push / PR は user approval gate として Phase 13 に残す。

## DoD

- [x] `outputs/phase-09/acceptance.md` に AC チェック表と検証コマンド結果を記載
