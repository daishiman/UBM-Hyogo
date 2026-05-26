# Phase 4: テスト計画

## 4.1 検証戦略

YAML 設定変更のみのため新規 unit テストは追加しない。代わりに以下 3 段階の検証ゲートで担保する。

### Gate 1: 静的検証（structural grep）

```bash
# 全 workflow に top-level permissions が存在することの確認
for f in .github/workflows/*.yml; do
  awk '/^jobs:/{exit} /^permissions:/{found=1} END{if(!found)print "MISSING: " FILENAME}' "$f"
done
# 期待: 何も出力されない
```

### Gate 2: actionlint 1.7.7

```bash
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.7
./actionlint -color .github/workflows/*.yml
# 期待: exit 0
```

local 未導入時は CI の actionlint step（`ci.yml:52-56`）を最終ゲートにする。

### Gate 3: required context 名不変

```bash
git diff dev -- .github/workflows/ | grep -E "^[+-]\s*[a-z_-]+:\s*$" | grep -vE "permissions:|contents:|id-token:|packages:|deployments:|pull-requests:" || echo "no job-key/name diff"
# 期待: "no job-key/name diff"
```

### Gate 4: job-level 宣言保持

```bash
# 既存 job-level permissions の diff（追加された top-level 以外に - 行が出ないこと）
git diff dev -- .github/workflows/backend-ci.yml .github/workflows/playwright-visual-baseline-update.yml .github/workflows/web-cd.yml .github/workflows/d1-migration-verify.yml .github/workflows/playwright-visual-full.yml | grep "^-" | grep -v "^---"
# 期待: 何も出力されない（削除行ゼロ）
```

## 4.2 DoD

- Gate 1〜4 すべて PASS。
- CI で actionlint が green。
- 既存 job が新たに red にならないこと（PR で全 required check green）。
