# Phase 13: PR 作成

> 本 Phase は **後続実行サイクル** で commit / push / PR 作成を行うための仕様。
> 本仕様書作成サイクルでは commit / push / PR 作成 / 実 secret 投入 / 実 staging deploy を **実行しない**（CONST_002 / NFR-4）。

## 1. PR スコープ

PR は以下を 1 サイクルにまとめる:

- env schema 拡張（`apps/web/src/lib/env.ts`）
- wrangler.toml staging / production vars 追加
- `.dev.vars.example` op 参照追記
- 単体テスト追加（`env.test.ts`）
- parent task-03 状態昇格（`task-03-w2-par-sentry-workers-sdk-unify.md`）
- aiworkflow-requirements references / LOGS 同期
- 本ワークフロー全 phase ファイル + outputs/phase-{1..13}/main.md + evidence

## 2. base / branch

- base: `dev`（CLAUDE.md ブランチ戦略）
- branch: `feat/issue-559-sentry-staging-runtime-evidence`

## 3. commit 戦略

| commit | 対象 | 備考 |
| --- | --- | --- |
| 1 | env schema + wrangler vars + .dev.vars.example + 単体テスト | コード差分 |
| 2 | runtime evidence ファイル + parent task-03 状態昇格 | runtime evidence wave |
| 3 | aiworkflow-requirements 同期 + 本ワークフロー Phase 12 outputs | docs wave |

> 単一 commit にまとめても可。重要なのは hook（lefthook）通過、`--no-verify` 不使用。

## 4. PR 本文テンプレ

```
## Summary
- task-03 PASS_BOUNDARY_SYNCED_RUNTIME_PENDING → VERIFIED 昇格
- staging Sentry runtime evidence（curl 200 + dashboard event server/browser 各 1 件以上 + grep gate 0 件）取得
- env schema 5 キー追加（SENTRY_DSN_WEB ほか）

## Test plan
- [x] pnpm --filter @ubm-hyogo/web typecheck
- [x] pnpm --filter @ubm-hyogo/web lint
- [x] pnpm --filter @ubm-hyogo/web test （env.test.ts 含む）
- [x] pnpm --filter @ubm-hyogo/web build
- [x] cf.sh secret list --env staging で name のみ確認
- [x] cf.sh deploy --env staging 成功 / version id 記録
- [x] curl `/` / `/(public)/members` 200
- [x] Sentry dashboard environment:staging で server / browser event 各 1 件以上
- [x] rg requestIdleCallback apps/web/.open-next/ → 0 件
- [x] rg @sentry/nextjs apps/web/.open-next/ → 0 件
- [x] DSN leak scan 0 件
- [x] 一時 throw revert 確認

Refs #559（runtime G0〜G5 と state 昇格が同一 PR で完了した場合のみ `Closes #559` に変更）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 5. PR 作成前最終チェック

```bash
git status --porcelain                                 # 空
git diff dev...HEAD --name-only                        # 期待ファイル一覧
rg -n 'https://.*@.*[.]ingest[.]sentry[.]io' .          # 0 件
rg -n 'force_error' apps/web/src/                       # 0 件
```

## 6. CONST_002 順守

- commit / push / PR / 実 secret 投入 / 実 staging deploy / 実 Sentry dashboard 観測は **本仕様書作成サイクルでは実施しない**
- 後続実行サイクルで G1〜G5 全 PASS 後、owner 明示承認を得てから実施する

## 7. DoD（Phase 13 完了条件）

- [ ] PR が `dev` をベースに作成され、URL 取得済
- [ ] CI 必須チェック PASS（typecheck / lint / test / build / verify-design-tokens / verify-indexes-up-to-date / その他）
- [ ] PR body に 13 phase 仕様書と Phase 11 evidence への参照あり
- [ ] PR merge 後、本ワークフロー root の `workflow_state` を `completed` に書き換える別 commit を別サイクルで作成（completed-tasks への移動は CLAUDE.md / completed-tasks-policy に従う）
