# Phase 9: リスクと対策

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 09 |
| state | implemented_local_runtime_pending |
| implementation_mode | verify_existing + コード変更 1 点 |

## 目的

production flag enablement + backfill による本番 `/members` 復旧に伴うリスクを洗い出し、各リスクに 影響度 / 対策 / 検知方法 を割り当てて、user-gated runtime ops を安全順序（staging→production）で進めるためのガードレールを固定する。

## 実行タスク

- 本番 D1 mutation の不可逆性・admin override 誤公開・secret 混入・data 分布差異・deploy 失敗・flag ON だが空のまま、の 6 リスクを表で整理する。
- 各リスクの検知方法（diagnostics / grep / spot check / screenshot）を明示し、Gate-C の PASS 判定に接続する。

## 参照資料

- [phase-05-implementation-guide.md](phase-05-implementation-guide.md) / Phase 5
- [phase-07-quality-gates.md](phase-07-quality-gates.md) / Phase 7
- [tasks/task-b-staging-runtime-verification.md](tasks/task-b-staging-runtime-verification.md)
- [tasks/task-c-production-runtime-rollout.md](tasks/task-c-production-runtime-rollout.md)
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。

## リスク一覧

| ID | リスク | 影響度 | 対策 | 検知方法 |
|----|--------|--------|------|---------|
| R-01 | 本番 D1 mutation（`member_status.publish_state` の一括 UPDATE）が不可逆で、誤った record を公開化したまま戻せない | 高 | Task C step 0 で `cf.sh d1 export` による backup を apply 前に必ず取得する。backfill は `dryRun=true` を先に実行し、approval marker 作成後にのみ `--apply` する（不変条件 #3）。 | apply 前後の `prod-diagnose-pre/post.json` の差分件数を比較。想定外件数なら中止し backup から復元（rollback 表）。 |
| R-02 | admin override（`publish_state='hidden'` / 非 `system:*` `updated_by`）された会員が backfill で誤って公開化される（Privacy 事故） | 高 | `decidePublishState` / `isAdminOverrideStatus` の保護（hidden・非 system updated_by は上書きしない）を信頼。dry-run の `skipped.adminExplicit` で対象外件数を事前確認し、apply 後に hidden 維持を spot check（不変条件 #4）。公開条件は `consent='consented'` 必須。 | dry-run JSON の `skipped.adminExplicit` 件数。apply 後に対象 member の `publish_state='hidden'` 維持を diagnostics / spot check で確認。 |
| R-03 | evidence JSON / log / summary に `SYNC_ADMIN_TOKEN` 等の secret が混入し、リポジトリ・AI コンテキストに残る | 高 | コマンドの token は `<redacted>` 表記で記載。evidence 保存後に redaction grep を必須実行（不変条件 #5）。D1 backup SQL はコミットせず path のみ記録。 | `rg 'SYNC_ADMIN_TOKEN\|CLOUDFLARE_API_TOKEN\|<token-prefix>' outputs/phase-11 outputs/phase-13` がゼロ件であること。 |
| R-04 | staging と production で data 分布が異なり、production の backfill 件数が想定外（staging 実績比で大きく乖離） | 中 | dry-run の `candidates` 件数を approval marker に記録し、staging 実績と比較。乖離が大きい場合は apply を**自動実行せず**ユーザーへエスカレーションする（Phase 2.5 の意思決定権）。 | `prod-backfill-dry-run.json` の `candidates` を `staging-backfill-apply.json` の `applied` と比率比較。閾値超過で中止。 |
| R-05 | deploy が runtime 互換性（OpenNext / Workers bundle）で失敗、または deploy 後に新 worker が異常動作する | 中 | deploy 前にローカル `typecheck` / `build` green を確認。deploy log / version id を summary に記録。異常時は `cf.sh rollback <PREVIOUS_VERSION_ID>` で即時 rollback（Task C rollback 表）。 | deploy log の成否、deploy 後の `/members` smoke と diagnostics の health。異常なら rollback。 |
| R-06 | flag ON + backfill apply 後も `/members` が空のまま（真因が H3 滞留ではなく H1 ingest / H2 identity / H4 schema だった） | 中 | dry-run `candidates=0` の場合は apply をスキップ（no-op）し、別原因として親ワークフローの CLOSED issue（#956 H1 / #957 H2 / #959 H4）の runtime ops を参照。本ワークフローでは UI/API 追加実装をせず、別原因が判明したら follow-up として切り出す（Phase 3.4 / Phase 12 unassigned-task-detection で記録）。 | `diagnose-post` の `visiblePublicCount` が増えず、`/members` after screenshot が空。breakdown（`totals` / consent / publish_state 内訳）で別原因を切り分け。 |

## エスカレーション基準

- backfill dry-run の `candidates` 件数が staging 実績比で大きく乖離する場合、apply を中止しユーザーへエスカレーション（自動 apply しない）。
- backfill apply 後も `/members` 表示が 0 件の場合、Gate-C を fail として扱い、diagnostics の breakdown で H1/H2/H4 を切り分け、該当 CLOSED issue の runtime runbook を参照する（再 issue 起票不要、別原因が確定したら follow-up 化）。
- admin override された hidden member が apply 後に公開化されている場合、即座に backup SQL から該当 `member_status` を復元、または admin UI で `publish_state='hidden'` へ手動再設定し、`isAdminOverrideStatus` の偽陰性を追加調査する。

## ロールバック方針（Task C 再掲・サマリ）

| 事象 | rollback |
|------|----------|
| deploy 後に新 worker が異常 | `bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/api/wrangler.toml --env production` |
| backfill apply が想定外 record を公開 | backup SQL から該当 `member_status` を復元、または admin UI で `publish_state='hidden'` へ手動再設定 |
| flag を再度 OFF にしたい | `wrangler.toml` production flag を `"false"` に戻して再 deploy（既に public 化した record は backfill では戻らないため手動対応） |

## 統合テスト連携

リスク R-06（flag ON だが `/members` 空のまま）は runtime 結合検証で初めて検知される。Phase 11 の smoke で別原因（H1/H2/H4）が判明した場合は follow-up 化する。
