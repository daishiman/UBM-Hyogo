# [#247] [UT-06-FU-A-INFRA-REGRESSION-001] apps/web OpenNext wrangler 設定回帰テスト追加

## メタ情報

```yaml
issue_number: 247
title: [UT-06-FU-A-INFRA-REGRESSION-001] apps/web OpenNext wrangler 設定回帰テスト追加
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/247
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

UT-06-FU-A は `apps/web/wrangler.toml` / `apps/web/.assetsignore` / `apps/web/package.json` の設定変更が中心で、UI・アプリコードのテストでは回帰検出できない。CI で禁止キー検出・必須パターン検証を行う infra regression test を追加する。

## 検出元

- 親タスク: UT-06-FU-A (OpenNext Workers migration)
- 検出 Phase: UT-06-FU-A Phase 12 unassigned-task-detection (UNASSIGNED-FU-A-003)

## 仕様書

- `docs/30-workflows/completed-tasks/issue-247-apps-web-opennext-config-regression-tests/UT-06-FU-A-open-next-config-regression-tests.md`

## 親タスクの実装ガイド

- `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/implementation-guide.md`

## 想定 AC

1. `apps/web/wrangler.toml` で `pages_build_output_dir` 不在を検証する test
2. env-scoped `[assets]`（staging / production）が存在することを検証
3. `apps/web/package.json` の `deploy` script 不在検証（CLAUDE.md ルール: `bash scripts/cf.sh deploy` 経由のみ）
4. `apps/web/.assetsignore` の必須行検証
5. CI ワークフローへ組み込み、PR で fail する

## 苦戦箇所

- 設定ファイル中心の変更は UI/アプリテストで回帰検出できない
- `pages_build_output_dir` 復活、env-scoped `[assets]` 欠落、`deploy` script 復活、`.assetsignore` 必須除外消失を検出する仕組みが将来の同種設定 drift を簡潔に検出する要点

## スコープ

- 含む: 設定ファイルの回帰テスト追加・CI 組み込み
- 含まない: staging deploy 実行・Cloudflare 実アカウント操作

## 優先度

MEDIUM（drift 防止のための継続的品質ゲート）。
