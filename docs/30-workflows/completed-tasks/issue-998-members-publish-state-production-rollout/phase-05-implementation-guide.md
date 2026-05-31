# Phase 5: 実装ガイド

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 05 |
| state | implemented_local_runtime_pending |
| implementation_mode | verify_existing + コード変更 1 点 |

## P50 チェック（skill 標準ルール）

**P50 判定: `implementation_mode = verify_existing`。** current branch に auto-publish policy / sync 統合 / backfill endpoint / diagnostics / ops scripts は親ワークフロー `members-not-displaying-form-sync-investigation`（`completed-tasks/` 配置・`implemented_local_runtime_pending`・Gate-A/B PASSED）で**既に実装済み・dev/main 反映済み**である。

→ よって **Phase 5 は新規実装ではなく、flag 変更（コード差分 1 点）+ 既実装の diff check / 回帰確認** を行う。新規モジュール・新規関数・新規 endpoint は一切作らない。

| 前提確認 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在 | Yes（flag 以外は実装済み） | 再実装しない |
| upstream にマージ済み | Yes（親 workflow は dev/main 反映済み） | 回帰確認のみ |
| 前提タスク完了 | Yes（親 Gate-A/B PASSED） | 依存解消タスク不要 |

## 変更ファイル一覧（FB-RT-03 必須）

### 新規作成ファイル

**なし**（本タスクは新規ファイルを作成しない）。

### 修正ファイル

| Task | Path | 種別 | 概要 |
| --- | --- | --- | --- |
| A | `apps/api/wrangler.toml` | 編集済み | `[env.production.vars]` の `MEMBERS_AUTO_PUBLISH_ON_CONSENT`（line 72）を `"false"` → `"true"`。直前コメント（line 70-71）を issue-998 production rollout 文脈へ更新 |

> 上記 1 ファイルが本サイクル（`03.実装.md`）の唯一のコード変更。Task B / Task C は runtime ops runbook であり、コード変更を伴わない（`apps/api` 配下は一切編集しない）。

## Task A: flag 変更（before / after diff）

### before（`apps/api/wrangler.toml` `[env.production.vars]` line 70-72 付近）

```toml
# members-not-displaying-form-sync-investigation Task B:
# production は default OFF。staging で安全性が確認できたら user-gated で切替。
MEMBERS_AUTO_PUBLISH_ON_CONSENT = "false"
```

### after

```toml
# issue-998-members-publish-state-production-rollout:
# production rollout enables auto-publish; deploy/backfill remain user-gated.
MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"
```

> staging（`[env.staging.vars]` line 162）は既に `"true"`。本変更で staging / production の flag が一致し drift がなくなる。

## 既実装回帰確認（verify_existing / コード変更なし）

flag 以外のコードは変更しない。current branch で以下が回帰なく green であることを **diff check / regression** として確認する（新規実装ではない）。

| 確認対象 | 正本ファイル | 確認 spec | 期待 |
| --- | --- | --- | --- |
| `decidePublishState` policy | `apps/api/src/lib/policies/auto-publish.ts` | `apps/api/src/lib/policies/auto-publish.spec.ts` | flag=false 現状維持 / hidden 維持 / public 維持 / member_only+consented → public |
| backfill endpoint | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` | `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` | dryRun default / admin override 保護 / batch UPDATE / idempotent |
| diagnostics contract | `apps/api/src/routes/admin/sync-diagnostics.ts`（+ `diagnostics/forms-pipeline.ts`） | `apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts` | snapshot fields（`visiblePublicCount` 等）と auth 境界 |
| sync 統合 | `apps/api/src/jobs/sync-forms-responses.ts` | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | flag 有効時に `decidePublishState` 適用 / flag=false 維持 regression |

## CONST_005 必須項目（Task A）

| 項目 | 内容 |
| --- | --- |
| 変更対象ファイル | `apps/api/wrangler.toml`（production `[env.production.vars]` flag 1 行 + コメント） |
| シグネチャ変更 | なし（既存関数・型は不変。新規シンボル追加なし） |
| 入力 | なし（静的 config 変更） |
| 出力 | production flag が `"true"`。staging / production drift なし |
| 副作用 | **このコード変更自体は runtime に即時影響しない**。production deploy（Task C）後に反映 |
| テスト | 新規 spec 追加なし。既実装 4 focused spec の回帰確認 + TOML 構文妥当性（deploy 時 `cf.sh` が検証） |
| 実行コマンド | 下記「ローカル実行・検証コマンド」 |
| DoD | Task A 仕様（`tasks/task-a-production-flag-enablement.md`）の DoD と一致 |

## ローカル実行・検証コマンド

```bash
# TOML diff 確認
git diff apps/api/wrangler.toml

# production flag が true になったこと / staging と一致を確認
rg -n 'MEMBERS_AUTO_PUBLISH_ON_CONSENT' apps/api/wrangler.toml

# 既実装回帰（verify_existing）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build
mise exec -- pnpm exec vitest run \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts
mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts

# ops script の構文チェック（変更しないが回帰確認）
bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh
```

## runtime ops（Task B / Task C）の扱い

- Task B（staging runtime 検証）/ Task C（production runtime rollout）は **user-gated runtime ops** であり、Cloudflare deploy + 本番 D1 mutation を伴う。
- **本サイクルでは実行しない。** runbook（`tasks/task-b-…` / `tasks/task-c-…`）として手順を確定するのみで、deploy / backfill apply / browser smoke の実行はユーザーの明示承認後に行う。
- 実行順序は直列強制: Task A（flag 変更）→ Task B（staging 検証 evidence）→ Task C（production rollout）。Task C は Task B の staging evidence で安全性が確認できた後にのみ実行する。

## 完了条件

- [x] 必須セクションが存在する。
- [x] P50 チェックで verify_existing を明記した。
- [x] 新規作成 / 修正ファイル一覧（FB-RT-03）を記載した。
- [x] flag の before/after diff と CONST_005 必須項目を網羅した。
- [x] runtime ops が user-gated・本サイクル実行外であることを明記した。

## 目的

implementation_mode=verify_existing に基づき、flag 1 行変更 + 既実装 diff check / 回帰確認の手順を、後続実装者が迷わない粒度で確定する。

## 実行タスク

1. `apps/api/wrangler.toml` の production flag を `"false"`→`"true"` へ変更する（唯一のコード変更、適用済み）。
2. 既実装 4 spec + typecheck + build の回帰を確認する。
3. runtime ops（Task B/C）は user-gated・本サイクル実行外であることを明記する。

## 参照資料

- `tasks/task-a-production-flag-enablement.md`
- `apps/api/wrangler.toml`

## 成果物

- 本 `phase-05-implementation-guide.md`（変更ファイル一覧・diff・回帰手順・CONST_005 項目）。

## 統合テスト連携

flag 変更は deploy 後の sync 時にのみ反映される。end-to-end の結合検証は Phase 11 の runtime smoke（user-gated）で実施する。
