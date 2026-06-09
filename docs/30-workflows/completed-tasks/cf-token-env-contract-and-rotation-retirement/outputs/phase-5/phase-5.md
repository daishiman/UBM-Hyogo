# Phase 5: 実装 — cf-token-env-contract-and-rotation-retirement

## 目的

Phase 4 で RED にしたテストを GREEN へ遷移させ、真因（`provision-staging-secrets.sh` の `SECRETS` 配列に `CLOUDFLARE_API_TOKEN` が欠落し `staging-runtime-smoke` 環境に未登録）を恒久解消する。Lane A（契約 + degrade + drift gate）と Lane B（rotation reminder 撤廃 + runbook 置換）の全コード変更を、本フェーズで具体手順として確定する。実コードの記述は本仕様書の指示に従い本実行サイクルで実施する。

## 新規作成 / 編集 / 削除 ファイル一覧（必須・FB-RT-03）

| 種別 | パス | 概要 |
| ---- | ---- | ---- |
| 編集 | `scripts/smoke/provision-staging-secrets.sh` | `SECRETS` 配列に CF トークンの op 参照を追加（A1） |
| 編集 | `.github/workflows/runtime-smoke-staging.yml` | `bulk-tag-runtime-smoke` を CF graceful degrade 化（A2） |
| 新規 | `scripts/smoke/verify-runtime-smoke-secret-contract.mts` | drift gate 本体・pure functions + main（A3） |
| 新規 | `scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | A3 の Vitest（A4・Phase 4 で設計） |
| 新規 | `.github/workflows/verify-runtime-smoke-secret-contract.yml` | A3 を PR/push で実行する CI gate（A5） |
| 削除 | `.github/workflows/cf-token-rotation-reminder.yml` | rotation reminder 撤廃（B1） |
| 新規 | `docs/30-workflows/.../cf-token-provisioning-and-revocation-runbook.md`（正本パスは Phase 2 B2 に従う） | CF トークン発行・投入・即時失効 runbook（B2） |
| 編集 | 旧 runbook（rotation 手順記載箇所） | tombstone 化し B2 へ誘導（B3） |
| 追記 | 当該ワークフローの LOGS | 撤廃 + 置換の記録（B4） |

## 実装順序

Lane A（A1 → A2 → A3 → A4 → A5） → Lane B（B1 → B2 → B3 → B4） → Validation。Lane A 内は依存順（契約定数 → degrade 配線 → gate → test → gate workflow）。Lane B は Lane A 完了後に着手（drift gate が green になってから rotation 撤廃を行い、撤廃で smoke が壊れない状態を先に確立）。

## Lane A — 契約 + degrade + drift gate

### A1: `provision-staging-secrets.sh`【編集】

- `SECRETS` 配列に以下 1 要素を追加する。挿入位置は既存 STAGING 系 secret 群の直後（配列内の論理グルーピングを維持）。

```sh
"CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE"
```

- `CLOUDFLARE_ACCOUNT_ID` は repo variable（`vars.CLOUDFLARE_ACCOUNT_ID`）で供給される非機密値のため `SECRETS` 配列には**追加しない**（drift gate の EXEMPT ではなく、そもそも secret として consume しない設計）。
- 既存の投入ループ（`gh secret set ... --env staging-runtime-smoke`）はそのまま使い、新要素が同ループで `staging-runtime-smoke` 環境へ登録される（AC-1）。
- 検証: `bash -n scripts/smoke/provision-staging-secrets.sh` で構文確認。

### A2: `runtime-smoke-staging.yml`【編集】degrade 化

`verify required staging secrets` step を 2 段に分離する。STAGING_* は hard-fail 維持、CF 系は degrade。既存 `RUNTIME_SMOKE_MINT_DEGRADED` パターンを踏襲。

degrade step の bash 擬似コード:

```sh
# STAGING_* は前提依存 → 欠落で hard-fail（AC-3）
if [ -z "${STAGING_API_BASE:-}" ] || [ -z "${STAGING_ADMIN_BEARER:-}" ]; then
  echo "::error::missing required staging secrets (STAGING_API_BASE / STAGING_ADMIN_BEARER)"
  exit 1
fi

# CF 系は任意依存 → 欠落で degrade-skip（AC-2）
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "::notice::CLOUDFLARE_API_TOKEN not provisioned — skipping bulk tag runtime smoke (degraded)"
  echo "cf_degraded=1" >> "$GITHUB_OUTPUT"
fi
```

- 上記 step の `env:` に `STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}` / `STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}` / `CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}` / `CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}` を渡す（ACCOUNT_ID は vars 由来）。
- 後続 step（`mask staging credentials` / `run bulk tag runtime smoke` / `redaction grep gate` / `upload evidence artifact`）の各 `if:` の末尾に `&& steps.verify-bulk-inputs.outputs.cf_degraded != '1'` を追加する。既存条件があれば AND で連結する。

| step | 変更後 `if:`（既存条件 ◯ がある場合は `◯ && ...`） |
| ---- | ---- |
| mask staging credentials | `... && steps.verify-bulk-inputs.outputs.cf_degraded != '1'` |
| run bulk tag runtime smoke | `... && steps.verify-bulk-inputs.outputs.cf_degraded != '1'` |
| redaction grep gate | `... && steps.verify-bulk-inputs.outputs.cf_degraded != '1'` |
| upload evidence artifact | `... && steps.verify-bulk-inputs.outputs.cf_degraded != '1'` |

- redaction / mask のロジック本体は変更しない（AC-8）。degrade 時に step ごと skip されるだけで、実走時の挙動は不変。
- 検証: `actionlint`。

### A3: `verify-runtime-smoke-secret-contract.mts`【新規】

- pure function を export: `extractWorkflowSecrets(yaml)` / `extractProvisionedSecrets(sh)` / `detectSecretContractViolations({ workflowSecrets, provisionedSecrets, exemptSecretRationales })` / 定数 `DEFAULT_EXEMPT_SECRET_RATIONALES`。
- `extractWorkflowSecrets`: 正規表現 `\$\{\{\s*secrets\.([A-Z0-9_]+)\s*\}\}` で全マッチを走査し、name を出現順に集めて `Set` で重複排除した配列を返す。
- `extractProvisionedSecrets`: 行単位で `"<NAME>:op://"` パターン（`"([A-Z0-9_]+):op:\/\/`）に一致する name のみ抽出。コメント行・非 op 行は無視。
- `detectSecretContractViolations`: missing provision は error、stale provision は warn、空 rationale exemption は error として返す。
- `DEFAULT_EXEMPT_SECRET_RATIONALES` は legacy static bearer fallback（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID`）の rationale map。`GITHUB_TOKEN` は抽出時に除外する。
- `main()`: `runtime-smoke-staging.yml` と `provision-staging-secrets.sh` を実ファイル読込 → 3 関数で突合 → `severity:"error"` が 1 件以上なら出力して `process.exit(1)`、error 0 件なら warn を出しても PASS して `exit 0`。
- entry guard: `if (import.meta.url === pathToFileURL(process.argv[1]).href) { main(); }`。import 時は `main()` を実行しない（テスト容易性）。
- トークン値は一切読まず、secret **name** 文字列のみ扱う（AC-8）。op 参照先の値解決（`op read`）は行わない。

### A4: `verify-runtime-smoke-secret-contract.spec.ts`【新規】

- Phase 4 の TC-1..TC-5 を実装。`scripts/smoke/__tests__/` 配下。`*.spec.ts` 命名（`*.test.ts` 禁止・不変条件 #8）。
- 検証: `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` で TC-1..TC-5 GREEN。

### A5: `verify-runtime-smoke-secret-contract.yml`【新規】CI gate

- `.github/workflows/verify-mint-env-contract.yml` を雛形にする（job 構成・Node setup・実行 step の形）。
- trigger は `pull_request` と `push`（`paths` フィルタは下記 footgun 注記に従う）。
- 実行 step: `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts`（A3 の `main()` を起動し違反で exit 1）。
- 検証: `actionlint`。

#### paths フィルタ footgun（重要）

- `pull_request.paths` フィルタを付けて**かつ required status check 化**すると、対象 paths を触らない PR で本 job が起動せず永続 pending となり PR を構造的にブロックする（MEMORY: paths footgun）。
- 既定方針: A5 は `pull_request` / `push` トリガで動かすが、**required status check への登録は行わない**（user-gated）。`paths` フィルタを付ける場合は required 化しないことと一対で扱う。required 化が必要なら `paths` を外して常時実行にするのが安全（既存 required workflow 群は `paths` 無し＝常時実行）。
- この判断は Phase 2/3 のリスク表に整合（drift gate を required 化すると非該当 PR が pending block）。

## Lane B — rotation reminder 撤廃 + runbook 置換

### B1: `cf-token-rotation-reminder.yml`【削除】

- ファイルを削除（`git rm`）。週次失効リマインダの ritual を撤廃（AC-5）。
- 削除前に stale 参照を grep して同時是正する:

```sh
grep -rn "cf-token-rotation-reminder" \
  --include="*.md" --include="*.yml" --include="*.yaml" --include="*.sh" \
  . ':!*.worktrees/*'
```

- ヒット箇所（CLAUDE.md / docs / 他 workflow の参照）を B2 runbook への参照に置換、または不要なら除去する。削除後に同 grep が 0 件（B1 削除対象自身を除く）であることを確認する。

### B2: 新 runbook【新規】

- パスは Phase 2 B2 で確定済の正本に従う（`cf-token-provisioning-and-revocation-runbook.md`）。
- 記載必須事項（AC-6）:
  - staging 用と production 用で**別トークン**を発行すること。
  - 各トークンは**狭スコープ**（必要最小の Cloudflare permission のみ。例: smoke が触る D1 / Workers の read/必要 write に限定）で発行すること。
  - **no-expiry（無期限）**で発行すること。週次/90日のカレンダーローテは行わない。
  - 漏洩・退役時の**即時失効**手順（Cloudflare ダッシュボードでの token revoke + 1Password item 更新 + `provision-staging-secrets.sh` 再実行）。
  - 1Password item（`op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` 等）の作成・更新手順。

### B3: 旧 runbook tombstone【編集】

- 旧 rotation runbook に「この手順は撤廃。CF トークン運用は B2 runbook（正本）を参照」の tombstone を冒頭へ追記し、本文の rotation 手順は B2 への誘導に置換する。

### B4: LOGS 追記【追記】

- 当該ワークフローの LOGS に「rotation reminder workflow 削除 + 即時失効 runbook へ置換」を 1 行記録する。

## Validation（Lane A/B 完了後）

| # | コマンド | 期待 |
| --- | ------ | ---- |
| V-1 | `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | TC-1..TC-5 GREEN |
| V-2 | `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts` | A1 追加後は violation 0 で exit 0（AC-4 追加後 PASS） |
| V-3 | `actionlint` | A2 / A5 YAML syntax OK |
| V-4 | `bash -n scripts/smoke/provision-staging-secrets.sh` | shell syntax OK |
| V-5 | `pnpm typecheck` | 型エラー 0 |
| V-6 | `pnpm lint` | lint エラー 0 |
| V-7 | 上記 grep（B1） | `cf-token-rotation-reminder` の stale 参照 0 件 |

AC-4 の「追加前 fail」は、A1 を当てる前の状態で V-2 を実行すると `CLOUDFLARE_API_TOKEN` が missing_provision として検出され exit 1 することを、A1 適用前後の二点で確認して証跡化する。

## 参照資料

| 資料 | パス | 用途 |
| ---- | ---- | ---- |
| security-operations | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | secret 投入正本・即時失効運用の原則 |
| cloudflare-edge-security | `.claude/skills/aiworkflow-requirements/references/cloudflare-edge-security.md` | CF API token の狭スコープ・環境分離の指針（AC-6） |
| security-principles | `.claude/skills/aiworkflow-requirements/references/security-principles.md` | 最小権限・爆発半径の考え方（本番トークンの扱い） |
| error-handling | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | degrade（任意依存欠落で fail-open skip）と hard-fail（前提欠落で fail-closed）の分離 |
| issue-526 actionlint/shellcheck gate | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` | YAML/shell 静的 gate の実装先例 |
| issue-1054 binding drift gate | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-1054-wrangler-binding-drift-ci-gate-2026-06.md` | drift gate workflow の雛形・required 化の footgun |

## 完了条件

- [ ] 新規 / 編集 / 削除ファイル一覧（FB-RT-03）が全て列挙されている。
- [ ] A1 の op 参照追加位置と、ACCOUNT_ID を SECRETS に含めない理由が明記されている。
- [x] A2 の degrade step bash 擬似コードと、後続 4 step の `if:` 追加条件が具体化されている。
- [ ] STAGING_* hard-fail（AC-3）と CF degrade（AC-2）が分離されている。
- [ ] A3 の pure function 契約・entry guard・name のみ扱う制約（AC-8）が明記されている。
- [ ] A5 の paths フィルタ footgun（required 未登録・既定 PR/push）が注記されている。
- [ ] B1 削除時の stale 参照 grep + 同時是正手順が明記されている。
- [ ] B2 runbook に staging/production 別トークン・狭スコープ・no-expiry・即時失効（AC-5/AC-6）が含まれる。
- [ ] Validation V-1..V-7 と AC-4 の追加前 fail / 追加後 PASS の二点確認が定義されている。
- [ ] `verify-mint-env-contract` を改変しない（AC-7）。
