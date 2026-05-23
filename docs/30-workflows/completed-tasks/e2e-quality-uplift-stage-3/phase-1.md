# Phase 1: 要件定義

## 目的

Issue #608「e2e-quality-uplift-stage-3: CI gate + Lighthouse + Branch protection 実装」の残作業 — branch protection への新規 status check 登録と runtime evidence 記録 — を、再現性のある正本コードと手順に落とし込む。

## 機能要件

| ID | 要件 | 検証方法 |
|----|------|---------|
| FR-1 | `dev` の `required_status_checks.contexts` に `e2e-tests-coverage-gate` + `lighthouse-ci` を追加し、既存 `ci` / `Validate Build` / `coverage-gate` を保持する | `gh api repos/.../branches/dev/protection` の contexts diff |
| FR-2 | `main` の `required_status_checks.contexts` に `e2e-tests-coverage-gate` + `lighthouse-ci` を追加し、既存 `ci` / `Validate Build` / `coverage-gate` を保持する | 同上（main） |
| FR-3 | 適用前後の branch protection snapshot を `outputs/phase-11/` に JSON として保存し、rollback 可能性を担保 | ファイル存在確認 |
| FR-4 | `lighthouse.yml` の prod server 起動 step を fragile な bare `&` 起動から `nohup` + `wait-on` 待機に置き換え | `lighthouse.yml` の job step diff |
| FR-5 | branch protection desired-state manifest を `.github/branch-protection/` 配下に配置し、fresh GET から contexts 差し替え + CLAUDE.md invariants 正規化 + optional fields 保持の `gh api -X PUT` payload を生成するスクリプトを用意 | `.github/branch-protection/apply.sh` 実行で contexts / invariants drift 解消可能 |

## 非機能要件

- `required_pull_request_reviews=null` / `enforce_admins=true` / `lock_branch=false` / `required_linear_history=true` の drift を発生させない
- API Token / OAuth Token の実値は仕様書・コード・コミットメッセージに残さない
- apply スクリプトは idempotent（複数回実行しても結果が同一）
- pre/post snapshot は機密値を含まないが、redact 不要なフィールドのみ保存（`url` / `contexts` / `enforce_admins` / 等）

## 入力

| 入力 | 出典 |
|------|------|
| Issue #608 受け入れ条件 | GitHub Issue body |
| 既存 workflow 定義 | `.github/workflows/e2e-tests.yml`, `lighthouse.yml` |
| CLAUDE.md branch 戦略 | `CLAUDE.md` ブランチ戦略セクション |
| 現行 branch protection | `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` |

## 出力（タスク完了時の成果物）

| 成果物 | パス |
|--------|------|
| dev branch protection desired contexts | `.github/branch-protection/dev.json` |
| main branch protection desired contexts | `.github/branch-protection/main.json` |
| apply スクリプト | `.github/branch-protection/apply.sh` |
| pre snapshot (dev/main) | `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-{dev,main}-pre.json` |
| post snapshot (dev/main) | 同 `-post.json` |
| 修正後 lighthouse workflow | `.github/workflows/lighthouse.yml` |
| runtime evidence | `outputs/phase-11/runtime-evidence/required-contexts-{dev,main}.txt` |

## 制約

- C-1: CLOSED Issue を再 OPEN しない。仕様書のみ作成し、実装 PR は dev に直接 merge する
- C-2: branch protection への `gh api -X PUT` は **ユーザー明示承認後**にのみ実行（CLAUDE.md UT-GOV-001 ポリシー）
- C-3: 単一 PR で全成果物を完了させる（CONST_007）

## 受け入れ条件

- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq -r '.required_status_checks.contexts | sort'` の出力に `e2e-tests-coverage-gate` / `lighthouse-ci` が含まれる
- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq -r '.required_status_checks.contexts | sort'` の出力に `e2e-tests-coverage-gate` / `lighthouse-ci` が含まれる
- [ ] pre/post snapshot が `outputs/phase-11/` に存在
- [ ] `lighthouse.yml` で `pnpm wait-on http://localhost:3000` 相当の待機が組み込まれている
- [ ] PR CI / Lighthouse runtime evidence 取得までは `index.md` の workflow_state が `implemented_local_runtime_pending` であり、runtime evidence 取得後のみ `completed` に昇格する
