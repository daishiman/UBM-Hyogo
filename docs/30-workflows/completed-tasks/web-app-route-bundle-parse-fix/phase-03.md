# Phase 3: 設計

## 3.1 全体方針

Next.js 16 のデフォルトビルダである Turbopack を **明示的に webpack に切り替える**。これにより App Route module の出力が `[project]/...` 仮想パスでなくなり、`@opennextjs/cloudflare` 1.19.4 の Worker bundling pipeline が実体パスに解決できるようになる。

## 3.2 修正方針の比較（採用 = A）

| 案 | 修正内容 | 修正範囲 | 互換性リスク | build 時間 | 推奨度 |
|---|---------|---------|----------|----------|------|
| A. webpack 切替 | `package.json` の build script に `--webpack` 追加 | 1 行 | 極小（webpack 経路は実績あり） | やや増 | ★★★（採用） |
| B. OpenNext を最新版に上げる | `@opennextjs/cloudflare` を最新へ | 中 | 別の互換性問題を引き込み得る | 同等 | ★ |
| C. Next.js を 15.x にダウングレード | `next` のメジャー戻し | 大 | アプリ全体の回帰リスク | 同等 | ☆ |

> A は CONST_007（1 サイクル完了）にも適合し、最も小さい blast radius で FR-1〜FR-3 を満たす。

## 3.3 修正後のビルド/デプロイフロー（変化点のみ）

```
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
  └─ NODE_ENV=production opennextjs-cloudflare build
      └─ pnpm build  ← ここの中で next build --webpack が走る   ◀ 変化点
      └─ patch-next-standalone-instrumentation.mjs
      └─ Worker bundle 生成 (.open-next/worker.js)
      └─ patch-open-next-worker.mjs (auth env bridge 注入)
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

## 3.4 検証戦略

| 段階 | 内容 |
|------|------|
| Local pre-flight | `pnpm typecheck` / `pnpm lint` PASS（DoD-4） |
| staging build | `pnpm --filter @ubm-hyogo/web build:cloudflare` 成功、`.open-next/worker.js` 生成 |
| staging deploy | `scripts/cf.sh deploy --env staging` 成功 |
| staging smoke | `/`, `/members`, `/login`, `/register`, `/api/auth/error` の status コード収集 |
| staging tail observation | 30 秒間 tail を維持し、`Could not parse module` の不在を確認（DoD-2） |
| production gate | staging で DoD-2/3 全 PASS を確認後にのみ production deploy へ進む |
| production deploy | `scripts/cf.sh deploy --env production` |
| production smoke | staging と同じ URL 集合で再確認 |

## 3.5 ロールバック方針

`scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env <ENV>` で直前バージョン (今回 deploy 直前の `efc4051e-160b-4c77-93ca-6a5751e952f3` (staging) / `e608d54e-37a8-414d-865c-798ebfd71735` (production)) に戻す。

## 3.6 モジュール俯瞰（修正タスクが触れる/触れないファイル）

```
apps/web/
├── package.json                ◀ ✏️ 編集（build script に --webpack）
├── next.config.ts              ◀  無編集（turbopack.root は webpack 経路で無視される）
├── open-next.config.ts         ◀  無編集
├── wrangler.toml               ◀  無編集（service binding 既設）
├── app/                        ◀  無編集（route 構成変更なし）
├── src/                        ◀  無編集（実装ロジック変更なし）
└── .open-next/worker.js        ◀  ビルド成果物（再生成のみ）

scripts/
├── cf.sh                       ◀  無編集
├── patch-open-next-worker.mjs  ◀  無編集
└── patch-next-standalone-instrumentation.mjs ◀ ✏️ 編集（webpack 経路の instrumentation 未生成を明示 skip）
```

## 3.7 後続タスクへの引き継ぎ

実装は `outputs/phase-04/task-01-switch-next-build-to-webpack.md` を参照。本仕様書（Phase 1-3）が CONST_005 に必要な前提情報をすべて提供している。
