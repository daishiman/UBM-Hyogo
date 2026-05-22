# Phase 1: 要件定義

> [実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: new

## 1. 真の論点

- 現象: `CLOUDFLARE_API_TOKEN` が job-level `env:` で全 step に露出
- 主問題: deploy 以外の step（build / lint / install）からも token が読める設計
- why now: Issue #331 で deferred 扱いだった token 分離 workstream の formalize
- why this way: OIDC は CF 側未 GA のため step-scoped が現実解

## 2. P50 チェック結果

| 項目 | 結果 |
|---|---|
| current branch に実装が存在する | No → 通常実装 |
| upstream にマージ済み | No |
| 前提タスク完了 | Yes（Issue #331 完了） |

→ `implementation_mode: "new"`

## 3. スコープ確定

### 含む

- `.github/workflows/web-cd.yml` の job-level `env: CLOUDFLARE_API_TOKEN` を deploy step-scoped へ降格（line 22, 63）
- `.github/workflows/backend-ci.yml` の wrangler-action 呼び出し 4 箇所（line 41, 52, 96, 107）の token 露出範囲が step 限定であることを実 yaml で確認
- 他 4 workflow（`cf-audit-log-cold-storage.yml` / `cf-audit-log-monitor.yml` / `d1-migration-verify.yml` / `post-release-dashboard.yml`）の token 参照箇所を grep で確認し、step-scoped 化が必要なものを補正
- `scripts/redaction-check.sh` 新規作成（log 内に token 値・Cloudflare Account ID が出現しないことを grep で検証）
- redaction-check を CI workflow に組み込み（既存 `backend-ci.yml` か `web-cd.yml` の post-deploy step として追加）
- `deployment-secrets-management.md`（aiworkflow-requirements references）の正本反映

### 含まない（CONST_007 例外: 技術的整合性破綻条件）

- OIDC 完全移行（CF 側未 GA・別 unassigned task へ formalize）
- 旧 long-lived token の物理失効（別 unassigned task）
- 1Password 構造変更（必要時のみ別 issue）

## 4. 変更対象ファイル一覧（CONST_005 必須）

| パス | 種別 | 概要 |
|---|---|---|
| `.github/workflows/web-cd.yml` | 編集 | job-level `env` 削除、deploy step 直下に `env:` 注入 |
| `.github/workflows/backend-ci.yml` | 編集 | wrangler-action の `apiToken` 指定が step 直下である構造を維持（confirm-only か微修正） |
| `.github/workflows/cf-audit-log-cold-storage.yml` | 編集（必要時） | token 参照位置の step-scoped 化 |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集（必要時） | 同上 |
| `.github/workflows/d1-migration-verify.yml` | 編集（必要時） | 同上 |
| `.github/workflows/post-release-dashboard.yml` | 編集（必要時） | 同上 |
| `scripts/redaction-check.sh` | 新規 | log への token leak 検出 grep スクリプト |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | 正本反映 |
| `docs/30-workflows/issue-640-oidc-cf-token-cutover/outputs/phase-*/` | 新規 | 各 Phase の成果物 |

## 5. 受入条件（DoD 抜粋）

- [ ] `grep -n "CLOUDFLARE_API_TOKEN" .github/workflows/web-cd.yml` の出力に **job-level `env:` 直下**の行が含まれない
- [ ] deploy 以外の step（build / lint / install）で `env.CLOUDFLARE_API_TOKEN` 未定義
- [ ] `bash scripts/redaction-check.sh <log-file>` が token / Account ID 検出時に exit 1 を返す
- [ ] staging deploy / production deploy が新 yaml で green
- [ ] `scripts/cf.sh` 経由のローカル deploy が引き続き動作（env var 名 `CLOUDFLARE_API_TOKEN` 互換）

## 6. 非機能要件

- セキュリティ: token 値 / Account ID の log 出現ゼロ
- 互換性: `scripts/cf.sh` ラッパー破壊禁止
- CI 影響: required status check（`backend-ci` / `web-cd`）の green 維持

## 7. 既存命名規則

- workflow file: kebab-case（`web-cd.yml`, `backend-ci.yml`）
- secret 名: SCREAMING_SNAKE_CASE（`CLOUDFLARE_API_TOKEN`）
- script: kebab-case + `.sh`（`scripts/cf.sh`, `scripts/redaction-check.sh`）

## 8. カテゴリ別 task 分類記録

- task classification: code task
- visual classification: NON_VISUAL（理由: CI/CD workflow 改修のみ、UI 変更なし）
- Phase 11 → 自動テスト + grep evidence で代替（実地操作不可）
