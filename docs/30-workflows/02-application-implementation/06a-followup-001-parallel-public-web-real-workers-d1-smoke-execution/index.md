# 06a-followup-001-parallel-public-web-real-workers-d1-smoke-execution

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 6a-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL |

## purpose

06a public web の local mock smoke では未検証だった real Workers + D1 経路を実測する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、正本上で未実装・未実測として残った follow-up gate だけを扱う。

06a 本体は公開4 routeを実装済みだが、wrangler dev mismatch により実 Workers/D1 smoke が deferred になっている。mock API の green は apps/web -> apps/api -> D1 の本番経路を保証しない。

## scope in / out

### Scope In
- `/`, `/members`, `/members/[id]`, `/register` の real Workers/D1 local smoke
- staging smoke の curl log と補助 screenshot 取得
- `PUBLIC_API_BASE_URL` 経路、D1 binding、Workers runtime の確認
- 06a 親タスクへの evidence link trace 更新

### Scope Out
- 公開画面の新機能追加
- OGP / sitemap
- mobile FilterBar / tag picker
- production deploy

## dependencies

### Depends On
- 04a public API
- 06a public web implementation
- Cloudflare D1 binding

### Blocks
- 09a staging deploy smoke
- 08b Playwright E2E

## refs

- docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/
- docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/12-search-tags.md

## AC

- local real Workers/D1 smoke の curl log が保存されている
- staging real Workers/D1 smoke の curl log が保存されている
- 少なくとも公開4 route family の screenshot または HTML evidence が保存されている
- mock API ではなく apps/web -> apps/api -> D1 経路であることが evidence に明記されている

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

## invariants touched

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止
- #8 localStorage/GAS prototype を正本にしない
- #14 Cloudflare free-tier

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
