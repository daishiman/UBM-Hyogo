# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 4 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

修正の正しさを検証する戦略を設計する。NON_VISUAL / infra-fix のため、UI コンポーネントテストは対象外。grep / actionlint / yamllint / GitHub API / CI 再実行を組み合わせる。


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

- Phase 2 成果物（参照置換マップ）
- Phase 3 成果物（PASS 判定）

## テストカテゴリ

### 1. Static 検証（マージ前に実行可能）

| TC ID | 種別 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| TC-S01 | 旧参照ゼロ確認 | `grep -rn 'secrets\.CLOUDFLARE_ACCOUNT_ID' .github/` | exit 1（マッチなし） |
| TC-S02 | 新参照 6 件確認 | `grep -rn 'vars\.CLOUDFLARE_ACCOUNT_ID' .github/workflows/` | 6 行出力（backend-ci 4 + web-cd 2） |
| TC-S03 | yaml 構文 | `actionlint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml` | exit 0 |
| TC-S04 | yaml lint | `yamllint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml` | exit 0 |
| TC-S05 | Variable 登録確認 | `gh api repos/daishiman/UBM-Hyogo/actions/variables \| jq '.variables[] \| select(.name=="CLOUDFLARE_ACCOUNT_ID")'` | name と value が返る |
| TC-S06 | diff 目視 | `git diff .github/workflows/` | 6 行のみ変更（`secrets.` → `vars.`） |
| TC-S07 | 他 workflow 影響なし | `git diff --stat .github/workflows/ci.yml .github/workflows/validate-build.yml .github/workflows/verify-indexes.yml .github/workflows/pr-build-test.yml .github/workflows/pr-target-safety-gate.yml` | 0 行 |

### 2. Runtime 検証（マージ後に実行）

| TC ID | 種別 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| TC-R01 | backend-ci deploy-production 成功 | `gh run list --branch main --workflow=backend-ci --limit 1 --json conclusion` | `conclusion: success` |
| TC-R02 | web-cd deploy-production 成功 | `gh run list --branch main --workflow=web-cd --limit 1 --json conclusion` | `conclusion: success` |
| TC-R03 | Authentication error 消失 | 最新 run の log に `Authentication error \[code: 10000\]` を含まないこと | 該当文字列なし |
| TC-R04 | wrangler が account ID を受領 | log に `accountId` warning が出ないこと（wrangler-action の "missing accountId" 系警告） | 警告なし |

### 3. Negative 検証（異常系シナリオ確認）

Phase 6 で扱う。

## TDD 適用判定

本タスクは「設定値の参照名変更」であり実装ロジックなし。RED/GREEN サイクルではなく **diff check + CI 再実行** を主とする。`task-specification-creator` の `verify_existing` モードに近い扱いだが、実装変更を伴うため `implementation_mode = "new"` を維持しつつ、Phase 5 を「6 箇所置換 + diff 確認」に簡素化する。

## カバレッジ目標

| 観点 | カバレッジ |
| --- | --- |
| 修正対象行 | 6/6 = 100%（TC-S01, TC-S02 で網羅） |
| 修正対象ファイル | 2/2 = 100%（backend-ci.yml, web-cd.yml） |
| Runtime 検証 | 2/2 = 100%（backend-ci deploy-production + web-cd deploy-production） |


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 全 TC が ID 付きで列挙されている
- [ ] Static / Runtime の二段構成になっている
- [ ] マージ前後の責務分担が明確である

## 成果物

- `outputs/phase-04/main.md`
