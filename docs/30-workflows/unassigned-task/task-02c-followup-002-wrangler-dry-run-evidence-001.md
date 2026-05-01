# wrangler 公式 dry-run bundle evidence 取得 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-02c-followup-002-wrangler-dry-run-evidence-001                           |
| タスク名     | apps/api `wrangler deploy --dry-run` 公式 bundle evidence 取得                |
| 分類         | infrastructure verification                                                   |
| 対象機能     | apps/api production deploy readiness 検証（wrangler 公式 bundler 経由）       |
| 優先度       | 低                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | unassigned                                                                    |
| 発見元       | 02c-followup-002 Phase 11（main.md §1 注記）                                  |
| 発見日       | 2026-05-01                                                                    |
| taskType     | implementation                                                                |
| visualEvidence | NON_VISUAL（CLI / log artifact）                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02c-followup-002（`__fixtures__` / `__tests__` の prod build 除外）の Phase 11 では、
AC-1（bundle 内に test/fixture/miniflare 由来文字列が無い）と AC-4（bundle 流入なし）の
evidence を `wrangler deploy --dry-run --outdir` ではなく **esbuild 直接 bundle** で代替取得した:

```bash
mise exec -- npx esbuild --bundle apps/api/src/index.ts \
  --platform=neutral --format=esm \
  '--external:cloudflare:*' '--external:node:*' \
  --outfile=/tmp/api-bundle.js --metafile=/tmp/api-meta.json \
  --tsconfig=apps/api/tsconfig.build.json
# → 792.9kb / grep -c "__fixtures__\|__tests__\|miniflare" → 0
```

wrangler の内部 bundler は esbuild なので AC 判定基準は同一だが、
**Cloudflare wrangler 公式の bundle 出力そのもの** は未取得のままである。

### 1.2 問題点・課題

- 02c-followup-002 の AC-1 / AC-4 evidence は esbuild 直接 bundle のみ
- production deploy 実行時の wrangler 公式 bundle ロジック（esbuild plugin / external 設定 / wrangler 固有 transform）を経由した evidence が無い
- `apps/api/wrangler.toml` の build 設定と esbuild 直接実行の external/platform が drift しても検知できない

### 1.3 放置した場合の影響

- production deploy 直前に wrangler 公式 bundler 固有の transform で **fixture / test / miniflare の bundle drift** が検出された場合、リリース直前の手戻りになる
- esbuild 直接 bundle と wrangler 公式 bundle で external 解決ロジックが乖離しても気づけない
- 「02c-followup-002 で deploy readiness を担保した」と言い切るには公式 dry-run 成果が望ましい

---

## 2. 何を達成するか（What）

### 2.1 目的

`scripts/cf.sh` ラッパー経由で `wrangler deploy --dry-run --outdir` を実行し、
Cloudflare 公式 bundler が生成する bundle に対して `__fixtures__` / `__tests__` / `miniflare`
の文字列が 0 件であることと bundle size を **公式経路の evidence** として記録する。

### 2.2 最終ゴール

- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run --outdir /tmp/api-wrangler-bundle/` が exit 0 で完走
- 出力 bundle に対して `grep -c "__fixtures__\|__tests__\|miniflare"` → 0
- bundle size（bytes）を 02c-followup-002 の Phase 11 evidence と並記できる形で記録
- production への実 deploy は **行わない**（dry-run 限定）

### 2.3 スコープ

#### 含むもの

- `scripts/cf.sh` ラッパー経由での `wrangler deploy --dry-run --outdir` 実行
- 出力 bundle への `grep` / `wc -c` による静的検査
- evidence ログを 02c-followup-002 Phase 11 main.md と相互参照可能な場所へ記録（追記 or 新規 phase artifact）
- esbuild 直接 bundle（792.9kb）と wrangler 公式 bundle の size 差の記録

#### 含まないもの

- production / staging への実 deploy（`--dry-run` 必須・違反時 abort）
- `wrangler.toml` の本文修正（必要が判明した場合は別タスク化）
- esbuild バージョン整合性の根本対応（`scripts/cf.sh` の `ESBUILD_BINARY_PATH` 解決済みのため運用回避）
- 02c-followup-002 の AC 再判定（既に PASS 済み・本タスクは補強 evidence）

### 2.4 成果物

- `bash scripts/cf.sh deploy ... --dry-run --outdir ...` の実行ログ
- 出力 bundle の `grep -c` / `wc -c` 結果
- 02c-followup-002 へのリンク付き evidence サマリ（追記先は実行者判断・既存 phase-11 main.md 注記の解消が望ましい）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `scripts/cf.sh` ラッパーが worktree に存在する（`CLAUDE.md` 「Cloudflare 系 CLI 実行ルール」節準拠）
- 1Password CLI (`op`) がログイン済み（`scripts/cf.sh` が `op run --env-file=.env` で `CLOUDFLARE_API_TOKEN` を動的注入する）
- `apps/api/wrangler.toml` / `apps/api/tsconfig.build.json` が main 取り込み済み
- `mise install` 済み（Node 24.15.0 / pnpm 10.33.2）

### 3.2 実行手順

1. ラッパー存在確認: `ls scripts/cf.sh` / `bash scripts/cf.sh whoami`
2. dry-run bundle 取得:
   ```bash
   rm -rf /tmp/api-wrangler-bundle
   bash scripts/cf.sh deploy \
     --config apps/api/wrangler.toml \
     --env production \
     --dry-run \
     --outdir /tmp/api-wrangler-bundle/
   ```
3. bundle 静的検査:
   ```bash
   find /tmp/api-wrangler-bundle -type f
   grep -rc "__fixtures__\|__tests__\|miniflare" /tmp/api-wrangler-bundle/ | grep -v ':0$' || echo "OK: 0 hits"
   wc -c /tmp/api-wrangler-bundle/*.js
   ```
4. esbuild 直接 bundle（792.9kb）との size 差をログに残す
5. evidence を 02c-followup-002 Phase 11 main.md §1 注記に追記、または新規 phase artifact として配置
6. 実行後の `/tmp/api-wrangler-bundle/` は破棄（シークレット混入防止）

### 3.3 受入条件 (AC)

- AC-1: `bash scripts/cf.sh deploy ... --dry-run --outdir ...` が exit 0 で完走
- AC-2: 出力 bundle 内に `__fixtures__` / `__tests__` / `miniflare` の文字列が 0 件
- AC-3: bundle size（bytes）が evidence ログに記録される
- AC-4: 実 deploy が **発生していない**（`wrangler deployments list` 等で直前との差分なし、または dry-run のため deployment 自体が作成されない）
- AC-5: 02c-followup-002 Phase 11 の「wrangler 同梱 esbuild とグローバル esbuild のバージョン不整合」注記が解消、または現状の代替経路と公式経路の双方が並記される

---

## 4. 苦戦箇所 / 学んだこと

### 4.1 wrangler 同梱 esbuild と global esbuild の version drift

02c-followup-002 Phase 11 で `wrangler deploy --dry-run --outdir` を直接実行したところ、
**ローカル wrangler 同梱 esbuild とグローバル esbuild のバージョン不整合により exit 144 で停止** した:

> 注: `wrangler deploy --dry-run` も同等の evidence を生成できるが、本ローカル環境では
> wrangler 同梱 esbuild とグローバル esbuild のバージョン不整合により `--outdir` 指定の
> dry-run が exit 144 で停止した（CLAUDE.md の `scripts/cf.sh` ラッパーは本 worktree 未配置）。
> 本 follow-up の AC-1 / AC-4 は esbuild 直接 bundle で代替 evidence を確保（wrangler の
> 内部 bundler は esbuild なので bundle 内訳の判定基準は同一）。
>
> — `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/outputs/phase-11/main.md` §1

### 4.2 worktree への scripts/cf.sh 未配置

CLAUDE.md「Cloudflare 系 CLI 実行ルール」では `bash scripts/cf.sh` 経由の実行を必須としているが、
02c-followup-002 実行時の worktree には当該ラッパーが配置されていなかったため、
`mise exec -- npx esbuild` での代替 bundle に切り替えた。本タスク実行時は **必ず main から取り込んだ
最新の `scripts/cf.sh` を使う**こと（ラッパーが `ESBUILD_BINARY_PATH` を解決し version drift を回避する）。

### 4.3 wrangler 公式 bundle と esbuild 直接 bundle の判定基準同一性

wrangler の内部 bundler は esbuild なので、`__fixtures__` / `__tests__` / `miniflare` の grep 判定は
両者で同一基準になる。一方で wrangler 固有の transform / external 解決により bundle size は乖離し得る
ため、**size の絶対値ではなく文字列含有 0 件**を AC の中核に据える。

---

## 5. リスクと対策

| リスク | 対策 |
| --- | --- |
| 誤って実 deploy が発生する | 必ず `--dry-run` を付与。コマンド実行前に `--dry-run` の存在を visual check。`wrangler deployments list --env production` で前後差分が無いことを確認 |
| `.env` / `CLOUDFLARE_API_TOKEN` 等の実値がログに混入する | `bash scripts/cf.sh` ラッパー以外を使わない（`wrangler` 直接実行禁止）。出力ログの commit 前に grep で token 系文字列を検査 |
| esbuild version drift で exit 144 再発 | `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 自動解決経由で実行。global `esbuild` を直接呼ばない |
| `/tmp/api-wrangler-bundle/` を消し忘れて bundle 内 secret 文字列が残留 | 実行手順 6 で必ず `rm -rf /tmp/api-wrangler-bundle` を実行 |
| evidence 追記による Phase 11 main.md 履歴汚染 | 追記する場合は phase-11 配下に新規 sub artifact（例: `phase-11/wrangler-dry-run.md`）として分離する選択肢も検討 |
| `wrangler.toml` が staging 設定を pickup して production と乖離 | `--env production` を必ず明示。`scripts/cf.sh` の `--config apps/api/wrangler.toml` も明示 |

---

## 6. 検証方法

### 6.1 実行コマンド

```bash
# 1. ラッパー / 認証確認
bash scripts/cf.sh whoami

# 2. dry-run bundle 取得（実 deploy しない）
rm -rf /tmp/api-wrangler-bundle
bash scripts/cf.sh deploy \
  --config apps/api/wrangler.toml \
  --env production \
  --dry-run \
  --outdir /tmp/api-wrangler-bundle/

# 3. bundle 静的検査
find /tmp/api-wrangler-bundle -type f -name "*.js"
grep -rc "__fixtures__\|__tests__\|miniflare" /tmp/api-wrangler-bundle/
wc -c /tmp/api-wrangler-bundle/*.js
```

### 6.2 期待結果

| 検査項目 | 期待値 |
| --- | --- |
| dry-run exit code | `0` |
| `grep -rc "__fixtures__\|__tests__\|miniflare" /tmp/api-wrangler-bundle/` | 全ファイルで `:0`（合計 0 件） |
| `wc -c` bundle size | esbuild 直接 bundle（792.9kb = 約 811,827 B）と同オーダー（±20% 以内目安。乖離大なら external 設定差分を調査） |
| `wrangler deployments list --env production` 前後差分 | dry-run のため新規 deployment 0 件 |
| `/tmp/api-wrangler-bundle/` 内に `.env` / token 文字列 | 0 件（事前 grep で確認後に破棄） |

### 6.3 evidence 記録先（推奨）

- `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/outputs/phase-11/main.md` §1 注記の解消パッチ、または
- 同 phase-11 配下に新規 `wrangler-dry-run.md` として、本タスクの実行ログ・grep 結果・size を記録

---

## 7. 依存関係

| 種別 | 対象 | 関係性 |
| --- | --- | --- |
| 親タスク | `docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md` | 補強 evidence タスクとして切り出し |
| 上流ワークフロー | `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/outputs/phase-11/main.md` §1 注記 | 代替 evidence 取得の経緯と本タスクの発見元 |
| 同根派生タスク | `task-02c-followup-002-sync-forms-responses-test-baseline-001.md` | 親が同じ。本タスクとは独立に実行可。互いにブロッキング無し |
| 環境依存 | `scripts/cf.sh`（main 取り込み済み） / 1Password CLI ログイン / `mise install` | ラッパー / シークレット注入 / Node 24 + pnpm 10 |
| 設定依存 | `apps/api/wrangler.toml` / `apps/api/tsconfig.build.json` | dry-run bundle 構築の入力 |
| ブロッキング | なし（02c-followup-002 の AC は既に PASS 済み・本タスクは補強 evidence） | — |
| ブロックされる側 | production deploy readiness を「公式 wrangler 経路で再証明」する将来監査 | 本タスク完了で esbuild 直接 bundle と公式経路の双方が evidence 化 |

---

## 8. 完了の定義 (Definition of Done)

- [ ] AC-1〜AC-5 すべて PASS（§3.3）
- [ ] `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run --outdir ...` が exit 0
- [ ] 出力 bundle に対する `grep -rc "__fixtures__\|__tests__\|miniflare"` 結果が全ファイル `:0`
- [ ] bundle size（bytes）と esbuild 直接 bundle（792.9kb）との差分が evidence に記録
- [ ] `wrangler deployments list --env production` 前後で新規 deployment 0 件（実 deploy が発生していない）
- [ ] 02c-followup-002 Phase 11 main.md §1 注記の解消差分（または phase-11 配下の新規 sub artifact）が配置
- [ ] `/tmp/api-wrangler-bundle/` が破棄され secret 残留なし
- [ ] 出力ログに API token / OAuth token 文字列が含まれない（grep 検査済み）
- [ ] `wrangler` 直接実行を行わず `scripts/cf.sh` 経由のみ
- [ ] commit / push / PR はユーザ承認まで実行しない

---

## 9. 関連リソース

- `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/outputs/phase-11/main.md` — 代替 evidence と本タスクの発見元
- `docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md` — 親タスク仕様書（consumed 済み）
- `apps/api/wrangler.toml` — wrangler ビルド構成
- `apps/api/tsconfig.build.json` — production build 用 tsconfig
- `scripts/cf.sh` — Cloudflare CLI ラッパー（op + esbuild 解決込み）
- `CLAUDE.md` 「Cloudflare 系 CLI 実行ルール」節 — `wrangler` 直接実行禁止ポリシー
- `.dependency-cruiser.cjs` — `no-prod-to-fixtures-or-tests` rule（CI 層の防御）
