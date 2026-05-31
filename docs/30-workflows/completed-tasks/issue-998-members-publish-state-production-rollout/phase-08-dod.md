# Phase 8: DoD (Definition of Done)

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 08 |
| state | implemented_local_runtime_pending |
| implementation_mode | verify_existing + コード変更 1 点 |

## 目的

Task A（production flag enablement + 既実装回帰確認）/ Task B（staging runtime 検証）/ Task C（production runtime rollout）を横断する完了条件を、コード変更・既実装回帰・staging runtime evidence・production runtime evidence・secret 非混入・user-gated 操作（commit/push/PR を実行しないこと）に分離して固定する。

## 実行タスク

- 各 DoD ブロックを Task A/B/C と Gate-A/B/C に対応付ける。
- runtime ブロック（Task B/C）は user-gated として「本サイクルで実行しない」ことを明記する。

## 参照資料

- 依存 Phase: [phase-01-requirements.md](phase-01-requirements.md) / Phase 1, [phase-02-architecture.md](phase-02-architecture.md) / Phase 2, [phase-05-implementation-guide.md](phase-05-implementation-guide.md) / Phase 5, [phase-06-test-strategy.md](phase-06-test-strategy.md) / Phase 6, [phase-07-quality-gates.md](phase-07-quality-gates.md) / Phase 7
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。

## コード変更の DoD（Task A / Gate-B）

- [x] `apps/api/wrangler.toml` の `[env.production.vars]` `MEMBERS_AUTO_PUBLISH_ON_CONSENT` が `"false"`→`"true"` に変更されている（line 72 付近）。
- [x] 付随コメントが issue-998 production rollout の文脈（deploy/backfill user-gated）に更新されている。
- [x] `git diff apps/api/wrangler.toml` が当該 flag 値とコメントのみの変更で、他 env / 他 var に波及していない。
- [x] staging flag（line 162 付近）と production flag（line 72 付近）がともに `"true"` で drift がない（`rg -n 'MEMBERS_AUTO_PUBLISH_ON_CONSENT' apps/api/wrangler.toml` で確認）。
- [x] 新規 test ファイル・新規シンボルを追加していない。

## 既実装回帰の DoD（Task A / Gate-B）

- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` が exit 0。
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api build` が exit 0。
- [x] 4 focused spec を含む API regression suite が green:
  - `apps/api/src/lib/policies/auto-publish.spec.ts`
  - `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts`
  - `apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts`
  - `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`
- [ ] `bash scripts/verify-pr-ready.sh` が pass（docs-only / spec gate の pre-flight）。
- [x] 既存 spec の挙動が変化していない（flag=false fixture は従来通り `member_only` 維持、flag=true で `member_only + consented → public` 昇格）。

## staging runtime evidence の DoD（Task B / Gate-C・user-gated）

- [ ] staging deploy 成功（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`）。
- [ ] `staging-diagnose-pre.json` / `staging-diagnose-post.json` を `outputs/phase-11/` に保存し、secret 非混入。
- [ ] `staging-backfill-dry-run.json` の `candidates` / `skipped` breakdown を確認済み。
- [ ] approval marker（`outputs/phase-13/user-approval-staging-<timestamp>.md`）作成後にのみ apply 実行。
- [ ] `staging-backfill-apply.json` の `applied` が dry-run `candidates` と整合。
- [ ] `diagnose-post` の `visiblePublicCount` が増加（または 0 件根拠を `staging-gate-c-summary.md` に記録）。
- [ ] `skipped.adminExplicit`（admin override された hidden member）が apply 後も hidden を維持していることを spot check。
- [ ] `staging-members-before.png` / `staging-members-after.png` を保存し、after で public member が 1 件以上表示。

## production runtime evidence の DoD（Task C / Gate-C・user-gated）

- [ ] Task B（staging）evidence で安全性が確認済みであること（前提）。
- [ ] production D1 backup を apply 前に取得（`prod-backup-<timestamp>.sql`、リポジトリにコミットせず path のみ summary 記録）。
- [ ] production deploy 成功（version id を summary に記録）。
- [ ] `prod-diagnose-pre.json` / `prod-diagnose-post.json` を保存し secret 非混入。
- [ ] dry-run（`prod-backfill-dry-run.json`）→ approval marker（`outputs/phase-13/user-approval-production-<timestamp>.md`）→ apply（`prod-backfill-apply.json`）の順序を厳守。
- [ ] `applied` が dry-run `candidates` と整合し、staging 実績と矛盾しない比率。
- [ ] admin override された hidden member が apply 後も hidden を維持（spot check）。
- [ ] `prod-members-before.png` / `prod-members-after.png` を保存し、after で表示復旧。
- [ ] rollback 手順を `prod-rollout-summary.md` に明記。

## secret 非混入の DoD（全 Task 共通）

- [ ] 各 evidence JSON / log / summary を `outputs/phase-11`・`outputs/phase-13` に保存後、`rg 'SYNC_ADMIN_TOKEN|CLOUDFLARE_API_TOKEN|<token-prefix>' outputs/phase-11 outputs/phase-13` がゼロ件。
- [ ] D1 backup SQL をリポジトリにコミットしていない（path のみ記録）。
- [ ] コマンド中の token は `<redacted>` 表記で記載し、実値を仕様書・evidence に転記していない。

## user-gated 操作の DoD（実行しないこと）

- [ ] commit / push を**実行していない**（本サイクルは仕様書作成 + flag 変更まで。コミットは user 承認後）。
- [ ] PR を**作成していない**。
- [x] GitHub Issue #998 は **CLOSED**。PR 文脈は `Refs #998` のみとし、Issue state mutation は行わない。
- [ ] staging / production の deploy・D1 backfill apply・browser smoke を本サイクルでは**実行していない**（runbook 確定のみ）。

## ドキュメント DoD

- [ ] Phase 11 evidence inventory が runtime 取得物（diagnose JSON / backfill レスポンス / before/after screenshot / summary）の path を列挙している。
- [x] artifacts.json の gate metadata（Gate-A/B passed / Gate-C pending）が整合。
- [ ] Phase 13 commit/PR draft が user 承認待ちとして確定している。

## 統合テスト連携

DoD のうち runtime evidence（staging/production smoke）は Phase 11 の end-to-end 結合検証に対応する。ローカル DoD（flag/回帰）は Phase 10 で完結する。
