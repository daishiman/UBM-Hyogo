# Workflow Artifact Inventory — cf-token-env-contract-and-rotation-retirement

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` |
| purpose | `runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke` が毎回赤くなる真因（`CLOUDFLARE_API_TOKEN` が provisioning 正本 `provision-staging-secrets.sh` に欠落し `staging-runtime-smoke` 環境へ未登録）を恒久解消し、全消費 secret を provisioning 正本と突合する drift gate で再発防止する。あわせて 90 日カレンダーローテ（`cf-token-rotation-reminder`）を撤廃し非失効・狭スコープ・環境分離・漏洩時即時失効へ一本化する |
| parent | `docs/30-workflows/completed-tasks/issue-1081-bulk-tag-real-d1-runtime-smoke/` |
| related | `staging-mint-bearer-env-contract-guard`（drift gate 雛形・別責務 = mint env 契約 vs 全 secret 契約・本タスクで AC-7 不変） |
| 起点 | CI 失敗ログ（`backend-ci #706 runtime-smoke-staging / bulk-tag-runtime-smoke`）。`related_issue=null` |

## Implementation

### Lane A: staging smoke token gap 解消 + 再発防止

| Path | Role |
| --- | --- |
| `scripts/smoke/provision-staging-secrets.sh` | `SECRETS` 配列へ `CLOUDFLARE_API_TOKEN`（1Password op:// 参照）を追加。inventory 検証ループが環境登録を担保（A1） |
| `.github/workflows/runtime-smoke-staging.yml` | `bulk-tag-runtime-smoke` を graceful degrade 化。`CLOUDFLARE_API_TOKEN` 欠落時は `cf_degraded=1` で後続 smoke を skip（hard-fail しない）。`STAGING_*` 欠落は従来通り hard-fail 維持（A2 / AC-3） |
| `scripts/smoke/verify-runtime-smoke-secret-contract.mts` | workflow の全消費 `secrets.*` を抽出し provisioning 正本（+ documented legacy exempt）と突合する drift gate（pure 関数 `extractWorkflowSecrets` / `extractProvisionedSecrets` / `detectSecretContractViolations` / `DEFAULT_EXEMPT_SECRET_RATIONALES`）（A3） |
| `scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | A3 の Vitest（pure function unit test・6 tests）（A4） |
| `.github/workflows/verify-runtime-smoke-secret-contract.yml` | A3 を PR/push で実行する CI gate（A5） |

### Lane B: rotation 撤廃 + token 再発行ポリシー統一

| Path | Role |
| --- | --- |
| `.github/workflows/cf-token-rotation-reminder.yml` | 削除（90 日カレンダーローテ撤廃）（B1） |
| `scripts/check-cf-rotation-reminder.sh` | 削除（reminder 起票ロジック撤廃）（B1） |
| `docs/30-workflows/operations/cf-token-provisioning-and-revocation-runbook.md` | 新規。非失効・狭スコープ・環境分離トークンの発行/保管/投入/漏洩時即時失効手順 + 不採用判断記録（OIDC 不採用理由）（B2） |
| `docs/30-workflows/operations/cf-token-rotation-runbook.md` | tombstone 化（冒頭 RETIRED marker + B2 転送）。監査履歴保持（B3） |
| `docs/30-workflows/operations/cf-token-rotation-log.md` | 末尾に「rotation policy retired・event-based revocation へ移行（2026-06-08）」追記（B4） |

## Evidence

| Evidence | Result |
| --- | --- |
| `pnpm exec vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | 2 files / 14 tests PASS（新規 6 + mint 回帰 8 = AC-7 不変確認） |
| `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts` | PASS（11 workflow secrets, 8 provisioned + 3 documented exempt, violations=0） |
| `bash -n scripts/smoke/provision-staging-secrets.sh` | PASS（exit 0） |
| actionlint `runtime-smoke-staging.yml` / `verify-runtime-smoke-secret-contract.yml` | PASS（0 error） |

## User-Gated

- Cloudflare token 再発行（staging=`ubm-hyogo-db-staging` D1:Edit のみ / production=Workers+D1 production のみ・別トークン・no-expiry）・1Password 保管。
- `gh secret set` / `provision-staging-secrets.sh` 実行（staging 環境への secret 投入）・実 staging smoke green 実走。
- 旧トークンの失効・`CF_TOKEN_ISSUED_AT` repo var 削除（任意）。
- drift gate `verify-runtime-smoke-secret-contract` の dev/main required status check 登録（branch protection 変更）。
- Commit / push / PR。

## Lessons Learned

苦戦箇所・将来同型タスクを簡潔に解決するための知見（inline 保持・L-CFEC-001..009）。

| ID | 要点 |
| --- | --- |
| L-CFEC-001 | CI が毎回赤い真因は「コード bug」とは限らず「provisioning 正本の secret 欠落（構造ギャップ）」のことがある。ユーザー仮説（週次トークン失効）を鵜呑みにせず、`workflow が消費する secrets.*` ⊆ `provisioning 正本に登録された集合 ∪ documented legacy exempt` を突合し、不足を PR 時点 fail-fast する drift gate で再発を構造的に封じる |
| L-CFEC-002 | graceful degrade フラグは既存パターンを踏襲する。`RUNTIME_SMOKE_MINT_DEGRADED`（mint）に倣い `cf_degraded` を命名・配線したことで直交フラグ設計が自然に決まった。新規 degrade フラグは既存 degrade パターンの命名・所有権分離を踏襲する |
| L-CFEC-003 | drift gate は雛形（`verify-mint-env-contract.{mts,yml}`）を流用しつつ、責務が異なる場合は別ファイル化する。本タスクの「全 secret 契約」と既存の「role-scoped mint env 契約」は責務が直交するため、既存 verifier を無改変（AC-7）で別ファイル実装した。契約 gate は責務単位で別ファイルに分ける |
| L-CFEC-004 | graceful degrade（実行時の skip）と static secret contract（PR 時点の登録検査）を混同しない。degrade で job を skip しても、secret 契約検査からは除外しない。exempt は「documented legacy（恒久的に provision されない正当な理由を明記した）」のみに限定する。degrade を契約免除の抜け穴にしない |
| L-CFEC-005 | ポリシー撤廃時は旧 runbook を削除せず tombstone（冒頭 RETIRED marker + 新 runbook 転送・B3）+ log 追記（B4）で監査履歴を二段保持する。ポリシー変更の追跡性が保たれ、後続が同じ検討を蒸し返すのを防ぐ |
| L-CFEC-006 | 90 日カレンダーローテは「漏洩時即時失効 + 非失効・狭スコープ・環境分離トークン」で代替できる。runbook には「不採用判断記録」章（OIDC token federation 不採用理由 = 個人開発規模に対しオーバーエンジニアリング）を残し、検討の蒸し返しを防ぐ |
| L-CFEC-007 | required status check 化を見据えた `pull_request.paths` footgun（非該当 PR で永久 pending・memory issue-1146 教訓）を spec 段階で注記し、branch protection 登録は baseline（B-1）へ分離。gate 本体実装と required 化（user-gated ガバナンス変更）を混ぜない |
| L-CFEC-008 | secret 値・token id・scope 詳細を log / artifact / evidence / spec に出さない（AC-8 redaction 不変）。provisioning script は op:// 参照のみを書き、verifier は env 名のみを扱う pure 関数化で値露出を原理的に防ぐ |
| L-CFEC-009 | 同期 wave では artifact-inventory（本ファイル）と task-workflow-active.md エントリ、ポリシー撤廃に伴う旧台帳エントリ（Issue #407 = 削除済み artifact を実装対象として記載）の RETIRED 注記が漏れやすい。`grep -c <slug> indexes/topic-map.md indexes/keywords.json` と inventory の Lessons 節存在、削除ファイル名の stale 参照を機械確認し、`pnpm indexes:rebuild` を必ず実行する（本タスクでも当初これらが欠落していた） |
