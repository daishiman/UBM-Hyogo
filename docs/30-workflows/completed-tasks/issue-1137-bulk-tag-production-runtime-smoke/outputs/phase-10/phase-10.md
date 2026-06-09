# Phase 10: 最終レビュー — issue-1137-bulk-tag-production-runtime-smoke

## 目的

AC-1〜AC-8 の充足を設計/テストの担保箇所と紐づけて確認し、blocker の有無、consumer side（runner → CI job → secret）まで contract が断絶なく通っているかを判定する。
MINOR 指摘は未タスク化候補（Phase 12 で baseline 記録）として列挙する。

## acceptance criteria 充足確認

| AC | 内容（要約）| 設計での担保 | テスト/gate での担保 | 充足 |
| -- | ----------- | ------------ | -------------------- | ---- |
| AC-1 | production 専用 allowlist host regex を導入、production endpoint にだけマッチ・staging と独立評価 | Phase 2 `assert_production_guard` が URL host を抽出し、anchored allowlist regex（`^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev|api\.ubm-hyogo\.workers\.dev)$`）を `${PRODUCTION_API_HOST_ALLOW_REGEX:-...}` で独立評価 | local test `production-wrong-host-refused` / `production-host-substring-refused` / `production-wrong-d1-refused` | ✅ |
| AC-2 | production fixture prefix `e2e_test_prod_tagbulk_` を staging と分離固定 | Phase 2 seed/cleanup SQL が全 INSERT/DELETE で当該 prefix を使用 | gate 5 SQL prefix grep（staging prefix 非包含・Phase 9）| ✅ |
| AC-3 | 二重承認 gate（workflow input + marker ×2・CI auto 実行不可）後のみ seed/POST/cleanup | Phase 2 `assert_production_guard` の `BULK_TAG_PRODUCTION_SMOKE_APPROVAL` / `BULK_TAG_PRODUCTION_SMOKE_CONFIRM` 検証 + CI `workflow_dispatch` 限定 + input 明示 opt-in + `environment: production-runtime-smoke` 承認 | local test `production-no-approval-refused` / `production-single-approval-refused`（Phase 7）+ gate 4 actionlint（CI に auto trigger なし）| ✅ |
| AC-4 | cleanup 残件 0 assert（6 table）。残件あれば FAIL | Phase 2 `cleanup()` が 6 table を `count(*) ... LIKE prefix` で集計し非 0 で `fail_and_exit` + trap EXIT cleanup | gate 5 cleanup 全 DELETE prefix LIKE（Phase 9）+ Phase 11 実走（user 二重承認後）| ✅（実走証跡は Phase 11）|
| AC-5 | audit parity（assign/unassign の action/batchId/count・test 行残留なし）| Phase 2 Topology の audit_count(tag_assigned) before==after（冪等）+ tag_unassigned 増分 assert + cleanup audit 残件 0 | Phase 11 実走（real D1）。冪等の根拠は contract（noop は audit append なし）| ✅（実走証跡は Phase 11）|
| AC-6 | 既存 staging guard 非退化を既存 local test PASS で確認 | Phase 8 `assert_staging_guard` 逐語不変 + `configure_environment` staging 値の逐語一致 | gate 1 既存 staging ケース（production-env-refused 等）が PASS（Phase 7/9）| ✅ |
| AC-7 | command log に URL/body redaction/response summary/audit query/cleanup query が残り bearer は redact | Phase 2 `redact.sh` + CI `::add-mask::` + redaction grep gate | gate 6 redaction grep（bearer/JWT 非露出・Phase 9）+ Phase 11 evidence | ✅（実走証跡は Phase 11）|
| AC-8 | issue 本文 contract（assigned 単値 / `@repo/api`）を最新コード（`results[].status` / `@ubm-hyogo/api`）へ最適化 | Phase 1/2 で `results[].status` jq 集計検証・全コマンドを `@ubm-hyogo/api` に訂正 | local test `production-config-selected`（Phase 7）+ ドキュメント全体のパッケージ名統一 | ✅ |

> AC-4 / AC-5 / AC-7 の正常系**実走証跡**は production real D1 への書き込みを伴うため Phase 11（user 二重承認後）に分離。これは先送りではなく副作用ゆえの実行タイミング分離（Phase 1 / 不変条件記載）。設計・静的 gate での担保は本サイクルで完了している。

## blocker 判定

**blocker なし。**

- 設計（Phase 2）は AC-1〜AC-8・不変条件 I-1〜I-7 を満たし、Phase 3 レビューゲートで PASS 済。
- 本サイクルで全成果物（runner 拡張 / SQL 2 本 / CI job 1 つ / test 拡張）をコード化できるスコープ（CONST_007）。
- staging 退化リスクは `assert_staging_guard` 逐語不変 + 既存 test 非退化で構造的に閉じている。

## consumer side contract の3層断絶チェック

runner → CI job → secret の3層で contract が断絶なく通っているか。

| 層 | 接続点 | 整合 | 根拠 |
| -- | ------ | ---- | ---- |
| runner → CI job | CI job が `bash scripts/smoke/runtime-tag-bulk.sh production --out-dir ci-evidence-bulk-tag-prod --ci-summary` を呼ぶ。runner は `production` env を受理（`case staging\|production`）| ✅ | Phase 2 CI job step `run bulk tag production smoke` ↔ runner `parse_args` production 受理 |
| CI job → secret | CI job は `run_bulk_tag_mutation=true` + `bulk_tag_confirmation=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1` の input が揃う時だけ対象化し、`PRODUCTION_API_BASE` / `PRODUCTION_ADMIN_BEARER` を `secrets.*` から注入する。runner marker は固定 phrase を env で渡し、runner の `configure_environment` / `assert_production_guard` が同名 env を要求 | ✅ | Phase 2 CI job env マッピング ↔ runner 必須 env。`verify required production secrets` step が欠落で fail-closed |
| runner → D1 | `run_d1` が `--env "$ENVIRONMENT"`（production）で `cf.sh d1 execute ubm-hyogo-db-prod` を叩く。seed/cleanup SQL が同 D1 を対象 | ✅ | Phase 2 `run_d1` 一般化 ↔ `CF_D1_DATABASE=ubm-hyogo-db-prod`（CI env / configure_environment） |

→ **3層に断絶なし**。secret 名・env 名・D1 名が runner / CI / SQL で一貫している。本サイクルでは env 名の typo がないことを actionlint（gate 4）+ runner の必須 env 検証（exit 2）で機械検出する。

## MINOR 指摘 → 未タスク化候補（Phase 12 で baseline 記録）

いずれも本タスクの AC 達成には不要。Phase 12 の未タスク検出で baseline として記録し、起票しない（本サイクルで完了させると破綻する／YAGNI／現状十分、のいずれか）。

| # | 指摘 | 分類 | 起票しない理由 |
| - | ---- | ---- | -------------- |
| M-1 | smoke runner 共通 lib 抽出（attendance / admin-web / tag-bulk の orchestration 横断共通化）| 別タスク（followup-007）| 本タスク非依存。runner 横断の共通化は独立スコープで、本タスクは単一 runner 内 env 分岐で完結する。今回混ぜると staging guard 逐語不変の保証境界が広がりリスク増 |
| M-2 | production smoke の定期実行スケジュール化（cron trigger 追加）| YAGNI・将来候補 | AC-3 は「CI 自動実行不可・workflow_dispatch 限定」を要求。定期実行は本番 mutation を無人で繰り返すことになり現方針と相反。需要が顕在化してから別途検討 |
| M-3 | production fixture を複数 member / 複数 tag（2×2 超）へ拡張 | 現状十分 | bulk assign / noop / unassign / audit parity の contract 検証には 2 member × 2 tag で必要十分。組合せ拡張は検証価値に対しコストが見合わない |

## 完了判定チェックリスト

- [ ] AC-1〜AC-8 すべてに設計/テストの担保箇所を紐づけた
- [ ] AC-4 / AC-5 / AC-7 の正常系実走証跡が Phase 11（user 二重承認後）に分離される境界を明記した
- [ ] blocker なしを判定した
- [ ] consumer side（runner → CI job → secret / runner → D1）の3層に断絶がないことを確認した
- [ ] MINOR 指摘 M-1（共通 lib 抽出）/ M-2（定期実行）/ M-3（fixture 拡張）を未タスク化候補として列挙し、起票しない理由を記した
- [ ] 全 MINOR が Phase 12 で baseline 記録される（current 未タスク 0 件想定）方針を確認した
