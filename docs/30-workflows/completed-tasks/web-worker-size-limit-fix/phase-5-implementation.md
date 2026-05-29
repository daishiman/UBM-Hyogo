# Phase 5: 実装手順

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `web-worker-size-limit-fix` |
| phase | 5 / 13 |
| phase_name | 実装手順 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | `new` |
| 前Phase | 4（テスト計画） |
| 次Phase | 6（テスト追加） |
| 不変条件 | production build = `next build --webpack` / Cloudflare CLI = `scripts/cf.sh` 経由のみ / env = `apps/web/src/lib/env.ts` 経由 / D1 直アクセス禁止 / HEX 直書き禁止 / 新規 test = `*.spec.{ts,tsx}` |

## 目的

Task A（`next/og` 撤去 → 静的 OG 置換）と Task B（OpenNext production minify 維持 + Worker サイズ CI gate）を、実装者がそのまま着手できる粒度で手順化する。変更対象ファイルを 1 件ずつ（新規/編集/削除）列挙し、各ファイルの変更前 → 変更後の方針・関数/型シグネチャの不変性を明示する。Worker gzip を 3072 KiB 未満へ落とし、再発を CI で防ぐ。

## 実行タスク

1. 変更対象ファイル一覧表を確定する（パス / 種別 / 変更概要）。
2. Task A の各ファイル変更を具体化する（site-metadata.ts の値変更のみ・型不変、page.tsx の ogImage 行削除、route/image 削除、静的 PNG 配置）。
3. Task B の各ファイル変更を具体化する（production minify 維持確認、check-worker-size.sh 擬似ロジック、web-cd.yml step 挿入位置）。
4. ローカル実行手順（typecheck / lint / test / build:cloudflare / size gate / dry-run / grep / coverage-guard）を確定する。

## 参照資料

- `apps/web/src/lib/seo/site-metadata.ts`（`SITE.ogImagePath = "/opengraph-image"`）
- `apps/web/app/(public)/members/[id]/page.tsx`（`generateMetadata` の `ogImage` 行）
- `apps/web/open-next.config.ts`（`defineCloudflareConfig()` + `buildCommand`。確認対象で変更なし）
- `.github/workflows/web-cd.yml`（`deploy-staging` / `deploy-production` の Build → Deploy）
- `scripts/cf.sh`（`deploy ... --dry-run` ラッパー）
- `@opennextjs/cloudflare` v1.19.4（`minify` オプションの実 API 名は着手時に型定義で確認）

## 実行手順

### 変更対象ファイル一覧

| # | パス | 種別 | 変更概要 |
| --- | --- | --- | --- |
| 1 | `apps/web/app/opengraph-image.tsx` | 削除 | root 静的 OG（`next/og` `ImageResponse`）を撤去 |
| 2 | `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | 削除 | member 動的 OG route（`next/og`）を撤去。route ディレクトリごと削除 |
| 3 | `apps/web/public/og-default.png` | 新規 | 1200×630 の静的 OG 画像（事前生成 PNG）。HEX 直書き禁止対象外（画像アセット） |
| 4 | `apps/web/src/lib/seo/site-metadata.ts` | 編集 | `SITE.ogImagePath` を `"/opengraph-image"` → `"/og-default.png"`。型不変 |
| 5 | `apps/web/app/(public)/members/[id]/page.tsx` | 編集 | `generateMetadata` 内の `ogImage: ".../opengraph-image"` 行を削除し汎用フォールバックへ |
| 6 | `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` | 削除 | 動的 OG route 削除に伴うテスト撤去（Phase 6） |
| 7 | `apps/web/playwright/tests/public-metadata.spec.ts` | 編集 | 静的 PNG 前提に更新（Phase 6） |
| 8 | `apps/web/open-next.config.ts` | 確認のみ | OpenNext v1.19.4 に `minify` config key がないため変更しない。`buildCommand` は維持 |
| 9 | `scripts/check-worker-size.sh` | 新規 | Worker gzip サイズ計測 + 3072 KiB 判定（warn 2800 / 上限 3072） |
| 10 | `.github/workflows/web-cd.yml` | 編集 | 両 deploy job の Build → Deploy 間に size gate step を挿入 |
| 11 | `apps/web/__tests__/opennext-config-regression.spec.ts` | 編集 | minify + `next/og` 0 件 assert 追加（Phase 6） |

> Task A（#1-7）と Task B（#8-11）は編集ファイルが重複せず並列実装可。ただし size gate の green 判定（#9/#10）は `next/og` 撤去（#1-5）完了後に成立する。

### Task A: `next/og` 撤去 → 静的 OG 置換

#### A-1. `apps/web/public/og-default.png`（新規）

- 1200×630 px の静的 OG 画像を 1 枚事前生成し配置する。サイト名 `UBM 兵庫支部会` を含む汎用デザイン。
- 生成は本サイクル外（デザインアセット）。実装サイクルでは PNG をリポジトリに追加するのみ。`apps/web/public/` 配下は OpenNext で静的アセット（ASSETS binding）として配信され、Worker bundle gzip には算入されない。

#### A-2. `apps/web/src/lib/seo/site-metadata.ts`（編集 / 型不変）

- 変更前: `ogImagePath: "/opengraph-image"`
- 変更後: `ogImagePath: "/og-default.png"`
- `SITE` の他フィールド・`buildBaseMetadata()` / `buildPageMetadata()` のシグネチャは不変。`openGraph.images[0].url` と `twitter.images[0]` は `SITE.ogImagePath` を参照しているため、値変更だけで静的 PNG に切り替わる（`width: 1200, height: 630` も整合）。

#### A-3. `apps/web/app/(public)/members/[id]/page.tsx`（編集）

- 変更前: `generateMetadata` の profile 取得成功 return に
  ```ts
  ogImage: `/members/${encodeURIComponent(id)}/opengraph-image`,
  ```
  が含まれる。
- 変更後: この `ogImage` 行を削除する。`buildPageMetadata` の `ogImage` は省略可（`input.ogImage ?? SITE.ogImagePath`）なので、削除すると自動で `/og-default.png` にフォールバックする。`title` / `description` / `path` / `twitterCard: "summary"` 等は不変。

#### A-4. ファイル削除（#1 / #2 / #6）

- `apps/web/app/opengraph-image.tsx` を削除。
- `apps/web/app/(public)/members/[id]/opengraph-image/` ディレクトリ（`route.tsx` 含む）を削除。
- `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` を削除（Phase 6 で扱うが、ここで削除対象として固定）。
- 削除後の残存参照を `rg -n "next/og|ImageResponse" apps/web/app apps/web/src`（0 件）と `rg -n "opengraph-image" apps/web/app apps/web/src apps/web/playwright`（live import 0 件）で確認する。

### Task B: OpenNext production minify 維持 + Worker サイズ CI gate

#### B-1. `apps/web/open-next.config.ts`（確認のみ）

- 変更前:
  ```ts
  import { defineCloudflareConfig } from "@opennextjs/cloudflare";

  export default {
    ...defineCloudflareConfig(),
    buildCommand:
      "pnpm build && node ../../scripts/patch-next-standalone-instrumentation.mjs",
  };
  ```
- 変更後（方針）: `node_modules/@opennextjs/cloudflare` の型定義確認により v1.19.4 には `minify` config key が存在しないため、無効な設定は追加しない。`buildCommand` は維持し、regression spec で `OPEN_NEXT_DEBUG` / `debug: true` を禁止して production 既定 minify を保つ。
- 期待効果: terser によるバンドル minify で handler.mjs を圧縮し、`next/og` 撤去（~1539 KB 削減）と合わせて gzip 後 ~2.5 MiB へ。

#### B-2. `scripts/check-worker-size.sh`（新規）

擬似ロジック（決定論的 shell・Script First）:

```
1. set -u / set -o pipefail。閾値定数: WARN_KIB=2800, LIMIT_KIB=3072。
2. test hook: 環境変数 WORKER_SIZE_OVERRIDE_KIB が設定されていれば計測をスキップしその値を採用（TC-B102/B103 再現用）。
3. 計測ソース:
   a. 第 1 引数でファイルが渡された場合はそのファイルを gzip 計測する。
   b. 引数なしの場合は `find apps/web/.open-next` の worker 関連
      (worker.js / server-functions/**/handler.mjs / middleware/handler.mjs 等) を
      gzip -c で圧縮しバイト合算 → KiB 換算。
   c. `WORKER_SIZE_OVERRIDE_KIB` が設定されていれば実ファイル計測をスキップしてその値を採用する（TC-B102/B103 再現用）。
4. 判定:
   - size_kib > LIMIT_KIB  → stderr に ERROR、exit 1
   - size_kib > WARN_KIB   → stderr に WARN（しきい値接近）、exit 0
   - それ以外               → stdout に OK（`gzip: NNNN KiB`）、exit 0
5. ログには account-id 等の秘匿値を出さない（redaction-check.sh 方針に整合）。
```

- 実行は `scripts/cf.sh` 経由のみ（`wrangler` 直呼び禁止）。`cf.sh` が 1Password 注入と esbuild 整合を担う。

#### B-3. `.github/workflows/web-cd.yml`（編集 / step 挿入位置）

- `deploy-staging` job: 既存 `Build web app (OpenNext Workers bundle)`（`build:cloudflare`）step の**直後**、`Deploy to Cloudflare Workers (staging)` step の**直前**に size gate step を挿入する。
  ```yaml
  - name: Verify Worker bundle size (staging)
    run: bash scripts/check-worker-size.sh
  ```
- `deploy-production` job: 同様に `Build`（`build:cloudflare`）step 直後・`Deploy ... (production)` step 直前へ挿入。
- step 名は両 job で `(staging)` / `(production)` を付け区別する。size gate が exit 1 なら deploy step は実行されない（CI fail で再発を遮断）。

### ローカル実行手順（実装サイクルで使用）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/check-worker-size.sh
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
rg -n "next/og|ImageResponse" apps/web/app apps/web/src        # → 0 件
find apps/web/.open-next -name 'resvg.wasm' -o -name 'yoga.wasm' # → 0 件
bash scripts/coverage-guard.sh                                 # → exit 0
```

## 統合テスト連携

- 実装後、Phase 6 のテスト（更新済 Playwright / 追加 regression assert）と統合し、`pnpm --filter @ubm-hyogo/web test` と Playwright smoke で OG meta 静的化・`next/og` 0 件を確認する。
- `build:cloudflare` 後に `check-worker-size.sh` と `cf.sh ... --dry-run` を実行し、`.open-next` に `resvg.wasm` / `yoga.wasm` が含まれないこと・gzip < 3072 KiB を統合検証する。
- coverage は `bash scripts/coverage-guard.sh` で apps/web の 4 軸 >=80% を統合判定する（Phase 7）。

## 多角的チェック観点（AIが判断）

- システム系: `ogImagePath` 値変更が `buildBaseMetadata` / `buildPageMetadata` 両経路に波及し、member page の `ogImage` 削除が同じ静的 URL に収束するか（責務は site-metadata.ts に集約）。
- 戦略・価値系: minify（低リスク・全体圧縮）と `next/og` 撤去（高効果・OG 機能縮退）の合算で制限を確実に下回るか。minify 単独では不足するため両方必須である根拠が手順に反映されているか。
- 問題解決系: 再発防止の主問題（CI 非検出）を size gate step の挿入位置（build 後 / deploy 前）で確実に塞いでいるか。

## サブタスク管理

| ID | 内容 | 対象ファイル | 依存 |
| --- | --- | --- | --- |
| ST-5A1 | 静的 PNG 配置 + site-metadata 値変更 | #3 / #4 | なし |
| ST-5A2 | page.tsx ogImage 行削除 | #5 | ST-5A1 |
| ST-5A3 | 動的 OG route / root OG / spec 削除 | #1 / #2 / #6 | なし |
| ST-5B1 | open-next.config production minify 維持化 | #8 | なし |
| ST-5B2 | check-worker-size.sh 新規作成 | #9 | ST-5A3 / ST-5B1 |
| ST-5B3 | web-cd.yml size gate step 挿入 | #10 | ST-5B2 |

## 成果物

- 本ファイル `phase-5-implementation.md`（変更対象一覧表 + 各ファイル変更方針 + check-worker-size.sh 擬似ロジック + web-cd.yml 挿入位置 + ローカル実行手順）

## 完了条件

- [ ] 変更対象ファイル一覧（11 件・新規/編集/削除）が確定している
- [ ] site-metadata.ts は値変更のみで型・シグネチャ不変であることを明記している
- [ ] page.tsx の `ogImage` 行削除でフォールバック（`/og-default.png`）に収束する根拠を明記している
- [ ] open-next.config.ts は変更せず、production 既定 minify 維持と `buildCommand` 維持を明記している
- [ ] check-worker-size.sh の擬似ロジック（override → 明示ファイル計測 / OpenNext worker 群 gzip 合算 → 3072 KiB 判定 / warn 2800）が定義されている
- [ ] web-cd.yml の size gate step 挿入位置（両 job の build 後 deploy 前）が定義されている
- [ ] coverage AC を含む（apps/web: Statements/Branches/Functions/Lines >=80% / `bash scripts/coverage-guard.sh` exit0）
- [ ] ローカル実行手順が実在コマンドで定義されている（`next/og` 0 件 / wasm 0 件 / coverage exit0 を含む）

## タスク100%実行確認【必須】

- [ ] ST-5A1 / ST-5A2 / ST-5A3 / ST-5B1 / ST-5B2 / ST-5B3 を完了した
- [ ] 各ファイルの変更前 → 変更後の方針を具体化した
- [ ] 統合テスト連携（test / build:cloudflare / size gate / dry-run / coverage）を残した
- [ ] 不変条件（cf.sh 経由 / env.ts 経由 / next build --webpack / HEX 直書き禁止 / *.spec.* 命名）を侵さない

## 次Phase

Phase 6（テスト追加）— Phase 4 計画を実テストコード粒度（`it` 記述・assert 内容）へ具体化する。
