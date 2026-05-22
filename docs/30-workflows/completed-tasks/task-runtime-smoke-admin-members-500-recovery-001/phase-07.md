# Phase 7: ローカル検証

[実装区分: 実装仕様書]

## 1. 実行コマンド
```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/admin/members.contract.spec.ts
```

## 2. ローカル Worker dev での手動確認
```bash
bash scripts/with-env.sh -- bash -c '
  mise exec -- pnpm --filter @ubm-hyogo/api dev &
  sleep 5
  curl -sS -H "authorization: Bearer $LOCAL_ADMIN_BEARER" \
    http://127.0.0.1:8787/admin/members | jq .
'
```
- 期待: 200 + `.members` array

## 3. evidence 取得
```
outputs/phase-07/
  ├── typecheck.log
  ├── lint.log
  ├── test.log
  └── local-curl-admin-members.json
```

## 4. Phase 7 DoD
- typecheck / lint / test すべて PASS
- 4 evidence ファイルが Phase 11 inventory に登録される
