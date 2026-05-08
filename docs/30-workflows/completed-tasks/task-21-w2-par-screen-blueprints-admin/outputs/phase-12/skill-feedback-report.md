# Phase 12 skill feedback report

## テンプレ改善

| item | routing | evidence |
| --- | --- | --- |
| docs-only blueprint task でも root `index.md` / `artifacts.json` と Phase 12 strict 7 outputs を必須化すると drift を早期検出できる | no-op / already covered | `task-specification-creator/references/phase-12-documentation-guide.md` の Phase 12 strict outputs / root-output parity / canonical tree audit で既に規定済み。本 task では成果物側を修正 |
| `outputs/artifacts.json` を lightweight marker にすると compliance 自己申告 PASS と実測 `cmp` が割れる | no-op / already covered | 同 reference の root/output artifacts parity ルールで full mirror と lightweight marker の区別を要求済み。本 task では full mirror に補正し `cmp_exit=0` |

## ワークフロー改善

| item | routing | evidence |
| --- | --- | --- |
| 旧 draft が存在する場合、Phase 05 構造との grep gate を先に実行する | no-op for current cycle | `scripts/verify-09g-screen-blueprints-admin.sh` を追加済み |
| current index が参照する canonical workflow root の削除は task scope 外でも同サイクルで検出・復元する | no-op / already covered | `task-specification-creator/references/phase-12-documentation-guide.md` の current canonical workflow tree 監査と `phase12-skill-feedback-promotion.md` の Canonical Root Existence Gate で既に規定済み |

## ドキュメント改善

| item | routing | evidence |
| --- | --- | --- |
| 09g は aiworkflow current API contract を参照し、prototype の stale API 名を採用しない | applied | 09g §2..§9 API 表 |
| AdminSidebar に含む既存 `/admin/dashboard/attendance` と task-21 blueprint 対象 8 routes の境界を明記する | applied | 09g §1.2 / §99.3 に既存 route 導線であり task-15/16/17 入力外と追記 |
