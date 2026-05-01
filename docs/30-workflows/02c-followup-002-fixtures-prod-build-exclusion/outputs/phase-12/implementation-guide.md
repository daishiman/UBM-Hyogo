# Implementation Guide — 02c-followup-002-fixtures-prod-build-exclusion

## Part 1: 中学生レベル概念説明（なぜ → 何）

### なぜ必要か（日常生活の例え話：給食室と試食用サンプル）

学校の給食室を想像してください。給食室には「本番の給食を作る場所」と「味見・試作のためのサンプル棚」があります。試作サンプルには本番では使わない実験的な味付け（たとえば辛すぎる試作カレー）も置かれています。もし本番の給食配膳カートにうっかり試作サンプルが混ざると、生徒に届けてはいけないものが届いてしまいます。

このタスクがやりたいのは、給食室の出口（配膳カートに積む工程）に **3 重の関所** を置いて、試作サンプルが絶対に本番カートに混ざらないようにすることです。

- 関所 1: 「本番カートに積む荷物リスト」を作るときに、最初から試作サンプル棚を見ないルールを追加する（= ビルドの設計図を分ける）
- 関所 2: 配膳室の見回り係が、本番ルートから試作棚に手を伸ばす動きを見つけたら止める（= コードの取り込み境界を機械的に検査する）
- 関所 3: カートに最終的に積まれる荷物は、関所 1・2 を通った荷物だけになるので、結果として試作品は到達できない（= 実際にビルドして包む工程）

これらをまとめて「3 重防御」と呼びます。1 重だけだと見落としが起き得るので、独立した仕組みを 3 つ重ねるのが目的です。

### 何をするか

1. **本番用のビルド設計図を新しく 1 枚追加します**（`apps/api/tsconfig.build.json`）。元の設計図はそのまま残し、本番だけは「試作棚（テストや擬似データ用ファイル）を見ない」と書いた別紙を使います。
2. **見回り係のルールブックを 1 行増やします**（`.dependency-cruiser.cjs`）。本番のフォルダから試作棚のフォルダへ手を伸ばすコードを見つけたらエラーで止めます。
3. **02c 本体タスクの覚え書きに「3 重防御で守ることにした」と追記します**（既存の implementation-guide.md の不変条件 #6 節）。

### 専門用語セルフチェック表

書き終わったあとに本文を読み返し、専門用語が説明なしで残っていないか確認するための表です。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| `tsconfig.build.json` | 「本番ビルド専用の設計図ファイル」（普段使う設計図とは別の本番専用版） |
| `exclude` | 「ここに書いたフォルダは見ないでね、という指示」 |
| `noEmit` | 「型チェックだけして、出力ファイルは作らない設定」 |
| dependency-cruiser | 「コード同士のつながりを見回って、ダメなつながりを止める係」 |
| バンドル（bundle） | 「本番に届ける荷物を 1 つに包んだもの」 |
| フィクスチャ（fixture） | 「テスト用に置いてある“代わりのデータ”」 |
| miniflare | 「本物の Cloudflare の代わりに机の上で動かす練習用エンジン」（テストでだけ使う） |
| `__tests__` / `__fixtures__` | 「テストや代わりデータを入れる名前付きフォルダ」 |
| バインディング | 「Cloudflare のサーバーが外の道具に繋がる接続口」 |
| プロダクションバンドル | 「本番に届ける完成品の荷物」 |

### Part 1 必須要素チェック（書き手用）

- [x] 日常生活の例え話（給食室と試作サンプル）を本文中に 1 つ含めた
- [x] 専門用語セルフチェック表に 5 用語以上（10 用語）を載せ、日常語に言い換えた
- [x] 中学 2 年生が読んで止まらない語彙に揃えた
- [x] 「なぜ必要か」を「何をするか」より先に書いた
- [x] phase-12.md ドラフトと逐語一致する内容にした

---

## Part 2: 実装ガイド（技術者向け）

### 目的

`apps/api` の build 成果物から `__fixtures__/**` / `__tests__/**` を構成上強制的に除外し、
production runtime に dev-only コード（miniflare 等の test 専用依存・dev fixture seed）が
流入しない状態を foundation として固定する。02c で実装した dev fixture / test loader
契約自体は変更せず、build 構成と境界 lint のみで三重防御を確立する。

## 変更ファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/tsconfig.build.json` | 新規 | `tsconfig.json` を `extends`。`src/**/__tests__/**` / `src/**/__fixtures__/**` / `src/**/*.test.ts` / `src/**/*.spec.ts` / `../../packages/**/__tests__/**` / `../../packages/**/*.test.ts` を `exclude`。 |
| `apps/api/package.json` | 変更 | `build` script を `tsc -p tsconfig.build.json --noEmit` に切替（`typecheck` / `lint` は `tsconfig.json` 維持で test / fixture も型検査）。 |
| `.dependency-cruiser.cjs` | 変更 | (a) header コメントに「6. production code → __fixtures__ / __tests__」を追記。(b) forbidden rule `no-prod-to-fixtures-or-tests` を追加（`from.path: ^(apps\|packages)/.+/src/`、`pathNot: (__tests__\|__fixtures__)/\|\.test\.ts$\|\.spec\.ts$`、`to.path: (__tests__\|__fixtures__)/`、severity: error）。(c) `options.exclude.path` を `(__tests__\|__fixtures__\|_shared)` から `(_shared/__tests__/\|_shared/__fixtures__/)` に narrow（`__tests__` / `__fixtures__` を analysis 対象に戻して境界 rule を機能させる）。 |
| root `package.json` | 変更 | `lint:deps` を追加し、root `lint` から dep-cruiser gate を実行。 |
| `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md` | 変更 | 不変条件 #6 行に「三重防御で固定」追記。直下に sub-section「#6 の三重防御（02c-followup-002 で追加）」追加。 |

## AC ↔ evidence

| AC | 結果 | evidence |
| --- | --- | --- |
| AC-1 build 成果物に `__fixtures__/**` `__tests__/**` を含めない | PASS | esbuild bundle 792.9 KB に `__fixtures__` `__tests__` `miniflare` 文字列 0 件（outputs/phase-11/main.md） |
| AC-2 `pnpm test` が引き続き通る | PARTIAL | `pnpm typecheck` / `pnpm build` exit 0。本 diff 起因の regression はなし。ただし pre-existing test failure 4 件により全体 `pnpm test` は FAIL。追跡先: `docs/30-workflows/unassigned-task/task-02c-followup-002-sync-forms-responses-test-baseline-001.md` |
| AC-3 prod → `__fixtures__` import が dep-cruiser で error | PASS | 合成違反テストで `error no-prod-to-fixtures-or-tests` 1 件発火（outputs/phase-06/main.md） |
| AC-4 bundle size 縮小記録 | PARTIAL | esbuild bundle 792.9 KB / build から exclude する source 344,831 B (47.7%) / 90 ファイル（outputs/phase-11/main.md）。`wrangler deploy --dry-run` 実測は未取得のため follow-up 化 |
| AC-5 02c implementation-guide.md #6 節への補強 | PASS | 完了タスクの implementation-guide.md に「#6 の三重防御」sub-section 追記済 |

## 三重防御の構造

1. **build 構成（tsconfig.build.json）**: production typecheck から test / fixture を除外。`pnpm build` は test loader / miniflare / fs 依存を読み込まない。
2. **境界 lint（dep-cruiser）**: production path から `__tests__/` `__fixtures__/` への import を error 化。違反は CI で停止。
3. **runtime bundling（wrangler/esbuild）**: `src/index.ts` から静的に到達可能な module のみが bundle される。境界 lint が green である限り test/fixture は到達不能。

## CI gate

Root `package.json` の `lint` は `lint:deps` を経由し、`rg --files apps packages -g '*.ts' -g '*.tsx'`
で列挙した source を `.dependency-cruiser.cjs` に渡す。これにより `no-prod-to-fixtures-or-tests`
を通常 lint 経路で実行する。依存取得は現時点では `pnpm dlx dependency-cruiser` 経由で、
lockfile 固定は follow-up ではなく次回 dependency policy 整理時に判断する。

## 不変条件

- #6 dev fixture を production seed として扱わない（既存 / 本タスクで三重防御を構成上固定）。
- production runtime に test 専用依存（miniflare 等）を流入させない。
- Cloudflare Workers free-tier bundle size 上限を遵守する。

## scope-out

- 02a / 02b の test refactor。
- production fixture / seed の新規実装。
- monorepo 全体の tsconfig 構成見直し。
- 新規アプリケーションコード実装。
- deploy / commit / push / PR 作成（本タスクの user 指示で抑止）。
