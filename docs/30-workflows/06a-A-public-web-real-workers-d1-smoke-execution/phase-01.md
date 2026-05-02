# Phase 1: 要件定義 — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 1 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

未完了の真因、scope、依存境界、成功条件を確定する。本タスクは 06a 親タスクで `apps/api` を local mock に差し替えて緑にした smoke を、**実 Workers runtime + 実 D1 binding** で踏み直す follow-up gate である。Phase 1 ではこの「実経路 smoke」を AC・evidence path・approval gate に落とし込み、後続 Phase へ橋渡しする。

## 真の論点

1. **mock smoke では検出できない領域は何か** — 06a Phase 11 では `apps/api` を local mock で代替したため、`PUBLIC_API_BASE_URL` 経路、D1 binding、wrangler runtime 設定、`@opennextjs/cloudflare` adapter の挙動、`API_SERVICE` service binding が未検証である。これらは production 直前で初めて顕在化する高リスク領域であり、本タスクで local + staging の 2 段 smoke により網羅する。
2. **実 D1 と mock の判別をどう evidence 化するか** — 単純な HTTP `200` だけでは mock でも green になる。`GET /public/members` の `items.length >= 1` と、その seeded ID を使った web `/members/{seeded-id}` の `200` を主証跡に据える。`/members/UNKNOWN` の `404` は異常系確認のみとし、実 binding 主証跡には使わない。
3. **wrangler 直接実行と esbuild Host/Binary version mismatch** — `pnpm --filter @ubm-hyogo/api dev` 直叩きは `Cannot start service: Host version "0.27.3" does not match binary version "0.21.5"` で失敗する。CLAUDE.md は `scripts/cf.sh` ラッパー経由を必須と定めており（`ESBUILD_BINARY_PATH` 自動解決込み）、本タスクでは **`scripts/cf.sh` 経由を唯一の起動経路として採用する**。
4. **staging `PUBLIC_API_BASE_URL` の未設定 / 誤設定リスク** — 未設定だと `apps/web` が `localhost:8787` に向き、staging / production で全リクエストが失敗する。`apps/web/wrangler.toml` の `[env.staging.vars]` に `PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"` が記載されていることを smoke gate に含める。
5. **不変条件 #6（apps/web から D1 直接アクセス禁止）の二重担保** — smoke 経路自体が `apps/web → apps/api → D1` を踏むため経路上は守られるが、`apps/web` 配下に `D1Database` / `env.DB` の直接 import が紛れ込まないか lint レベルでも確認する。

## 参照資料

- docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/ — 完了済み類似タスクの実例（粒度の参考）
- docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/ — 親タスクの outputs / evidence
- docs/00-getting-started-manual/specs/05-pages.md — 公開4 route family の機能要件
- docs/00-getting-started-manual/specs/09-ui-ux.md — UI スタイル / レスポンシブ要件
- docs/00-getting-started-manual/specs/12-search-tags.md — `/members?q=&zone=&density=` search params
- docs/00-getting-started-manual/specs/08-free-database.md — D1 構成 / binding / migration 運用
- CLAUDE.md（不変条件 #5 #6 #8 #14 / `scripts/cf.sh` 必須ルール）

## AC 確定

index.md の AC を本 Phase で正式採択する。各 AC は検証手段付き断定形であることを再確認する。

| AC | 内容 | 検証手段 | evidence path |
| --- | --- | --- | --- |
| AC-1 | local で `apps/api` Workers が `scripts/cf.sh` 経由で起動し、`Listening on http://127.0.0.1:8787` を観測 | terminal log キャプチャ | `outputs/phase-11/evidence/local-api-startup.log` |
| AC-2 | local で `apps/web` が `PUBLIC_API_BASE_URL=http://localhost:8787` を読み込み起動する | terminal log キャプチャ | `outputs/phase-11/evidence/local-web-startup.log` |
| AC-3 | local 公開4 route family / 5 smoke cases の curl で期待 status code を観測 | curl `-w "%{http_code}"` 連結 | `outputs/phase-11/evidence/local-curl.log` |
| AC-4 | `/public/members` が `items.length >= 1` を返し、その seeded ID で `/members/{id}` が `200` を返す（実 D1 経路の主証跡） | curl + jq | `outputs/phase-11/evidence/local-d1-evidence.log` |
| AC-5 | staging で公開4 route family / 5 smoke cases の curl で期待 status code を観測 | curl `-w "%{http_code}"` 連結 | `outputs/phase-11/evidence/staging-curl.log` |
| AC-6 | staging `PUBLIC_API_BASE_URL` が staging API URL を指していることが `apps/web/wrangler.toml [env.staging.vars]` で確認できる | toml Read 結果のキャプチャ | `outputs/phase-11/evidence/staging-vars.log` |
| AC-7 | `apps/web` 配下に `D1Database` / `env.DB` の直接 import が 0 件であることを `rg` で再確認 | ripgrep 出力 | `outputs/phase-11/evidence/invariant-6-rg.log` |
| AC-8 | 公開4 route family について少なくとも 1 枚の screenshot または HTML evidence を保存 | ブラウザ screenshot or `curl -s URL` の HTML | `outputs/phase-11/evidence/screenshot-*.png` または `*.html` |
| AC-9 | mock API ではなく `apps/web → apps/api → D1` 経路であることを evidence summary に明記 | `outputs/phase-11/main.md` の summary 節 | `outputs/phase-11/main.md` |

## evidence path 一覧

```
outputs/
├── phase-01/main.md          ... 本 Phase 出力
├── phase-02/main.md          ... 設計
├── phase-03/main.md          ... 設計レビュー
├── phase-11/
│   ├── main.md               ... 実測サマリ（AC-9 の経路明記）
│   └── evidence/
│       ├── local-api-startup.log
│       ├── local-web-startup.log
│       ├── local-curl.log
│       ├── local-d1-evidence.log
│       ├── staging-curl.log
│       ├── staging-vars.log
│       ├── invariant-6-rg.log
│       └── screenshot-*.png / *.html
```

## approval gate / 自走禁止操作

| 操作 | 必要 approval | 理由 |
| --- | --- | --- |
| `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | user 明示承認 | staging D1 へ書込み発生 |
| `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | user 明示承認 | staging deploy が staging 環境を一時的に置換 |
| `bash scripts/cf.sh dev ...`（local 起動） | 不要 | local のみ |
| curl by `localhost` / staging URL（read-only） | 不要 | read-only |
| commit / push / PR | user 明示承認 | 本仕様書作成 task の scope 外 |

## scope in / out 再確認

### Scope In
- `/`, `/members`, `/members/[id]`, `/register` の real Workers/D1 local smoke
- staging real Workers/D1 smoke の curl log と補助 screenshot 取得
- `PUBLIC_API_BASE_URL` 経路、D1 binding、Workers runtime の確認
- 06a 親タスクへの evidence link trace 更新
- `apps/web` 配下の D1 直接 import 0 件の rg 検査（不変条件 #6 二重担保）

### Scope Out
- 公開画面の新機能追加 / UI 改修
- OGP / sitemap
- mobile FilterBar / tag picker
- production deploy / production smoke
- 新規 D1 migration の作成
- Playwright E2E（08b の責務）

## 不変条件 trace

| # | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | public/member/admin boundary | 公開 route のみ smoke 対象、member / admin は触らない |
| #6 | `apps/web` から D1 直接アクセス禁止 | smoke 経路 `apps/web → apps/api → D1` を実行することで経路自体を検証。AC-7 の rg 検査で二重担保 |
| #8 | localStorage / GAS prototype を正本にしない | smoke 対象は `apps/api` 実体のみ、GAS endpoint / localStorage 状態は触らない |
| #14 | Cloudflare free-tier | local smoke は wrangler local mode、staging smoke も既存 staging Worker を使うのみで新規リソース作成は行わない |
| 実フォーム formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` を `apps/api` `[vars]` で参照する。本タスクで上書きしない |

## 実行手順

- 対象 directory: `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。
- wrangler は直接実行せず必ず `bash scripts/cf.sh` 経由で起動する（CLAUDE.md / esbuild mismatch 自動解決）。

## 統合テスト連携

- 上流: 04a public API（`/public/members` `/public/members/:id` の実装が前提）, 06a public web implementation（公開4 route の実装が前提）, Cloudflare D1 binding（migration apply 済が前提）
- 下流: 09a staging deploy smoke（本タスクで staging vars 健全性を確認することが前提）, 08b Playwright E2E（本タスクで実 binding 経路の baseline を確定することが前提）

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止
- #8 localStorage/GAS prototype を正本にしない
- #14 Cloudflare free-tier
- 未実装 / 未実測を PASS と扱わない
- placeholder と実測 evidence を分離する
- mock 経路の `200` を実 D1 経路 evidence に流用しない（AC-4 の seeded ID 検証で必ず区別）

## サブタスク管理

- [ ] 参照資料および完了済み類似タスク（06a-followup-001）の AC trace を確認する
- [ ] AC-1〜AC-9 と evidence path を対応付ける
- [ ] approval gate / 自走禁止操作を明記する
- [ ] 不変条件 trace を Phase 2 に渡せる粒度で確定する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 完了条件

- local real Workers/D1 smoke の curl log evidence path が AC に紐付いて確定している
- staging real Workers/D1 smoke の curl log evidence path が AC に紐付いて確定している
- 公開4 route family の screenshot または HTML evidence の保存先が確定している
- mock API ではなく `apps/web → apps/api → D1` 経路であることが AC-9 として明記されている
- approval gate / 自走禁止操作の一覧が確定している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] AC-1〜AC-9 の検証手段と evidence path が 1:1 で対応している
- [ ] approval gate が明示されている

## 次 Phase への引き渡し

Phase 2 へ以下を渡す:
- AC-1〜AC-9 の確定版とその evidence path
- 不変条件 trace（特に #6 の二重担保）
- approval gate（staging deploy / migration apply は user 承認必須）
- `scripts/cf.sh` 経由起動を唯一の経路とする方針
- `PUBLIC_API_BASE_URL` の local / staging それぞれの値設計入力
