# Phase 11 — 手動テスト

## 11.1 evidence カテゴリ

NON_VISUAL（既存 SignOutButton の集約位置変更が主体、新規 UI primitive 追加なし）。ただし topbar 右側の見た目が「空白 → ghost button」に変わるため、admin staging で簡易 visual を撮る。

## 11.2 手動テスト手順

### 11.2.1 ローカル

```bash
mise exec -- pnpm --filter web dev   # localhost:3000
```

1. `manjumoto.daishi@senpai-lab.com` で admin ログイン → `/admin` に遷移
2. topbar 右側にログアウトボタンが表示されることを目視
3. ログアウトボタン押下 → `/login` にリダイレクトされる
4. 再度 `/admin` にアクセス → `/login?next=/admin` に redirect される（認証ガード維持）

### 11.2.2 a11y

ブラウザ拡張（axe DevTools）で `/admin/members` / `/admin/tags` / `/admin/audit` を検査:
- critical violation 0
- topbar 右側 button が a11y tree に含まれる
- `aria-hidden` 領域内に focusable 要素なし

### 11.2.3 責務境界

各 admin ページの topbar 右側に「新規追加」「タグ作成」等ページ固有操作が紛れていないことを目視。逆に各 page の `AdminPageHeader` 右側にログアウト導線が重複していないことを目視。

## 11.3 evidence 保存先

- `outputs/phase-11/manual-test-result.md` — 上記 1-3 の結果記録
- `outputs/phase-11/screenshot-admin-topbar.png`（任意） — topbar 右側のスクリーンショット

## 11.4 staging 検証

dev → staging deploy 後:

```bash
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging
```

別タブで staging admin にログインしログアウト操作を実行し、tail に 5xx / unhandled error が出ないことを確認。

## 11.5 DoD

- 11.2 全項目 OK
- 11.3 evidence 保存
- 11.4 staging で error 0
