# task-01-staging-runtime-smoke-secret-finalization

[実装区分: 実装仕様書]

判定根拠: secret 実投入そのものは user 単独操作（AI 禁止）であり、AI は値に触れない。一方で本タスクは runbook の新規作成（コードリポジトリ配下のファイル追加）と、baseline / after evidence の取得手順整備、`runtime-smoke-staging.yml` 再実行手順の citation を伴うため、ドキュメント生成という形での「リポジトリへの変更」が発生する。よって docs-only 仕様書ではなく **実装仕様書** として扱う（CONST_005）。

## 概要

`staging-runtime-smoke` GitHub Environment に対し、必須 secret 5 件を user 自身が `op read | gh secret set` で投入し、`runtime-smoke-staging.yml` の `verify required staging secrets` step が再実行で PASS する状態を確定させる。

必須 secret 5 件:

| name | 用途 |
|------|------|
| `STAGING_API_BASE` | staging API base URL |
| `STAGING_ADMIN_BEARER` | admin 経路 smoke 用 bearer |
| `STAGING_MEMBER_ID` | member 経路 smoke 対象 ID |
| `STAGING_ME_BEARER` | `/me` smoke 用 bearer |
| `SLACK_WEBHOOK_INCIDENT` | smoke 失敗時の incident 通知 |

AI が担うのは「runbook 整備」「baseline / after evidence 受け入れ枠」「再実行手順 citation」のみ。`op read` / `gh secret set` の代行、値の chat / file / commit message / PR description への記載は禁止。

## 実装区分

- 実装仕様書（runbook 新規追加を含む）
- ただし secret 値そのものへの touch は AI 禁止。user 単独操作のみで完結する手順を runbook 化する。

## 変更対象ファイル

| 区分 | パス | 変更内容 |
|------|------|---------|
| 新規 | `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-01-staging-runtime-smoke-secret-finalization/runbook.md` | user 操作手順・baseline / after コマンド・再実行手順を 1 ファイルに集約 |
| 参照のみ (変更なし) | `scripts/smoke/provision-staging-secrets.sh` | 既存スクリプト。runbook から citation するのみ |
| 参照のみ (変更なし) | `.github/workflows/runtime-smoke-staging.yml` (L35-L48 `verify required staging secrets` step) | 再実行先の workflow。pass 判定の根拠 step |
| 参照のみ (変更なし) | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` §54-58 | 既存 runbook を citation 元として参照 |

新規ファイルは `runbook.md` 1 件のみ。既存ファイルへの編集は行わない。

## 手順 (user 操作)

> **AI 禁止操作**: 以下コマンドは user が local 端末で実行する。AI（Claude Code 含む）は `op read` / `gh secret set` を代行してはならない。

### 1. 事前確認

```bash
gh auth status
op whoami
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke >/dev/null && echo "env exists"
```

### 2. baseline 取得（投入前）

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets | length'
# 期待値: 0
```

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name | sort'
# 期待値: 空配列（出力なし）
```

### 3. 5 件を 1Password から `gh secret set` で投入

```bash
op read 'op://Cloudflare/UBM-Hyogo Staging/api-base' \
  | gh secret set STAGING_API_BASE --env staging-runtime-smoke

op read 'op://Cloudflare/UBM-Hyogo Staging/admin-bearer' \
  | gh secret set STAGING_ADMIN_BEARER --env staging-runtime-smoke

op read 'op://Cloudflare/UBM-Hyogo Staging/member-id' \
  | gh secret set STAGING_MEMBER_ID --env staging-runtime-smoke

op read 'op://Cloudflare/UBM-Hyogo Staging/me-bearer' \
  | gh secret set STAGING_ME_BEARER --env staging-runtime-smoke

op read 'op://Cloudflare/UBM-Hyogo Staging/slack-webhook-incident' \
  | gh secret set SLACK_WEBHOOK_INCIDENT --env staging-runtime-smoke
```

> op item path は 1Password vault 構成に合わせて user 側で読み替える。値そのものは stdout に echo / pipe 先以外へリダイレクトしない。

> 既存スクリプト `scripts/smoke/provision-staging-secrets.sh` に投入経路をまとめてもよい（実行も user 操作で行う）。

## 検証コマンド

### A. 件数検証（after）

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets | length'
# 期待値: 5
```

### B. name list 完全一致検証

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name | sort'
```

期待出力（順不同を sort で吸収）:

```
SLACK_WEBHOOK_INCIDENT
STAGING_ADMIN_BEARER
STAGING_API_BASE
STAGING_ME_BEARER
STAGING_MEMBER_ID
```

### C. `runtime-smoke-staging.yml` 再実行

```bash
# 方法 1: 手動 dispatch
gh workflow run runtime-smoke-staging.yml --ref dev

# 方法 2: 直近 fail run を re-run
gh run list --workflow=runtime-smoke-staging.yml --branch dev --limit 1 --json databaseId \
  --jq '.[0].databaseId' \
  | xargs -I{} gh run rerun {}
```

完了待ち:

```bash
gh run list --workflow=runtime-smoke-staging.yml --branch dev --limit 1
gh run view <RUN_ID> --log
```

### D. success 判定

- `.github/workflows/runtime-smoke-staging.yml` の `verify required staging secrets` step (L35-L48) が **PASS**
- 後続 `run runtime smoke` step に **進入** している（skip ではない）
- run の conclusion が `success`

## テスト方針

- spec_created 段階: evidence 枠のみ準備（`outputs/phase-2/` または task-01 ローカルの evidence ディレクトリに baseline / after の出力を後追いで貼り付ける枠を確保）。
- spec_implemented 段階: user 操作後、検証コマンド A / B / C / D の出力を evidence として記録する。
- AI による自動テスト（Vitest 等）は本タスク対象外。secret 投入は GitHub API mutation であり、CI で再現するものではない。
- evidence 中に secret 値・hash・fragment・末尾抜粋を残さないこと。残してよいのは「name」「件数」「workflow run の step 名と conclusion」のみ。

## DoD

- [ ] `staging-runtime-smoke` env の secrets 件数 = **5**（検証コマンド A）
- [ ] secret name 5 件すべてが期待リスト（`SLACK_WEBHOOK_INCIDENT` / `STAGING_ADMIN_BEARER` / `STAGING_API_BASE` / `STAGING_ME_BEARER` / `STAGING_MEMBER_ID`）と完全一致（検証コマンド B）
- [ ] `runtime-smoke-staging.yml` が **1 度の re-run** で `verify required staging secrets` step PASS（検証コマンド C / D）
- [ ] 後続 `run runtime smoke` step に進入し、run conclusion = `success`
- [ ] secret 値を chat / file / commit message / PR description / evidence のいずれにも出していない
- [ ] `runbook.md` が新規作成され、上記手順・コマンドが citation 付きで記載されている

## 不変条件

1. AI による `op read` / `gh secret set` の代行禁止。値そのものに AI が touch しない。
2. secret 値の hash / fragment / 末尾抜粋 / 長さ等の派生情報を、いかなる成果物（chat 応答 / runbook / evidence / commit message / PR description）にも残さない。
3. `gh secret set` の結果として GitHub が表示する name / updated_at 以外の値を記録しない。
4. `.github/workflows/runtime-smoke-staging.yml` 本体・`scripts/smoke/provision-staging-secrets.sh` 本体を本タスクで編集しない（task-01 のスコープ外）。
5. `staging-runtime-smoke` 以外の GitHub Environment（例: `production` / `staging` 一般 env）への投入は本タスクでは行わない。
6. 1Password item path は user 側 vault 構成に依存するため、runbook は path テンプレートを示すのみで実 path を強制しない。ただし vault 名 / item 名に secret 値断片を含めない運用前提を継承する。

## サイクル外候補

該当なし。本タスクは secret 5 件 + runbook 1 件のみで完結する。`runtime-smoke-staging.yml` 自体の改修・`SLACK_WEBHOOK_INCIDENT` の通知文面整備・production env への展開は task-02 / task-03 / 後続 workflow のスコープ。

## References

- 上位 workflow: `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/index.md`
- 上位 phase: `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/phase-1.md` / `phase-2.md` / `phase-3.md`
- 既存 runbook citation 元: `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` §54-58
- 既存スクリプト: `scripts/smoke/provision-staging-secrets.sh`
- 対象 workflow: `.github/workflows/runtime-smoke-staging.yml` L35-L48 (`verify required staging secrets` step)
- secret 管理ポリシー: `CLAUDE.md` 「シークレット管理」「Cloudflare 系 CLI 実行ルール」節
