# Phase 12: ドキュメント更新 — 02c-followup-002-fixtures-prod-build-exclusion

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 02c-followup-002-fixtures-prod-build-exclusion |
| phase | 12 / 13 |
| wave | 02c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

02c implementation-guide.md 不変条件 #6 節 / aiworkflow-requirements 同期方針を定義する。

## Part 1 ドラフト（中学生レベル概念説明 / implementation-guide.md Part 1 と逐語一致）

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

> 本ドラフトは `outputs/phase-12/implementation-guide.md` Part 1 と逐語一致させること（drift 防止）。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 未反映の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md
- docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md
- apps/api/tsconfig.json
- apps/api/wrangler.toml
- apps/api/src/repository/__fixtures__/admin.fixture.ts
- apps/api/src/repository/__tests__/_setup.ts
- .dependency-cruiser.cjs

## 実行手順

- 対象 directory: docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 02c admin notes audit / sync jobs / data-access boundary（本体タスク）, aiworkflow-requirements 不変条件 #6
- 下流: 03a 以降の fixture 追加タスク, production deploy readiness, Cloudflare Workers bundle size 監査

## 多角的チェック観点

- #6 dev fixture を production seed として扱わない
- production runtime に test 専用依存（miniflare 等）を流入させない
- Cloudflare Workers free-tier bundle size 上限を遵守する
- 未実装 / 未実測を PASS と扱わない。
- 02c で固定した dev fixture / test loader 契約を勝手に変更しない（本タスクは build 構成と境界 lint のみで防御する）。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- outputs/phase-12/main.md

## 完了条件

- apps/api build 成果物に `__fixtures__/**` / `__tests__/**` ファイルが含まれない（成果物 ls 確認）
- `pnpm test` が引き続き通る（fixture loader / 02a / 02b の test 影響なし）
- production code (`src/**` で `__tests__` / `__fixtures__` 配下以外) から `__fixtures__` への import が `.dependency-cruiser.cjs` で error になる
- `pnpm build` または `wrangler deploy --dry-run` の bundle サイズ縮小が記録される
- 02c implementation-guide.md 不変条件 #6 節への補強が反映される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、AC、blocker、evidence path、approval gate を渡す。
