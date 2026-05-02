# ut-09a-exec-staging-smoke-001

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | Wave 9 |
| mode | parallel |
| owner | - |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/339 (CLOSED, keep closed) |
| task_id | UT-09A-EXEC-STAGING-SMOKE-001 |

## purpose

09a `09a-parallel-staging-deploy-smoke-and-forms-sync-validation` の spec close-out で
`NOT_EXECUTED` placeholder として残された staging deploy smoke / UI visual smoke /
Forms sync validation を、実 staging 環境での実測 evidence へ置換し、09c
production deploy の前提条件を実測で満たす。Phase 11 placeholder を
Playwright report / screenshot / sync audit / `bash scripts/cf.sh` 経由 tail の実測成果に書き換え、
09c blocker 状態を実測結果に基づいて更新する。

## why this is not a restored old task

このタスクは 09a 本体（spec）タスクの復活ではなく、09a Phase 12 の
`unassigned-task-detection.md` で formalize された「実 staging 実行」だけを
責務とする follow-up である。09a が固定した runbook / evidence contract /
artifacts parity 規約は変更しない。本タスクは Phase 11 evidence を `NOT_EXECUTED`
から実測結果に置換し、09c の GO/NO-GO 判断を実測に固定する。

## scope in / out

### Scope In

- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md` の runbook に従う staging smoke 実行
- 公開ルート / ログイン / プロフィール / 管理画面 / 認可境界の screenshot または Playwright evidence 取得
- Forms schema / responses sync の staging 実行と `sync_jobs` / audit dump の取得
- `bash scripts/cf.sh` 経由の staging tail 30 分相当 redacted log 取得（取得不能時は理由を保存）
- 09a 配下 `outputs/phase-11/*` の `NOT_EXECUTED` placeholder を実測結果に置換
- 09a `artifacts.json` と `outputs/artifacts.json` の parity 維持
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` の状態更新
- 09c blocker 状態の更新（実測結果 PASS / FAIL に基づく）

### Scope Out

- production deploy（09c の責務）
- 09c production verification
- 新規 UI / API 機能の追加
- staging secret 値そのものの記録・文書化
- 09a runbook 自体の改変（不可避な誤りは別タスクで起票）
- ユーザー明示指示なしの commit / push / PR 作成

## dependencies

### Depends On

- 08b-parallel-playwright-e2e-and-ui-acceptance-smoke（Playwright scaffold / delegated visual smoke）
- ut-27-github-secrets-variables-deployment（GitHub / Cloudflare secrets）
- ut-28-cloudflare-pages-projects-creation（staging deploy target）
- U-04 Sheets→D1 sync（Forms sync endpoints / audit ledger）

### Blocks

- 09c-serial-production-deploy-and-post-release-verification（production deploy gate）

## refs

- docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md
- https://github.com/daishiman/UBM-Hyogo/issues/339
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md (実行 runbook 正本)
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/implementation-guide.md (evidence contract)
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/unassigned-task-detection.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
- apps/web/wrangler.toml
- apps/api/wrangler.toml
- scripts/cf.sh
- scripts/with-env.sh

## AC

- AC-1: `outputs/phase-11/*` の `NOT_EXECUTED` placeholder が実測 evidence path に置換されている
- AC-2: 公開ルート / ログイン / プロフィール / 管理画面 / 認可境界の screenshot または Playwright report / trace が `outputs/phase-11/playwright-staging/` 配下に保存されている
- AC-3: Forms schema / responses sync の staging 実行結果が `outputs/phase-11/sync-jobs-staging.json` に保存され、`sync_jobs` ledger と整合する
- AC-4: `outputs/phase-11/wrangler-tail.log` に `bash scripts/cf.sh` 経由の staging tail log（または取得不能理由）が保存されている
- AC-5: 09a 直下 `artifacts.json` と `outputs/artifacts.json` が一致しており、Phase 11 status が実測結果に更新されている
- AC-6: 09c の blocker 状態が実測 PASS / FAIL に基づき `references/task-workflow-active.md` で更新されている

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
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

`spec_created` 時点では Phase 11 runtime evidence は未実行であり、`outputs/phase-11/`
配下の runtime evidence は実行後に実体化する。Phase 12 の 7 固定成果物は仕様準拠の
ため spec 作成段階でも実体を配置する。

## invariants touched

- 09a で固定した runbook / evidence contract / artifacts parity 規約を変更しない
- staging secret 値を stdout / artifact / log に記録しない（存在確認のみ）
- Cloudflare CLI は `bash scripts/cf.sh` 経由で扱い、直接 `wrangler` 実行を正本手順にしない
- `NOT_EXECUTED` を PASS と扱わない
- staging 実 evidence なしに 09c production deploy を進めない
- screenshot / log には個人情報が含まれないよう redaction を行う

## completion definition

全 phase 仕様書（phase-01〜phase-13）が揃い、Phase 11 evidence contract と
Phase 12 close-out の 7 成果物が定義され、09a 配下 evidence path 更新ルールと
09c blocker 更新条件、ユーザー承認 gate（commit / push / PR）が明確であること。
本仕様書作成では実 staging 実行・commit・push・PR を行わない。

## issue 連携

- Issue #339 はクローズド状態のままタスク仕様書を作成する（再オープンしない）
- spec-created 段階では Issue 状態を変更しない
- 実 staging 実行・PR 作成時に必要であればユーザーが明示的に指示する
