# Lessons Learned: Issue #502 UT-07B-FU-01-FOLLOWUP DLQ Monitoring Dashboard

> Workflow root: `docs/30-workflows/completed-tasks/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/`
> Artifact inventory: `references/workflow-issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard-artifact-inventory.md`
> Skill reference: `references/dlq-monitoring.md`
> Runbook: `docs/runbooks/dlq-monitoring/schema-alias-backfill.md`
> Issue: #502 CLOSED (`Refs #502` のみ。`Closes #502` 不可)
> Parent task workflow: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/`

## L-502-001: `last_error` 列の SELECT 禁止 — PII / OAuth token 混入リスクは SQL レイヤで遮断する

**原因**: `schema_diff_queue.last_error` には Cloudflare Queue consumer が捕捉した例外メッセージが TEXT で永続化される。本系列は schema alias back-fill のため、Google OAuth refresh / Sheets API 失敗時の token 文字列、内部 user email、Google Form responseId 等が文字列として混入し得る。集計や dash 表示で `SELECT last_error` を許してしまうと、運用ダッシュボードや CLI 出力に PII / 機密が露出する経路が生まれる。

**教訓**: 集計 SQL では `last_error` を **SELECT しない** ことを `references/dlq-monitoring.md` §2 と runbook §1 で明文化し、要約のみ runbook 側に固定文字列で記述する。アプリケーション層 / view 層の redaction に依存せず、SQL の column projection レベルで遮断する。

**再発防止**: Phase 11 で `outputs/phase-11/redaction-grep.log` に `grep -n 'last_error' docs/runbooks/dlq-monitoring/schema-alias-backfill.md` を残し、SELECT 文の中に `last_error` が登場しないことを grep で証跡化する。新しい集計 SQL を runbook に追加する際は redaction grep を再実行する。

**参照**: `references/dlq-monitoring.md` §2 / `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §1, §3 / `docs/30-workflows/completed-tasks/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/redaction-grep.log`

---

## L-502-002: Cloudflare Queue / DLQ binding 命名規約 — 環境別 suffix を SSOT で固定する

**原因**: schema alias back-fill 系の Queue / DLQ は production と staging で別名 binding を持つ（`schema-alias-backfill` / `schema-alias-backfill-dlq` / `schema-alias-backfill-staging` / `schema-alias-backfill-staging-dlq`）。binding 変数 `SCHEMA_ALIAS_BACKFILL_QUEUE` は同名で `apps/api/wrangler.toml` の `[env.production]` / `[env.staging]` 配下に分かれて配置される。runbook / dash 手順 / SQL 例の中で命名が drift すると、staging で組んだ集計を production に流用した時に存在しない Queue を参照して silent fail する事故が起きる。

**教訓**: Queue / DLQ 物理名と binding 変数名の対応表を `references/dlq-monitoring.md` §1 に SSOT として固定し、runbook はこれを参照する経路 1 本に絞る。`-staging` suffix の有無を **環境** 列で明示し、勝手に複数形 / 単数形を切り替えない。

**再発防止**: Phase 11 で `outputs/phase-11/binding-grep.log` に `apps/api/wrangler.toml` の Queue / DLQ binding grep を残し、命名差異を物理ファイル grep で確定する。`scripts/cf.sh queues list` をフォールバック確認経路として `references/dlq-monitoring.md` §5 に明記する。

**参照**: `references/dlq-monitoring.md` §1, §5 / `apps/api/wrangler.toml` / `outputs/phase-11/binding-grep.log`

---

## L-502-003: しきい値（DLQ ≥ 1 / retry_count ≥ 3 / exhausted 24h）— 初期固定値と再観測ポリシー

**原因**: 監視しきい値を「経験則で動的に変更する」運用にすると、誰がいつ変えたかが log に残らず post-mortem 時に基準値再現ができなくなる。一方で初期段階から複雑な動的しきい値を導入すると、観測データが揃う前に過剰なノイズ抑制ロジックが入り、本来検知すべきインシデントが silent になる。schema alias back-fill は CPU budget 制約と remaining-scan 採用（L-UT07B-FU01-002 / 004）の影響で、retry / exhausted 滞留の現実的な分布が未測定の段階だった。

**教訓**: 初期しきい値は **保守的固定値** として 3 軸（`failed_items_json IS NOT NULL` の COUNT ≥ 1 / `retry_count >= 3` / `backfill_status='exhausted'` の `last_processed_at` 経過 24h）に確定し、再観測は **30 日 / 60 日 / 90 日** の cadence で skill changelog に見直し記録を残すポリシーを採用する。値域変更は必ず changelog に残し、runbook §6（しきい値見直し基準）と整合させる。

**再発防止**: しきい値見直しは別 unassigned task として起票し、その都度 `changelog/` に新エントリを追加する。runbook §6 に「30/60/90 日再観測」を明記する。

**参照**: `references/dlq-monitoring.md` §3 / `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §4, §6 / `changelog/20260507-issue502-dlq-monitoring.md`

---

## L-502-004: `wrangler` 直接実行禁止 — `scripts/cf.sh` ラッパー強制の根拠

**原因**: `wrangler` を直接呼ぶと、(1) ローカル OAuth トークンが `~/Library/Preferences/.wrangler/config/default.toml` に保持されて漏洩経路が増える、(2) `CLOUDFLARE_API_TOKEN` を `.env` の平文に書く誘惑が発生し AI コンテキスト混入リスクが上がる、(3) グローバル `esbuild` のバージョン不整合で deploy が破損する、(4) Node 24 / pnpm 10 の固定が外れて isolate 起動条件が変わる、という 4 系統の劣化が同時に発生する。

**教訓**: D1 集計 / Queue 一覧 / deploy / rollback はすべて `bash scripts/cf.sh ...` ラッパー経由に統一し、ラッパーが (1) `op run --env-file=.env` で 1Password 揮発注入、(2) `ESBUILD_BINARY_PATH` で esbuild 整合、(3) `mise exec --` で Node/pnpm 固定、を担う設計を `references/dlq-monitoring.md` §5 で SSOT 化する。

**再発防止**: runbook 内の全 CLI 例を `bash scripts/cf.sh` 文字列で開始させ、`wrangler ...` 直書きを grep で検出可能にする。`CLAUDE.md` のシークレット管理章に同方針を反映済み（プロジェクト全体の禁止事項として既に明文化）。

**参照**: `references/dlq-monitoring.md` §5 / `scripts/cf.sh` / `CLAUDE.md` シークレット管理章

---

## L-502-005: docs-only spec_created で Issue CLOSED を維持し、PR は `Refs #502` のみで連結する

**原因**: GitHub の `Closes #N` 構文は PR merge 時に Issue を CLOSED に再遷移させる。Issue #502 は本ワークフロー開始時点で既に CLOSED 状態（フォローアップ起票 → docs-only 仕様化のための形式 issue）であり、`Closes #502` を含む PR を merge すると "再オープン → 再 close" の不要な状態遷移が発生し、CLOSED 状態 metadata と activity log を破壊する。本ワークフローは docs-only / NON_VISUAL / spec_created で実 D1 mutation を含まないため、Issue 状態を変更する正当性も無い。

**教訓**: docs-only な spec_created sync では、PR 文面に **`Refs #502` のみ** を書き、`Closes #502` / `Fixes #502` / `Resolves #502` は使用しない。Issue 側は CLOSED を維持し、コメントでも「再オープン要請」を出さない。

**再発防止**: Phase 13 PR skeleton を生成する段階で `Refs #N` 文面を template 固定し、自動修復スクリプトでも `Closes`/`Fixes`/`Resolves` を grep してブロックする。`references/task-workflow-active.md` の issue-502 行に `Refs #502` のみと明記する。

**参照**: `docs/30-workflows/completed-tasks/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/phase-13.md` / `references/task-workflow-active.md` / `changelog/20260507-issue502-dlq-monitoring.md`

---

## 関連 lessons

- `references/lessons-learned-ut07b-fu-01-schema-alias-backfill-queue-cron-split-2026-05.md` — 親タスク（Queue/Cron 分離・dedupe 二層・public/internal status 値域）
- `references/lessons-learned-issue-377-retry-tick-dlq-audit-2026-05.md` — DLQ audit 系列の retry tick / repository primitive
- `references/lessons-learned-09b-A-sentry-slack-runtime-smoke-2026-05.md` — observability runbook 系列の運用境界
