# Phase 10: 最終レビュー（Go / No-Go）

## 1. 完了確認マトリクス

| 観点 | 状態 | 根拠 |
|---|---|---|
| 実装：opengraph-image/route.tsx 新規 | PASS | Phase 5 Step 1 |
| 実装：page.tsx の metadata 修正 | 要確認 | Phase 5 Step 2 |
| 実装：site-metadata.ts doc コメント | 要確認 | Phase 5 Step 3 |
| Unit test 追加 | 要確認 | Phase 5 Step 4 |
| Playwright 追加 | 要確認 | Phase 5 Step 5 |
| typecheck / lint / build PASS | 要確認 | Phase 5 Step 7-9 |
| coverage 維持 | 要確認 | Phase 7 |
| manual smoke | 要確認 | Phase 11 |

## 2. Go / No-Go 判定基準

**Go 条件（全て満たすこと）:**

- Phase 9 QA チェックリストが全てチェック済み
- Phase 5 DoD が全てチェック済み
- Phase 11 manual test が PASS

**No-Go 条件（いずれか該当）:**

- `next build --webpack` が `ImageResponse` 関連エラーで fail
- OpenNext Cloudflare build で `ImageResponse` route が runtime error
- OG 画像内に publicConsent=false の情報が含まれる
- root OG 画像 (`/opengraph-image`) に regression

## 3. ロールバック手順

1. `apps/web/app/(public)/members/[id]/page.tsx` の `ogImage` 引数を削除（root site image にフォールバック）
2. `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` を削除
3. `git revert <commit-sha>` で PR commit を巻き戻し再 push

ロールバック後も member detail page 自体は機能継続（OG 画像のみ root に戻る）。
