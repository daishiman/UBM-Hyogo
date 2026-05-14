# Phase 3: タスク分解と俯瞰

## サブタスク分解（CONST_007: 1 サイクル内完了）

| ID | タイトル | 依存 | 並列性 | 想定差分行数 |
|----|---------|------|--------|-------------|
| task-01 | web-cd workflow の secret 名を実 Environment に整合させる | なし | task-02 と並列 | YAML 約 +12 / -2 |
| task-02 | staging-runtime-smoke env の readiness gate と secret provisioning runbook | なし | task-01 と並列 | YAML 約 +14 / -0、runbook 新規 |

両タスクとも 1 PR で同梱可能。先送り対象なし。

## モジュール俯瞰（実装着手者向け地図）

```
.github/workflows/
├── web-cd.yml                    [task-01: line 22, 56 と pre-check step 2 箇所]
├── runtime-smoke-staging.yml     [task-02: mask credentials の直前に pre-check 1 ブロック追加]
└── backend-ci.yml                [変更なし。runtime-smoke-staging を workflow_call で呼ぶだけ]

scripts/
├── cf.sh                         [変更なし。既存 CF_SH_SKIP_WITH_ENV 分岐をそのまま利用]
└── smoke/runtime-attendance-provider.sh
                                  [変更なし。pre-check で先に止めるので line 57 fail には到達しなくなる]

docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/
├── index.md                      [作成済み]
├── outputs/phase-{1,2,3}.md      [作成済み]
├── runbooks/secret-provisioning.md [task-02 で新規作成]
└── task-{01,02}/phase-1..13.md   [本 phase 完了後に作成]
```

## 検証コマンド俯瞰

| 目的 | コマンド |
|---|---|
| YAML lint | `mise exec -- pnpm exec actionlint .github/workflows/web-cd.yml .github/workflows/runtime-smoke-staging.yml`（actionlint 配置済みの前提） |
| ローカル wrangler deploy 流し込み模擬（実行はしない・dry-check のみ） | `bash -n scripts/cf.sh && bash -n scripts/smoke/runtime-attendance-provider.sh` |
| GitHub Environment secret 走査 | `gh api "repos/daishiman/UBM-Hyogo/environments/<env>/secrets" --jq '.secrets[].name'` |
| dev push 後の実 CI 結果確認 | `gh run watch <run-id>` または `gh run view --log-failed <run-id>` |

## DoD（タスク横断）

- [ ] `task-01` `task-02` 両 PR 含む差分が `dev` push 後の `web-cd` / `runtime-smoke-staging` CI の失敗原因を解消する（または readiness 不足を明示 fail に変換し、必要 secret 一覧をログに出す）
- [ ] secret 実値はリポジトリ・コミットメッセージ・PR 本文に一切残らない
- [ ] runbook がユーザー単独で secret 投入できる粒度（コマンド逐語 + 取得元）になっている
