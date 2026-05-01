# Phase 11: 手動 smoke test（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 11 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（GitHub Actions workflow yaml の参照修正） |
| 非視覚的理由 | UI / UX 変更を含まない CI infra-fix |
| 代替証跡 | grep / actionlint / yamllint / gh api / gh run 結果ログ |
| Screenshot | UI/UX変更なしのため Phase 11 スクリーンショット不要 |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

修正の正しさを Static / Runtime の二段で検証し、`outputs/phase-11/manual-smoke-log.md` に記録する。


## 参照資料

- `index.md`
- `artifacts.json`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## 入力

- Phase 5 完了済みの作業ツリー
- main マージ後の最新 CI run（Runtime 検証時）

## 実施手順

### Static 検証（マージ前）

```bash
# TC-S01: 旧参照ゼロ
grep -rn 'secrets\.CLOUDFLARE_ACCOUNT_ID' .github/

# TC-S02: 新参照 6 件
grep -rn 'vars\.CLOUDFLARE_ACCOUNT_ID' .github/workflows/ | wc -l

# TC-S03: actionlint
actionlint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml

# TC-S04: yamllint
yamllint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml

# TC-S05: Variable 登録確認
gh api repos/daishiman/UBM-Hyogo/actions/variables | jq '.variables[] | select(.name=="CLOUDFLARE_ACCOUNT_ID")'
gh api repos/daishiman/UBM-Hyogo/actions/secrets | jq '.secrets[] | select(.name=="CLOUDFLARE_ACCOUNT_ID")'

# TC-S06: diff 確認
git diff .github/workflows/

# TC-S07: 他 workflow 不変
git diff --stat .github/workflows/
```

各結果を `outputs/phase-11/manual-smoke-log.md` に貼り付ける。

### Runtime 検証（マージ後）

```bash
# TC-R01: backend-ci 最新 run
gh run list --branch main --workflow=backend-ci --limit 1 --json conclusion,status,databaseId

# TC-R02: web-cd 最新 run
gh run list --branch main --workflow=web-cd --limit 1 --json conclusion,status,databaseId

# TC-R03: Authentication error 不在
gh run view <run-id> --log | grep -E 'Authentication error|code: 10000' || echo "PASS: no auth error"

# TC-R04: missing accountId 系警告不在
gh run view <run-id> --log | grep -Ei 'missing accountId|accountId.*(empty|required)' || echo "PASS: accountId warning absent"
```

## 証跡フォーマット

`outputs/phase-11/manual-smoke-log.md` に以下のセクションを含める:

1. NON_VISUAL 宣言
2. 実施情報（実施日時・実施者・対象ブランチ・対象 commit SHA）
3. Static 検証結果（TC-S01〜S07 の実コマンド出力）
4. Runtime 検証結果（TC-R01〜R04 の実コマンド出力 - マージ後追記）
5. 既知の制限・環境ブロッカー（あれば分離記録）


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] Static 検証 7 項目が全 PASS で記録されている
- [ ] Runtime 検証 4 項目が green で記録されている（マージ後）
- [ ] NON_VISUAL 宣言が `manual-smoke-log.md` 冒頭に明記されている

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
