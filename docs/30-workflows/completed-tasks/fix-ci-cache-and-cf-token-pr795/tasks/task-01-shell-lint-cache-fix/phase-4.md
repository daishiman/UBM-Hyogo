# Phase 4 — テスト方針 (task-01)

## 前提

本タスクは GitHub Actions YAML の修正であり、ランタイムは GitHub Actions runner 上でのみ評価される。ユニットテストフレームワーク (vitest 等) は適用不可。よって以下の代替検証経路を採用する。

## テスト方針

### T1. 構文検証 (静的)

`actionlint` で YAML 構文・action 入力の整合性を検証する。

```bash
# 事前: GitHub Actions runner 上の手順と同等
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)

./actionlint -color .github/workflows/ci.yml .github/actions/setup-project/action.yml
```

assertion: exit code 0 / 出力に `ERROR` / `unexpected` を含まない。

### T2. composite action 構造検証 (静的)

`ci.yml` L52- の `Validate setup-project composite action structure` step で行われている token 存在 grep に新 input が干渉しないことを確認する。

```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('.github/actions/setup-project/action.yml', 'utf8');
for (const token of [
  'runs:',
  \"using: 'composite'\",
  'uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1',
  'uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
]) {
  if (!src.includes(token)) { console.error('missing:', token); process.exit(1); }
}
console.log('ok');
"
```

assertion: stdout = `ok` / exit 0。

### T3. 実 CI 実行検証 (動的)

```bash
gh workflow run ci.yml --ref <branch>
# 完了待ち
gh run watch <run-id>
# 結果確認
gh run view <run-id> --log > run.log
```

assertion (複合):

1. `gh run view <run-id> --json conclusion -q .conclusion` == `success`
2. `grep -c "Path Validation Error" run.log` == `0`
3. `gh run view <run-id> --json jobs -q '.jobs[] | select(.name=="workflow-shell-lint") | .conclusion'` == `success`

### T4. 他 caller への回帰検証 (動的)

`workflow-shell-lint` 以外の job (typecheck / lint / test 等、`setup-project` を default 引数で利用) が同 run で green になることを確認。

assertion: `gh run view <run-id> --json jobs -q '.jobs[].conclusion' | sort -u` が `["success"]` のみ。

## NON_VISUAL 宣言

本タスクは GitHub Actions infra 修正であり UI 影響なし。Phase 11 evidence はスクリーンショット不要、CI run のログで代替する。

## テスト網羅

| AC | 検証経路 |
| -- | -------- |
| AC-1 | T3 (1) (3) |
| AC-2 | T3 (2) |
| AC-3 | T4 |
| AC-4 | T1 |

## CI gate 関連

`workflow-shell-lint` は dev / main の required status check 候補。本タスク完了で「常時 green の required check」として登録可能になる (登録自体は別タスクで明示承認後)。
