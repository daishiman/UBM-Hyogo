# Phase 6: テスト拡充 — cf-token-env-contract-and-rotation-retirement

## 目的

Phase 4 の happy path（TC-1..TC-5）に対し、fail path・境界ケース・回帰 guard を追加し、drift gate（A3）が壊れ方・誤検出・取りこぼしを起こさないことを保証する。あわせて `verify-mint-env-contract` が無改変であること（AC-7）と、mint 系 secret が consumed に現れても provisioned 済みのため通過すること（回帰）を確認する。

## 追加テストケース（境界・fail path）

| # | ケース | 入力 fixture | 期待 |
| --- | ------ | ----------- | ---- |
| TC-E01 | 空 YAML | `extractWorkflowSecrets("")` | `[]`（例外を投げず空配列。consumed 0 件） |
| TC-E02 | secrets 参照 0 件の非空 YAML | `${{ secrets.* }}` を含まない YAML（`run:` のみ等） | `[]`（マッチ 0 で空配列） |
| TC-E03 | provisioned 0 件 | `extractProvisionedSecrets("")` | `[]`（op 参照行なしで空配列） |
| TC-E04 | 複数 gap | `consumed=["CLOUDFLARE_API_TOKEN","STAGING_API_BASE","STAGING_ADMIN_BEARER"]`, `provisioned=["STAGING_API_BASE"]`, `exempt=[]` | 違反 2 件（CLOUDFLARE_API_TOKEN / STAGING_ADMIN_BEARER）。各 `kind:"missing_provision"` / `severity:"error"`。順序は consumed 出現順 |
| TC-E05 | legacy fallback exemption | `workflowSecrets=["STAGING_ADMIN_BEARER"]`, `provisionedSecrets=[]`, `exemptSecretRationales={STAGING_ADMIN_BEARER:"legacy fallback"}` | 違反 0 件（rationale 付き exemption で充足） |
| TC-E06 | empty rationale rejection | `workflowSecrets=["STAGING_ADMIN_BEARER"]`, `provisionedSecrets=[]`, `exemptSecretRationales={STAGING_ADMIN_BEARER:""}` | `missing_exemption_rationale` error |
| TC-E07 | provisioned に余剰（workflow に無い secret） | `workflowSecrets=["STAGING_API_BASE"]`, `provisionedSecrets=["STAGING_API_BASE","UNUSED_SECRET"]` | `stale_provision` warn（error ではない。over-provision を fail にしない方針を固定） |
| TC-E08 | provision 行の op 参照に複数コロン | `extractProvisionedSecrets` に `"CLOUDFLARE_API_TOKEN:op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE"` | `["CLOUDFLARE_API_TOKEN"]`（最初のコロンまでを name とし、op 参照内のコロン・スラッシュを誤って name に含めない） |
| TC-E09 | コメント / 非 op 行の除外 | shell に `# "FAKE_SECRET:op://..."`（コメント）と `LOCAL_VAR="plain"`（非 op）を混在 | これらは抽出されない（コメント行を name 抽出しない） |
| TC-E10 | 大文字小文字・記号境界 | YAML に `${{secrets.NO_SPACE}}` と `${{ secrets.WITH_SPACE }}` | 両方抽出（正規表現が `\s*` で空白有無を吸収） |

## 回帰 guard

### RG-1: mint 系 secret の通過（誤検出回帰防止）

- `STAGING_AUTH_SECRET` 等の mint 系 secret は `runtime-smoke-staging.yml` で consumed に現れ、かつ `provision-staging-secrets.sh` で provisioned 済み。
- 期待: `consumed=["STAGING_AUTH_SECRET","CLOUDFLARE_API_TOKEN"]`, `provisioned=["STAGING_AUTH_SECRET","CLOUDFLARE_API_TOKEN"]` → 違反 0 件。
- 趣旨: A1 で CF トークンを追加した後、mint 系 secret を誤って missing_provision として誤検出しないことを固定する。drift gate の責務は「未 provision の consumed を検出」であって「mint 系を巻き込む」ことではない。

### RG-2: 実ファイル統合（I/O smoke）

- `main()` が実 `runtime-smoke-staging.yml` + 実 `provision-staging-secrets.sh` を読んだとき、A1 適用後は violation 0 で exit 0 になることを統合的に確認する（`pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts`）。
- A1 適用**前**の状態（CF トークン未追加）では `CLOUDFLARE_API_TOKEN` が gap となり exit 1 することを確認し、AC-4 の「追加前 fail」証跡とする。

### RG-3: `verify-mint-env-contract` 無改変（AC-7）

- 検証方針: `git diff` 上で `.github/workflows/verify-mint-env-contract.yml` および mint contract verifier 本体に変更が含まれないことを確認する（`git diff --name-only <base>...HEAD` に mint 系ファイルが現れない）。
- mint gate の Vitest（既存）が本変更の前後で pass のまま不変であることを `pnpm vitest run`（mint contract spec）で確認する。CF drift gate（A3）と mint gate は別ファイル・別責務で独立しており、相互に影響しないことを回帰として固定する。

### RG-4: degrade 後続 step の if 回帰（actionlint + 手動 trace）

- Phase 4 マトリクス M-1..M-5 を A2 編集後に再 trace し、`actionlint` が green かつ後続 4 step の `if:` に `steps.verify-bulk-inputs.outputs.cf_degraded != '1'` が含まれることを確認する。
- 既存の `RUNTIME_SMOKE_MINT_DEGRADED` 条件が誤って除去・上書きされていないことを diff で確認（mint degrade と CF degrade が AND で共存）。

## 検証コマンド

| # | コマンド | 対象 |
| --- | ------ | ---- |
| 1 | `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts` | TC-E01..TC-E10 / RG-1 |
| 2 | `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts` | RG-2（実ファイル統合） |
| 3 | `actionlint` | RG-4（A2 / A5 YAML） |
| 4 | `git diff --name-only <base>...HEAD` | RG-3（mint 系ファイル不在の確認） |

## 参照資料

| 資料 | パス | 用途 |
| ---- | ---- | ---- |
| testing-fixtures | `.claude/skills/aiworkflow-requirements/references/testing-fixtures.md` | 境界 fixture の設計・空入力の決定性 |
| security-input-validation | `.claude/skills/aiworkflow-requirements/references/security-input-validation.md` | 空 / 不正入力（空 YAML・コメント行）の堅牢な扱い |
| error-handling | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail path を例外でなく構造化結果で表現する一貫性 |
| security-operations | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | over-provision を error にしない運用判断の根拠 |
| issue-526 actionlint/shellcheck gate | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` | YAML degrade の回帰 trace 方針 |

## 完了条件

- [ ] 空 YAML / secrets 0 件 / provisioned 0 件 / 複数 gap / rationale 付き exemption / stale provision の境界（TC-E01..TC-E10）が網羅されている。
- [ ] over-provision（provisioned 余剰）を error にしない方針が TC-E07 で固定されている。
- [ ] mint 系 secret が consumed に現れても通過する回帰（RG-1）が定義されている。
- [ ] AC-4 の追加前 fail / 追加後 PASS が実ファイル統合（RG-2）で確認される。
- [ ] `verify-mint-env-contract` 無改変（RG-3・AC-7）の確認方針が明記されている。
- [ ] degrade if 条件の回帰（RG-4）と mint degrade との共存が確認されている。
