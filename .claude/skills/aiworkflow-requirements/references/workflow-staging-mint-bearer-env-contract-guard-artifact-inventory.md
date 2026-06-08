# Workflow Artifact Inventory — staging-mint-bearer-env-contract-guard

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` |
| purpose | `runtime-smoke-staging.yml` の bulk-tag admin-only mint step が ME 系 env 欠落で落ちる drift を、role-scoped mint contract と static verifier で再発防止する |
| parent | `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/` |

## Implementation

| Path | Role |
| --- | --- |
| `scripts/smoke/mint-staging-bearers.mts` | `--roles admin|me|admin,me`、role-scoped required env、degrade marker を実装 |
| `scripts/smoke/verify-mint-env-contract.mts` | workflow step env / roles / provisioned secrets の static drift gate |
| `.github/workflows/runtime-smoke-staging.yml` | bulk-tag mint step を `--roles admin` に限定し、degrade marker 時は後続 bulk smoke を skip |
| `.github/workflows/verify-mint-env-contract.yml` | PR/push gate |
| `scripts/smoke/provision-staging-secrets.sh` | JWT-mint secret 集合へ provision inventory を整合 |
| `scripts/smoke/README.md` | role-scoped mint helper usage |

## Evidence

| Evidence | Result |
| --- | --- |
| `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | 3 files / 27 tests PASS |
| `pnpm exec tsx scripts/smoke/verify-mint-env-contract.mts` | PASS (2 mint steps, 7 provisioned secrets) |
| `bash -n scripts/smoke/provision-staging-secrets.sh` | PASS |
| `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml .github/workflows/verify-mint-env-contract.yml` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS（stablekey-literal warning 3 件は既存 warning mode） |

## User-Gated

- GitHub Environment secret mutation / 1Password item creation.
- Staging deploy / real GitHub Actions runtime smoke / real D1 mutation.
- Required status check registration for `verify-mint-env-contract / verify`.
- Commit / push / PR.

## Lessons Learned

苦戦箇所・将来同型タスクを簡潔に解決するための知見（inline 保持・L-SMBE-001..009）。

| ID | 要点 |
| --- | --- |
| L-SMBE-001 | caller(workflow step)が要求する env と callee(mint script)が必須化する env の食い違い（契約 drift）は「`verify-*` 命名 + 契約算出 pure 関数 + fixture test + workflow gate」の 4 点セットで PR 時点 fail-fast 検出する。`verify-hook-integrity` / `verify-indexes` / `verify-design-tokens` と同型の再発防止パターン |
| L-SMBE-002 | role→env 契約は `ROLE_REQUIRED_ENV` / `COMMON_REQUIRED_ENV` の単一定数に集約し、mint script と gate の双方が import する（二重定義を排除）。契約 SSOT を 1 箇所に置くことで gate と実体の乖離が原理的に発生しない |
| L-SMBE-003 | degrade の状態所有権を分離する。判定（入力フラグ `RUNTIME_SMOKE_MINT_DEGRADE` 読取）= mint script、job skip の最終判定（結果 marker `RUNTIME_SMOKE_MINT_DEGRADED` 読取）= workflow。**入力フラグと結果 marker を別名**にして「入力と結果の取り違え」事故を防ぐ |
| L-SMBE-004 | degrade（セキュリティ緩和）は staging 限定。production には適用しない境界を AC（AC-10=staging 既定 / AC-11=production hard-fail 維持）に明示し、production workflow に degrade env を設定しない差分で機械的に担保する |
| L-SMBE-005 | role-scoping の後方互換は `parseRoles` の既定 `["admin","me"]` で維持し、既存 spec を無改修 PASS（AC-12）。`requiredEnvForRoles(["admin"])` に ME env を含めないことで admin-only job が ME env 欠落で exit 2 になる回帰（RC-1/RC-2）を防ぐ |
| L-SMBE-006 | JWT/secret 非露出は pure 関数化で担保。pure 関数は env を引数で受け取り `process.env` 直読は `main()` のみ。`findMissingEnv` は存在判定のみで出力は env 名のみ（値・JWT 文字列を console/stdout/エラーに出さない） |
| L-SMBE-007 | gate の YAML descriptor 抽出は js-yaml 優先・不在時は正規表現 fallback。matrix 内 mint step や複数行 `run` の `--roles` 指定が増えると抽出漏れリスクがあるため、2 本目以降の mint step 追加時に網羅性を再点検する（baseline 残課題 M-2） |
| L-SMBE-008 | 新 env（`MINT_ROLES` / `RUNTIME_SMOKE_MINT_DEGRADE`）・新 CLI 契約（`--roles`）は API/IPC/UI/auth/schema/Secret 正本の契約変更ではない CI/script 派生物。system-spec Step 2 = N/A とし、documentation-changelog に記録する（FB-3） |
| L-SMBE-009 | 同期 wave では artifact-inventory の `## Lessons Learned` 節 と自動生成 index（topic-map / keywords）の再生成が漏れやすい。同期完了前に `grep -c <slug> indexes/topic-map.md indexes/keywords.json` と inventory の Lessons 節存在を機械確認する（本タスクでも当初欠落・`pnpm indexes:rebuild` 未実行で stale だった） |
