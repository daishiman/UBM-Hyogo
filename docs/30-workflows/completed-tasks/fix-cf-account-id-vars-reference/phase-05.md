# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 5 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

Phase 2 の置換マップに沿って 6 箇所を置換し、Static 検証（TC-S01〜S07）が通ることを確認する。


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
- Phase 4 成果物（テスト戦略）

## 新規作成 / 修正ファイル一覧

| 種別 | パス | 変更概要 |
| --- | --- | --- |
| 修正 | `.github/workflows/backend-ci.yml` | 4 箇所の `secrets.CLOUDFLARE_ACCOUNT_ID` → `vars.CLOUDFLARE_ACCOUNT_ID` |
| 修正 | `.github/workflows/web-cd.yml` | 2 箇所の `secrets.CLOUDFLARE_ACCOUNT_ID` → `vars.CLOUDFLARE_ACCOUNT_ID` |
| 新規作成 | なし | - |

## 実行手順

### Step 1: 事前確認

```bash
# 1-A: Variable が登録済みであることを再確認
gh api repos/daishiman/UBM-Hyogo/actions/variables | jq '.variables[] | select(.name=="CLOUDFLARE_ACCOUNT_ID")'
# 期待: name=CLOUDFLARE_ACCOUNT_ID, value=b3dde7be... が返る

# 1-B: 修正前の参照箇所を記録
grep -rn 'secrets\.CLOUDFLARE_ACCOUNT_ID' .github/
# 期待: 6 箇所がマッチ（backend-ci.yml: 4, web-cd.yml: 2）
```

### Step 2: 置換実行

`.github/workflows/backend-ci.yml`:

```
Edit:
  old_string: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  new_string: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
  replace_all: true
```

`.github/workflows/web-cd.yml`:

```
Edit:
  old_string: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  new_string: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
  replace_all: true
```

### Step 3: Static 検証

```bash
# TC-S01: 旧参照ゼロ
grep -rn 'secrets\.CLOUDFLARE_ACCOUNT_ID' .github/ || echo "PASS"

# TC-S02: 新参照 6 件
grep -rn 'vars\.CLOUDFLARE_ACCOUNT_ID' .github/workflows/ | wc -l
# 期待: 6

# TC-S03: actionlint
actionlint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml

# TC-S04: yamllint
yamllint .github/workflows/backend-ci.yml .github/workflows/web-cd.yml

# TC-S05: Variable 登録確認 + Secret 未登録確認
gh api repos/daishiman/UBM-Hyogo/actions/variables | jq '.variables[] | select(.name=="CLOUDFLARE_ACCOUNT_ID")'
gh api repos/daishiman/UBM-Hyogo/actions/secrets | jq '.secrets[] | select(.name=="CLOUDFLARE_ACCOUNT_ID")'
# 期待: variables 側は name が返る / secrets 側は空

# TC-S06: diff 目視
git diff .github/workflows/
# 期待: 6 行のみ変更

# TC-S07: 他 workflow 不変
git diff --stat .github/workflows/ci.yml .github/workflows/validate-build.yml \
                 .github/workflows/verify-indexes.yml .github/workflows/pr-build-test.yml \
                 .github/workflows/pr-target-safety-gate.yml
# 期待: 0 行
```

### Step 4: コミット（Phase 13 まで保留）

本フェーズではコミットしない。Phase 13 で user 明示承認後にまとめて実行する。

## diff サンプル（期待）

```diff
--- a/.github/workflows/backend-ci.yml
+++ b/.github/workflows/backend-ci.yml
@@ -39,7 +39,7 @@ jobs:
         uses: cloudflare/wrangler-action@v3
         with:
           apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
-          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
+          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
           wranglerVersion: 4.85.0
@@ -50,7 +50,7 @@ jobs:
         uses: cloudflare/wrangler-action@v3
         with:
           apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
-          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
+          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
           wranglerVersion: 4.85.0
（以下、L87, L98, web-cd.yml L45, L82 も同パターン）
```

## ロールバック手順

修正後にトラブルが発生した場合（極めて低確率）:

```bash
git revert <commit-sha>
```

`vars.CLOUDFLARE_ACCOUNT_ID` の Variable 登録を意図的に削除されたケース等を除き、本修正で新たな障害が発生するシナリオは想定されない。


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 修正対象 6 箇所が置換されている
- [ ] Static 検証 TC-S01〜S07 が全 PASS
- [ ] コミットは実行されていない（Phase 13 で実施）

## 成果物

- `outputs/phase-05/main.md`
