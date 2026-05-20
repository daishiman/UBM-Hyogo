# Phase 9: QA

## 1. 自動 QA チェック

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components
```

すべて PASS することが必須。

## 2. 静的解析チェック

```bash
rg -n "router.refresh" apps/web/app/profile/_components
```

期待: `VisibilityRequestDialog.tsx` と `DeleteRequestDialog.tsx` のみにヒット。`RequestActionPanel.tsx` にはヒットしないこと。

```bash
rg -n "useRouter" apps/web/app/profile/_components/RequestActionPanel.tsx
```

期待: `RequestActionPanel.tsx` には `useRouter` が残らない (未使用 import 削除済み)。

## 3. 検証マトリクス

| 観点 | 確認方法 | 期待 |
|------|---------|------|
| 順序固定 | spec assertion (TC-D1/D2) | `["refresh","onSubmitted","onClose"]` 厳密一致 |
| エラー時 refresh 非発火 | spec assertion (TC-D3/D4) | refresh.mock.calls.length === 0 |
| DUPLICATE_PENDING_REQUEST 時 refresh 非発火 | spec assertion (TC-D5) | 同上 |
| parent 由来 refresh 非発火 | spec assertion (TC-P1) | 同上 |
| 型契約破壊なし | typecheck | PASS |
| 未使用 import なし | lint | PASS |

## 4. DoD

- [ ] 自動 QA 全項目 PASS
- [ ] 静的解析 grep が期待通り
- [ ] 検証マトリクス全項目 OK
