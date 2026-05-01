# Phase 11: 手動 smoke / 実測 evidence — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 11 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実装後に踏む手動 smoke と実測 evidence の取得手順、placeholder 配置を確定する。

## 実行タスク

1. screenshot path を決める（`outputs/phase-11/screenshots/admin-meetings-list.png` など）。完了条件: list / create drawer / attendance / CSV のうち最低 4 枚が定義される。
2. curl による API smoke 手順を書く（cookie 取得 → POST → GET → CSV download）。完了条件: 認証 cookie の扱いが明記される。
3. wrangler 出力 placeholder（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` の Version ID 記録欄）を置く。完了条件: secret 値は記載しない。
4. ログイン admin として Cloudflare staging で踏む手順を書く。完了条件: 失敗時の rollback 手順が併記される。

## 参照資料

- CLAUDE.md（Cloudflare 系 CLI 実行ルール）
- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- 実測時は `bash scripts/cf.sh ...` 経由のみ使用する（`wrangler` 直接実行禁止）。
- screenshot / curl 出力 / wrangler 出力に secret 値が混入しないよう mask する。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- secret 値（API token / cookie 値）を成果物に含めない。

## サブタスク管理

- [ ] screenshot path を定義する
- [ ] curl smoke 手順を書く
- [ ] wrangler placeholder を置く
- [ ] rollback 手順を書く
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- outputs/phase-11/main.md
- outputs/phase-11/screenshots/（実測時に保存）
- outputs/phase-11/curl/（実測時に保存）

## 完了条件

- 手動 smoke が再現可能な粒度で記述される
- evidence path が AC matrix と一対一になる
- secret 値が成果物に含まれない

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、smoke 手順と evidence path を渡す。
