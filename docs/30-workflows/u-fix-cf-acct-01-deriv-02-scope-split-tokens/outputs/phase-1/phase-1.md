# Phase 1: 要件定義・GO/NO-GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

Issue #406 の AC を確定し、上流タスク `U-FIX-CF-ACCT-01`（単一 Token + 最小 4 scope）が staging / production の両方で 30 日以上 green であることを実測値で確認したうえで、本タスクの GO / NO-GO を判定する。

## Step 0: P50 チェック（必須）

```bash
# 1) 単一 Token 運用での 30 日 deploy 履歴（staging）
gh run list --branch dev --workflow backend-ci.yml --limit 50 \
  --json status,conclusion,createdAt \
  | tee outputs/phase-1/staging-30day-history.json

# 2) production 履歴
gh run list --branch main --workflow backend-ci.yml --limit 50 \
  --json status,conclusion,createdAt \
  | tee outputs/phase-1/production-30day-history.json

# 3) 現行単一 Token の scope を確認（base wave outputs を再参照）
cat docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-11/cf-token-scope.json \
  | tee outputs/phase-1/current-token-scope-snapshot.json

# 4) 既存 GitHub Secrets 一覧（値ではなく名前のみ）
gh secret list --repo daishiman/UBM-Hyogo \
  | tee outputs/phase-1/secret-name-inventory.log
```

期待:
- staging / production 両方で直近 30 日の deploy `conclusion=success` 比率 100%
- 現行 Token scope が `Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read` の 4 scope のみ
- `CLOUDFLARE_API_TOKEN` 単一 secret が存在し、`CF_TOKEN_*_*` 名は未投入

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | 6 Token (Workers/D1/Pages × staging/production) が発行済み | Phase 11 manual evidence |
| AC-2 | GitHub Secrets が `CF_TOKEN_<SCOPE>_<ENV>` 命名で 6 件投入済み | `gh secret list` |
| AC-3 | ``.github/workflows/backend-ci.yml` / `.github/workflows/web-cd.yml` が job 分割され、各 job の `secrets:` が該当 Token のみ | YAML diff & `actionlint` |
| AC-4 | `scripts/cf.sh` が `CLOUDFLARE_API_TOKEN` を引数経由で受け取る | shell smoke test |
| AC-5 | staging 7 日連続 deploy success | `gh run list` |
| AC-6 | production deploy 成功 + 旧単一 Token 24h 並行保持後の失効 | Cloudflare dashboard manual evidence |
| AC-7 | Token 単位 rotation / rollback runbook が `outputs/phase-12/runbook-token-rotation.md` に存在 | ファイル grep |
| AC-8 | `deployment-secrets-management.md` の secrets 表が 6 Token 構成に更新済み | git diff |

## GO / NO-GO 判定

| 条件 | 判定 |
| --- | --- |
| 単一 Token が staging/production で 30 日 green | GO |
| 30 日 green 未達 | NO-GO（U-FIX-CF-ACCT-01 観測継続） |
| secret 管理オペレーション未成熟（rotation 経験なし） | NO-GO（先に rotation 実演） |
| DERIV-03 (rotation 自動化) 未着手かつ運用人員 1 名のみ | CONDITIONAL-GO（runbook を強化条件） |

## 成果物

- `outputs/phase-1/staging-30day-history.json`
- `outputs/phase-1/production-30day-history.json`
- `outputs/phase-1/current-token-scope-snapshot.json`
- `outputs/phase-1/secret-name-inventory.log`
- `outputs/phase-1/single-token-stability-evidence.md`（30 日 green サマリ）
- `outputs/phase-1/go-no-go-decision.md`（判定結果と根拠）
