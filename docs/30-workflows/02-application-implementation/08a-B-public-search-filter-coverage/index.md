# 08a-B-public-search-filter-coverage

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 08a-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL |

## purpose

公開メンバー一覧 `/members` の検索/フィルタ機能（q / zone / status / tag / sort / density）の動作仕様を `12-search-tags.md` 正本に沿って固定し、08a coverage hardening でカバーされていない検索パラメータの spec gap を解消する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、08a-A の use-case coverage では扱わない検索パラメータ仕様（query string ↔ API ↔ UI 表示の三者整合）だけを follow-up として固定する。

`/members` のフィルタ UI は `claude-design-prototype/pages-public.jsx` に存在するが、本番経路で query parameter 受け取り → API 渡し → 結果反映 → URL 同期 の一連の動作仕様が確定していないため、08b E2E と 09a staging smoke の検索シナリオが書けない状態にある。

## scope in / out

### Scope In
- `/members?q=&zone=&status=&tag=&sort=&density=` のパラメータ仕様
- public API `GET /api/public/members` の同パラメータ受け取り挙動
- 部分一致 / enum / multi-tag / sort / density 各々の AC
- 空結果 / 不正値 / 大量ヒットの UI 挙動仕様
- a11y（filter UI のキーボード操作・aria）
- visual evidence path（Playwright screenshot）

### Scope Out
- tag 管理 UI（admin 側）の実装
- search index 化 / 全文検索エンジン導入
- pagination 仕様の再定義（既存 03-data-fetching.md に従う）
- 非公開フィールドの公開 API 露出変更

## dependencies

### Depends On
- 08a-A-public-use-case-coverage-hardening（base coverage）
- 07a tag resolve API 本体
- 06a public web real workers / d1 smoke

### Blocks
- 08b-A-playwright-e2e-full-execution（検索 E2E シナリオ）
- 09a-A-staging-deploy-smoke-execution（検索 smoke）

## refs

- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx

## AC

- query parameter 6種（q / zone / status / tag / sort / density）すべてに対し既知ケースが spec として記述される
- `GET /api/public/members` の query 受け取り型と response 形が確定する
- 空結果 / 不正値（enum 外, 過大文字数）/ 大量ヒット（>=200件）の UI 挙動が記述される
- a11y: filter input が role / label / keyboard 操作で全て到達可能と明記される
- 不変条件 #4 公開状態フィルタ正確性 / #5 public boundary / #6 admin-only field 非露出 が AC として明文化される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## services / secrets

- Cloudflare Workers (apps/web, apps/api)
- Cloudflare D1（read-only, public scope）
- secret 追加なし

## invariants touched

- #4 公開状態フィルタ正確性（status=非公開/退会済みは public 結果から除外）
- #5 public/member/admin boundary
- #6 admin-only field を public response に含めない

## completion definition

全 phase 仕様書が揃い、検索パラメータごとの AC と evidence path、a11y 観点が明記され、08b E2E / 09a smoke が参照できる状態になること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
