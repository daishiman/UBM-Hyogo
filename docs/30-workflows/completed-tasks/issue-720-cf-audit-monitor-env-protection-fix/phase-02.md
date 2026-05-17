# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で固定した採用方針（案B' / environment なし / repo-level 同名 mirror / production env 側維持 / runbook 追記）の解像度を上げ、Phase 4 以降の実装手順をそのまま起こせる粒度に確定する。

## 設計成果物

| 成果物 | パス | 対応 AC |
| --- | --- | --- |
| workflow yaml 差分計画 | outputs/phase-02/workflow-diff.md | AC-1 |
| secrets / vars 複製計画 | outputs/phase-02/secret-migration-plan.md | AC-2 |
| environment 分離 ADR ドラフト | outputs/phase-02/environment-separation-adr.md | AC-5 |

---

## 1. workflow yaml 差分計画 (outputs/phase-02/workflow-diff.md)

### 1.1 変更前 (L36-L41 抜粋)

```yaml
jobs:
  fetch-and-analyze:
    runs-on: ubuntu-latest
    environment: production    # ← L39 削除対象
    timeout-minutes: 10
    env:
```

### 1.2 変更後

```yaml
jobs:
  fetch-and-analyze:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
```

### 1.3 差分の不変条件

- 削除する行は **L39 の 1 行のみ**。
- secrets / vars 参照名は全て不変。
- `concurrency` / `permissions` / cron schedule / step 構成は不変。
- 削除に伴うインデント崩れがないこと（`environment:` が L39 のみで、jobs 内 children の縦並びは保持）。

### 1.4 検証コマンド

- `actionlint .github/workflows/cf-audit-log-monitor.yml`
- `git diff -- .github/workflows/cf-audit-log-monitor.yml | head -20`（差分が 1 行削除のみであることを確認）

---

## 2. secrets / vars 複製計画 (outputs/phase-02/secret-migration-plan.md)

### 2.1 複製対象 secrets

| secret name | 用途 (workflow yaml 内参照箇所) | 1Password 参照 (`.env` 記述例) | 投入コマンド (user-gated) |
| --- | --- | --- | --- |
| `CF_AUDIT_D1_TOKEN_PROD` | L69, L79 (D1 access) | `op://UBM-Hyogo-Prod/CloudflareD1AuditToken/credential` | `gh secret set CF_AUDIT_D1_TOKEN_PROD --repo daishiman/UBM-Hyogo --body "$(op read op://UBM-Hyogo-Prod/CloudflareD1AuditToken/credential)"` |
| `CF_AUDIT_TOKEN_PROD` | L70 (audit API token) | `op://UBM-Hyogo-Prod/CloudflareAuditToken/credential` | `gh secret set CF_AUDIT_TOKEN_PROD --repo daishiman/UBM-Hyogo --body "$(op read op://UBM-Hyogo-Prod/CloudflareAuditToken/credential)"` |
| `CF_AUDIT_WORKERS_AI_TOKEN` | L82 (Workers AI classifier) | `op://UBM-Hyogo-Prod/CloudflareWorkersAIToken/credential` | `gh secret set CF_AUDIT_WORKERS_AI_TOKEN --repo daishiman/UBM-Hyogo --body "$(op read op://UBM-Hyogo-Prod/CloudflareWorkersAIToken/credential)"` |
| `SLACK_WEBHOOK_INCIDENT` | L113 (Slack 通知) | `op://UBM-Hyogo-Prod/SlackIncidentWebhook/url` | `gh secret set SLACK_WEBHOOK_INCIDENT --repo daishiman/UBM-Hyogo --body "$(op read op://UBM-Hyogo-Prod/SlackIncidentWebhook/url)"` |
| `EMAIL_WEBHOOK_URL` | L114 (Mail 通知 webhook) | `op://UBM-Hyogo-Prod/EmailWebhookUrl/url` | `gh secret set EMAIL_WEBHOOK_URL --repo daishiman/UBM-Hyogo --body "$(op read op://UBM-Hyogo-Prod/EmailWebhookUrl/url)"` |

> 1Password の vault / item / field 名は実際の正本パスに合わせて Phase 06 で再確認する。本表は仮定。

`secrets.GITHUB_TOKEN` は GitHub Actions が自動注入するため複製不要。

### 2.2 複製対象 variables

| variable name | workflow yaml 内参照 | 投入コマンド (user-gated) | 備考 |
| --- | --- | --- | --- |
| `CF_AUDIT_CLASSIFIER` | L42 | `gh variable set CF_AUDIT_CLASSIFIER --repo daishiman/UBM-Hyogo --body "ml"` | 値は production env と同一を維持 |
| `ML_MODEL_PATH` | L43 | `gh variable set ML_MODEL_PATH ...` | |
| `CF_AUDIT_IF_MODEL` | L44 | `gh variable set CF_AUDIT_IF_MODEL ...` | |
| `CF_AUDIT_XGB_MODEL` | L45 | `gh variable set CF_AUDIT_XGB_MODEL ...` | |
| `CF_AUDIT_WORKERS_AI_URL` | L46 | `gh variable set CF_AUDIT_WORKERS_AI_URL ...` | |
| `CLOUDFLARE_ACCOUNT_ID` | L68, L78 | `gh variable set CLOUDFLARE_ACCOUNT_ID ...` | |
| `CF_AUDIT_CLASSIFIER_VERSION` | L95 | `gh variable set CF_AUDIT_CLASSIFIER_VERSION ...` | |
| `EMAIL_FROM` | L115 | `gh variable set EMAIL_FROM ...` | |
| `EMAIL_TO` | L116 | `gh variable set EMAIL_TO ...` | |

variable は非機密扱いだが、production env と repo の両側に存在しても問題ない（fall-through で repo level が参照される）。

### 2.3 事前確認手順 (read-only)

```bash
# repo-level に既に存在する secret / variable 一覧
gh secret list --repo daishiman/UBM-Hyogo
gh variable list --repo daishiman/UBM-Hyogo

# production env 側
gh secret list --repo daishiman/UBM-Hyogo --env production
gh variable list --repo daishiman/UBM-Hyogo --env production
```

差分が「複製が必要なもの」になる。

### 2.4 投入順序の不変条件

1. **必ず repo secret 投入を完了**（5 secrets + 9 vars すべて）
2. 投入完了確認 (`gh secret list` / `gh variable list` で 5 + 9 が visible)
3. workflow yaml の `environment: production` 行削除 commit
4. PR を `dev` ブランチに作成 → merge
5. workflow_dispatch dry_run で疎通確認
6. hourly schedule 6 連続 success 観察

順序逆転で workflow が `secrets.CF_AUDIT_D1_TOKEN_PROD` を参照したとき env が無い状態だと 401/403 で fail する。

### 2.5 投入時の禁止事項

- `gh secret set --body "<実値>"` のように **コマンドラインに実値を書かない**（shell history に残る）。必ず `$(op read op://...)` 経由。
- 1Password 経由で取った値を `echo` / `cat` / ファイル書き出ししない。
- Claude Code は本投入を自律実行しない（user-gated）。

---

## 3. environment 分離 ADR ドラフト (outputs/phase-02/environment-separation-adr.md)

### 3.1 ADR タイトル

**監視系 (read-only) workflow と deploy 系 (mutation) workflow の environment 分離原則**

### 3.2 Context

GitHub Actions `environment:` ディレクティブは元来 deploy 時の保護 (branch policy / required reviewers / wait timer) を目的としている。`cf-audit-log-monitor.yml` は production resource を read するだけだが、`environment: production` を指定していたために `dev` ブランチからの hourly 実行が branch policy で拒否され、issue-720 として 30 日以上 silently fail を続けた。

### 3.3 Decision

- **監視系 workflow** (resource を read するのみで mutation を伴わないもの) には `environment:` を指定しない。secrets は **repository-level secret** として管理する。
- **deploy 系 workflow** (deploy / rollback / schema apply 等) には引き続き `environment: production` 等を指定し branch policy で保護する。
- 監視系 secret は production env と repo の両側に重複させて持つことを許容する（移行期間および rollback 安全弁のため）。
- 監視系 secret は **read-only token に限定**する。mutation 権限のある token を repo-level に複製してはならない。

### 3.4 Consequences

- pro: 監視系 workflow が任意ブランチから実行可能になる。Phase 11 で実証する hourly 6 連続 success の根拠。
- pro: deploy 系経路の保護は不変。production env の branch policy / required reviewers は維持される。
- con: repo-level secret として複製した値は private repo の全 workflow からアクセス可能になり security boundary が広がる。
- 緩和: 監視系 token は read-only に限定する原則を本 ADR で明文化する。

### 3.5 Status

`proposed`（Phase 03 review で `accepted` に昇格させる）

### 3.6 関連リンク

- 親 Issue: #720
- 親 workflow: docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/
- 該当 workflow: `.github/workflows/cf-audit-log-monitor.yml`

---

## 設計の検証観点

| 観点 | 確認内容 |
| --- | --- |
| 最小差分 | workflow yaml diff が L39 削除 1 行のみ |
| 同名複製 | secrets / vars 参照名が一切変更されていない |
| user-gate 境界 | `gh secret set` / `gh variable set` の実行は user 承認後に限定 |
| 1Password 経由注入 | 平文 secret が yaml / コマンド履歴に残らない |
| 保護維持 | production env の branch policy 等は変更しない |
| 監視系限定 | repo-level に複製する secret は read-only に限定 |

## 実行タスク

- [ ] `outputs/phase-02/workflow-diff.md` を作成
- [ ] `outputs/phase-02/secret-migration-plan.md` を作成
- [ ] `outputs/phase-02/environment-separation-adr.md` を作成
- [ ] 1Password vault / item / field 名を Phase 06 で再確認するためのチェックリストを残す

## 完了条件

- [ ] 3 つの主成果物が指定パスに作成されている
- [ ] secrets / vars 全数列挙が完了している
- [ ] 投入順序の不変条件が明文化されている
- [ ] ADR が proposed 状態で Phase 03 に引き継ぎ可能になっている

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項:
  - ADR を accepted に昇格させる判断材料
  - workflow yaml diff の最小性確認
  - secret migration plan の完全性確認 (5 + 9)
