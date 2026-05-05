# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビューゲート) |
| 状態 | spec_created |

## 目的

Phase 1 で確定した inventory を、SSOT (`outputs/phase-02/observability-matrix.md`) の更新差分として落とし込む。Phase 5 で機械的に適用できる粒度の patch 設計を作る。

## 設計方針

### 方針 1: 既存セクションを破壊しない

SSOT は 05a タスクの完了成果物として運用に組み込まれている。本タスクでは既存「Cloudflare 無料枠一覧」「GitHub Actions 無料枠」「環境別観測対象」「rollback / degrade 判断基準概要」の 4 セクションは保持し、以下を追加 / 改修する。

| 改修種別 | 対象 | 内容 |
| --- | --- | --- |
| 改修 | `## 環境別観測対象 (AC-4)` の dev / main 観測対象表 | 5 workflow を行追加し、欠落していた `backend-ci.yml` / `web-cd.yml` / `verify-indexes.yml` を補う |
| 新規 | `## CI/CD Workflow 識別子マッピング` セクション | 4 列分離 mapping 表を新規追加 |
| 新規 | `## Discord 通知の current facts` セクション | 5 workflow すべてが Discord 通知未実装であることを注記 |
| 改修 | 旧 path 参照 (`docs/05a-...`) | `docs/30-workflows/completed-tasks/05a-...` へ全件置換 |

### 方針 2: 4 列分離 mapping 表

| workflow file | display name (`name:`) | trigger | job id | required status context (confirmed / candidate) |
| --- | --- | --- | --- | --- |
| `.github/workflows/ci.yml` | `ci` | `push: main/dev`, `pull_request: main/dev` | `ci`, `coverage-gate` | `ci` confirmed; `coverage-gate` candidate after hard-gate rollout |
| `.github/workflows/backend-ci.yml` | `backend-ci` | `push: dev/main` | `deploy-staging`, `deploy-production` | none confirmed; deploy jobs are monitoring targets |
| `.github/workflows/validate-build.yml` | `Validate Build` | `push: main/dev`, `pull_request: main/dev` | `validate-build` | `Validate Build` confirmed |
| `.github/workflows/verify-indexes.yml` | `verify-indexes-up-to-date` | `push: main`, `pull_request: main/dev` | `verify-indexes-up-to-date` | `verify-indexes-up-to-date` confirmed |
| `.github/workflows/web-cd.yml` | `web-cd` | `push: dev/main` | `deploy-staging`, `deploy-production` | none confirmed; deploy jobs are monitoring targets |

> **注**: `required status context` は branch protection API (`gh api repos/daishiman/UBM-Hyogo/branches/{main,dev}/protection`) の `required_status_checks.contexts` を正とする。`workflow display name / job id` 形式は見た目の説明に留め、UT-GOV-001 / UT-GOV-004 confirmed contexts と混同しない。

### 方針 3: 環境別観測対象表の更新

```diff
 ### dev (staging) 環境

 | 観測対象 | 確認先 | owner |
 | --- | --- | --- |
 | Pages staging builds | CF Dashboard / ubm-hyogo-web-staging | ops |
 | Workers (dev env) requests | CF Dashboard / Workers / dev | ops |
 | D1 staging reads / storage | CF Dashboard / ubm-hyogo-db-staging | ops |
 | GitHub Actions CI runs | GitHub / Actions / ci.yml | ops |
+| GitHub Actions backend deploy (staging) | GitHub / Actions / backend-ci.yml (deploy-staging) | ops |
+| GitHub Actions web deploy (staging) | GitHub / Actions / web-cd.yml (deploy-staging) | ops |
+| GitHub Actions verify-indexes (drift gate) | GitHub / Actions / verify-indexes.yml | ops |
```

```diff
 ### main (production) 環境

 | 観測対象 | 確認先 | owner |
 | --- | --- | --- |
 | Pages production builds | CF Dashboard / ubm-hyogo-web | ops |
 | Workers (production) requests | CF Dashboard / Workers / production | ops |
 | D1 production reads / storage | CF Dashboard / ubm-hyogo-db-prod | ops |
 | GitHub Actions build validation | GitHub / Actions / validate-build.yml | ops |
 | GitHub Actions typecheck / lint | GitHub / Actions / ci.yml | ops |
+| GitHub Actions backend deploy (production) | GitHub / Actions / backend-ci.yml (deploy-production) | ops |
+| GitHub Actions web deploy (production) | GitHub / Actions / web-cd.yml (deploy-production) | ops |
+| GitHub Actions verify-indexes (drift gate) | GitHub / Actions / verify-indexes.yml | ops |
```

### 方針 4: Discord 通知 current facts 注記

新規セクション末尾に以下を追加する。

```markdown
## Discord 通知の current facts (2026-05-01)

`grep -iE "discord|webhook|notif" .github/workflows/{ci,backend-ci,validate-build,verify-indexes,web-cd}.yml` の結果は **0 件**。本 SSOT に列挙される 5 workflow すべて、本タスク作成時点では **Discord 通知は未実装**。observability owner は GitHub Actions の run history（`gh run list --workflow=<file>`）と CF Dashboard を主な確認先とする。Discord/Slack 通知の導入は別タスクで起票する。
```

### 方針 5: 旧 path 参照解消

```bash
rg -n "docs/05a-" docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/
```

該当行を `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/` に置換する。

## 因果関係 / 依存境界

```
.github/workflows/* (current facts)
  ↓ (grep で抽出)
phase-01 inventory
  ↓ (4 列分離 + 注記設計)
phase-02 patch design (本 Phase 成果)
  ↓ (Phase 5 で機械適用)
SSOT (observability-matrix.md) 更新
  ↓
05a completed task の current facts 整合
  ↓
UT-GOV-001 / UT-GOV-004 の status context 表との整合確認 (Phase 11)
```

## ライブラリ / ツール選定

| ツール | 用途 |
| --- | --- |
| `rg` (ripgrep) | 旧 path 参照の検索 / drift 確認 |
| `gh api` | required status context の正本確認（UT-GOV-001 の参照値と照合） |
| `grep` | Discord / webhook / notif の 0 件検証 |

新規ライブラリ採用なし（docs-only タスクのため）。

## 責務境界

| ファイル | 責務 |
| --- | --- |
| 本タスク `outputs/phase-*/*.md` | docs sync の意思決定根拠 |
| `completed-tasks/05a-.../outputs/phase-02/observability-matrix.md` | SSOT。本タスクで更新 |
| `.github/workflows/*.yml` | current facts のソース。本タスクでは **更新しない** |
| UT-GOV-001 関連 docs | required_status_checks の正本。Phase 11 で照合のみ |

## リスクと対策（Phase 1 から繰越）

| リスク | 対策 |
| --- | --- |
| `required_status_checks` の context 名が表記違い | Phase 11 で `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` を実行し contexts 実値と本表を diff |
| backend-ci.yml が将来 CI 実体に戻った場合に表が陳腐化 | 注記欄に「2026-05-01 時点 deploy 系」と current date を明記 |

## 成果物

- `outputs/phase-02/main.md` — 本 Phase 設計成果サマリー（patch 設計を含む）
