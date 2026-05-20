# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | spec_created |

## 目的

Phase 1 で確定した方針（runtime restoration + cleanup no-op）を、具体的な投入手順 / inventory snapshot 手順 / variables 差分計画として落とし込み、Phase 6 の実装手順に渡せる粒度の設計書を `outputs/phase-02/` 配下に 3 ファイルで生成する。

## 変更対象ファイル一覧（CONST_005）

本 Phase でコード変更はないが、後続 Phase での変更対象を本 Phase で確定する。

| パス | 変更種別 | 変更内容 |
| --- | --- | --- |
| docs/30-workflows/issue-772-.../outputs/phase-02/secret-investment-plan.md | 新規 | repo-level secret 投入計画 |
| docs/30-workflows/issue-772-.../outputs/phase-02/variable-mirror-plan.md | 新規 | repo-level variables 差分計画 |
| docs/30-workflows/issue-772-.../outputs/phase-02/inventory-before.md | 新規 | inventory snapshot 手順 + placeholder |
| .github/workflows/cf-audit-log-monitor.yml | **不変** | 最小差分原則 |
| docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | Phase 08 で編集 | environment-separation ADR にステータス行追記 |

## 設計内容

### 2.1 投入必須 secrets リスト

workflow yaml 内 `secrets.*` 参照を grep し、`secrets.GITHUB_TOKEN`（自動付与）を除外した結果:

| 参照名 | yaml 内位置 | 現状（repo-level） | 投入要否 | source-of-truth |
| --- | --- | --- | --- | --- |
| `CF_AUDIT_D1_TOKEN_PROD` | L68, L78 | 不在 | **要投入** | 1Password production item |
| `CF_AUDIT_TOKEN_PROD` | L69 | 不在 | **要投入** | 1Password production item |
| `CF_AUDIT_WORKERS_AI_TOKEN` | L81 | 不在 | **要投入** | 1Password production item |
| `SLACK_WEBHOOK_INCIDENT` | L112 | 存在 | 投入不要（再確認のみ） | repo-level に既存 |
| `EMAIL_WEBHOOK_URL` | L113 | 不在 | **要投入** | 1Password production item |
| `GITHUB_TOKEN` | L79, L110, L139 | auto | 投入不要 | GitHub auto-injected |

→ 投入必須は **4 件**（`CF_AUDIT_D1_TOKEN_PROD` / `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_WORKERS_AI_TOKEN` / `EMAIL_WEBHOOK_URL`）。

### 2.2 投入必須 variables 差分

workflow yaml が参照する `vars.*` と現状 repo-level / production env-level vars の突き合わせ:

| 参照名 | yaml 内位置 | repo-level 現状 | production env 現状 | 投入要否 |
| --- | --- | --- | --- | --- |
| `CF_AUDIT_CLASSIFIER` | L41 | 不在 | `ml`（2026-05-09 投入済） | **要投入**（repo-level） |
| `ML_MODEL_PATH` | L42 | 不在 | 不明 | **要投入**（repo-level） |
| `CF_AUDIT_IF_MODEL` | L43 | 不在 | 不明 | **要投入**（repo-level） |
| `CF_AUDIT_XGB_MODEL` | L44 | 不在 | 不明 | **要投入**（repo-level） |
| `CF_AUDIT_WORKERS_AI_URL` | L45 | 不在 | 不明 | **要投入**（repo-level） |
| `CLOUDFLARE_ACCOUNT_ID` | L67, L77 | 存在 | n/a | 投入不要 |
| `CF_AUDIT_CLASSIFIER_VERSION` | L94 | 不在 | 不明 | **要投入**（repo-level） |
| `EMAIL_FROM` | L114 | 不在 | 不明 | **要投入**（repo-level） |
| `EMAIL_TO` | L115 | 不在 | 不明 | **要投入**（repo-level） |

→ repo-level variable は **8 件投入必須**（`CLOUDFLARE_ACCOUNT_ID` は既存のため除外。実値は production env 側に既設の値を踏襲。production env 側に値が無いものは値の決定を user に確認する）。

> `vars.X` が undefined の場合、workflow は空文字を参照し、`scripts/cf-audit-log/fetch.ts` 等で実行時 fail する可能性がある。Phase 06 で全 vars 投入を要求する。

### 2.3 投入手順設計（仕様、実行は user-gated）

```bash
# 値は 1Password から op read で動的注入。Claude / Codex は実値を扱わない
gh secret set CF_AUDIT_D1_TOKEN_PROD     --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_D1_TOKEN_PROD/credential')"
gh secret set CF_AUDIT_TOKEN_PROD        --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_TOKEN_PROD/credential')"
gh secret set CF_AUDIT_WORKERS_AI_TOKEN  --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_WORKERS_AI_TOKEN/credential')"
gh secret set EMAIL_WEBHOOK_URL          --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/EMAIL_WEBHOOK_URL/credential')"

# repo-level variables（実値は production env 側の既設値を踏襲。production env 側に存在しない場合は user 判断）
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=CF_AUDIT_CLASSIFIER         -f value=ml
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=ML_MODEL_PATH               -f value=<value>
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=CF_AUDIT_IF_MODEL           -f value=<value>
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=CF_AUDIT_XGB_MODEL          -f value=<value>
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=CF_AUDIT_WORKERS_AI_URL     -f value=<value>
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=CF_AUDIT_CLASSIFIER_VERSION -f value=<value>
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=EMAIL_FROM                  -f value=<value>
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=EMAIL_TO                    -f value=<value>
```

### 2.4 投入順序設計

| 順 | 操作 | 確認 |
| --- | --- | --- |
| 1 | inventory before snapshot 取得 | `gh secret list` / `gh api .../actions/variables` を保存 |
| 2 | repo-level secrets 4 件投入 | `gh secret list \| grep CF_AUDIT` で 3 件追加確認 |
| 3 | repo-level variables 8 件投入 | `gh api .../actions/variables` で count 増加確認 |
| 4 | `workflow_dispatch -f dry_run=true --ref dev` 実行 | run conclusion = success |
| 5 | hourly schedule 6 連続 success 観測 | `gh run list --workflow=cf-audit-log-monitor.yml --event schedule --limit 10` |
| 6 | inventory after snapshot 取得 | production env 側に monitor 専用 secret が**追加されていないこと**を確認（cleanup no-op evidence） |
| 7 | runbook ADR ステータス追記コミット | dev に PR |

### 2.5 inventory before / after の形式

- 記録項目: secret name、created_at、updated_at のみ。**value は禁止**。
- 取得コマンド:
  ```bash
  gh secret list --repo daishiman/UBM-Hyogo > before-repo-secrets.md
  gh secret list --repo daishiman/UBM-Hyogo --env production > before-prod-secrets.md
  gh api repos/daishiman/UBM-Hyogo/actions/variables | jq '.variables[] | {name, created_at, updated_at}' > before-repo-vars.json
  gh api repos/daishiman/UBM-Hyogo/environments/production/variables | jq '.variables[] | {name, created_at, updated_at}' > before-prod-vars.json
  ```
- value（CLOUDFLARE_ACCOUNT_ID 等の非機密 var 値）は `gh api` 出力にそのまま含まれるため、commit 前に jq で名前のみ抽出する。

## 入力・出力・副作用の定義

| 項目 | 内容 |
| --- | --- |
| 入力 | `.github/workflows/cf-audit-log-monitor.yml`（参照のみ） / 1Password Vault / 既存 GitHub secrets+variables inventory |
| 出力 | repo-level secrets 4 件 / variables 8 件追加（user-gated）、evidence MD 3 件、runbook ADR ステータス追記 |
| 副作用 | repo-level に monitor 系 secret surface 拡大（issue-720 ADR で許容範囲を明文化済） |

## テスト方針（追加するテスト）

本タスクはコード追加なしのため unit test 追加は不要。runtime test は Phase 11 で扱う:

- workflow_dispatch dry_run の 1 回 success
- hourly schedule の 6 連続 success
- secret-leakage-grep step が全 6 run で exit 0

## ローカル実行・検証コマンド

```bash
# typecheck / lint は yaml / md only の差分のため skip 可。ただし precommit hook は走らせる
mise exec -- pnpm typecheck   # ベースラインが通ることを確認
mise exec -- pnpm lint        # md 差分のみであれば warn のみ想定
gh secret list --repo daishiman/UBM-Hyogo                       # inventory 確認
gh secret list --repo daishiman/UBM-Hyogo --env production      # cleanup no-op 確認
```

## 完了条件 (DoD)

- [ ] `outputs/phase-02/secret-investment-plan.md` 作成
- [ ] `outputs/phase-02/variable-mirror-plan.md` 作成
- [ ] `outputs/phase-02/inventory-before.md` 作成（PENDING_USER_GATE placeholder 含む）
- [ ] 投入対象 secrets 4 件 / variables 8 件の網羅性確認
- [ ] 投入順序が Phase 06 実装手順に転記可能な粒度になっている

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項:
  - 投入対象 secrets / variables の確定リスト
  - 投入順序 7 ステップ
  - inventory before / after 取得コマンド
- ブロック条件: secret-investment-plan / variable-mirror-plan / inventory-before のいずれかが未作成
