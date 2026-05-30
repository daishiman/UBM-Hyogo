# Phase 12: 実装ガイド

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `web-worker-size-limit-fix` |
| task_type | `implementation` / `NON_VISUAL` |
| implementation_targets | 実変更 10 ファイル + `open-next.config.ts` 確認のみ（下記 Part2 参照） |

---

## Part1: 中学生にもわかる説明

### そもそも何が起きているの？

このサイトは Cloudflare という会社の「Worker」という小さなサーバーの上で動いています。無料プランだと、アプリ本体の大きさは **圧縮して 3MiB（約 3072KiB）まで** という決まりがあります。

ところが、今のアプリは圧縮後 **3316KiB** になってしまい、決まりを **244KiB オーバー**。荷物が重すぎてロッカーに入らず、デプロイ（公開）が `[code: 10027]` というエラーで止まっている状態です。

### なぜ重くなったの？

重さの正体は **「画像を毎回その場で描く道具」（`next/og`）** です。この道具は、

- 文字を画像にするための計算プログラム（`resvg.wasm` = 1346KB、`yoga.wasm` = 70KB）
- きれいなフォント（Geist = 123KB）

を、アプリの中に **まるごと持ち込んで** います。合計でおよそ 1539KB。これだけで荷物の半分近くを占めていました。

### どう直すの？（Task A の比喩）

**「毎回その場で絵を描く絵描きさん」を雇うのをやめて、「あらかじめ描いておいた 1 枚のポスター」を貼る** ようにします。

- ポスター = `og-default.png`（1200×630 の決まった 1 枚の画像）を最初から用意しておく。
- 絵描きさんの道具一式（wasm・フォント）はもう要らないので、アプリから追い出す。
- これだけで荷物が **700KB 以上軽く** なり、約 2.5MiB に収まって決まりの中に入ります。

OGP（SNS でシェアしたときに出るサムネ画像）は「毎回その人の名前入りで描く」のをやめて「共通の 1 枚」に変わりますが、画像が表示されること自体は変わりません。

### 二度と太らないようにする（Task B の比喩）

直しても、また別の機能を足したときに太って制限を超えるかもしれません。そこで 2 つの予防策を入れます。

1. **無駄な空白を削って圧縮する（minify）**: プログラムの文章には人間が読みやすいように空白や改行がたくさん入っています。機械にとっては不要なので、それを削ってギュッと小さくします。本を要約するイメージです。
2. **公開する前に体重計に乗せる（CI サイズ gate）**: アップロード（デプロイ）の直前に「今の荷物は何 KiB か」を自動で量ります。決まりを超えていたら、その場で公開を **止めます**。気づかないうちに太って公開失敗する事故を防ぎます。

---

## Part2: 技術者向け実装詳細

### Task A: `next/og`（@vercel/og）撤去 + 静的 OG 画像化

#### 背景

`next/og` は `resvg.wasm`（1346KB）+ `yoga.wasm`（70KB）+ Geist フォント（123KB）≒ 1539KB を Worker bundle に焼き込む。動的 OG を静的 PNG に置換することで gzip 後 700KB+ を削減し、bundle を ~3316KiB → ~2.5MiB へ縮小する。

#### 変更ファイル

| ファイル | 操作 | 内容 |
|---------|------|------|
| `apps/web/app/opengraph-image.tsx` | 削除 | ルート動的 OG generator を撤去 |
| `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | 削除 | member 個別動的 OG route を撤去 |
| `apps/web/public/og-default.png` | 新規 | 1200×630 の静的 OG 画像（共通 1 枚） |
| `apps/web/src/lib/seo/site-metadata.ts` | 変更 | `ogImagePath` を `/og-default.png` に変更 |
| `apps/web/app/(public)/members/[id]/page.tsx` | 変更 | `generateMetadata` 内の動的 OG 参照（L100 相当）を削除し共通画像へ寄せる |
| `apps/web/playwright/tests/public-metadata.spec.ts` | 更新 | `og:image` が静的 `og-default.png` を指す assert へ修正 |
| `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` | 削除/更新 | 動的 OG route 削除に伴い spec を撤去または静的化 |

#### 手順

1. 2 つの OG generator ファイルを削除する。
2. `public/og-default.png`（1200×630）を配置する。
3. `site-metadata.ts` の `ogImagePath` を静的パスへ更新する。
4. member 詳細 `page.tsx` の `generateMetadata` から動的 OG 参照を除去する。
5. 関連 spec を静的 OG 前提に更新／削除する。

#### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test -- site-metadata.spec.ts public-metadata
grep -rn "next/og\|@vercel/og" apps/web/app apps/web/src   # 0 件期待
```

#### DoD

- `next/og` / `@vercel/og` の import が `apps/web` から 0 件。
- OGP メタタグが `og-default.png` を指す（SEO 回帰なし）。
- 動的 OG route 削除に伴う spec が green。

### Task B: OpenNext production minify 維持 + CI サイズ gate

#### 背景

minify で残りの空白・コメントを圧縮し、CI サイズ gate で再太りを deploy 前に検知する。`@opennextjs/cloudflare` v1.19.4 を使用。

#### 変更ファイル

| ファイル | 操作 | 内容 |
|---------|------|------|
| `apps/web/open-next.config.ts` | 確認のみ | OpenNext v1.19.4 に `minify` config key がないため、無効な設定を追加しない。`OPEN_NEXT_DEBUG`/`debug: true` 禁止は regression spec で担保 |
| `scripts/check-worker-size.sh` | 新規 | gzip 計測、閾値 3072KiB（warn 2800KiB）、超過時 `exit 1` |
| `.github/workflows/web-cd.yml` | 変更 | staging/production 両 deploy job の deploy 前段に size gate を挿入 |
| `apps/web/__tests__/opennext-config-regression.spec.ts` | 拡張 | `production minify` + `next/og` 0 件 assert を追加 |

#### `scripts/check-worker-size.sh` 仕様

- ビルド成果物（OpenNext Worker bundle）を gzip し、KiB を算出する。
- 閾値: 3072KiB（hard limit）超過で `exit 1`、2800KiB 超過で warn 出力。
- 出力は KiB 表示と判定結果を含める。

#### 手順

1. OpenNext v1.19.4 の型定義で `minify` config key 不在を確認し、`open-next.config.ts` は無効な設定を追加せず既存 `buildCommand` を保持する。
2. `scripts/check-worker-size.sh` を新規作成し実行権限を付与する。
3. `web-cd.yml` の両 deploy job に、build 後・deploy 前のステップとして size gate を挿入する。
4. `opennext-config-regression.spec.ts` に production minify 維持 + next/og 不在の assert を追加する。

#### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/check-worker-size.sh
mise exec -- pnpm --filter @ubm-hyogo/web test -- opennext-config-regression.spec.ts
```

#### DoD

- production 既定 minify 維持後の gzip bundle が 3072KiB 未満。
- size gate が両 deploy job で deploy 前段に発火し、超過時 fail する。
- regression spec が debug 無効維持 + next/og 0 件を保証する。

### 共通不変条件

- 新規 test は `*.spec.{ts,tsx}` のみ。
- production build は `next build --webpack`（Turbopack は local dev 限定）。
- Cloudflare 系 CLI は `scripts/cf.sh` 経由（`wrangler` 直叩き禁止）。
- env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由。
- D1 直アクセス禁止 / HEX 直書き禁止。
