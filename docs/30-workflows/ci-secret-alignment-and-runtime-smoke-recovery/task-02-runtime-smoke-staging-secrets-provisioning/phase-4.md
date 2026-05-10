# Phase 4: テスト設計（task-02 — 失敗系 / 成功系の 2 シナリオ）

| 項目 | 値 |
|------|----|
| 入力 | `phase-3.md` 実装計画 |
| 出力 | 失敗系 / 成功系シナリオ + 静的検証項目 |

---

## 1. テストシナリオ全体像

| ID | 種別 | 起点 | 期待結果 |
|----|------|------|---------|
| TS-01 | 失敗系（statics） | YAML 構文・grep gate | YAML parse OK / pre-check step 1 件 / secret 実値 grep 0 件 |
| TS-02 | 失敗系（runtime） | secret 未投入で smoke 起動 | pre-check step で exit 1 / `::error::` に 4 件の不足 secret 名 |
| TS-03 | 成功系（runtime） | 5 secret 投入後に smoke 再実行 | pre-check 突破 / smoke 本体実行へ進む |

---

## 2. TS-01: 静的検証

### 2.1 YAML 構文

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/runtime-smoke-staging.yml'))"
```

期待: exit 0（parse 成功）。

### 2.2 pre-check step 存在確認

```bash
test "$(grep -c 'verify required staging secrets' .github/workflows/runtime-smoke-staging.yml)" -eq 1
```

期待: exit 0（厳密に 1 件）。

### 2.3 secret 実値 grep gate

```bash
! grep -rE 'eyJ[A-Za-z0-9_-]{20,}|sk_[A-Za-z0-9]{20,}|hooks\.slack\.com/services/[A-Z0-9]{8,}' \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/
```

期待: 0 件 hit（grep は exit 1 を返す → 否定で exit 0）。

### 2.4 actionlint

```bash
pnpm dlx actionlint -color .github/workflows/runtime-smoke-staging.yml
```

期待: violation 0 件。

---

## 3. TS-02: 失敗系（runtime）

### 3.1 前提

- `staging-runtime-smoke` env の secret 一覧が空（または 4 件のうち 1 件以上が欠けている）。

### 3.2 起動

```bash
gh workflow run runtime-smoke-staging.yml --ref <feature-branch>
gh run watch
```

または PR push による自動 trigger。

### 3.3 期待

| # | 観測項目 | 期待値 |
|---|---------|--------|
| F-1 | smoke job exit code | non-zero（`verify required staging secrets` step で exit 1） |
| F-2 | runner ログ | `::error::missing secrets in environment 'staging-runtime-smoke': STAGING_API_BASE STAGING_ADMIN_BEARER STAGING_MEMBER_ID STAGING_ME_BEARER` |
| F-3 | runner ログ | `::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/.../runbooks/secret-provisioning.md)` |
| F-4 | `mask staging credentials` step | **実行されない**（pre-check で止まるため） |
| F-5 | `run runtime smoke` step | **実行されない** |
| F-6 | failure 通知 step | `if: failure()` のため起動。`SLACK_WEBHOOK_INCIDENT` 欠如時は warning skip（既存挙動） |

### 3.4 evidence 保存先

`outputs/phase-11/evidence/pre-check-fail-run.log`

---

## 4. TS-03: 成功系（runtime）

### 4.1 前提

- ユーザーが runbook §投入手順 を実施し、`staging-runtime-smoke` env に 5 secret を投入済。
- 投入確認: `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets --jq '.secrets[].name' | sort` が 5 行を返す。

### 4.2 起動

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
gh run watch
```

### 4.3 期待

| # | 観測項目 | 期待値 |
|---|---------|--------|
| S-1 | `verify required staging secrets` step | exit 0（pre-check 突破） |
| S-2 | `mask staging credentials` step | 実行 |
| S-3 | `run runtime smoke` step | 実行（成功 or smoke 固有 failure。pre-check は通過済） |
| S-4 | runner ログに `missing secrets` 文字列 | **存在しない** |

### 4.4 evidence 保存先

- `outputs/phase-11/evidence/pre-check-success-run.log`
- `outputs/phase-11/evidence/secret-name-list-after.log`（投入後の name 一覧）

---

## 5. テスト除外項目

| 項目 | 理由 |
|------|------|
| smoke スクリプト本体のロジックテスト | 本 task の対象外（不変条件 3） |
| `staging` / `production` env の secret provisioning | 本 task のスコープ外（task-01 / 別 runbook） |
| Cloudflare Worker のレスポンス検証 | smoke スクリプト本体の責務 |
| unit test 追加 | shell の `[ -z ... ]` 評価に独立 unit test を書く合理性が薄い。runtime 観測（TS-02 / TS-03）で代替 |

---

## 6. テスト実行順序

1. TS-01（静的・ローカル）→ commit 前に必須通過。
2. PR push（feature branch）→ TS-02 自動 trigger（secret 未投入のため pre-check fail）。
3. ユーザーが secret 投入。
4. TS-03 手動 trigger → pre-check 突破確認。
5. evidence を `outputs/phase-11/evidence/` に保存。
