# UT-09A-EXEC-STAGING-SMOKE-001: Execute 09a staging deploy smoke and Forms sync validation

## メタ情報

```yaml
issue_number: 339
task_id: UT-09A-EXEC-STAGING-SMOKE-001
task_name: Execute 09a staging deploy smoke and Forms sync validation
category: 改善
target_feature: 09a staging deploy smoke / Forms sync validation
priority: 高
scale: 中規模
status: 未実施
source_phase: Phase 12
created_date: 2026-05-01
dependencies: []
spec_path: docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md
```

| 項目 | 値 |
| --- | --- |
| ID | UT-09A-EXEC-STAGING-SMOKE-001 |
| タスク名 | Execute 09a staging deploy smoke and Forms sync validation |
| 優先度 | HIGH |
| 推奨Wave | Wave 9 |
| 状態 | open |
| 作成日 | 2026-05-01 |
| 検出元 | docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/unassigned-task-detection.md |

## 1. なぜこのタスクが必要か（Why）

### 背景

09a は Phase 1-12 の spec close-out として完了しているが、実 staging 環境での deploy smoke、UI visual smoke、Forms sync validation は `NOT_EXECUTED` のまま残っている。09c production deploy の前提にするには、placeholder ではなく実測証跡へ置換する必要がある。

### 問題点

`docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md` と `outputs/phase-12/implementation-guide.md` は実行手順と evidence contract を定義しているが、staging secret / Pages project / sync endpoint を使った実行結果は未取得である。

### 放置時の影響

09c production verification が staging の実測なしに進み、認証境界、管理画面、Forms sync、Workers log の問題を本番直前または本番後に検出するリスクが残る。

## 2. 何を達成するか（What）

### 目的

09a の spec close-out で `NOT_EXECUTED` として残した staging deploy smoke、UI visual smoke、Forms sync validation を実 staging 環境で実行し、09c production deploy の前提を実測証跡で満たす。

### ゴール

Phase 11 の `NOT_EXECUTED` placeholder を、Playwright / screenshot / sync audit / wrangler tail の実測 evidence に置換し、09c の blocker 状態を実測結果に基づいて更新する。

## スコープ

### 含む

- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md` の手順に沿った staging smoke 実行
- 公開、ログイン、プロフィール、管理画面、認可境界の screenshot / Playwright evidence 取得
- Forms schema / responses sync の実行と `sync_jobs` / audit evidence 取得
- `wrangler tail --env staging` 30 分相当のログ取得または redacted evidence 保存
- `outputs/phase-11/*` の `NOT_EXECUTED` placeholder を実測結果に置換
- `artifacts.json` と `outputs/artifacts.json` の parity 維持
- `references/task-workflow-active.md` と evidence inventory の実行済み状態への更新

### 含まない

- production deploy
- 09c production verification
- 新規 UI/API 機能追加
- Secret 値の文書化
- ユーザー承認なしの commit / push / PR 作成

## 3. どのように実行するか（How）

### 前提条件

- staging web / api の URL が利用可能であること
- staging の required secrets が設定済みであること（値は記録しない）
- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md` の手順を最新として扱うこと
- 09c production deploy は本タスク完了まで GO 判定しないこと

### 推奨アプローチ

1. required secrets の存在確認だけを先に行い、値は stdout / artifact に出さない。
2. UI smoke と Forms sync validation を分けて実行し、失敗時の原因範囲を狭める。
3. `NOT_EXECUTED` を PASS として扱わず、実 evidence path が存在する場合のみ完了にする。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `08b-parallel-playwright-e2e-and-ui-acceptance-smoke` | Playwright scaffold / delegated visual smoke |
| 上流 | `ut-27-github-secrets-variables-deployment` | GitHub / Cloudflare secrets availability |
| 上流 | `ut-28-cloudflare-pages-projects-creation` | staging deploy target availability |
| 上流 | `U-04 Sheets→D1 sync` | Forms sync endpoints / audit ledger |
| 下流 | `09c-serial-production-deploy-and-post-release-verification` | production deploy gate |

## 4. 実行手順

1. `phase-11.md` の staging smoke runbook と `outputs/phase-12/implementation-guide.md` の evidence contract を読む。
2. staging web / api の到達性、認証、管理画面、認可境界を確認し、screenshots / Playwright report / trace を保存する。
3. Forms schema / responses sync を staging で実行し、`sync_jobs` / audit dump を保存する。
4. `wrangler tail --env staging` 相当の redacted log を取得し、30 分相当の観測結果または実行不能理由を保存する。
5. `outputs/phase-11/*` の `NOT_EXECUTED` placeholder を実測結果に置換する。
6. `artifacts.json` と `outputs/artifacts.json` の parity、`references/task-workflow-active.md`、09c blocker 状態を更新する。

## 5. 完了条件チェックリスト

- [ ] Phase 11 の `NOT_EXECUTED` placeholder が実測 evidence に置換されている
- [ ] UI route / authz / admin route の screenshot または Playwright evidence が保存されている
- [ ] Forms schema / responses sync の実行結果が保存されている
- [ ] `wrangler-tail.log` に staging 実行ログまたは取得不能理由が保存されている
- [ ] `artifacts.json` と `outputs/artifacts.json` が一致している
- [ ] 09c の blocker 状態が実測結果に基づいて更新されている

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-204523-wt-4/docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md`
- 症状: 09a は Phase 1-12 が `completed` だが、Phase 11 の実 staging 証跡は `NOT_EXECUTED` であり、Phase 完了と実行完了を同一視しやすい。
- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-204523-wt-4/docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json`
- 症状: `workflow_state: spec_created` / `docsOnly: true` / `executionVisualEvidence: VISUAL_ON_EXECUTION` の組み合わせにより、root workflow は閉じず、実 staging evidence は後続タスクで消費する境界判断が必要だった。
- 参照: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-204523-wt-4/docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/unassigned-task-detection.md`

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| staging secret 不足で実行できない | 実行前に required secrets の存在だけを確認し、値は記録しない |
| placeholder を PASS と誤認する | `NOT_EXECUTED` を実 evidence に置換するまで完了不可 |
| screenshot に個人情報が含まれる | staging fixture / redaction ルールを使用し、必要なら画像をマスクする |
| sync 多重実行で 409 になる | `sync_jobs` と lock 状態を確認し、409 は evidence として記録して再実行判断する |
| 09c が先行する | 本タスク完了まで 09c の GO 判定を禁止する |

## 6. 検証方法

### 単体検証

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation
```

期待: artifacts parity と Phase 12 成果物検証が PASS する。

### 統合検証

1. `phase-11.md` の runbook に従って staging web / api を検証する。
2. Playwright report、screenshots、manual smoke log、sync job dump、wrangler tail log を保存する。
3. `outputs/phase-12/implementation-guide.md` と task workflow active state を実測結果に更新する。
4. `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation` を実行し、artifacts parity を含めて PASS させる。

## 必須証跡パス

| パス | 内容 |
| --- | --- |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/playwright-staging/` | screenshots / report / trace |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/manual-smoke-log.md` | 手動 smoke 結果 |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/sync-jobs-staging.json` | Forms sync job dump |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/wrangler-tail.log` | staging tail log |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json` | 実行後 phase state |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/artifacts.json` | root artifact mirror |

## 8. 参照情報

- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md`
- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 9. 備考

このタスクは production deploy を実行しない。09c は、本タスクで staging 実測 evidence が揃い、blocker 状態が更新された後に判断する。
