# Phase 5: 実装

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## 1. 実装判定

`.github/workflows/web-cd.yml` の deploy 挙動変更（`permissions: id-token: write` 付与・OIDC exchange step 追加）は Cloudflare 公式 OIDC deploy support 未確認のため `skipped_by_unsupported_oidc`。本サイクルでは **周辺強化 5 件のみを実装**する。

## 2. 変更対象ファイル一覧

| パス | 種別 | 変更概要 |
|---|---|---|
| `scripts/oidc/verify-claim-pin.sh` | 新規 | subject claim 4 軸 dry-run 検証 helper |
| `scripts/redaction-check.sh` | 編集 | JWT + `cloudflare-aud` claim 検出パターン追加 |
| `.github/workflows/oidc-observation-window.yml` | 新規 | manual dispatch only / no-op verifier 雛形 |
| `.github/workflows/ci.yml` / `package.json` | 編集 | actionlint / `observation:lint` 対象に新規 workflow を追加 |
| `.github/workflows/web-cd.yml` | 編集（コメントのみ） | step-scoped token が current safe baseline である根拠コメント追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | future supported path gate G1-G4 + current safe baseline 追記 |

## 3. 周辺強化 1: `scripts/oidc/verify-claim-pin.sh`（新規）

### 3.1 full skeleton

```bash
#!/usr/bin/env bash
# scripts/oidc/verify-claim-pin.sh
# subject claim 4 軸（repository / ref / environment / event_name）の dry-run 検証 helper。
# 実 OIDC token を発行しない / 外部エンドポイントを叩かない / read-only。
#
# usage:
#   scripts/oidc/verify-claim-pin.sh \
#     --repository <owner/repo> \
#     --ref <refs/heads/main | refs/heads/dev> \
#     --environment <production | staging> \
#     --event-name <push>
#
# exit:
#   0 → 全 4 claim が固定値 + ref/environment 対応一致
#   1 → claim mismatch（mismatch 内容を stderr に出力）
#   2 → 引数エラー（usage を stderr に出力）
set -euo pipefail

readonly EXPECTED_REPOSITORY="daishiman/UBM-Hyogo"
readonly EXPECTED_EVENT_NAME="push"
# ref ↔ environment 対応表（後続実切替時に追加するならここを更新）
#   refs/heads/main → production
#   refs/heads/dev  → staging

usage() {
  cat >&2 <<'USAGE'
usage: scripts/oidc/verify-claim-pin.sh \
  --repository <owner/repo> \
  --ref <refs/heads/main | refs/heads/dev> \
  --environment <production | staging> \
  --event-name <push>
USAGE
}

REPOSITORY=""
REF=""
ENVIRONMENT=""
EVENT_NAME=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repository)  REPOSITORY="${2:-}"; shift 2 ;;
    --ref)         REF="${2:-}"; shift 2 ;;
    --environment) ENVIRONMENT="${2:-}"; shift 2 ;;
    --event-name)  EVENT_NAME="${2:-}"; shift 2 ;;
    -h|--help)     usage; exit 2 ;;
    *)             usage; exit 2 ;;
  esac
done

if [ -z "$REPOSITORY" ] || [ -z "$REF" ] || [ -z "$ENVIRONMENT" ] || [ -z "$EVENT_NAME" ]; then
  usage
  exit 2
fi

mismatches=0

if [ "$REPOSITORY" != "$EXPECTED_REPOSITORY" ]; then
  echo "MISMATCH repository: expected=${EXPECTED_REPOSITORY}, got=${REPOSITORY}" >&2
  mismatches=$((mismatches + 1))
fi

if [ "$EVENT_NAME" != "$EXPECTED_EVENT_NAME" ]; then
  echo "MISMATCH event_name: expected=${EXPECTED_EVENT_NAME}, got=${EVENT_NAME}" >&2
  mismatches=$((mismatches + 1))
fi

# ref / environment 対応一致
expected_env_for_ref=""
case "$REF" in
  refs/heads/main) expected_env_for_ref="production" ;;
  refs/heads/dev)  expected_env_for_ref="staging" ;;
  *)
    echo "MISMATCH ref: expected one of [refs/heads/main, refs/heads/dev], got=${REF}" >&2
    mismatches=$((mismatches + 1))
    ;;
esac

if [ -n "$expected_env_for_ref" ] && [ "$ENVIRONMENT" != "$expected_env_for_ref" ]; then
  echo "MISMATCH environment: expected=${expected_env_for_ref} (for ref=${REF}), got=${ENVIRONMENT}" >&2
  mismatches=$((mismatches + 1))
fi

if [ "$mismatches" -gt 0 ]; then
  exit 1
fi

echo "PASS: subject claim pin verified (repository=${REPOSITORY}, ref=${REF}, environment=${ENVIRONMENT}, event_name=${EVENT_NAME})"
exit 0
```

### 3.2 入出力

| 種別 | 内容 |
|---|---|
| 入力 | CLI 引数 4 件（`--repository` / `--ref` / `--environment` / `--event-name`、すべて必須） |
| 出力（stdout） | 一致時 `PASS: subject claim pin verified (...)` |
| 出力（stderr） | mismatch 1 件ごとに `MISMATCH <field>: expected=<val>, got=<val>` / 引数エラー時 usage |
| 副作用 | なし（外部 API call なし / OIDC token 発行なし / 一時ファイルなし） |
| exit code | 0=PASS / 1=mismatch / 2=引数エラー |

### 3.3 rollback 手順

```bash
git rm scripts/oidc/verify-claim-pin.sh
rmdir scripts/oidc  # 他ファイルがなければ
git commit -m "revert(issue-762): remove verify-claim-pin.sh"
```

## 4. 周辺強化 2: `scripts/redaction-check.sh`（編集）

### 4.1 追加パターン

既存の ACCOUNT_ID / token-like 検出ロジックの直後に以下を追加する（既存 `LEAK_FOUND` 集約フローに OR で合算）:

```bash
# --- issue-762 追加: JWT 形式 (header.payload.signature) ---
readonly JWT_REGEX='eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
JWT_MATCHES="$(grep -E -n "$JWT_REGEX" "$INPUT_SRC" 2>/dev/null || true)"
if [ -n "$JWT_MATCHES" ]; then
  echo "::error::JWT-like token detected in log"
  printf '%s\n' "$JWT_MATCHES" | mask_line
  LEAK_FOUND=1
fi

# --- issue-762 追加: cloudflare-aud claim 文字列 ---
CF_AUD_MATCHES="$(grep -F -n "cloudflare-aud" "$INPUT_SRC" 2>/dev/null || true)"
if [ -n "$CF_AUD_MATCHES" ]; then
  echo "::error::cloudflare-aud claim detected in log"
  printf '%s\n' "$CF_AUD_MATCHES" | mask_line
  LEAK_FOUND=1
fi
```

### 4.2 diff 方針

| 項目 | 内容 |
|---|---|
| 既存 CLI | `--log` / `--account-id` / `--token-value-for-test` / stdin すべて不変 |
| 既存 exit semantics | leak あり=非ゼロ exit を維持（`LEAK_FOUND` フラグに OR 合算） |
| 既存 `mask_line` 関数 | 再利用（重複定義しない） |
| 既存 `TOKEN_REGEX` | 不変。JWT 専用 regex は別変数 `JWT_REGEX` で限定 |
| false positive 制御 | JWT は `eyJ` プレフィックス + 2 つの `.` 区切りで限定。`pnpm-lock.yaml` integrity hash（`sha512-...`、`.` を含まない）は誤検出しない |
| 出力フォーマット | 既存 `::error::` style を踏襲（GitHub Actions annotation 互換） |

### 4.3 入出力

| 種別 | 内容 |
|---|---|
| 入力 | `--log <path>` または stdin（既存仕様） |
| 出力 | leak 検出時 `::error::JWT-like token detected in log` / `::error::cloudflare-aud claim detected in log` + masked 行 |
| 副作用 | `mktemp` 一時ファイル（既存 trap で削除） |
| exit code | leak あり=非ゼロ / なし=0（既存と同じ） |

### 4.4 rollback 手順

```bash
git checkout dev -- scripts/redaction-check.sh
git commit -m "revert(issue-762): rollback redaction-check JWT + cf-aud extension"
```

## 5. 周辺強化 3: `.github/workflows/oidc-observation-window.yml`（新規）

### 5.1 full skeleton

```yaml
# 目的: OIDC 切替後の observation window で fallback 起動 0 件を確認する manual gate 雛形。
# 本サイクル（issue-762）では no-op verifier。後続実切替 PR で実 verifier に差し替える。
# 詳細: docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/
name: oidc-observation-window
on:
  workflow_dispatch:
    inputs:
      window_label:
        description: 'observation label (e.g., 2026-06-staging-proof)'
        required: true
        type: string
permissions:
  contents: read
concurrency:
  group: oidc-observation-window-${{ inputs.window_label }}
  cancel-in-progress: false
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: No-op observation gate (manual)
        run: |
          echo "observation window manual gate: ${{ inputs.window_label }}"
          echo "TODO(後続サイクル): fallback 起動回数 0 件確認 / deploy version 突合 / Cloudflare dashboard 突合"
```

### 5.2 制約

- trigger: `workflow_dispatch` のみ（`push` / `schedule` を持たせない）
- permissions: `contents: read` のみ（`id-token: write` を付与しない）
- step: `actions/checkout@v4` + echo only の no-op
- `actionlint` PASS / `shellcheck` 警告を生じないよう echo のみの最小構成

### 5.3 rollback 手順

```bash
git rm .github/workflows/oidc-observation-window.yml
git commit -m "revert(issue-762): remove oidc-observation-window workflow"
```

## 6. 周辺強化 4: `.github/workflows/web-cd.yml`（編集・コメントのみ）

### 6.1 追加箇所と文言

既存 `web-cd.yml` の staging deploy job（line 44 付近）と production deploy job（line 89 付近）の **deploy step `env:` / `with:` ブロック直前** に以下コメントを追加する（YAML semantics 不変）:

```yaml
      # NOTE(issue-762): step-scoped `secrets.CLOUDFLARE_API_TOKEN` は current safe baseline。
      # Cloudflare 公式 OIDC deploy support (`cloudflare/wrangler-action#402`) が
      # supported になるまで `permissions: id-token: write` と OIDC exchange step は追加しない。
      # 詳細: docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/
      - name: Deploy to Cloudflare Workers (...)
```

文言は staging / production の両 job で完全一致させる。`grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml` が `2` を返すこと。

### 6.2 不変条件

| 項目 | 維持 |
|---|---|
| `permissions:` ブロック | `contents: read` のみ（本サイクルで `id-token: write` を付与しない） |
| `on:` trigger | 既存維持 |
| deploy step の `env:` / `with:` | 既存維持 |
| step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路 | 既存維持（rollback path 温存） |
| `actionlint` 結果 | PASS 維持 |

### 6.3 rollback 手順

```bash
git checkout dev -- .github/workflows/web-cd.yml
git commit -m "revert(issue-762): remove web-cd.yml rationale comments"
```

## 7. 周辺強化 5: `deployment-secrets-management.md`（編集）

### 7.1 追記内容

既存 H2 階層に揃え、ファイル末尾もしくは「current secret boundary」セクション直後に以下を追加:

```markdown
## OIDC Future Supported Path Gate（issue-762 反映）

Cloudflare 公式 OIDC deploy support が確認された後にのみ、以下 G1-G4 を順に満たすこと。

| Gate | 内容 | 担当 |
|---|---|---|
| G1 | Cloudflare docs / `cloudflare/wrangler-action` release notes が input 名 / audience / exchange endpoint / rollback path を明示 | 後続サイクル primary-source revalidation |
| G2 | staging job で OIDC proof 取得、redacted log + `scripts/redaction-check.sh` PASS + `scripts/oidc/verify-claim-pin.sh` PASS | issue-717-followup-001 後続 |
| G3 | production cutover（subject claim pin: `repository=daishiman/UBM-Hyogo`, `ref=refs/heads/main`, `environment=production`, `event_name=push`） | issue-717-followup-001 後続 |
| G4 | observation window で fallback 起動 0 件確認後、legacy token 物理失効を `docs/30-workflows/issue-718-legacy-cf-token-revocation` で実行 | docs/30-workflows/issue-718-legacy-cf-token-revocation |

### current safe baseline（2026-05-17 時点）

- `.github/workflows/web-cd.yml` は step-scoped `secrets.CLOUDFLARE_API_TOKEN` を維持
- `permissions: id-token: write` は付与しない
- `scripts/redaction-check.sh` は JWT 形式 + `cloudflare-aud` claim 文字列も leak 検出
- `scripts/oidc/verify-claim-pin.sh` は dry-run 検証 helper として常時利用可能
- `.github/workflows/oidc-observation-window.yml` は `workflow_dispatch` only の no-op 雛形

repo 移管（`daishiman/UBM-Hyogo` 以外への変更）時は本セクションと `scripts/oidc/verify-claim-pin.sh` の `EXPECTED_REPOSITORY` を同時更新する。
```

### 7.2 不変条件

- 既存セクションの heading / 順序を破壊しない
- 既存 link / 用語と整合（`CLOUDFLARE_API_TOKEN` / `issue-640` / `issue-717` 等）
- markdown lint（lefthook 既存設定）PASS

### 7.3 rollback 手順

```bash
git checkout dev -- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
mise exec -- pnpm indexes:rebuild
git add .claude/skills/aiworkflow-requirements/indexes/
git commit -m "revert(issue-762): rollback deployment-secrets-management.md gate section"
```

## 8. 実装順序

1. `scripts/oidc/verify-claim-pin.sh` 新規 → `shellcheck` → 手動 dry-run
2. `scripts/redaction-check.sh` 編集 → `shellcheck` → 既存 regression 確認
3. `.github/workflows/oidc-observation-window.yml` 新規 → `actionlint`
4. `.github/workflows/web-cd.yml` 編集 → `actionlint` → diff guard
5. `deployment-secrets-management.md` 編集 → markdown lint → `mise exec -- pnpm indexes:rebuild`

各ステップ完了後に該当 lint / test を即時実行し、失敗時は次ステップに進まない。

## 9. 検証コマンド

```bash
# 1. 静的解析
shellcheck scripts/oidc/verify-claim-pin.sh scripts/redaction-check.sh
actionlint .github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml

# 2. claim pin dry-run（PASS 例）
bash scripts/oidc/verify-claim-pin.sh \
  --repository daishiman/UBM-Hyogo \
  --ref refs/heads/main \
  --environment production \
  --event-name push

# 3. 構造 grep
grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml   # → 2
rg -n "id-token" .github/workflows/web-cd.yml             # → 0 件
rg -n "id-token" .github/workflows/oidc-observation-window.yml  # → 0 件

# 4. indexes drift
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/

# 5. CI 等価
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 10. DoD

### 機能 DoD

- [ ] `scripts/oidc/verify-claim-pin.sh` が PASS / mismatch / 引数エラーで規定 exit code を返す
- [ ] `scripts/redaction-check.sh` が JWT 形式・`cloudflare-aud` claim を検出し非ゼロ exit する
- [ ] `.github/workflows/oidc-observation-window.yml` が `workflow_dispatch` only / `permissions: contents: read` のみで `actionlint` PASS
- [ ] `.github/workflows/web-cd.yml` の deploy 挙動が不変（diff はコメント追加のみ）
- [ ] `deployment-secrets-management.md` に future supported path gate G1-G4 + current safe baseline が追記されている

### 品質 DoD

- [ ] `shellcheck` 警告 0 件（全対象 shell script）
- [ ] `actionlint` 警告 0 件（全対象 workflow）
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `indexes` drift 0 件

### セキュリティ DoD

- [ ] 実 OIDC token / 実 JWT 値 / 実 Cloudflare Account ID が成果物・log・コミットに含まれない
- [ ] `permissions: id-token: write` を本サイクルで付与していない
- [ ] step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路の rollback path 温存
