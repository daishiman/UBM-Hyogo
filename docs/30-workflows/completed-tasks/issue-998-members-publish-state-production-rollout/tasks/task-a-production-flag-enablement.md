# Task A — Production flag enablement + 既実装回帰確認

`[実装区分: 実装仕様書 / implementation_mode: 新規コード変更 1 点 + verify_existing]`

## 目的

根本問題の真の解決のため、production の `MEMBERS_AUTO_PUBLISH_ON_CONSENT` を `false`→`true` へ切り替える。あわせて親ワークフローでローカル実装済みの auto-publish policy / diagnostics / backfill が current コードで回帰なく機能することを確認する。

## 変更対象ファイル（コード変更）

| パス | 変更種別 | 変更内容 |
|------|---------|---------|
| `apps/api/wrangler.toml` | 編集 | `[env.production.vars]` の `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "false"`（line 72 付近）を `"true"` へ変更。直前のコメント（line 70-71）を「staging 安全性確認後に user-gated で切替 → issue-998 で切替済み」へ更新 |

### 変更前後（diff 方針）

```toml
# 変更前（apps/api/wrangler.toml [env.production.vars]）
# members-not-displaying-form-sync-investigation Task B:
# production は default OFF。staging で安全性が確認できたら user-gated で切替。
MEMBERS_AUTO_PUBLISH_ON_CONSENT = "false"

# 変更後
# issue-998-members-publish-state-production-rollout:
# production rollout enables auto-publish; deploy/backfill remain user-gated.
MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"
```

> **重要**: flag を `true` にしても、それは **deploy 後の新規/更新 sync 時にのみ**既存の `member_only` を `public` へ昇格する。既に存在する record は Task C の backfill apply を実行しない限り変わらない。flag 変更（Task A）と backfill（Task C）は両輪。

## 既実装の回帰確認（verify_existing / コード変更なし）

flag 変更以外のコードは親ワークフローで実装済み。current ブランチで以下が回帰なく green であることを確認する（実装ではなく diff check / regression）。

| 確認対象 | 確認方法 | 期待 |
|---------|---------|------|
| `decidePublishState` policy | `apps/api/src/lib/policies/auto-publish.spec.ts` | flag=false→現状維持 / hidden 維持 / public 維持 / member_only+consented→public 昇格 |
| backfill endpoint | `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` | dryRun default / admin override 保護 / batch UPDATE |
| diagnostics contract | `apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts` | snapshot fields（`visiblePublicCount` 等）を返す |
| sync 統合 | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | flag 有効時に `decidePublishState` を適用 |

## 入力 / 出力 / 副作用

- 入力: なし（静的 config 変更）。
- 出力: `apps/api/wrangler.toml` の production flag が `"true"`。
- 副作用: **このコード変更自体は runtime に即時影響しない**。production deploy（Task C）後に初めて反映される。

## テスト方針

- 新規テストファイルは追加しない（flag は config であり挙動は既存 spec で網羅済み）。
- 回帰確認として `apps/api` の focused tests を実行する。
- `wrangler.toml` の TOML 構文妥当性を deploy 前 dry validation で確認する（Task C deploy 時に `cf.sh deploy` が検証）。

## ローカル実行・検証コマンド

```bash
# TOML diff 確認
git diff apps/api/wrangler.toml

# 既実装回帰（verify_existing）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build
mise exec -- pnpm exec vitest run \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts
mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts

# production flag が true になったことを確認
rg -n 'MEMBERS_AUTO_PUBLISH_ON_CONSENT' apps/api/wrangler.toml
```

## DoD（Definition of Done）

- [ ] `apps/api/wrangler.toml:72` 付近の production `MEMBERS_AUTO_PUBLISH_ON_CONSENT` が `"true"`。
- [ ] コメントが issue-998 production rollout の文脈に更新されている。
- [ ] `pnpm --filter @ubm-hyogo/api typecheck` / `build` が exit 0。
- [ ] 4 focused spec が green。
- [ ] staging flag（`"true"`）と production flag（`"true"`）が一致し、drift がないことを `rg` で確認。
- [ ] commit / push は行わない（user-gated）。
