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

### 追記 (2026-05-11): Pass 2 成功判定の jq 検証 (audit A3)

Pass 2 の `gh run watch` 完了だけでは「pre-check 突破 + smoke 本体 PASS」の機械判定にならない。runtime artifact (`runtime-smoke-staging-<run_id>`) を取得して `summary.json` を jq で検証し、`gh run view --json conclusion` で workflow 全体の conclusion も確認する。

```bash
# 1. runtime artifact をダウンロード
gh run download "$RUN_ID" -n "runtime-smoke-staging-${RUN_ID}" -D ci-evidence

# 2. summary.json の status を検査（200 以外が 0 件で成功）
jq -e '.results[] | select(.status != 200)' ci-evidence/summary.json
# ↑ exit 1 (= match 0 件) なら成功。exit 0 (= 1 件以上 match) なら fail
# 注: jq -e は select 結果が空のとき exit 1 を返す（= 成功扱い）

# 3. workflow 全体の conclusion を確認
gh run view "$RUN_ID" --json conclusion > "$OUT/pass2-run-conclusion.json"
jq -e '.conclusion == "success"' "$OUT/pass2-run-conclusion.json"

# 4. evidence として保存
cp ci-evidence/summary.json "$OUT/pass2-summary.json"
```

evidence 保存先:
- `outputs/phase-11/evidence/pass2-summary.json` — runtime smoke の全 endpoint 結果
- `outputs/phase-11/evidence/pass2-run-conclusion.json` — workflow conclusion

判定:
- `pass2-summary.json` の全 `.results[].status` が `200` かつ `pass2-run-conclusion.json` の `.conclusion` が `"success"` で PASS。
- いずれか欠ければ §3 (追記) failure decision tree に進む。

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

---

## 6. 追記 (2026-05-11): failure decision tree — pre-check 通過後 smoke 本体 fail 時 (audit B3)

Pass 2 で `verify required staging secrets` step が PASS した後、smoke 本体（`scripts/smoke/runtime-attendance-provider.sh` 実行 step）が fail する場合、`pass2-summary.json` の `.results[]` の `status` を見て下記表で切り分ける。

| HTTP status | suspect | 戻り先 |
|---|---|---|
| 401 | bearer 失効（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`） | `runbooks/secret-provisioning.md` §rotation → bearer 再投入 |
| 404 | `STAGING_MEMBER_ID` が D1 と不整合（member 削除済み等） | `runbooks/secret-provisioning.md` §投入手順 §member id 取得 から再取得 |
| 5xx | Worker down / D1 down | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 再デプロイ判断（task-01 経由） |
| timeout / DNS error | `STAGING_API_BASE` URL 不正 / Workers route 未公開 | `STAGING_API_BASE` の URL を再確認、`curl -I "$STAGING_API_BASE"` で疎通確認 |
| その他 | smoke スクリプト本体の不具合 | task-02 rollback ではなく smoke スクリプト調査タスクとして起票（phase-10 §3 参照） |

切り分け後の対応 commit / PR は本 task-02 の範囲外（task-01 もしくは別 fix task）。
