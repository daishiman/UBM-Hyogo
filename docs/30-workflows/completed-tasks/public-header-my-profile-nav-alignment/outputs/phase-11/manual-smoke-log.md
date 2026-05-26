# Manual Smoke Log（user-gated）

実施は user の明示承認後。実施後に結果を本ファイルに追記する。

## 対象環境

- Cloudflare Workers staging（`apps/web` deploy 済み前提）
- テストアカウント: `manju.manju.03.28@gmail.com`（一般会員 / MEMORY 参照）

## smoke 手順

1. 未認証で staging `/` 訪問
   - 期待: 右上 CTA = `ログイン`（href=`/login`）、nav にマイページ非表示
2. magic link で session 確立 → `/` に戻る
   - 期待: 右上 CTA = `マイページ`（href=`/profile` / `data-state="authenticated"`）
3. nav の `マイページ` リンクをクリック → `/profile` 到達
4. `/members` / `/register` を巡回し、ヘッダの `マイページ` 動線が維持されていることを確認
5. `/profile` 上で nav の `マイページ` に `aria-current="page"` 属性が付与されることを確認

## 結果

未実施（user-gated）。

## 関連 issue

なし。
