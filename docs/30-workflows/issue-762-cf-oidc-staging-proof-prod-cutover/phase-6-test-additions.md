# Phase 6: テスト拡充

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## 1. 判定

Phase 5 で実装する周辺強化 5 件のうち、shell script 2 件（`verify-claim-pin.sh` / `redaction-check.sh`）と workflow 1 件（`oidc-observation-window.yml`）に対し自動テストを追加する。`web-cd.yml`（コメントのみ）と `deployment-secrets-management.md`（reference doc）は静的検証（actionlint / markdown lint / 構造 grep）のみで担保する。

| 対象 | 追加テスト | 形式 |
|---|---|---|
| `scripts/oidc/verify-claim-pin.sh` | `scripts/oidc/__tests__/verify-claim-pin.spec.sh` | plain bash spec（repo 既存スタイル） |
| `scripts/redaction-check.sh` | `scripts/__tests__/redaction-check.test.sh` | plain bash fixture test + existing regression |
| `.github/workflows/oidc-observation-window.yml` | `actionlint` + 構造 grep | CI static |
| `.github/workflows/web-cd.yml` | `actionlint` + diff guard | CI static |
| `deployment-secrets-management.md` | markdown lint + 構造 grep | static |

## 2. 追加テスト: `scripts/oidc/__tests__/verify-claim-pin.spec.sh`

実装ではリポジトリ既存の plain bash spec 形式を採用した。対象ケースは production PASS / staging PASS / repository mismatch / ref mismatch / environment mismatch / event mismatch / argument missing / ref-environment pair mismatch / unknown option の 9 assertions。

### 2.1 ファイル骨子

```bash
#!/usr/bin/env bash
# scripts/oidc/__tests__/verify-claim-pin.spec.sh

setup() {
  SCRIPT="scripts/oidc/verify-claim-pin.sh"
}

@test "T1: 4 軸完全一致 (main/production) → exit 0" {
  run bash "$SCRIPT" \
    --repository daishiman/UBM-Hyogo \
    --ref refs/heads/main \
    --environment production \
    --event-name push
  [ "$status" -eq 0 ]
  [[ "$output" == *"PASS: subject claim pin verified"* ]]
}

@test "T2: 4 軸完全一致 (dev/staging) → exit 0" {
  run bash "$SCRIPT" \
    --repository daishiman/UBM-Hyogo \
    --ref refs/heads/dev \
    --environment staging \
    --event-name push
  [ "$status" -eq 0 ]
}

@test "T3: repository mismatch → exit 1" {
  run bash "$SCRIPT" \
    --repository daishiman/OTHER-REPO \
    --ref refs/heads/main \
    --environment production \
    --event-name push
  [ "$status" -eq 1 ]
  [[ "$stderr" == *"MISMATCH repository:"* ]] || [[ "$output" == *"MISMATCH repository:"* ]]
}

@test "T4: ref mismatch → exit 1" {
  run bash "$SCRIPT" \
    --repository daishiman/UBM-Hyogo \
    --ref refs/heads/feature/foo \
    --environment production \
    --event-name push
  [ "$status" -eq 1 ]
}

@test "T5: environment mismatch (main + staging) → exit 1" {
  run bash "$SCRIPT" \
    --repository daishiman/UBM-Hyogo \
    --ref refs/heads/main \
    --environment staging \
    --event-name push
  [ "$status" -eq 1 ]
}

@test "T6: event_name mismatch → exit 1" {
  run bash "$SCRIPT" \
    --repository daishiman/UBM-Hyogo \
    --ref refs/heads/main \
    --environment production \
    --event-name pull_request
  [ "$status" -eq 1 ]
}

@test "T7: --repository 省略 → exit 2 (引数エラー)" {
  run bash "$SCRIPT" \
    --ref refs/heads/main \
    --environment production \
    --event-name push
  [ "$status" -eq 2 ]
}

@test "T8: 全引数省略 → exit 2 (引数エラー)" {
  run bash "$SCRIPT"
  [ "$status" -eq 2 ]
}
```

### 2.2 期待結果

| Test | 期待 status | 期待出力 |
|---|---|---|
| T1 | 0 | `PASS: subject claim pin verified ...` |
| T2 | 0 | `PASS: subject claim pin verified ...` |
| T3 | 1 | stderr に `MISMATCH repository:` |
| T4 | 1 | stderr に `MISMATCH ref:` |
| T5 | 1 | stderr に `MISMATCH environment:` |
| T6 | 1 | stderr に `MISMATCH event_name:` |
| T7 | 2 | stderr に usage |
| T8 | 2 | stderr に usage |

### 2.3 検証コマンド

```bash
bash scripts/oidc/__tests__/verify-claim-pin.spec.sh
```

## 3. 追加テスト: `scripts/__tests__/redaction-check.test.sh`

実装では既存 `redaction-check.test.sh` に JWT-like token、`cloudflare-aud`、integrity false-positive 回避を追加した。既存 ACCOUNT_ID / multiline / token-like regression を含め、合計 15 assertions で検証する。

### 3.1 fixture 配置

`scripts/__tests__/tmp-fixtures/` を新規作成し、以下を配置:

| ファイル | 内容（実 token は使わない・dummy のみ） |
|---|---|
| `jwt-only.log` | `auth: Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.signature_part_abcdef` |
| `cf-aud-only.log` | `claim: cloudflare-aud=foo` |
| `clean.log` | `OK: deploy completed, no secrets` |
| `pnpm-lock-integrity.log` | `integrity: sha512-eyJabcdef0123456789MNOPQRSTUVWXYZ==` |
| `account-id-leak.log` | `account_id=00000000000000000000000000000000`（既存 ACCOUNT_ID 32-hex pattern） |
| `jwt-and-cf-aud.log` | jwt-only.log と cf-aud-only.log を連結 |
| `empty.log` | 空ファイル |

### 3.2 ファイル骨子

```bash
#!/usr/bin/env bash
# scripts/__tests__/redaction-check.test.sh

setup() {
  SCRIPT="scripts/redaction-check.sh"
  FIX="scripts/__tests__/tmp-fixtures"
}

@test "R1: JWT のみを含む log → 非ゼロ exit + JWT error" {
  run bash "$SCRIPT" --log "$FIX/jwt-only.log"
  [ "$status" -ne 0 ]
  [[ "$output" == *"JWT-like token detected in log"* ]]
}

@test "R2: cloudflare-aud のみを含む log → 非ゼロ exit + cf-aud error" {
  run bash "$SCRIPT" --log "$FIX/cf-aud-only.log"
  [ "$status" -ne 0 ]
  [[ "$output" == *"cloudflare-aud claim detected in log"* ]]
}

@test "R3: clean log → exit 0" {
  run bash "$SCRIPT" --log "$FIX/clean.log"
  [ "$status" -eq 0 ]
}

@test "R4: pnpm-lock integrity hash → 誤検出しない (exit 0)" {
  run bash "$SCRIPT" --log "$FIX/pnpm-lock-integrity.log"
  [ "$status" -eq 0 ]
  [[ "$output" != *"JWT-like token detected"* ]]
}

@test "R5: 既存 ACCOUNT_ID leak regression → 非ゼロ exit" {
  run bash "$SCRIPT" --log "$FIX/account-id-leak.log"
  [ "$status" -ne 0 ]
}

@test "R6: JWT + cf-aud 両方含む log → 非ゼロ exit + 両方の error" {
  run bash "$SCRIPT" --log "$FIX/jwt-and-cf-aud.log"
  [ "$status" -ne 0 ]
  [[ "$output" == *"JWT-like token detected in log"* ]]
  [[ "$output" == *"cloudflare-aud claim detected in log"* ]]
}

@test "R7: empty log → exit 0" {
  run bash "$SCRIPT" --log "$FIX/empty.log"
  [ "$status" -eq 0 ]
}
```

### 3.3 期待結果

| Test | 期待 status | 期待出力 |
|---|---|---|
| R1 | 非ゼロ | `::error::JWT-like token detected in log` |
| R2 | 非ゼロ | `::error::cloudflare-aud claim detected in log` |
| R3 | 0 | `::error::` 行なし |
| R4 | 0 | JWT 誤検出なし（false positive 回避） |
| R5 | 非ゼロ | 既存 ACCOUNT_ID leak regression PASS |
| R6 | 非ゼロ | JWT + cf-aud 両 error 行 |
| R7 | 0 | error 行なし |

### 3.4 検証コマンド

```bash
bash scripts/__tests__/redaction-check.test.sh
```

## 4. 追加検証: `.github/workflows/oidc-observation-window.yml`

### 4.1 actionlint

```bash
actionlint .github/workflows/oidc-observation-window.yml
# 期待: exit 0、warning / error 0 件
```

### 4.2 構造 grep

```bash
# trigger は workflow_dispatch のみ
rg -n "^on:" -A 5 .github/workflows/oidc-observation-window.yml | rg -v "push|schedule"
# 期待: push / schedule 行なし

# id-token: write 未付与
test "$(rg -c 'id-token' .github/workflows/oidc-observation-window.yml || echo 0)" = "0"

# permissions: contents: read のみ
rg -n "permissions:" -A 3 .github/workflows/oidc-observation-window.yml
# 期待: contents: read のみ
```

## 5. 追加検証: `.github/workflows/web-cd.yml`

### 5.1 actionlint

```bash
actionlint .github/workflows/web-cd.yml
# 期待: exit 0
```

### 5.2 diff guard + comment count

```bash
# コメント追加のみであることを確認
git diff dev -- .github/workflows/web-cd.yml

# NOTE(issue-762) コメントが 2 箇所（staging / production）
test "$(grep -c 'NOTE(issue-762)' .github/workflows/web-cd.yml)" = "2"

# 本サイクルで id-token: write を追加していないこと
test "$(rg -c 'id-token' .github/workflows/web-cd.yml || echo 0)" = "0"
```

## 6. 追加検証: `deployment-secrets-management.md`

```bash
DOC=".claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md"

# 追加見出し存在
rg -n "OIDC Future Supported Path Gate（issue-762 反映）" "$DOC"
rg -n "current safe baseline（2026-05-17 時点）" "$DOC"

# G1-G4 行存在
test "$(rg -c '^\| G[1-4] \|' "$DOC")" = "4"

# markdown lint（lefthook 既存設定）
# 通常 pnpm lint or lefthook run pre-commit で同等

# indexes drift
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/
```

## 7. 実行手順（ローカル全件）

```bash
# 1. 静的解析
shellcheck scripts/oidc/verify-claim-pin.sh scripts/redaction-check.sh
actionlint .github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml

# 2. plain bash spec
bash scripts/oidc/__tests__/verify-claim-pin.spec.sh
bash scripts/__tests__/redaction-check.test.sh

# 3. 既存 regression
bash scripts/__tests__/redaction-check.test.sh
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4. 構造 grep + indexes drift
test "$(grep -c 'NOTE(issue-762)' .github/workflows/web-cd.yml)" = "2"
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/
```

## 8. CI 統合方針

| CI gate | 追加 / 既存 | 整合性 |
|---|---|---|
| `actionlint` | 既存 | `.github/workflows/ci.yml` と `package.json` `observation:lint` の対象に `.github/workflows/oidc-observation-window.yml` を同一 wave で追加 |
| `verify-indexes-up-to-date` | 既存 | reference doc 編集後 `pnpm indexes:rebuild` を Phase 5 で実行 |
| `verify-gate-metadata` | 既存 | `index.md` の Phase 表と本ファイル名 1:1 一致 |
| `verify-test-suffix` | 既存 | plain bash spec は `*.test.{ts,tsx}` 禁止 suffix に該当しない |
| `shellcheck` / shell spec CI step | 既存または追加 | リポジトリ既存 CI が対象 shell spec を未実行ならば、ローカル DoD として `outputs/phase-11/local-verification-summary.md` に記録し PR description に明記 |

## 9. Future Test Scope（後続サイクル送り）

公式 support 確認後の後続サイクルで新規テスト対象にする項目（本サイクル範囲外）:

- `id-token: write` scope grep（`web-cd.yml` 実切替後）
- 実 OIDC exchange step の input / audience / endpoint 整合性
- 実 staging proof run の redacted log + `verify-claim-pin.sh` 統合テスト
- step-scoped token fallback rehearsal
- `oidc-observation-window.yml` の no-op verifier を実 verifier（fallback 起動カウント取得）に差し替えるテスト

## 10. DoD

### 機能 DoD

- [x] `scripts/oidc/__tests__/verify-claim-pin.spec.sh` の 9 assertions すべて PASS
- [x] `scripts/__tests__/redaction-check.test.sh` の 15 assertions すべて PASS
- [x] `actionlint` が新規 / 編集 workflow 両方で 0 warn
- [ ] `web-cd.yml` の `NOTE(issue-762)` コメントが 2 箇所
- [ ] `deployment-secrets-management.md` に G1-G4 + current safe baseline セクションが存在

### 品質 DoD

- [ ] 既存 `scripts/__tests__/` regression 0 件（存在する場合）
- [ ] `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` PASS
- [ ] `indexes` drift 0 件
- [ ] test fixture に実 OIDC token / 実 JWT 値 / 実 Cloudflare Account ID を含めていない

### セキュリティ DoD

- [ ] R4 で `pnpm-lock.yaml` integrity hash 風 base64 を JWT として誤検出しない
- [ ] R5 で既存 ACCOUNT_ID leak 検出が regression なく動作
- [ ] `oidc-observation-window.yml` に `id-token` 文字列が含まれない（grep ヒット 0 件）
