# 手動 smoke evidence

## 前提

```bash
# 1) apps/api を別タブで起動
mise exec -- pnpm --filter @ubm-hyogo/api dev   # localhost:8787 想定

# 2) apps/web を起動
mise exec -- pnpm --filter @ubm-hyogo/web dev   # localhost:3000

# 3) admin 権限を持つ Google アカウントでログイン
#    （adminFlag は session-resolve API で付与される）
```

## チェックリスト

| # | 経路 | 期待挙動 | スクショ |
| --- | --- | --- | --- |
| 1 | 未ログインで `/admin` | `/login?next=/admin` redirect | TBD |
| 2 | 非 admin で `/admin` | `/login?gate=forbidden` redirect | TBD |
| 3 | admin で `/admin` | KPI 4 種 + 最近提出 + schema 状態が表示、ネットワーク監視で `GET /admin/dashboard` 1 リクエスト | TBD |
| 4 | `/admin/members` → 詳細 | ドロワーが開き、profile 本文の textarea/input が **存在しない** こと、editResponseUrl リンクあり | TBD |
| 5 | `/admin/members` ドロワー | 「タグキューで編集」リンクが `/admin/tags?memberId=...` へ遷移 | TBD |
| 6 | `/admin/tags?memberId=...` | 該当 memberId の queue が先頭に表示 | TBD |
| 7 | `/admin/tags` resolve | resolved 後に list 再取得・status が `resolved` 表示 | TBD |
| 8 | `/admin/schema` | 4 ペイン（added/changed/removed/unresolved）に分類 | TBD |
| 9 | `/admin/schema` alias | `POST /admin/schema/aliases` 200 後に list 更新 | TBD |
| 10 | `/admin/meetings` 追加 | 開催追加後にリスト最上段に表示 | TBD |
| 11 | `/admin/meetings` attendance | 削除済み会員が候補に出ない、同一会員 2 度追加で disabled | TBD |
| 12 | `/admin/meetings` 422 | 422 受信で Toast に「削除済み会員は登録できません」 | TBD |

## 既知の制約

本セッションでは D1 fixture と wrangler dev を起動できないため、画面スクショは未取得。チェックリストはローカルで実行可能な状態に整えている。
