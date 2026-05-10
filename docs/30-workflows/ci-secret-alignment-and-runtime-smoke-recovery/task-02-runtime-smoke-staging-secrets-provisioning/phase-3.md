# Phase 3: 実装計画（task-02 — 2 ファイルの差分計画とユーザー操作の分離）

| 項目 | 値 |
|------|----|
| 入力 | `phase-2.md` 設計確定 |
| 出力 | 2 ファイルの差分計画 / ユーザー操作の境界線 |

---

## 1. 変更対象ファイル一覧

| # | path | 種別 | 概算差分行数 | 担当 |
|---|------|------|---------------|------|
| 1 | `.github/workflows/runtime-smoke-staging.yml` | edit | +18 行（pre-check step 追加のみ） | AI（spec 通り編集） |
| 2 | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | new | +60 行（runbook 全文） | AI（実値は書かない） |
| — | （ユーザー操作） `gh secret set <NAME> --env staging-runtime-smoke` × 5 | env 設定 | n/a | **ユーザー** |

---

## 2. 差分 1: `.github/workflows/runtime-smoke-staging.yml`

### 2.1 挿入位置

`steps:` 配列内、現状 line 32（前 step 末尾）と line 35（`mask staging credentials`）の間。`mask staging credentials` step の **直前** に新規 step を 1 件挿入。

### 2.2 挿入内容（逐語）

```yaml
      - name: verify required staging secrets
        env:
          STAGING_API_BASE: ${{ env.STAGING_API_BASE }}
          STAGING_ADMIN_BEARER: ${{ env.STAGING_ADMIN_BEARER }}
          STAGING_MEMBER_ID: ${{ env.STAGING_MEMBER_ID }}
          STAGING_ME_BEARER: ${{ env.STAGING_ME_BEARER }}
        run: |
          missing=()
          [ -z "${STAGING_API_BASE:-}" ] && missing+=("STAGING_API_BASE")
          [ -z "${STAGING_ADMIN_BEARER:-}" ] && missing+=("STAGING_ADMIN_BEARER")
          [ -z "${STAGING_MEMBER_ID:-}" ] && missing+=("STAGING_MEMBER_ID")
          [ -z "${STAGING_ME_BEARER:-}" ] && missing+=("STAGING_ME_BEARER")
          if [ "${#missing[@]}" -gt 0 ]; then
            echo "::error::missing secrets in environment 'staging-runtime-smoke': ${missing[*]}"
            echo "::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md)"
            exit 1
          fi
```

### 2.3 既存変更しない箇所（不変保証）

| 既存 step | 状態 |
|---|---|
| `actions/checkout@v4` | 不変 |
| `actions/setup-node@v4` | 不変 |
| `pnpm/action-setup@v4` | 不変 |
| `mise install` | 不変 |
| `mask staging credentials` | 不変（直前に新規 step 挿入のみ） |
| `run runtime smoke` | 不変 |
| `upload evidence` | 不変 |
| `notify slack on failure` (`if: failure()`) | 不変 |

---

## 3. 差分 2: `runbooks/secret-provisioning.md` 新規

### 3.1 章立て（実値ゼロ）

| § | 内容 |
|---|------|
| 目的 | runbook の責務 + 「実値はこの doc に書かない」明示 |
| 必要 secret 一覧 | name / 取得元 / 例形式（実値ではない placeholder） |
| 投入手順（ユーザー操作） | `gh secret set <NAME> --env staging-runtime-smoke` × 5 の逐語コマンド |
| 投入確認 | `gh api repos/.../environments/staging-runtime-smoke/secrets --jq '.secrets[].name' \| sort` |
| 動作確認（再実行） | `gh workflow run runtime-smoke-staging.yml --ref dev` |
| ローテーション運用 | bearer 失効時の再投入手順 |
| 禁止事項 | secret 実値を doc / commit / PR / Slack / Issue / AI agent 経由で扱わない |

### 3.2 内容の正本

`task-02/main.md §11`（task-specification-creator が削除前に評価する原典）からそのまま転記する。バックティック escape は markdown コードブロック内の三重バックティックを保持する。

---

## 4. ユーザー操作の境界線（AI 不可侵）

| 操作 | 担当 | 根拠 |
|---|---|---|
| workflow YAML 編集 | AI | コードのみ。実値なし |
| runbook 作成 | AI | placeholder のみ。実値なし |
| `gh secret set STAGING_API_BASE --env staging-runtime-smoke` | **ユーザー** | 実値投入のため AI には委ねない（不変条件 2） |
| `gh secret set STAGING_ADMIN_BEARER --env staging-runtime-smoke` | **ユーザー** | 同上 |
| `gh secret set STAGING_MEMBER_ID --env staging-runtime-smoke` | **ユーザー** | 同上 |
| `gh secret set STAGING_ME_BEARER --env staging-runtime-smoke` | **ユーザー** | 同上 |
| `gh secret set SLACK_WEBHOOK_INCIDENT --env staging-runtime-smoke` | **ユーザー** | 同上 |
| 投入後の `gh workflow run` で smoke 再実行 | **ユーザー**（または PR push の自動 trigger） | 再実行に repo 操作権限が必要 |

---

## 5. 実装順序

1. `.github/workflows/runtime-smoke-staging.yml` に pre-check step を挿入。
2. `runbooks/secret-provisioning.md` を新規作成（main.md §11 を転記）。
3. ローカル検証（phase-6）: YAML 構文 / actionlint / grep gate。
4. commit & push、`fix/runtime-smoke-staging-readiness-gate` で PR を `dev` 向けに作成。
5. ユーザーが runbook 手順で 5 secret を投入。
6. `dev` 上で smoke を再実行し pre-check 突破を確認（phase-7 / phase-11）。

---

## 6. リスクと緩和

| リスク | 緩和 |
|---|------|
| pre-check step の bash 配列構文が runner shell で動かない | GitHub Actions runner の default shell は bash。bash array は使用可。phase-6 で構文検証する |
| `env:` 再宣言を job 直下と step 直下で二重に書くことの冗長 | phase-2 §1 で「step 単位の意図明示」として正当化済 |
| runbook が `op` 経由運用と齟齬 | `SLACK_WEBHOOK_INCIDENT` は 1Password Vault 参照を runbook に明記。CLAUDE.md シークレット管理セクションと整合 |
