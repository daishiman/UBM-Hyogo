# Phase 8: 統合・ビルド検証

## ビルド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" build 2>&1 \
  | tee outputs/phase-11/evidence/build.log
```

`@opennextjs/cloudflare` 経由の Workers 互換 build (`next build --webpack`) が成功すること。Turbopack は禁則（CLAUDE.md `apps/web` env 不変条件）。

## 期待結果

- exit 0
- `Route /profile` が build 出力に含まれる
- `app/profile/loading.tsx` がコンパイル対象として認識される
- Worker bundle に `[project]/...` 仮想 module specifier の混入なし

## 局所統合確認

`/profile` への遷移時、SSR streaming 中に skeleton が表示されることをローカル dev server で確認する:

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" dev
# 別タブで http://localhost:3000/profile を開く（要 staging Cloudflare bindings or mock）
```

> dev 環境で profile data fetch が遅延しない場合、skeleton 確認は test (Phase 6) で代替する。

## 完了条件

- [ ] `pnpm build` exit 0
- [ ] build.log を evidence に保存
