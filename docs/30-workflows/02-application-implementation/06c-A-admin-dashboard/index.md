# 06c-A-admin-dashboard

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06c-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

管理者ダッシュボード `/admin` を、`docs/00-getting-started-manual/specs/11-admin-management.md` および `claude-design-prototype/pages-admin.jsx` の dashboard 機能に整合させるための follow-up 仕様書を作成する。本仕様書は spec のみを生成し、アプリケーション実装は行わない。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、admin 本体実装後にプロトタイプと現状コードの差分として残った dashboard 領域だけを扱う。

`/admin` ルートは admin role と require-admin middleware による二段防御で保護される設計だが、現状は KPI tile / 直近 7 日のアクション / pending request 件数 / 未解決 audit 件数を表示する集計 UI と対応 API（`/api/admin/dashboard` 系）が未接続である。プロトタイプ `pages-admin.jsx` の dashboard セクションを正本仕様 11-admin-management.md に整合させ、UI 構成、集計 endpoint、認可境界、audit logging を spec として確定させる。

## scope in / out

### Scope In
- `/admin` dashboard 画面の UI 構成（KPI tile / 直近アクション / ショートカット導線）の仕様化
- 集計 API（`/api/admin/dashboard` 等）の endpoint / response shape の仕様化
- admin role 二段防御（middleware + require-admin API）の責務分離記述
- audit log への dashboard 閲覧記録方針
- pending request 件数 / 未解決 audit 件数 / 公開メンバー数 KPI の集計ソース定義

### Scope Out
- アプリケーション実装コードの追加・変更
- admin 権限自体の付与フロー再設計
- admin 詳細画面（member 編集 / request 承認 UI）の仕様（別 followup で扱う）
- production secret 値の記録
- 未承認 commit / push / PR

## dependencies

### Depends On
- 06b-A-me-api-authjs-session-resolver（admin session resolver の前提）
- 06c admin pages 本体タスク（`/admin` 配下の routing と layout）
- require-admin middleware 実装

### Blocks
- 06c-B-admin-members（admin shell 共通基盤を提供）
- 08b-A-playwright-e2e-full-execution（admin E2E）
- 09a-A-staging-deploy-smoke-execution（staging admin smoke）

### 内部依存
- 表記上は parallel だが、実依存は **06b-A → 06c admin pages 本体 → 06c-A（本タスク）** の順で実装可能になる。
- 本タスクは dashboard 集計 API と UI tile の SRP を担い、後続 admin E2E / staging smoke の前提条件を確定する。
- 06c-A〜E（admin 5 件）は実態として admin shell 共通基盤を共有する parallel-eligible だが、命名規則「sort 順 = 実行順」に従い名目上 serial として A → B → C → D → E の順で実行する。

## refs

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/api/src/middleware/require-admin.ts
- apps/web/app/admin/

## AC

- `/admin` は admin role 必須（middleware + require-admin API の二段防御）で保護される
- KPI tile（公開メンバー数 / pending request 件数 / 未解決 audit 件数）が集計 API 経由で表示される
- 直近 7 日のアクション一覧が dashboard 上で確認できる
- 非 admin user が `/admin` にアクセスした場合、middleware で 302、API で 403 を返す
- dashboard 閲覧は audit log に記録される（#13）
- apps/web は D1 直参照せず apps/api 経由で集計データを取得する（#5）

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

- #5 public/member/admin boundary（apps/web D1 direct access forbidden を含む）
- #11 管理者も他人本文を直接編集しない
- #13 admin audit logging
- #15 Auth session boundary

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
