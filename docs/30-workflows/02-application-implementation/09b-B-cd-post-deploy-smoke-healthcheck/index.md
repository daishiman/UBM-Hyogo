# 09b-B-cd-post-deploy-smoke-healthcheck

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 09b-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | NON_VISUAL |

## purpose

CD デプロイ後の smoke / healthcheck 自動化漏れを埋める。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、現状コード・正本仕様・未割当タスクを照合して残った未実装または未運用 gate だけを扱う。

staging/prod deploy は手動 smoke だけでは drift と silent failure を検知しづらい。UT-29 と正本仕様では post-deploy smoke/healthcheck が未実装として残っており、09a/09c の実行証跡を継続的に再検証する仕組みが必要である。

## scope in / out

### Scope In
- GitHub Actions または Cloudflare deploy 後の healthcheck 設計
- web/api health endpoint smoke
- Pages deployment source drift check
- D1/Workers 接続の軽量 smoke
- 失敗時の redacted log/evidence 保存

### Scope Out
- 全 E2E suite の常時実行化
- production deploy 実行そのもの
- 監視基盤全体の再設計
- 未承認 commit/push/PR

## dependencies

### Depends On
- 09a staging smoke execution
- 09c production deploy execution runbook
- Cloudflare Pages/Workers project settings
- GitHub Actions secrets

### Blocks
- 09c-A-production-deploy-execution（healthcheck mechanism が green の状態で初めて production deploy へ進む）
- production release operational confidence
- future deploy regression detection

### 因果順序の明確化（思考法分析からの整合）
- mechanism setup（本タスク）→ staging で動作確認 → production deploy（09c-A）→ deploy 後に同 mechanism が再発火、という因果ループ。
- 本タスクが先行することで 09c production deploy 失敗時の silent failure を automated に検知可能になる。

## refs

- docs/30-workflows/unassigned-task/UT-29-cd-post-deploy-smoke-healthcheck.md
- .claude/skills/aiworkflow-requirements/references/deployment-details.md
- .claude/skills/aiworkflow-requirements/references/lessons-learned-ut-28-cloudflare-pages-projects-2026-04.md

## AC

- deploy 後に web/api healthcheck が自動実行される
- Pages deployment source drift が検出される
- 失敗時に workflow が fail close する
- secret 実値なしの evidence が保存される
- 09a/09c の手動 smoke と責務重複しない

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

- #14 Cloudflare free-tier
- #16 secret values never documented
- #18 deployment drift detection

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
