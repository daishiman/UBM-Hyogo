# lessons-learned: 09b Cron Monitoring / Release Runbook 苦戦箇所（2026-05-01）

> 対象タスク: `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/`
> 状態: `spec_created` / docs-only / `NON_VISUAL`
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check}.md`

09b は runtime cron を変更しない運用 runbook 仕様である。次回の cron / release / incident response 系タスクで同じ判断を短時間で再現するため、苦戦箇所を promotion target 付きで固定する。

## L-09B-001: cron は top-level と env scope の parity を先に見る

**苦戦箇所**: Cloudflare Workers cron は top-level `[triggers]` だけを読めば足りるように見えるが、staging / production の env scope に差分があると本番だけ動かない事故になる。

**5分解決カード**: `rg -n "triggers|crons" apps/api/wrangler.toml` を最初に実行し、top-level / `env.staging` / `env.production` の cron 配列を表にする。09b では `0 * * * *`, `0 18 * * *`, `*/15 * * * *` を current facts とし、legacy hourly cron の撤回は UT21-U05 に委譲した。

**promoted-to**: `deployment-details.md`, `workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md`

## L-09B-002: running guard は runbook SQL と仕様語を二重化しない

**苦戦箇所**: `sync_jobs` の running / timeout / failed 化を runbook が独自語で書くと、03b/U-04 の実装語と運用手順がずれる。

**5分解決カード**: runbook には確認 SQL と期待される状態遷移だけを書く。enum や DB 契約の正本は該当 spec / implementation guide に寄せ、09b は運用者向けに current facts を再掲する。

**promoted-to**: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`, `outputs/phase-12/release-runbook.md`

## L-09B-003: rollback は worker / pages / D1 / cron を分ける

**苦戦箇所**: release runbook では一括 rollback script を作りたくなるが、障害種別が違う対象をまとめると web/api/cron/D1 の不要な巻き戻しが起きる。

**5分解決カード**: rollback 表は必ず 4 行に分ける。Worker rollback、Pages rollback、D1 forward repair、cron disable / restore を別手順にし、D1 を apps/web から直接触らない不変条件を明記する。

**promoted-to**: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## L-09B-004: docs-only / NON_VISUAL は screenshot N/A ではなく代替 evidence を固定する

**苦戦箇所**: docs-only runbook タスクで `screenshot N/A` だけを書くと、Phase 11 が空洞化する。後続 09c が実行するときに、どの evidence を埋めるべきか不明になる。

**5分解決カード**: Phase 11 には `main.md`, `manual-smoke-log.md`, `link-checklist.md` を置き、実行予定コマンド、期待出力、Dashboard 目視項目を残す。実 deploy / rollback / dashboard 操作は未実行と明記する。

**promoted-to**: `phase12-skill-feedback-promotion.md`, `workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md`

## L-09B-005: skill feedback は candidate task と existing task を分けて route する

**苦戦箇所**: `skill-feedback-report.md` の改善提案をすべて新規未タスクにすると、既存の 09c / observability / UT21 系 task と重複する。

**5分解決カード**: `docs/30-workflows/unassigned-task/` を先に検索し、formalized / delegated / existing related / candidate を分ける。存在する task はリンクし、低優先度 candidate は `unassigned-task-detection.md` に no formalize reason を残す。

**promoted-to**: `task-specification-creator/references/phase12-skill-feedback-promotion.md`, `skill-creator/references/patterns-success-skill-phase12.md`
