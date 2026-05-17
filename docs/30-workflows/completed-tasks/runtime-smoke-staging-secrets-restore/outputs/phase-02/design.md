# Phase 2: 設計

## アーキテクチャ概要

```
            ┌─ verify-env-secrets.yml (PR / push) ──┐
            │     verify-env-secrets.sh             │
            │       ├─ workflow ref scan            │  ←── 既存
PR / push ──┤       └─ allowlist env-required scan  │  ←── 追加 (AC-03/04)
            └────────────────────────────────────────┘

backend-ci ─ deploy-staging ─ runtime-smoke-staging.yml
                                 ├─ verify required staging secrets   ←── runtime値の空文字確認を維持 (AC-04)
                                 └─ run runtime smoke
```

## 変更対象ファイル

| パス | 変更種別 | 役割 |
|------|---------|------|
| `scripts/ci/verify-env-secrets.sh` | 編集 | allowlist の `env=<ENV>;required=<CSV>;reason=<REASON>` 宣言を読み、指定 Environment scope の登録済 secret 一覧（`gh api`）と必須キー集合の差分を計算する |
| `scripts/ci/verify-env-secrets.allowlist` | 編集 | `staging-runtime-smoke` Environment の必須キー宣言を追加 |
| `scripts/ci/__tests__/verify-env-secrets.spec.sh` | 編集 | 新規ケース ENV-001（allowlist env-required 欠落時 fail / 全件登録時 PASS）を追加 |
| `.github/workflows/verify-env-secrets.yml` | 確認 | 既存 `Run preflight gate` step が allowlist を読むため追加 step は不要 |
| `.github/workflows/runtime-smoke-staging.yml` | 確認 | inline for ループは runtime 値確認として維持。`env:` block と secret マスキングも維持する |
| `docs/30-workflows/runtime-smoke-staging-secrets-restore/outputs/phase-05/implementation-spec.md` | 新規 | 本実装仕様書 |
| `docs/30-workflows/runtime-smoke-staging-secrets-restore/runbooks/incident-2026-05-16.md` | 新規 | 今回の incident 復旧手順（既存 runbook を参照する形でリンクのみ） |

## 関数 / インタフェース

### `scripts/ci/verify-env-secrets.sh` 追加 I/F

```
verify-env-secrets.allowlist
  env=<ENV_NAME>;required=<CSV>;reason=<REASON>

return:
  0 → 必須キーすべて登録済
  1 → 1 件以上欠落（既存 unresolved output schema で stdout に出力）
  2 → 引数不正 / 前提コマンド不在
  3 → GitHub API inventory 取得失敗

JSON 出力スキーマ（既存 unresolved entry と同一 schema）:
  {
    "workflow": "scripts/ci/verify-env-secrets.allowlist",
    "job": "env-required",
    "env": "staging-runtime-smoke",
    "secret": "STAGING_MEMBER_ID",
    "reason": "required-staging-runtime-smoke-secret"
  }
```

### 取得 API

`gh api repos/{owner}/{repo}/environments/{env}/secrets --jq '.secrets[].name'`

権限: `GH_VERIFY_ENV_SECRETS_TOKEN`（PR からも環境 secrets 一覧の **名前のみ** を読める必要があるため、既存 `GITHUB_TOKEN` フォールバックでは不足する可能性がある。fallback 経路の挙動を Phase 11 証跡で確認し、不足時は PR gate ではなく push / workflow_dispatch gate を正本境界にする）。

## 副作用 / セキュリティ

- secret **値** は一切取得しない。`name` 一覧のみを取得。
- `set -x` / xtrace は使用禁止。
- `::add-mask::` 系は本検査では不要（値を扱わないため）。
- `runtime-smoke-staging.yml` 側の既存マスキング / redaction grep gate は維持。

## エラーハンドリング

| ケース | 挙動 |
|--------|------|
| `gh` 不在 | exit 2、stderr `gh is required` |
| Environment 未存在 | 空 inventory として扱い、必須キー欠落を既存 unresolved output schema で出力 |
| API 4xx / 5xx（404 以外） | exit 3、stderr に `gh api` error と `failed to list environment secrets: <ENV>` |
| 必須キー欠落 | exit 1、stdout に line output または `--json` 時 JSON output |
| 全件 PASS | exit 0、`--json` 時のみ JSON を stdout |

## ステップ間 state 引き渡し（CI）

| step | 入力 | 出力 |
|------|------|------|
| verify (preflight) | allowlist env-required 宣言 | exit code, JSON evidence |
| smoke 本体 | exit 0 を前提に env block の secret を参照 | smoke 結果 |

## ライブラリ採用判定

新規依存なし。`gh` / `jq` / `bash 5.x`（既に CI ランナーで利用可能）。

## NON_VISUAL 宣言根拠

UI / アプリケーション動作の変更は無く、CI ガード強化と shell スクリプト変更のみ。視覚証跡は不要。代替証跡は `scripts/ci/__tests__/verify-env-secrets.spec.sh` の追加ケース PASS ログと、`gh workflow run` での re-run 成功ログ。
