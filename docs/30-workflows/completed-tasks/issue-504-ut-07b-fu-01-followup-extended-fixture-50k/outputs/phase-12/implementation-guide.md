# Phase 12 Implementation Guide

## Part 1: 中学生レベルの説明

このタスクは、50,000 件の練習用データを作って、「たくさんの入力が来ても処理が止まらないか」を本番ではない練習場所で確かめるためのものです。

たとえるなら、学校の避難訓練です。本当の火事を起こすのではなく、練習用の合図と決められた順路で、人数が多くても安全に動けるかを確認します。このタスクでも、本物の個人情報は使わず、練習用データだけを使います。本番のデータ置き場には入れないよう、スクリプトと API の両方で止めます。

| 用語 | 中学生向けの意味 | セルフチェック |
| --- | --- | --- |
| fixture | テスト用に作る練習データ | 本物のメールアドレスや秘密情報を入れない |
| staging | 本番前に試す練習場所 | `production` ではなく `staging` だけを使う |
| production | 実際の利用者が使う本番場所 | bulk INSERT / DELETE は禁止 |
| back-fill | あとから足りない情報を埋める処理 | 途中で止まったら再開できるか見る |
| evidence | 実行結果の証拠 | 10 回分の数値を JSON として残す |

## Part 2: 技術者向け

実装対象は `scripts/schema-alias-backfill/` 配下の fixture 生成、staging seed、cleanup、10 trial driver、vitest / bats / shellcheck gate、および `apps/api/src/routes/admin/schema.ts` の staging-only trigger endpoint である。`generate-50k-fixture.ts` は counter based な deterministic row generation を使い、`dedupe_key` 重複ゼロと synthetic data 性をテストで固定する。`seed-staging-50k.sh` / `cleanup-staging-50k.sh` は `scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote` のみに閉じ、production 引数または production 環境を検出した時点で fail closed する。

Runtime evidence は user approval 後に `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/extended-fixture-50k-evidence.md` へ記録する。Phase 11 の状態語彙は、local spec / script contract が揃っているが staging trial 未実行の場合 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とし、単独 `PASS` と runtime 未実行を混同しない。

## Required Commands

```bash
pnpm -w exec vitest run scripts/schema-alias-backfill/__tests__/generate-50k-fixture.test.ts
pnpm exec vitest run apps/api/src/routes/admin/schema.test.ts
pnpm schema-alias-backfill:test
bats scripts/schema-alias-backfill/__tests__/seed-staging-50k.bats
shellcheck scripts/schema-alias-backfill/*.sh
pnpm typecheck
pnpm lint
```

## Dependency Notes

- Parent gate: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md`
- Parent unassigned detection: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
- SSOT: `.claude/skills/aiworkflow-requirements/references/schema-alias-backfill-runbook.md`
