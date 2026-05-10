# Workflow: ci-pipeline-recovery-web-cd-and-runtime-smoke

## 目的

`Merge pull request #612` 直後の CI run で同時失敗した 2 ジョブを今回サイクル内に復旧する。

| ジョブ | エラー | 根因 | 修正対象 |
|--------|--------|------|----------|
| `web-cd / deploy-staging` | `Pages only supports files up to 25 MiB`（`cache/webpack/client-production/0.pack` = 93.8 MiB） | workflow が `wrangler pages deploy .next` を呼び続けており、CLAUDE.md 正本（Cloudflare Workers + `@opennextjs/cloudflare`）から逸脱 | `.github/workflows/web-cd.yml` |
| `backend-ci / runtime smoke staging / smoke` | `STAGING_API_BASE: STAGING_API_BASE is required` → 後続 `summary.json not found` | environment `staging-runtime-smoke` に environment-scoped secrets が 0 件 | `.github/workflows/runtime-smoke-staging.yml` + 1Password → `gh secret set --env staging-runtime-smoke` 投入 |

## スコープ

- **含む**: 上記 2 ファイル群の仕様書、実装手順、DoD、実ファイル反映、Phase 12 close-out evidence
- **含まない**: commit、push、PR 作成、secret 実値の投入、runtime staging smoke 実行（外部状態変更のため user approval 後）

## 正本順位

1. 本 workflow の `design/phase-{01,02,03}.md`
2. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（特に Issue #571 section, lines 150-167）
3. ルート `CLAUDE.md`（`apps/web` env アクセス不変条件、Cloudflare 系 CLI 実行ルール）
4. 既存先行仕様書:
   - `docs/30-workflows/UT-GOV-006-web-deploy-target-canonical-sync.md`
   - `docs/30-workflows/ut-06-followup-A-opennext-workers-migration.md`
   - `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-11.md`

## 構成

```
ci-pipeline-recovery-web-cd-and-runtime-smoke/
├── index.md                                                  # 本ファイル
├── design/
│   ├── phase-01-context.md                                   # 現状・エラー・既存仕様の事実整理
│   ├── phase-02-requirements.md                              # 要件・スコープ・成功基準・不変条件
│   └── phase-03-architecture.md                              # 統合設計・タスク間依存・正本同期
└── tasks/
    ├── task-01-web-cd-opennext-workers-migration/
    │   ├── index.md                                          # Phase 1-13（実装仕様書）
    │   └── outputs/{phase-11,phase-12}/                      # evidence 置き場（実装サイクルで埋める）
    └── task-02-staging-runtime-smoke-secrets-provisioning/
        ├── index.md                                          # Phase 1-13（実装仕様書）
        └── outputs/{phase-11,phase-12}/
```

## タスク一覧

| Task ID | 実装区分 | 並列性 | 1 サイクル内完了 |
|---------|---------|--------|------------------|
| task-01 | 実装（YAML 編集） | 並列可（task-02 と独立） | ✅ local 実装完了 / runtime deploy pending user approval |
| task-02 | 実装（YAML 編集 + secrets 投入 script） | 並列可（task-01 と独立） | ✅ local 実装完了 / secret 投入 pending user approval |

> CONST_007 適合: repository 内の実ファイル反映は今回サイクル内で完了。secret 実値投入と runtime smoke は外部状態変更を伴うため Phase 13 user gate に残し、PASS evidence と混同しない。

## 不変条件

- `apps/web` の D1 直アクセス禁止は維持（task-01 はデプロイ先のみ変更）
- `wrangler` 直接呼び出し禁止 → `scripts/cf.sh deploy` ラッパー経由を CI でも踏襲
- secret 値・token fragment を docs / logs / artifacts に転記しない
- `.env` を `cat` / `Read` / `grep` しない（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）
