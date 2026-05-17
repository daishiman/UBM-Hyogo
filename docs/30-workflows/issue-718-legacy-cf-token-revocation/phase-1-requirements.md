# Phase 1: 要件定義

## メタ情報

- task_id: `issue-718-legacy-cf-token-revocation`
- phase: 1 / requirements
- prev: なし
- next: phase-2-design

## 目的

legacy `CLOUDFLARE_API_TOKEN`（Issue #640 cutover 前から存在する long-lived Account-scoped token）の物理失効に必要な inventory・前提・受け入れ基準を確定する。

## Step 0: P50 チェック（必須）

```bash
# legacy 名参照の最新状態を確認
rg -n "CLOUDFLARE_API_TOKEN\b" .github/workflows/ apps/api/ apps/web/ scripts/ docs/ .claude/

# Issue #640 staging/production evidence の green 確認
ls docs/30-workflows/completed-tasks/issue-640-oidc-cf-token-cutover/outputs/phase-11/
```

期待: legacy 名参照は `web-cd.yml` / `backend-ci.yml` および test/redaction utility に限定され、各参照が「secret 名の継続利用」か「legacy token value 依存」かに分類されている。完了タスクの evidence ディレクトリが存在。

## 実行タスク

1. legacy `CLOUDFLARE_API_TOKEN` の参照箇所を `outputs/phase-1/legacy-token-reference-inventory.md` に列挙する。
2. 参照を「deploy step env: 実 token を要求」「test/grep utility: pattern マッチのみ」「redaction script: pattern マッチのみ」の 3 区分に分類する。
3. 各 GitHub Secrets / 1Password item の name（実値除く）を `outputs/phase-1/secret-inventory.md` に列挙する。
4. 受け入れ基準（AC）を番号付きで定義する。

## 受け入れ基準（AC）

- **AC-1**: Cloudflare dashboard 上の legacy `CLOUDFLARE_API_TOKEN` が `revoked` 状態になっている。
- **AC-2**: `.github/workflows/backend-ci.yml` の D1 / Workers deploy step が正本既存名 `CF_TOKEN_D1_STAGING` / `CF_TOKEN_D1_PRODUCTION` / `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` を参照している。`web-cd.yml` は environment-scoped `CLOUDFLARE_API_TOKEN` 名を維持し、operator-only evidence で値が legacy token ではないことを確認する。
- **AC-3**: `scripts/__tests__/workflow-env-scope.test.sh` に「backend-ci で無修飾 `secrets.CLOUDFLARE_API_TOKEN` が D1 / Workers deploy step に出現したら fail」し、かつ step 名ごとの期待 secret 名を exact match する gate が追加されている。
- **AC-4**: `gh secret list` 出力と operator-only evidence で、legacy token value が GitHub Secrets / 1Password の active deploy surface から外れていることが確認されている（secret 値・URI・hash は記録しない）。
- **AC-5**: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の inventory が新方式単一参照に更新されている。
- **AC-6**: revocation 直前 / 直後の `bash scripts/cf.sh whoami` / `d1 list` health check が green。
- **AC-7**: evidence ファイルに redaction 漏れ（token 値・suffix・account id）がないことを `scripts/redaction-check.sh` で検証済み。

## 参照資料

- `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`
- `docs/30-workflows/completed-tasks/issue-640-oidc-cf-token-cutover/phase-12-documentation.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`

## 統合テスト連携

該当なし（CI/CD workflow rename + bash gate のみ）。`scripts/__tests__/workflow-env-scope.test.sh` を integration test 相当として扱う。

## 多角的チェック観点

- secret rename によって deploy が一時的に止まらないか（rename と secret 投入の順序）
- redaction check で token 値・account id が混入していないか
- `scripts/check-cf-rotation-reminder.sh` の grep pattern が rename 後も機能するか

## 成果物

- `outputs/phase-1/legacy-token-reference-inventory.md`
- `outputs/phase-1/secret-inventory.md`
- `outputs/phase-1/acceptance-criteria.md`

## 完了条件

- [ ] AC-1〜AC-7 が `outputs/phase-1/acceptance-criteria.md` に明文化されている
- [ ] legacy token 参照 inventory が完了（区分 3 分類済み）
- [ ] Issue #640 evidence green が確認できている

## タスク100%実行確認【必須】

- [ ] 上記成果物 3 ファイルが作成されている
- [ ] Phase 2 に進む gate が NO-GO になっていない

## 次Phase

phase-2-design.md
