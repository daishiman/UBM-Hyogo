# Phase 2: 設計 — cf-token-env-contract-and-rotation-retirement

## 目的

Phase 1 の AC を満たす実装トポロジ・SubAgent lane・各成果物の contract（関数シグネチャ / env / マージ戦略）・検証 path を設計する。

## 既存資産の再利用可否（FB-SDK-07-1）

| 再利用候補 | 可否 | 判断 |
| ---------- | ---- | ---- |
| `RUNTIME_SMOKE_MINT_DEGRADED` degrade パターン | 再利用 | CF 欠落 degrade を同型で実装し新規パターンを生やさない |
| `verify-mint-env-contract.mts` の workflow パーサ（`extractMintStepsFromWorkflow` / `extractProvisionedSecrets`） | 部分再利用（参照のみ） | 正規表現パターン（`secrets.<NAME>` / `"<NAME>:op://"` 抽出）を参考にするが、責務が異なる（mint env vs 全 secret）ため**別ファイル**で実装。既存 verifier は無改変（AC-7） |
| `provision-staging-secrets.sh` の inventory 検証ループ | 再利用 | `SECRETS` への 1 行追加で網羅性検証が自動的に効く |
| `redact.sh` / `::add-mask::` | 不変 | 変更しない |

## 実装トポロジ

```
runtime-smoke-staging.yml (bulk-tag-runtime-smoke)
  ├─ A1: provision-staging-secrets.sh  ──(投入)──▶ staging-runtime-smoke env: CLOUDFLARE_API_TOKEN
  ├─ A2: degrade (verify-bulk-inputs.outputs.cf_degraded)  ──▶ 欠落時は skip / 存在時は smoke 実走
  └─ A3/A5: verify-runtime-smoke-secret-contract  ──(PR static check)──▶ secret ⊆ provisioned ∪ exempt

cf-token-rotation-reminder.yml  ──(B1 削除)──▶  cf-token-provisioning-and-revocation-runbook.md (B2)
  └─ 旧 runbook (B3 tombstone) / 旧 log (B4 追記)
```

## Lane 分割（SubAgent ≤3 並列 + validation 直列）

| Lane | 担当 | 並列性 | 内容 |
| ---- | ---- | ------ | ---- |
| Lane A | A1〜A5 | 直列（A1→A2→A3→A4→A5 は contract 共有のため） | secret gap 解消 + degrade + drift gate |
| Lane B | B1〜B4 | Lane A と並列可（独立ファイル） | rotation 撤廃 + runbook |
| Validation | actionlint / Vitest / typecheck / lint / mirror parity | 直列（最後に締める） | Phase 9 |

> 本仕様書（spec）作成段階では各 Lane の phase doc を 3 並列 SubAgent で執筆する。実装段階（本実行サイクル）では Lane A → Lane B → Validation の順で進める。

## 各成果物の contract

### A1: `provision-staging-secrets.sh`

`SECRETS` 配列に 1 エントリ追加（位置は STAGING_AUTH_SECRET 群の後・SLACK の前を推奨）:

```bash
SECRETS=(
  "STAGING_API_BASE:op://Employee/ubm-hyogo-env/STAGING_API_BASE"
  ...
  "CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE"   # ★追加
  "SLACK_WEBHOOK_INCIDENT:op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING"
)
```

- `CLOUDFLARE_ACCOUNT_ID` は repo var のため `SECRETS`（環境シークレット投入）には**含めない**。コメントで「ACCOUNT_ID は `vars.CLOUDFLARE_ACCOUNT_ID`（repo variable）で管理。本 script の対象外」と明記。
- 1Password item `CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` は新規（staging smoke 専用・狭スコープトークン値を保管）。runbook B2 に作成手順を記載。
- inventory 検証ループ（既存 L104-116）は `SECRETS` を参照するため追加分も自動検証される。

### A2: `runtime-smoke-staging.yml` degrade

`bulk-tag-runtime-smoke` の `verify required staging secrets` step（現 L179-195）を 2 段階に再設計:

```yaml
- name: verify required staging secrets
  if: env.RUNTIME_SMOKE_MINT_DEGRADED != '1'
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
  run: |
    # 前提 secret（欠落は hard-fail）
    hard_missing=()
    for name in STAGING_API_BASE STAGING_ADMIN_BEARER; do
      if [ -z "${!name:-}" ]; then hard_missing+=("$name"); fi
    done
    if [ "${#hard_missing[@]}" -gt 0 ]; then
      printf "::error::missing required secrets in 'staging-runtime-smoke': %s\n" "${hard_missing[*]}"
      exit 1
    fi
    # CF 系（欠落は degrade-skip）
    cf_missing=()
    for name in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
      if [ -z "${!name:-}" ]; then cf_missing+=("$name"); fi
    done
    if [ "${#cf_missing[@]}" -gt 0 ]; then
      echo "cf_degraded=1" >> "$GITHUB_OUTPUT"
      printf "::notice::bulk-tag runtime smoke skipped; missing CF credentials: %s (register via provision-staging-secrets.sh)\n" "${cf_missing[*]}"
    fi
```

- 後続 step（`mask staging credentials` / `run bulk tag runtime smoke` / `redaction grep gate` / `upload evidence artifact`）の `if:` に `&& steps.verify-bulk-inputs.outputs.cf_degraded != '1'` を AND 追加。
- 状態語彙: `verify-bulk-inputs.outputs.cf_degraded`（CF 欠落で skip）は `RUNTIME_SMOKE_MINT_DEGRADED`（mint 失敗で skip）と直交する独立フラグ。両方が degrade なら当然 skip。

### A3: `verify-runtime-smoke-secret-contract.mts`（pure functions + main）

```typescript
export interface SecretContractViolation {
  readonly kind: "missing_provision" | "stale_provision" | "missing_exemption_rationale";
  readonly names: readonly string[];
  readonly severity: "error" | "warn";
}

// runtime-smoke-staging.yml の全 `${{ secrets.<NAME> }}` を抽出（重複排除）
export function extractWorkflowSecrets(workflowYaml: string): string[];

// provision-staging-secrets.sh の `"<NAME>:op://..."` を抽出（既存 extractProvisionedSecrets と同パターン）
export function extractProvisionedSecrets(provisionSh: string): string[];

// workflowSecrets ⊆ provisionedSecrets ∪ documented legacy exemptions を検査
export function detectSecretContractViolations(input: {
  workflowSecrets: readonly string[];
  provisionedSecrets: readonly string[];
  exemptSecretRationales?: Readonly<Record<string, string>>;
}): SecretContractViolation[];

// documented legacy exemptions: provisioning 対象外だが正当に消費される fallback secret と根拠
export const DEFAULT_EXEMPT_SECRET_RATIONALES: Readonly<Record<string, string>>;
```

- `main()`: workflow と provision script を読み、violation があれば stderr に出し exit 1。なければ PASS 出力。`import.meta.url === pathToFileURL(entry).href` ガードで test import 時に main を走らせない（既存 verifier と同パターン）。
- **トークン値は一切読まない**（name のみ）。AC-8 維持。

### A4: `verify-runtime-smoke-secret-contract.spec.ts`（Vitest）

純関数の unit test。fixture YAML / sh 文字列をインラインで与える。詳細は Phase 4。

### A5: `verify-runtime-smoke-secret-contract.yml`（CI gate）

`verify-mint-env-contract.yml` を雛形に、`paths` に `runtime-smoke-staging.yml` / `provision-staging-secrets.sh` / 新 verifier / 新 spec を指定。`push: [dev, main]` 併設。

> **paths フィルタの footgun（memory issue-1146 教訓）**: 本 gate を将来 dev/main の required status check に登録する場合、`pull_request.paths` フィルタがあると非該当 PR で永久 pending になり block する。required 化は user-gated（branch protection）であり、登録時は paths 除去 or 別途検討する旨を runbook / phase-5 に注記する。本 spec の既定は「required 化は未実施・PR/push トリガのみ」。

### B1: `cf-token-rotation-reminder.yml` 削除

`git rm`。reminder の唯一の参照元のため、削除で `CF_TOKEN_ISSUED_AT` var は未参照になる。

### B2: 新 runbook `cf-token-provisioning-and-revocation-runbook.md`

章立て:
1. トークン設計原則（非失効・最小権限・環境分離・即時失効）
2. staging smoke 用トークン発行手順（CF dashboard scope: D1:Edit on ubm-hyogo-db-staging のみ / TTL なし）
3. production deploy 用トークン発行手順（scope: Workers Scripts:Edit + D1:Edit on production のみ / TTL なし / staging と別トークン）
4. 1Password 保管（item 名・field）
5. GitHub 環境投入（`provision-staging-secrets.sh` / `gh secret set --env`）
6. 漏洩時即時失効（CF dashboard → roll token → reissue → 再投入）
7. 不採用判断の記録（90日カレンダーローテ撤廃理由 / GitHub OIDC 不採用理由）

### B3 / B4: tombstone + log

- B3: 旧 `cf-token-rotation-runbook.md` 冒頭に `> **RETIRED (YYYY-MM-DD)**: 90日カレンダーローテーションは撤廃。後継は cf-token-provisioning-and-revocation-runbook.md` を追記し本文は監査履歴として保持。
- B4: `cf-token-rotation-log.md` 末尾に「rotation policy retired・event-based revocation へ移行」を 1 行追記。

## 状態所有権（責務境界）

| 関心 | 所有 | 備考 |
| ---- | ---- | ---- |
| secret → 環境投入 | `provision-staging-secrets.sh` | 唯一の投入正本 |
| secret 契約 drift 検出 | `verify-runtime-smoke-secret-contract.mts`（新規・全 secret） | mint env 契約とは別責務 |
| mint env 契約 drift 検出 | `verify-mint-env-contract.mts`（既存・不変） | AC-7 |
| degrade 判定 | `runtime-smoke-staging.yml`（job step） | mint と CF は直交フラグ |
| トークン発行 / 失効 | runbook（operational・user-gated） | コードは name のみ扱う |

## 因果ループ（再発防止の構造）

- 強化ループ（負）: 「新ジョブが secret 追加 → provisioning 正本未更新 → 環境未登録 → 毎回赤」。A1 で断ち切る。
- バランスループ（正）: 「PR で drift gate が consumed ⊄ provisioned を検出 → fail-fast → provisioning 正本を更新 → PASS」。A3 が再発を構造的に封じる。
- degrade ループ: 「token 一時欠落 / 失効 → hard-fail で赤」を A2 が「skip + notice」へ変換し、CI を赤にしない安全網にする。

## 検証 path

| 検証 | コマンド |
| ---- | -------- |
| drift gate unit | `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` |
| drift gate 実走 | `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts` |
| YAML lint | `actionlint .github/workflows/runtime-smoke-staging.yml .github/workflows/verify-runtime-smoke-secret-contract.yml` |
| shell 構文 | `bash -n scripts/smoke/provision-staging-secrets.sh` |
| 型 / lint | `pnpm typecheck` / `pnpm lint` |
| mirror parity | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` |

## 完了条件

- [x] 既存資産再利用可否を判定した。
- [x] A1〜A5 / B1〜B4 の contract（関数シグネチャ / env / マージ戦略）を定義した。
- [x] degrade フラグの直交性・責務境界・状態所有権を固定した。
- [x] 因果ループで再発防止構造を明示した。
- [x] paths フィルタ footgun を注記した。
- [x] 検証 path を列挙した。
