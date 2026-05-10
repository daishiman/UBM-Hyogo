# Phase 11: 手動受入 evidence（task-02 — NON_VISUAL）

| 項目 | 値 |
|------|----|
| 入力 | `phase-10.md` GO 判定 |
| 出力 | runtime 観測ログ + 静的検証ログ |
| 保存先 | `outputs/phase-11/evidence/` |
| visualEvidence | NON_VISUAL（CI workflow / runbook 編集のため UI スクショなし） |

---

## 1. evidence 一覧

| # | ファイル | 取得 phase | 取得方法 |
|---|---------|-----------|---------|
| E-1 | `yaml-syntax.log` | phase-6 ST-1 | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/runtime-smoke-staging.yml'))"` 出力（成功時は空、stderr を含めて redirect） |
| E-2 | `actionlint.log` | phase-6 ST-3 / phase-9 QG-1 | `pnpm dlx actionlint -color .github/workflows/runtime-smoke-staging.yml` 出力 |
| E-3 | `grep-gate.log` | phase-6 ST-4 / phase-9 QG-4 | `grep -rE 'eyJ[A-Za-z0-9_-]{20,}\|sk_[A-Za-z0-9]{20,}\|hooks\.slack\.com/services/[A-Z0-9]{8,}' docs/.../ci-secret-alignment-and-runtime-smoke-recovery/ ; echo "exit=$?"` |
| E-4 | `pre-check-fail-run.log` | phase-7 §2 / phase-9 QG-8 | `gh run view <run-id> --log` for Pass 1 |
| E-5 | `secret-name-list-after.log` | phase-7 §3 / phase-9 QG-9 補助 | `gh api .../environments/staging-runtime-smoke/secrets --jq '.secrets[].name' \| sort` |
| E-6 | `pre-check-success-run.log` | phase-7 §4 / phase-9 QG-9 | `gh run view <run-id> --log` for Pass 2 |

---

## 2. evidence 取得手順

### 2.1 静的検証 evidence（commit 前）

```bash
mkdir -p docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/outputs/phase-11/evidence

OUT=docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/outputs/phase-11/evidence

python3 -c "import yaml; yaml.safe_load(open('.github/workflows/runtime-smoke-staging.yml')); print('YAML parse OK')" \
  > "$OUT/yaml-syntax.log" 2>&1

pnpm dlx actionlint -color .github/workflows/runtime-smoke-staging.yml \
  > "$OUT/actionlint.log" 2>&1 || true

(grep -rE 'eyJ[A-Za-z0-9_-]{20,}|sk_[A-Za-z0-9]{20,}|hooks\.slack\.com/services/[A-Z0-9]{8,}' \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/ ; \
  echo "exit=$?") > "$OUT/grep-gate.log" 2>&1
```

### 2.2 runtime evidence Pass 1（secret 未投入で fail）

```bash
git push origin fix/runtime-smoke-staging-readiness-gate
RUN_ID=$(gh run list --workflow=runtime-smoke-staging.yml \
  --branch=fix/runtime-smoke-staging-readiness-gate \
  --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID"
gh run view "$RUN_ID" --log > "$OUT/pre-check-fail-run.log"
```

### 2.3 user action: 5 secret 投入

ユーザーが `runbooks/secret-provisioning.md` 手順に従って実施。AI は実行しない。

```bash
# (ユーザー操作)
gh secret set STAGING_API_BASE       --env staging-runtime-smoke
gh secret set STAGING_ADMIN_BEARER   --env staging-runtime-smoke
gh secret set STAGING_MEMBER_ID      --env staging-runtime-smoke
gh secret set STAGING_ME_BEARER      --env staging-runtime-smoke
gh secret set SLACK_WEBHOOK_INCIDENT --env staging-runtime-smoke

gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort > "$OUT/secret-name-list-after.log"
```

### 2.4 runtime evidence Pass 2（投入後に pre-check 突破）

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
RUN_ID=$(gh run list --workflow=runtime-smoke-staging.yml --branch=dev \
  --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID"
gh run view "$RUN_ID" --log > "$OUT/pre-check-success-run.log"
```

---

## 3. evidence 内容の検証ルール

| evidence | 検証 |
|---------|------|
| `yaml-syntax.log` | `YAML parse OK` を含む |
| `actionlint.log` | エラー出力なし（または false-positive のみ） |
| `grep-gate.log` | `exit=1` で終わる（grep ヒット 0 件） |
| `pre-check-fail-run.log` | `missing secrets in environment 'staging-runtime-smoke': STAGING_API_BASE STAGING_ADMIN_BEARER STAGING_MEMBER_ID STAGING_ME_BEARER` を含む |
| `secret-name-list-after.log` | 5 行（`SLACK_WEBHOOK_INCIDENT` / `STAGING_*` 4 件） |
| `pre-check-success-run.log` | `missing secrets` 文字列を含まない / `mask staging credentials` step が実行されている |

---

## 4. visualEvidence: NON_VISUAL の根拠

本 task は CI workflow YAML 編集と markdown runbook 新規のみで、Web UI / 画面遷移を生まない。スクリーンショット evidence は対象外。runner ログとシェルコマンド出力のみで AC を機械検証可能。

---

## 5. evidence 保存責任

- 静的検証 evidence（E-1..E-3）: AI（commit 前に取得）。
- runtime evidence（E-4..E-6）: ユーザー（PR push と secret 投入の権限が必要）。
- E-5 は runtime 観測の補助として PR コメントに添付してもよい（実値でない name 一覧のため）。
