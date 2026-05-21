# Phase 10: デプロイ事前確認

本タスクは Next.js Server Component の static placeholder 変更のみで、以下に**影響しない**:

- D1 schema / migrations
- Cloudflare Secrets / Variables
- Wrangler bindings（KV / R2 / Queue / D1）
- Cron triggers
- API endpoint surface（`apps/api/`）
- Auth flow

## 確認事項

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| D1 migration drift | 不要 | grep `apps/api/migrations/` 差分 0 |
| Wrangler config drift | 不要 | grep `apps/web/wrangler.toml` 差分 0 |
| Secrets 追加 | 不要 | grep `.dev.vars.example` 差分 0 |
| Route 追加 | 不要 | `/profile` は既存 route |

```bash
git diff --name-only dev...HEAD \
  | grep -E "wrangler\.toml|migrations/|\.dev\.vars" \
  && echo "REVIEW REQUIRED" \
  || echo "OK: infra unchanged"
```

## staging / production deploy

通常の dev → main マージで Cloudflare Workers がデプロイされる。手動 deploy 不要。

## ロールバック

`git revert <commit>` で `loading.tsx` を旧 placeholder に戻すのみ。データ移行なし。

## 完了条件

- [ ] infra unchanged 確認
- [ ] ロールバック手順を README に明記不要（git revert で十分）
