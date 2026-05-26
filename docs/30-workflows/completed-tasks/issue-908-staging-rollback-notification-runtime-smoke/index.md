---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
read_only_evidence_allowed_pre_gate: true
mutation_commands:
  - "bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging"
  - "bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging（staging rollback smoke 実行に伴う schema alias の D1 mutation）"
  - "bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias <TEST_ALIAS_ID>"
user_approval_marker: outputs/phase-13/user-approval-issue-908-staging-rollback-notification-runtime-smoke-<timestamp>.md
---

# issue-908: schema alias rollback notification staging runtime smoke evidence 取得 — タスク仕様書

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。
> 判定根拠: 本タスクは smoke helper script `scripts/runtime-smoke/schema-alias-rollback.sh`（新規）と evidence MD（新規）、親 `manual-test-result.md` の pending cross-link（編集）と runtime 実行後の Status mutation 手順を成果物として含む。docs-only ではないため実装仕様書として作成する。helper script は read-only モードのデフォルトを持ちつつ、user-gated mutation（rollback POST + D1 read wrapper）を実行する設計。

---

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-908-staging-rollback-notification-runtime-smoke |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/908（CLOSED のまま。クローズ状態を維持して仕様書を作成） |
| 親タスク | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/`（Phase 1-12 local 完了 / Phase 11 `local_evidence_captured_runtime_pending`） |
| 発見元 | 親 Phase 11 `outputs/phase-11/manual-test-result.md` の Status が `local_evidence_captured_runtime_pending` で AC-6 未取得 |
| 旧仕様書 | `docs/30-workflows/unassigned-task/issue-838-followup-001-staging-rollback-notification-smoke.md` |
| 作成日 | 2026-05-25 |
| 実装区分 | 実装仕様書（smoke helper script 追加 + evidence MD 新規 + 親 status mutation 編集） |
| implementation_mode | `new`（runtime smoke helper / evidence MD は新規） |
| task_type | verification（runtime evidence） |
| visual_category | NON_VISUAL（apps/api のみ・UI/UX 変更なし） |
| scale | small |
| 想定スコープ | 1 実装サイクルで完了（CONST_007）。先送りタスクなし。 |

---

## issue 現状調査の結論

issue #908 は CLOSED 状態だが、親 issue-838 の AC-6（staging runtime evidence）は未取得である。

| 確認項目 | 結果 | 根拠 |
| --- | --- | --- |
| 親 implementation（dispatch / route / audit） | 実装済み | `apps/api/src/workflows/schemaAliasRollbackNotification.ts` / `apps/api/src/routes/admin/schema.ts` |
| 親 focused tests | 全 PASS | `schemaAliasRollbackNotification.spec.ts` + `schema.rollback.spec.ts`（2 files / 13 tests） |
| staging deploy | 実施済み（前提） | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` |
| 親 Phase 11 status | `local_evidence_captured_runtime_pending` | 親 `outputs/phase-11/manual-test-result.md:5` |
| staging runtime evidence MD | placeholder 作成済み / runtime 値 pending | 親 `outputs/phase-11/evidence/staging-smoke.md` |
| smoke 再現性 helper | 作成済み | `scripts/runtime-smoke/schema-alias-rollback.sh` |

### 解決方針

1. smoke helper script `scripts/runtime-smoke/schema-alias-rollback.sh` を追加し、誰でも再現可能な runtime smoke 経路を確立する（`--dry-run` モード必須・secret は op 参照経由のみ）
2. 3 ケース（sent / skipped / failed）の staging runtime smoke 実行手順を Phase 11 で確立し、evidence MD を tracked file として残す
3. 親 `outputs/phase-11/manual-test-result.md` には pending cross-link を追加済み。`runtime_evidence_captured` への Status 昇格は user-gated runtime 実行後にのみ行う
4. 親 `artifacts.json` は placeholder evidence_path を保持し、Phase 11 status / Gate-C status の完了昇格は user-gated runtime 実行後にのみ行う

---

## スコープ

### 含む

- 新規: `scripts/runtime-smoke/schema-alias-rollback.sh`（read-only helper・rollback POST + d1 read のラッパー・`--dry-run` 既定推奨・secret は op 参照経由のみ・実行は user-gated）
- 新規: `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md`（3 ケース sent / skipped / failed の runtime evidence・secret redact 必須）
- 編集: 同親 `outputs/phase-11/manual-test-result.md`（現 cycle は pending cross-link 追加。Status 昇格は runtime 実行後）
- 編集: 同親 `artifacts.json`（現 cycle は evidence_path 追加。Phase 11 completed / Gate-C passed 昇格は runtime 実行後）

### 含まない（理由付き）

- 通知 dispatch / redaction / audit 記録の実装変更（→ 親 issue-838 で完了済み）
- production 環境での smoke（→ staging で AC-6 を充足。production は別 release gate）
- bulk rollback 通知（→ `serial-05-step-03-followup-006-schema-alias-bulk-rollback` で別管理）
- 集計再実行（→ issue #836 で別管理）
- member 向け `notification_outbox` の generic 化（→ 運用者通知はスコープ外）

> CONST_007 準拠: 上記「含まない」はいずれも独立した完了済み/別 issue の領域。本タスクを 1 サイクルで完了させても破綻しない。

---

## 受入条件

- AC-1: smoke helper `scripts/runtime-smoke/schema-alias-rollback.sh` が `bash -n` syntax check と `--dry-run` 実行で正常終了する
- AC-2: helper が secret 実値（webhook URL / token / mail key / Authorization header の値）を stdout / log / evidence MD に転記しない（redact 関数経由必須）
- AC-3: staging runtime で 3 ケース（sent / skipped / failed）を実行し、evidence MD に rollback HTTP status・audit entry JSON・通知 channel/status/attempts を記録する
- AC-4: local cycle では親 `outputs/phase-11/manual-test-result.md` に staging-smoke.md への pending cross-link が追加される。user-gated runtime 実行後に Status が `runtime_evidence_captured` に更新される
- AC-5: local cycle では親 `artifacts.json` の evidence_path が staging-smoke.md を指す。user-gated runtime 実行後に Phase 11 status が `completed` / Gate-C status が `passed` に更新される
- AC-6: `bash scripts/verify-pr-ready.sh` の `gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift が全 green
- AC-7: typecheck / lint / 既存 vitest が回帰しない

---

## 不変条件の遵守

| CLAUDE.md 不変条件 | 本タスクでの遵守方法 |
| --- | --- |
| Cloudflare CLI は `bash scripts/cf.sh` 経由のみ | helper script 内も `wrangler` 直接呼び出し禁止。`cf.sh d1 execute` / deploy ラッパー経由 |
| secret 実値は `.env` / log / docs に転記禁止 | helper は op run 経由で `SLACK_WEBHOOK_URL` 等を揮発的に受け取り、evidence MD には redact 後のみ記録 |
| `*.spec.ts` のみ | smoke helper の bash test は `bats` ではなく `bash -n` syntax check + `--dry-run` 実行で代替（spec 追加なし） |
| #5 D1 直接アクセスは apps/api に閉じる | helper は admin API endpoint 経由で rollback を叩き、D1 read は `cf.sh d1 execute` 経由のみ |

---

## Phase 構成

| Phase | ファイル | 目的 | ステータス |
| --- | --- | --- | --- |
| 1 | `phase-1-requirements.md` | 要件定義・inventory・命名規則・P50・AC 確定 | completed |
| 2 | `phase-2-design.md` | 設計（helper script I/O / redaction / dry-run / 3 ケース手順） | completed |
| 3 | `phase-3-design-review.md` | 設計レビューゲート | completed |
| 4 | `phase-4-test-plan.md` | 検証計画（syntax / dry-run / 3 ケース runtime） | completed |
| 5 | `phase-5-implementation.md` | 実装手順（helper script / evidence MD / parent pending cross-link） | completed（helper + placeholder evidence をローカル実装済み） |
| 6 | `phase-6-test-additions.md` | テスト拡充（dry-run mode regression） | completed |
| 7 | `phase-7-coverage.md` | カバレッジ確認（smoke helper は coverage 対象外） | completed |
| 8 | `phase-8-refactor.md` | リファクタリング（helper の redact 関数共通化検討） | completed |
| 9 | `phase-9-qa.md` | 品質保証（typecheck / lint / verify-pr-ready） | completed |
| 10 | `phase-10-final-review.md` | 最終レビューゲート | completed（spec review） |
| 11 | `phase-11-manual-test.md` | 手動テスト（staging smoke 3 ケース実行 + evidence MD 生成） | runtime_pending |
| 12 | `phase-12-documentation.md` | ドキュメント更新・spec sync・未タスク・feedback | completed |
| 13 | `phase-13-pr.md` | PR 作成（ユーザー明示承認後のみ） | pending |

> ゲート: Phase 1-3 完了まで Phase 4 へ進まない（CONST_001）。

---

## 主要参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 親 implementation | `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | dispatch / redaction / audit |
| 親 route 発火点 | `apps/api/src/routes/admin/schema.ts` | rollback route best-effort wiring |
| 親 Phase 11 手動テスト | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md` | 編集対象（pending cross-link。Status mutation は runtime 実行後） |
| 親 artifacts.json | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/artifacts.json` | 編集対象（evidence_path 登録。gate / phase status 昇格は runtime 実行後） |
| 元 unassigned-task | `docs/30-workflows/unassigned-task/issue-838-followup-001-staging-rollback-notification-smoke.md` | 本仕様書の入力ソース |
| 先行 runtime-evidence followup | `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md` | 雛形参考 |
| Cloudflare CLI ラッパー | `scripts/cf.sh` | wrangler 直接呼び出し禁止 |
