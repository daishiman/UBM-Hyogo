# Phase 4: テスト作成 — cf-token-env-contract-and-rotation-retirement

## 目的

drift gate 本体（A3 `scripts/smoke/verify-runtime-smoke-secret-contract.mts`）が満たすべき振る舞いを、実装に先立つ Vitest テスト（A4 `scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts`）として TDD RED 状態で固定する。本フェーズはテスト「設計」であり、実装コードは Phase 5 で書く。テストは A3 の pure function 群（`extractWorkflowSecrets` / `extractProvisionedSecrets` / `detectSecretContractViolations`）の入出力契約のみを対象とし、トークン値は一切扱わず secret name の文字列処理のみを検証する（AC-8）。

degrade 挙動（A2 YAML の `if:` 条件分岐）は Vitest の対象外とし、`actionlint` + 手動 trace の検証マトリクスで担保する方針を本フェーズで確定する。

## A3 が公開する pure function（テスト対象の契約）

| 関数 | 入力 | 出力 |
| ---- | ---- | ---- |
| `extractWorkflowSecrets(yaml: string)` | workflow YAML 文字列 | `${{ secrets.<NAME> }}` の `<NAME>` を全抽出し重複排除した `string[]`（出現順を保持） |
| `extractProvisionedSecrets(sh: string)` | provision shell 文字列 | `"<NAME>:op://..."` 形式の行から `<NAME>` のみ抽出した `string[]` |
| `detectSecretContractViolations({ workflowSecrets, provisionedSecrets, exemptSecretRationales })` | workflow / provision / rationale map | missing provision を `{ kind: "missing_provision", severity: "error", names }`、stale provision を `{ kind: "stale_provision", severity: "warn", names }`、空 rationale を `{ kind: "missing_exemption_rationale", severity: "error", names }` として列挙した配列 |
| `DEFAULT_EXEMPT_SECRET_RATIONALES`（定数） | — | `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID` の legacy fallback rationale map。`GITHUB_TOKEN` は抽出時に除外 |

## Vitest テストケース一覧（TC-1..TC-5）

| # | ケース | 入力 fixture | 期待 |
| --- | ------ | ----------- | ---- |
| TC-1 | provision gap 検出 | `workflowSecrets=["CLOUDFLARE_API_TOKEN","STAGING_API_BASE"]`, `provisionedSecrets=["STAGING_API_BASE"]`, `exemptSecretRationales={}` | 戻り値長 1。`[0].kind==="missing_provision"` / `[0].severity==="error"` / `[0].names=["CLOUDFLARE_API_TOKEN"]` |
| TC-2 | 追加後は違反 0 | `workflowSecrets=["CLOUDFLARE_API_TOKEN","STAGING_API_BASE"]`, `provisionedSecrets=["STAGING_API_BASE","CLOUDFLARE_API_TOKEN"]`, `exemptSecretRationales={}` | 戻り値 `[]`（length 0） |
| TC-3 | rationale 付き legacy exemption は gap 扱いしない | `workflowSecrets=["STAGING_ADMIN_BEARER"]`, `provisionedSecrets=[]`, `exemptSecretRationales={STAGING_ADMIN_BEARER:"legacy fallback"}` | 戻り値 `[]`。legacy fallback は rationale 付きでのみ許容 |
| TC-4 | `extractWorkflowSecrets` の重複排除 | YAML 文字列に `${{ secrets.STAGING_API_BASE }}` を 2 箇所、`${{ secrets.STAGING_ADMIN_BEARER }}` を 1 箇所含む | `["STAGING_API_BASE","STAGING_ADMIN_BEARER"]`（重複が畳まれ length 2、出現順保持） |
| TC-5 | `extractProvisionedSecrets` は op 参照行のみ抽出 | shell 文字列に `"CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE"` を含む `SECRETS` 配列と、`# comment` 行・`CLOUDFLARE_ACCOUNT_ID="${VAR}"`（op 参照でない）行を混在 | `["CLOUDFLARE_API_TOKEN"]` 等 op 参照行の name のみ。コメント行・非 op 行は抽出されない |

### fixture 配置方針

- fixture は spec ファイル内のインライン文字列定数（テンプレートリテラル）として定義し、外部ファイル I/O を行わない（pure 関数テストの決定性を担保）。
- YAML fixture は `runtime-smoke-staging.yml` の実構造の最小再現（`jobs > steps > env > <KEY>: ${{ secrets.<NAME> }}`）を使う。実ファイル読込は Phase 6 の I/O 統合テストで扱い、本フェーズの TC-1..TC-5 は文字列定数で完結させる。
- 各 TC は 1 アサーション群 1 振る舞いに対応させ、`describe` ブロックを関数単位（`detectSecretContractViolations` / `extractWorkflowSecrets` / `extractProvisionedSecrets`）で分割する。

## degrade 検証マトリクス（A2・Vitest 対象外）

A2 の YAML degrade は実行時の `if:` 評価であり Vitest では検証できないため、以下を `actionlint` + 手動 trace（YAML を読み下し各 step の `if:` を真偽評価）で確認する。

| # | STAGING_API_BASE | STAGING_ADMIN_BEARER | CLOUDFLARE_API_TOKEN | CLOUDFLARE_ACCOUNT_ID | 期待挙動 |
| --- | --- | --- | --- | --- | --- |
| M-1 | 欠落 | 任意 | 任意 | 任意 | `verify required staging secrets` step で `exit 1`（hard-fail 維持・AC-3） |
| M-2 | 任意 | 欠落 | 任意 | 任意 | 同上 `exit 1`（hard-fail 維持・AC-3） |
| M-3 | あり | あり | 欠落 | あり | `cf_degraded=1` を `$GITHUB_OUTPUT` に書き `::notice::` を出力。後続 4 step を skip（AC-2 degrade） |
| M-4 | あり | あり | あり | 欠落 | 同上 degrade（CF 系どちらの欠落でも degrade） |
| M-5 | あり | あり | あり | あり | degrade なし。`run bulk tag runtime smoke` 以降を実走（AC-2 実走） |

degrade 後続 step の `if:` は `... && steps.verify-bulk-inputs.outputs.cf_degraded != '1'` を含むこと。`actionlint` で構文・式参照を静的検証し、上記 5 行を手動 trace で網羅する。

## 検証の層別（local vs staging）

| 層 | 内容 | gate |
| ---- | ---- | ---- |
| local（自動） | `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts`（TC-1..TC-5）/ `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts`（実ファイル突合の smoke 実行）/ `actionlint`（A2/A5 YAML）/ `bash -n scripts/smoke/provision-staging-secrets.sh` | 非 user-gated。Phase 5 完了時に全 green を必須とする |
| staging（user-gated） | 実 `runtime-smoke-staging.yml` を staging 環境で発火し M-3/M-5 の実挙動（degrade-skip / 実走）を CI ログで確認 | Phase 13 / Gate-C。ユーザー明示承認後のみ |

## TDD RED 前提

- Phase 4 時点では A3 が実装済のため、A4 を作成・実行すると import 解決失敗または関数 undefined で **全 TC が RED** となる。これを「テストが実装を正しく駆動する」証跡とする。
- Phase 5 で A3 を実装し、TC-1..TC-5 を GREEN へ遷移させる。RED→GREEN の差分が Phase 5 の完了基準の一部となる。

## 参照資料

| 資料 | パス | 用途 |
| ---- | ---- | ---- |
| security-operations | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | secret 投入・契約の運用原則。verifier が name のみ扱う根拠 |
| security-input-validation | `.claude/skills/aiworkflow-requirements/references/security-input-validation.md` | YAML/shell パース入力の検証境界。抽出関数の入力健全性 |
| testing-fixtures | `.claude/skills/aiworkflow-requirements/references/testing-fixtures.md` | インライン fixture 定義方針・決定性の担保 |
| error-handling | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | violation を例外でなく構造化結果（`{ kind, severity }`）で返す設計指針 |
| issue-526 actionlint/shellcheck gate | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` | YAML/shell の静的 gate の先例。degrade の actionlint 検証方針 |
| issue-1054 binding drift gate | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-1054-wrangler-binding-drift-ci-gate-2026-06.md` | drift gate（consumed ⊆ provisioned）の設計先例 |

## 完了条件

- [ ] TC-1..TC-5 のケース表（入力 fixture / 期待）が一意に決まり、各 TC が 1 振る舞いに対応している。
- [ ] fixture をインライン文字列定数で定義する方針が明記され、外部 I/O 依存がない。
- [ ] degrade 検証マトリクス M-1..M-5 が定義され、`actionlint` + 手動 trace で担保する方針が明記されている。
- [ ] STAGING_* 欠落の hard-fail（M-1/M-2・AC-3）と CF 欠落の degrade（M-3/M-4・AC-2）が分離されている。
- [ ] verifier は secret name のみ扱いトークン値を読まない（AC-8）ことがテスト設計上保証されている。
- [ ] local 自動層と staging user-gated 層が層別され、TDD RED 前提が明記されている。
