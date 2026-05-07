# Phase 11: 実行 evidence（NON_VISUAL）

## 目的

NON_VISUAL タスクのため、画面 screenshot ではなく以下の runtime evidence を `outputs/phase-11/` 配下に保存する。

## 必須 evidence

| # | evidence | コマンド / 手順 | 保存先 |
| --- | --- | --- | --- |
| 1 | `pnpm typecheck` exit 0 | `pnpm typecheck \| tee outputs/phase-11/typecheck.log` | `outputs/phase-11/typecheck.log` |
| 2 | `pnpm lint` exit 0 | `pnpm lint \| tee outputs/phase-11/lint.log` | `outputs/phase-11/lint.log` |
| 3 | classifier focused test 全 pass | `pnpm vitest run scripts/cf-audit-log/__tests__ --reporter=verbose \| tee outputs/phase-11/vitest.log` | `outputs/phase-11/vitest.log` |
| 4 | offline-replay 出力 | `pnpm tsx scripts/cf-audit-log/evaluation/offline-replay.ts --classifier=threshold --evaluate=tests/fixtures/cf-audit/synthetic-anomaly.jsonl --out=outputs/phase-11/replay-threshold.json` | `outputs/phase-11/replay-threshold.json` |
| 5 | offline-replay (ml fallback) 出力 | `pnpm tsx scripts/cf-audit-log/evaluation/offline-replay.ts --classifier=ml --evaluate=tests/fixtures/cf-audit/synthetic-anomaly.jsonl --out=outputs/phase-11/replay-ml-fallback.json` | `outputs/phase-11/replay-ml-fallback.json` |
| 6 | secret leakage grep clean PASS | `pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts tests/fixtures/cf-audit/leakage-clean.jsonl; echo $?` → `0` | `outputs/phase-11/leakage-clean.log` |
| 7 | secret leakage grep positive FAIL | `pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts tests/fixtures/cf-audit/leakage-positive-ip.jsonl; echo $?` → `1` | `outputs/phase-11/leakage-positive.log` |
| 8 | staging migration list before / after | `scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` の前後 2 回実行 | `outputs/phase-11/migrations-before.log` / `migrations-after.log` |
| 9 | staging `PRAGMA table_info(cf_audit_log)` | apply 後の列確認 | `outputs/phase-11/cf-audit-log-pragma.log` |
| 10 | analyze.ts CLI dry-run | `CF_AUDIT_CLASSIFIER=threshold pnpm tsx scripts/cf-audit-log/analyze.ts --dry-run --evaluate=tests/fixtures/cf-audit/synthetic-anomaly.jsonl` で既存 #408 互換出力を確認 | `outputs/phase-11/analyze-dry-run-threshold.log` |
| 11 | analyze.ts ml fallback CLI | `CF_AUDIT_CLASSIFIER=ml ML_MODEL_PATH= pnpm tsx scripts/cf-audit-log/analyze.ts --dry-run` で fallback ログ出力確認 | `outputs/phase-11/analyze-dry-run-ml-fallback.log` |
| 12 | AC-1〜AC-12 ↔ evidence 対応表 | 各 AC を上記 evidence に紐付け | `outputs/phase-11/main.md` |

## State 表記

| state | 意味 | 本 Phase での扱い |
| --- | --- | --- |
| `spec_created` | 仕様書作成済み | runtime evidence は未取得でもよい |
| `implemented_local_runtime_pending` | local code / tests / SSOT 同期完了 | typecheck / lint / focused test / replay / leakage grep を保存 |
| `pass_boundary_synced_runtime_pending` | staging apply 完了 + production apply pending | staging migration list / PRAGMA が実体取得済みの場合のみ使用 |

## 完了条件

- [ ] local implementation evidence 7 種（typecheck / lint / focused test / replay / leakage clean/positive / dry-run）が `outputs/phase-11/` に存在
- [ ] `outputs/phase-11/main.md` に AC ↔ evidence の対応表
- [ ] staging apply が未実施の場合は `pass_boundary_synced_runtime_pending` と記録せず、`implemented_local_runtime_pending` と明記
- [ ] production apply / 本番切替が **未実施** であることを明記
- [ ] secret leakage grep が positive fixture で exit 1 を返すことが log で確認できる

## 出力

- `outputs/phase-11/main.md`
- `outputs/phase-11/{typecheck,lint,vitest,leakage-clean,leakage-positive,migrations-before,migrations-after,cf-audit-log-pragma,analyze-dry-run-threshold,analyze-dry-run-ml-fallback}.log`
- `outputs/phase-11/{replay-threshold,replay-ml-fallback}.json`

## 参照資料

- `index.md` ・ `phase-09.md` ・ `phase-10.md`

## 統合テスト連携

- evidence 3 / 4 / 5 / 6 / 7 が test 計画（Phase 9）の証跡となる

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 11-1 | この Phase の契約を確定する |
| 11-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
