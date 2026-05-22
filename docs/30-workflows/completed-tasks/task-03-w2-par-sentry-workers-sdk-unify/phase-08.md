# Phase 8: CI / Governance

## 目的

本 task が CI gate（既存・新規）と branch protection / CODEOWNERS / diff scope 規律にどう適合するかを確定し、CI 失敗ポイントを事前に潰す。design-tokens gate との非干渉も明示する。

## 既存 CI gate との関係

| gate | 対象 | 本 task への影響 | 対応 |
| --- | --- | --- | --- |
| `verify-design-tokens`（task-18） | OKLch トークン直書き禁止 | 本 task は色トークンを触らない → **非干渉** | 干渉なきことを Phase 11 で grep 確認（`rg '#[0-9a-fA-F]\{3,6\}' apps/web/src/{instrumentation*,lib/sentry/**}` 0 件） |
| `verify-indexes-up-to-date`（CLAUDE.md） | `.claude/skills/aiworkflow-requirements/indexes` drift | 本 task は skill indexes を触らない | 触れない |
| `typecheck` / `lint` / `test` | apps/web 全般 | 本 task の追加コードは PASS 必須 | Phase 5 / Phase 6 で確保 |
| solo-dev branch protection | `required_pull_request_reviews=null` | レビュアー必須なし。CI gate で品質担保 | PR 作成時 `gh api repos/.../branches/dev/protection` で drift 確認（CLAUDE.md UT-GOV-001） |

## 新規 CI gate（追加検討）

| 提案 gate | 目的 | 実装案 | 配置先 |
| --- | --- | --- | --- |
| `verify-no-requestIdleCallback-in-worker` | Browser SDK が Workers bundle に推移混入していないことを CI で fail | `pnpm --filter @ubm-hyogo/web build && rg 'requestIdleCallback' apps/web/.open-next/ && exit 1 \|\| exit 0` | `.github/workflows/verify-sentry-runtime-split.yml`（新規） |
| `verify-no-nextjs-sentry-in-worker` | `@sentry/nextjs` / browser SDK 固有 token が Workers bundle に混入していないことを CI で fail | `pnpm --filter @ubm-hyogo/web build && rg '@sentry/nextjs\|replayIntegration\|captureRouterTransitionStart' apps/web/.open-next/worker.js && exit 1 \|\| exit 0` | 同上 |
| `verify-no-direct-sentry-dsn-env` | `process.env.SENTRY_DSN` 直接参照禁止 | `rg 'process\\.env\\.SENTRY_DSN' apps/web/src && exit 1 \|\| exit 0`（client の `NEXT_PUBLIC_SENTRY_DSN` は許容） | 同上 or 既存 lint gate に統合 |
| `verify-old-sentry-configs-removed` | 旧 `sentry.{client,server,edge}.config.ts` の混入禁止 | `find apps/web -maxdepth 2 -name 'sentry.*.config.*' -type f \| grep . && exit 1 \|\| exit 0` | 同上 |

> 新規 workflow の追加は本 task の implementation スコープ内（apps/web 限定の grep）に閉じるなら scope-in。CODEOWNERS で `.github/workflows/**` は `@daishiman` 自身。

## CODEOWNERS

CLAUDE.md governance より:

- `apps/web/**` → `@daishiman`
- `.github/workflows/**` → `@daishiman`

本 task の変更ファイル（F-01〜F-12）はすべて `apps/web/**` 配下。新規 CI gate 追加時は `.github/workflows/**` も `@daishiman`。solo-dev のため `require_code_owner_reviews` 無効でも文書化的に整合する。

## diff scope 規律（SCOPE.md §6）

PR 作成前必須確認:

```bash
git diff --name-only main...HEAD | sort -u
```

許可される範囲:

1. `apps/web/src/instrumentation.ts` / `instrumentation-client.ts`
2. `apps/web/src/lib/sentry/**`
3. `apps/web/src/lib/__tests__/sentry-capture.test.ts` / `apps/web/src/__tests__/instrumentation.test.ts`
4. `apps/web/sentry.{client,server,edge}.config.ts` の **削除**（`git rm`）
5. `apps/web/package.json` / `apps/web/pnpm-lock.yaml`（`@sentry/cloudflare` 追加 / 旧依存削除）
6. `apps/web/next.config.ts`（最小修正のみ）
7. `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/**`（本仕様書）
8. （任意）`.github/workflows/verify-sentry-runtime-split.yml`（新規 CI gate）

範囲外混入があれば、まず `git diff -- <path>` で内容を確認し、ユーザー変更の可能性がないことを確認する。復旧が必要な場合も、ユーザー承認後に非破壊な退避（別 branch / patch / stash）を作ってから対象 path を戻す。

## sync-merge / hook 挙動

CLAUDE.md「sync-merge 時の hook 挙動」より:

- `pre-commit staged-task-dir-guard`: merge commit 時は自動 skip
- `pre-push coverage-guard`: merge を含む push の `--changed` モードは自動 skip
- 本 task の通常 commit / push では hook を **skip しない**（`--no-verify` 使用禁止）

## 実行タスク（チェックリスト）

- [ ] design-tokens gate との非干渉を Phase 11 で grep 確認
- [ ] 新規 CI gate `verify-sentry-runtime-split.yml` 追加要否を Phase 13 で最終決定（本仕様書では追加候補として記述のみ）
- [ ] CODEOWNERS の `apps/web/**` カバレッジを確認
- [ ] PR 作成前に `git diff --name-only main...HEAD` を実行し scope 内であることを確認
- [ ] solo-dev branch protection drift を `gh api` で確認（CLAUDE.md UT-GOV-001 適用時）

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | CLAUDE.md governance、SCOPE.md §6、`.github/workflows/` 既存 |
| 出力 | CI gate 表、新規 gate 提案、diff scope 許容範囲表 |

## 参照資料

- `CLAUDE.md`「Governance / CODEOWNERS」「ブランチ戦略」「sync-merge」
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6
- `.github/workflows/verify-indexes.yml`（既存パターン参考）

## 成果物

- 本 phase-08.md（CI gate 表 / diff scope 許容範囲）
- `outputs/phase-08/main.md`（executed 時のみ）

## 完了条件（DoD）

- [ ] 既存 CI gate と本 task の関係表が確定
- [ ] 新規 CI gate 提案が grep ベースで実行可能な形で提示
- [ ] diff scope 許可範囲 8 件が列挙
- [ ] solo-dev branch protection ポリシーに整合

## 統合テスト連携

- CI gate 候補は Phase 11 の `grep-gate.log` と同じコマンド列から派生させる。
- `.github/workflows/verify-sentry-runtime-split.yml` を追加する場合も、task-02 の wrangler env 注入とは分離し、Sentry runtime split の grep / build だけを検証対象にする。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 8
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
