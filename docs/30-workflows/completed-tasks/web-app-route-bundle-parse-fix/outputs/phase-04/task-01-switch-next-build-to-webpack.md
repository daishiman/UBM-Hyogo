# task-01: `next build` を webpack 経路に切り替えて App Route Handler の Worker bundle parse fail を解消する

[実装区分: 実装仕様書]

> 判定根拠: CONST_004 デフォルトに従う。本タスクは `apps/web/package.json` の build script を編集することで動作不良を解消する目的であり、ファイル変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
|------|------|
| ワークフロー | `web-app-route-bundle-parse-fix` |
| 親 Phase | Phase 4（実装） |
| ブランチ | `fix/web-app-route-bundle-parse-fix` |
| 起点 | `origin/dev` (5913a3cc) |
| visualEvidence | NON_VISUAL（HTTP status + tail ログで判定） |
| 想定 PR base | `dev` |
| 並列性 | 単独タスク（依存なし） |

## 背景

`apps/web` (Next.js 16.2.4) は staging / production 共に App Route Handler 系（`/api/auth/error` など）が Cloudflare Workers ランタイムで `Could not parse module '[project]/node_modules/next/dist/server/route-modules/app-route/vendored/contexts/app-router-context.js', file not found` を投げて 500 を返している。Next 16 デフォルトの Turbopack 出力に含まれる `[project]/...` 仮想モジュールパスを `@opennextjs/cloudflare` 1.19.4 が実体に解決できないことが真因。詳細は `phase-01.md` 参照。

## 目的

`next build` を webpack 強制で実行し、`[project]/...` 仮想パスを含まない出力にすることで Worker bundle 段階で実体解決可能にする。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
|------|---------|------|
| `apps/web/package.json` | 編集 | `scripts.build` を `"NODE_ENV=production next build"` から `"NODE_ENV=production next build --webpack"` に変更 |

それ以外のファイルは無編集。

## 2. 主要な関数・型・モジュールのシグネチャまたは構造（CONST_005 必須）

該当なし（ビルド設定のみの変更で、ソースコードのシグネチャは変更しない）。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
|------|------|
| 入力 | （ビルド時）`apps/web` 配下の Next.js 16 ソース一式 |
| 出力 | `apps/web/.next/`（webpack 経路の Next 標準出力）、続いて `apps/web/.open-next/worker.js`（OpenNext bundle、`patch-open-next-worker.mjs` 適用済み） |
| 副作用 | ローカルでは `.next/` / `.open-next/` の再生成のみ。Cloudflare 側は別途 `scripts/cf.sh deploy` 実行時に Worker version が増える |
| 環境変数依存 | 既存と同一（`NODE_ENV=production`、Cloudflare Secret 注入は `scripts/cf.sh` 経由） |

## 4. 編集差分（unified diff）

```diff
--- a/apps/web/package.json
+++ b/apps/web/package.json
@@ -4,7 +4,7 @@
   "private": true,
   "type": "module",
   "scripts": {
-    "build": "NODE_ENV=production next build",
+    "build": "NODE_ENV=production next build --webpack",
     "build:cloudflare": "NODE_ENV=production opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs",
     "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
     "dev": "next dev",
```

## 5. テスト方針（CONST_005 必須）

本タスクはビルド設定変更であり、コード単体テストでは検出できない（型/lint も無関係）。代わりに **runtime smoke** を必須テストとする。

### 5.1 ローカル pre-flight（コード回帰検出）

| 観点 | コマンド | 期待 |
|------|---------|------|
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0、`.open-next/worker.js` 生成、ログに `OpenNext build complete.` |

### 5.2 staging runtime smoke（FR-1, FR-2 検証）

deploy 後に以下 5 URL の HTTP status を `node -e "fetch('<URL>').then(r=>console.log(r.status))"` で取得（`curl` を許可されていない環境用）。期待値:

| URL | 期待 status |
|-----|------------|
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/` | `200` |
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members` | `200` |
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/login` | `200` |
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/register` | `200` |
| `https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/auth/error` | `200` または `302`（**500 でないこと** が合格条件、Auth.js 仕様で正常時の挙動はリダイレクトまたはエラーページ HTML を 200 で返却） |

### 5.3 staging tail observation（DoD-2 検証）

```bash
nohup bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging --format json </dev/null >/tmp/tail-fix-verify.log 2>&1 &
sleep 10
# 上記 5 URL を順に叩く
sleep 10
grep -c "Could not parse module" /tmp/tail-fix-verify.log   # 期待: 0
pkill -f "wrangler tail" || true
```

### 5.4 production runtime smoke（FR-3 検証）

staging で 5.1〜5.3 がすべて期待通りに通ったことを **gate** として、production を同手順で再 deploy + smoke（URL を `ubm-hyogo-web-production.daishimanju.workers.dev` に置換）。

## 6. ローカル実行・検証コマンド（CONST_005 必須）

順に実行する。

```bash
# 0. ブランチ確認（既に切られている前提）
git branch --show-current   # => fix/web-app-route-bundle-parse-fix

# 1. 編集（テスト方針 5.1 の前に実施）
#    -> apps/web/package.json の "build" 行を仕様書 §4 の通りに変更

# 2. 依存セットアップ（lockfile 変更なし想定）
mise exec -- pnpm install

# 3. ローカル pre-flight
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

# 4. staging deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 5. staging smoke + tail（テスト方針 5.2 / 5.3）
#    結果がすべて期待通りであれば次へ

# 6. production deploy（5 が PASS のときのみ）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production

# 7. production smoke（5.2 を production URL で繰り返す）
```

## 7. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
|----|------|------|
| DoD-T01-1 | `apps/web/package.json` の `scripts.build` に `--webpack` が含まれている | `git diff apps/web/package.json` で確認 |
| DoD-T01-2 | `pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0 で完了し `.open-next/worker.js` が生成されている | コマンド実行後 `ls apps/web/.open-next/worker.js` |
| DoD-T01-3 | `pnpm --filter @ubm-hyogo/web typecheck` が exit 0 | コマンド出力 |
| DoD-T01-4 | `pnpm --filter @ubm-hyogo/web lint` が exit 0 | コマンド出力 |
| DoD-T01-5 | staging deploy が成功し `Current Version ID` が新規発行される | `scripts/cf.sh deploy` ログ |
| DoD-T01-6 | テスト方針 5.2 の 5 URL が staging で期待 status を返す | 5.2 の手順 |
| DoD-T01-7 | テスト方針 5.3 の `grep -c "Could not parse module" /tmp/tail-fix-verify.log` が 0 を返す | 5.3 の手順 |
| DoD-T01-8 | production も DoD-T01-5/6/7 と同等の状態である | 5.4 の手順を production URL で実施 |

## 8. ロールバック手順

staging で 5.2〜5.3 のいずれかが失敗した場合:

```bash
# Worker version を直前に戻す
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging | head -20  # 直前の Version ID を控える
bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env staging
```

直前 Version は `efc4051e-160b-4c77-93ca-6a5751e952f3`（staging, 2026-05-08 deploy）/ `e608d54e-37a8-414d-865c-798ebfd71735`（production, 2026-05-08 deploy）。本タスク開始時点ではこれらが「動作 OK の Server Component pages + 動作不良の App Route Handler」状態。**rollback すると Server Component pages の 200 状態を維持しつつ修正だけが消える** ため、再修正までの一時凌ぎとしてはこちらに戻す方針で問題ない。

修正がそもそも build に届かない（5.1 の段階で fail）場合は deploy していないので Worker は無変更のまま。`apps/web/package.json` の `--webpack` 追加と instrumentation patch の skip guard を戻すのみ。

## 9. 後続タスク・先送り項目

| 項目 | 取り扱い |
|------|--------|
| `favicon.ico 404` の解消 | 別タスク（軽微・本ワークフロー対象外、`SCOPE.md` 既知のスコープ外を参照） |
| `next` / `@opennextjs/cloudflare` の追従更新 | 必要時に別ワークフローで実施。本タスクの DoD 達成後は不要 |
| Sentry / browser-extension ノイズ抑制 | 自社責務外、対応しない |

CONST_007 に違反する先送り（`Phase 2 で対応`、`バックログ送り` など）は **無し**。

## 10. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` 等のフローに従って PR を作成する想定。base は `dev`。
