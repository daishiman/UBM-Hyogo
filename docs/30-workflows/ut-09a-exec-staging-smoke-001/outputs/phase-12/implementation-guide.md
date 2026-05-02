# Implementation Guide

## Part 1: 中学生レベルの説明

### 何をするタスクか

本番に出す前に、練習用の場所で本当に動くかを確かめるタスクです。

たとえば、学校の文化祭で本番前にリハーサルをするようなものです。受付、案内、
放送、片付けまで一通り試すと、本番で困りそうなところを先に見つけられます。

このタスクでは、画面が開けるか、ログインまわりが壊れていないか、データの同期が
動くか、記録に秘密の値が混ざっていないかを確認します。

### 用語セルフチェック

| 用語 | やさしい説明 |
| --- | --- |
| staging | 本番前に試す練習場所 |
| smoke test | 朝の体調チェックのような短い確認 |
| evidence | 確認した証拠として残すファイル |
| blocker | 次へ進むのを止める理由 |
| redaction | 見せてはいけない文字を隠すこと |

## Part 2: 技術者向け

### Current Contract

- Source workflow: `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/`
- Execution workflow: `docs/30-workflows/ut-09a-exec-staging-smoke-001/`
- Runtime gate: Phase 11 requires explicit user instruction before staging commands.
- Cloudflare CLI path: use `bash scripts/cf.sh`; direct `wrangler` command is not the canonical path.

### Target Delta

| Area | Delta |
| --- | --- |
| 09a placeholder | Replace `NOT_EXECUTED` references with measured evidence paths after execution |
| Visual evidence | Store Playwright/manual evidence under `outputs/phase-11/playwright-staging/` |
| Forms sync | Store staging job dump at `outputs/phase-11/sync-jobs-staging.json` |
| Tail log | Store redacted tail log or unavailable reason at `outputs/phase-11/wrangler-tail.log` |
| 09c blocker | Record `blocked|unblocked`, `reason`, `evidence_path`, `checked_at` |

### GO / NO-GO Rule

09c can move from blocked to unblocked only when AC-1 through AC-6 pass and
`redaction-checklist.md` passes. Any runtime failure, missing evidence, or redaction failure keeps
09c blocked and records the reason.

### 2026-05-02 実行結果サマリ (BLOCKED)

User 明示指示により実 staging smoke を試行。`bash scripts/cf.sh whoami` が
`You are not authenticated` を返し、`CLOUDFLARE_API_TOKEN` が `op run --env-file=.env`
経由で注入されない状態を確認。staging deploy / wrangler tail / Forms sync が全て
成立せず、AC-1〜AC-4 = FAIL、AC-5 = 部分 PASS (artifacts.json parity 維持で
phase-11 status を `blocked` に更新)、AC-6 = 維持 (09c は引き続き blocked)。

#### 取得不能の実測 evidence

- `outputs/phase-11/wrangler-tail.log` — wrangler unauthenticated 出力と取得不能理由
- `outputs/phase-11/manual-smoke-log.md` — 各 step の実行不能内訳
- `outputs/phase-11/sync-jobs-staging.json` — Forms sync 経路 BLOCKED dump
- `outputs/phase-11/playwright-staging/README.md` — staging URL 未確定により Playwright 実行不能の記録
- `outputs/phase-11/redaction-checklist.md` — 記録物に PII / secret 不在を確認 (PASS)
- `outputs/phase-11/main.md` — Phase 11 実行サマリ

#### 09c blocker 影響

09c production deploy gate は本タスクの実測 PASS を前提としているため、現状維持で
blocked。`task-workflow-active.md` 上の 09c entry は変更しない (PASS が出ない限り
GO に上げない仕様書ロジックを尊重)。

#### スクリーンショット

実 staging URL が確定しないため screenshot は取得していない。`outputs/phase-11/screenshots/`
には既存 `pending-runtime-evidence.png` のみが存在し、本実行で新規 image は生成していない。

#### 復旧条件

1. user 環境で 1Password CLI に sign-in (`op signin`)
2. `.env` の op 参照が指す Cloudflare API Token item を 1Password に配置
3. token が当該 Cloudflare account の Workers / D1 / Pages 編集権限を保持
4. 上記 1-3 確認後に本タスクを再実行し、`bash scripts/cf.sh tail` を 30 分相当走らせる

上記が揃った状態で再実行することで AC-1〜AC-4 を PASS に置換可能。

