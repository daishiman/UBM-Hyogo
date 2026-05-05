# 09c-A-production-deploy-execution

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 9c-fu |
| mode | serial |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL |

## purpose

09c docs-only runbook を実 production deploy / smoke / 24h verification に進める。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、正本上で未実装・未実測として残った follow-up gate だけを扱う。

09c は production release runbook specification として完了しているが、実 production deploy、D1 migration、release tag、runtime smoke、24h verification は user approval 後の別 operation として未実行である。

## scope in / out

### Scope In
- user approval evidence
- main merge commit と deploy target 照合
- production D1 migration list/apply evidence
- api/web production deploy evidence
- release tag
- production smoke
- 24h verification

### Scope Out
- 09c docs-only 仕様書の再設計
- 新規機能開発
- secret 値の記録
- 09a staging smoke 未完了時の production 実行

## dependencies

### Depends On
- 09a staging smoke green
- 09b release/incident runbook
- 09b-B-cd-post-deploy-smoke-healthcheck（post-deploy healthcheck mechanism が green。silent failure 検知の前提）
- 09b-A-observability-sentry-slack-runtime-smoke（runtime observability が疎通済み）
- Phase 13 user approval

### Blocks
- post-release observation follow-ups

## refs

- docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md
- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/
- docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
- .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md

## AC

- user approval evidence が保存される
- production D1 migration が Applied として確認される
- api/web production deploy が exit 0
- production public/member/admin smoke が green
- release tag と 24h verification summary が保存される

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
- #6 apps/web D1 direct access forbidden
- #14 Cloudflare free-tier

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
