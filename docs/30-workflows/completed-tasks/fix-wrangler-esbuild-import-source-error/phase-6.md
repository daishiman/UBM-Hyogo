# Phase 6: テスト拡充

## 6.1 方針

プロダクトコード（ランタイム）変更は無いため新規ユニットテストの追加は不要。
代わりに、ビルド・デプロイ経路における **fail path / 回帰 guard / 補助検証** を網羅する。

## 6.2 追加検証マトリクス

| ID | 検証目的 | コマンド | 期待 |
|----|---------|---------|------|
| EXT-1 | overrides が実際に解決されているか | `mise exec -- pnpm why esbuild` | 全 esbuild 解決が `0.27.3` で揃う |
| EXT-2 | esbuild バイナリ単体の起動 | `node_modules/.pnpm/esbuild@0.27.3*/node_modules/esbuild/bin/esbuild --version` | `0.27.3` を出力 |
| EXT-3 | wrangler 内蔵 esbuild 一致 | `find node_modules/wrangler -path '*@esbuild/*/bin/esbuild' \| head -3` で見つかる版が pnpm overrides と同一 | 一致または互換版 |
| EXT-4 | `apps/web` dry-run (staging) | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit 0 |
| EXT-5 | `apps/web` dry-run (production) | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production --dry-run` | exit 0 |
| EXT-6 | `apps/api` dry-run (staging) | `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` | exit 0 |
| EXT-7 | `apps/api` dry-run (production) | `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env production --dry-run` | exit 0 |
| EXT-8 | OpenNext build 単体 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | `.open-next/worker.js` 生成 |
| EXT-9 | Next.js build 単体（webpack 正本） | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0、Turbopack 混入なし |

## 6.3 fail path 検証

| ID | 想定 | コマンド | 期待 |
|----|------|---------|------|
| FAIL-1 | esbuild bump 前の再現 | 別 worktree または `git show HEAD:package.json` から一時コピーを作り、作業ツリーを変更せずに旧 override を検証 | RED-1 と同一エラー再現 |
| FAIL-2 | wrangler キャッシュ汚染 | `rm -rf node_modules/.cache/wrangler` → EXT-4 再実行 | 影響なし、exit 0 維持 |

> FAIL-1 はあくまで再現テストとして 1 度だけ実施し、すぐ revert する（コミット対象にしない）。

## 6.4 補助テスト（regression guard）

| 観点 | コマンド | 期待 |
|------|---------|------|
| 既存テスト | `mise exec -- pnpm test -- --run` | 既存 spec すべて pass（変更前と同件数） |
| script suite | `mise exec -- pnpm test:scripts` | exit 0 |

## 6.5 DoD

- EXT-1〜EXT-9 がすべて exit 0。
- FAIL-1 で旧エラーが再現することで、修正が因果的に解消したことを確認できる。
- 既存テストの pass 件数が回帰前と一致。
