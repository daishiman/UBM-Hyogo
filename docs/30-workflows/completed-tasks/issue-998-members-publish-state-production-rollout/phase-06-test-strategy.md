# Phase 6: テスト戦略

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 06 |
| state | implemented_local_runtime_pending |
| implementation_mode | verify_existing + コード変更 1 点 |

## 6.1 新規テストを追加しない方針と根拠

本タスクは **新規テストファイルを追加しない**。根拠は以下:

1. 唯一のコード変更は `apps/api/wrangler.toml` の flag 1 行（`"false"` → `"true"`）であり、**config 値変更**である。実行時挙動はすべて既存実装が握り、その挙動は既存 spec が網羅済み。
2. `parseAutoPublishFlag` の `flagEnabled` 分岐（true / false）は `auto-publish.spec.ts` の truth table と `sync-forms-responses.contract.spec.ts` の flag true/false regression で既にカバーされている。flag 値が `"true"` になっても新たに検証すべきコードパスは増えない。
3. 不変条件 #2（D1 schema / endpoint surface 不変）により新規ロジックを足さないため、新規ユニットテスト対象が存在しない。
4. flag の妥当性は TOML 構文検証（deploy 前 dry validation）と既実装 4 spec の回帰で十分に担保される。
5. runtime レベルの正しさ（実 D1 での昇格・可視化）は spec ではなく runtime smoke（Task B / Task C・user-gated）で実証する。これは本番 D1 mutation を伴うため自動テスト化しない。

## 6.2 回帰確認する 4 focused spec

flag 以外のコードは不変。current branch で以下 4 spec が回帰なく green であることを確認する。

| spec | 正本実装 | カバー範囲 | expected result |
| --- | --- | --- | --- |
| `apps/api/src/lib/policies/auto-publish.spec.ts` | `lib/policies/auto-publish.ts` | `decidePublishState` 遷移表全 7 ケース（flag=false 現状維持 / hidden 維持 / public 維持 / member_only+consented→public / member_only+declined→member_only / member_only+unknown→member_only / override→現状維持）、`isAdminOverrideStatus`、`normalizePublishState`/`normalizeConsentValue` | 全ケース PASS（昇格は member_only+consented+非override のみ） |
| `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` | `routes/admin/sync-backfill-publish-state.ts` | `runBackfillPublishState` の dryRun default（applied=0）/ candidates 計上 / `skipped.{alreadyPublic,adminExplicit,consentNotMet,deleted}` 分類 / batch UPDATE（`system:backfill`）/ idempotent 再実行 / 非 admin token 拒否 | 全ケース PASS（dry-run で UPDATE せず、apply で candidates 件数のみ UPDATE） |
| `apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts` | `routes/admin/sync-diagnostics.ts` + `diagnostics/forms-pipeline.ts` | snapshot fields（`visiblePublicCount` / `publishStateBreakdown` / `publicConsentBreakdown` / `lastSuccessfulSyncAt` / `totals`）の形・`requireSyncAdmin` auth 境界 | PASS（必須 field を返し、非 admin は拒否、secret 値は返さない） |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | `jobs/sync-forms-responses.ts` | flag=false 時 `member_only` 維持の regression / flag=true + consented + 非 override で `public` 昇格（`updated_by='system:sync'`）/ admin override 時スキップ | PASS（flag 値で昇格挙動が切り替わる） |

### 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build
mise exec -- pnpm exec vitest run \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts
mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts
```

## 6.3 TOML 構文妥当性検証

| 検証 | 手段 | expected result |
| --- | --- | --- |
| `wrangler.toml` 構文 | `git diff apps/api/wrangler.toml` で変更が flag 値 + コメントのみであることを目視確認 | 変更行は `MEMBERS_AUTO_PUBLISH_ON_CONSENT` と直前コメントのみ |
| flag 値の正しさ | `rg -n 'MEMBERS_AUTO_PUBLISH_ON_CONSENT' apps/api/wrangler.toml` | staging / production とも `"true"`（drift なし） |
| deploy 時 TOML validation | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>`（Task B/C で wrangler が構文検証） | deploy が TOML parse error を出さない |

## 6.4 runtime smoke 検証ケース（Task B / Task C・user-gated）

実 D1 / 実環境での正しさは runtime smoke で実証する。本サイクルでは検証ケースを確定するのみで実行は user-gated。

| ケース | 検証内容 | 手段 | expected result |
| --- | --- | --- | --- |
| dry-run / apply 件数整合 | `backfill apply` の `applied` が直前 dry-run の `candidates` と一致 | `backfill-publish-state.sh --env <env> --dry-run` → `--apply` の JSON 比較 | `applied == candidates`（dry-run 時）。乖離大なら中止しエスカレーション |
| admin override 保護 | hidden / 非 `system:` updated_by の member が apply 後も hidden を維持 | dry-run の `skipped.adminExplicit` 件数確認 + apply 後 spot check | override member は公開されない（不変条件 #4） |
| `visiblePublicCount` 増加 | backfill apply 後に公開可視会員数が増える（または 0 件根拠を summary 記録） | `diagnose-members-pipeline.sh --env <env>` の pre / post 比較 | `post.visiblePublicCount >= pre.visiblePublicCount`（昇格対象があれば増加） |
| `/members` browser smoke | 公開ページに会員が 1 件以上表示 | staging / production `/members` の before / after screenshot + DevTools Network 200 | after で public member が表示される（UI 空のままなら別原因を follow-up 化） |
| redaction grep | evidence JSON / log に secret 非混入 | `rg 'SYNC_ADMIN_TOKEN' outputs/phase-11`（保存後） | ヒット 0 件（不変条件 #5） |
| idempotent 再実行（任意） | apply を再実行しても二重昇格しない | `--apply` 再実行 | `applied=0`（昇格済みは `skipped.alreadyPublic`） |

## 6.5 既存テスト regression（不変条件）

- `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` の flag=false default ケースが緑のまま維持されること（flag 変更は production env のみで spec の default 値に影響しない）。
- 公開フィルタ（`apps/api/src/_shared/public-filter.ts` / `repository/publicMembers.ts` の `publish_state = 'public'` 条件）の既存契約に変更がないこと（不変条件 #1）。`use-cases/public/__tests__/list-public-members.spec.ts` の WHERE 条件 assertion が緑のまま。

## 完了条件

- [x] 必須セクションが存在する。
- [x] 新規テスト不追加の方針と根拠を明記した。
- [x] 回帰確認 4 spec のカバー範囲と expected result を表で記述した。
- [x] TOML 構文妥当性検証と runtime smoke 検証ケースを expected result 付きで記述した。

## 目的

新規テストを追加しない方針の根拠を固定し、回帰確認する 4 focused spec と runtime smoke 検証ケースの期待結果を確定する。

## 実行タスク

1. 新規テスト不追加の方針と根拠を記録する。
2. 回帰確認 4 focused spec のカバー範囲と期待結果を表で示す。
3. runtime smoke 検証ケース（件数整合 / admin override 保護 / visiblePublicCount 増加 / redaction）を定義する。

## 参照資料

- `apps/api/src/lib/policies/auto-publish.spec.ts`
- `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts`
- `apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts`
- `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`

## 成果物

- 本 `phase-06-test-strategy.md`（回帰方針・4 spec カバー範囲・runtime smoke ケース）。

## 統合テスト連携

4 focused spec が unit/contract レベルの結合を担保。runtime レベルの結合（deploy→backfill→公開フィルタ→`/members`）は Phase 11 で user-gated 実行する。
