# Phase 11 — Evidence (task-01 + task-02 合算)

## NON_VISUAL 宣言

両タスクとも NON_VISUAL (GitHub Actions infra 修正)。スクリーンショット不要。
Evidence は GitHub Actions CI run の CLI 出力で代替する。

## ローカル静的検証 evidence

実装サイクル内 (push 前) に取得した evidence。

### actionlint

```
$ ./actionlint -color .github/workflows/ci.yml .github/workflows/backend-ci.yml
(exit 0, no output)
```

→ AC-4 (task-01) / AC-4 (task-02) 充足。

### caller 数 grep gate (task-01 AC-3 用)

```
$ grep -rn "uses: ./.github/actions/setup-project" .github/workflows/ | wc -l
9
```

→ 既存 caller 数 9 が維持されている。新規 caller の意図せぬ追加なし。

### `cache: ''` 適用箇所 (task-01)

```
$ grep -rn "cache: ''" .github/workflows/
.github/workflows/ci.yml:30:          cache: ''
```

→ `workflow-shell-lint` job のみが `cache: ''` を渡しており、他 caller (`install: 'true'`) は default `'pnpm'` 解決で後方互換維持。

### 実 token 混入 grep (task-02 AC-6 用)

```
$ git diff -- .github/workflows/backend-ci.yml | grep -Ei '(eyJ[A-Za-z0-9_-]{20,}|[a-f0-9]{40,})' || echo "OK: no raw token detected"
OK: no raw token detected
```

→ AC-6 (実 token 値が diff に出現しない) 充足。

### git diff --stat

```
 .github/actions/setup-project/action.yml     |  6 ++++-
 .github/workflows/backend-ci.yml             | 12 ++++++++++
 .github/workflows/ci.yml                     |  1 +
 scripts/__tests__/workflow-env-scope.test.sh | 33 ++++++++++++++++++++++++++++
 4 files changed, 51 insertions(+), 1 deletion(-)
```

→ Phase 5 仕様の編集差分 (task-01: setup-project + ci cache / task-02: backend-ci 4 step env + workflow-env-scope regression) と一致。

## CI run evidence (push 後に追記)

> 実装サイクルでは push / commit / PR 作成は禁止されているため、CI run の実取得は別フェーズ (PR 作成プロンプト) に委ねる。
> push 後に下記表を埋める。

### task-01 (workflow-shell-lint)

| 項目 | 値 |
| ---- | -- |
| feature branch | (push 後記入) |
| CI run URL | (push 後記入) |
| workflow-shell-lint conclusion | (期待: success) |
| `Path Validation Error` 出現回数 | (期待: 0) |
| 他 caller (pr-build-test/e2e-tests 等) latest conclusion | (期待: success) |

### task-02 (deploy-staging)

> Phase 11 EV-11-1〜EV-11-5。dev に PR マージ後にしか取得不可。
> また EV-11-1 (`gh secret list --env staging`) は Phase 5 Step 4 (Secret 登録) のユーザー承認後でのみ確認可能。

| EV ID | 期待 | 実値 |
| ----- | ---- | ---- |
| EV-11-1 (secret 名 2 件) | `CF_TOKEN_D1_STAGING`, `CF_TOKEN_WORKERS_STAGING` 存在 | (Secret 登録後) |
| EV-11-2 (D1 migrations 成功) | `Resource location: remote` 後エラーなし | (dev push 後) |
| EV-11-3 (Workers deploy 成功) | `Deployment complete!` | (dev push 後) |
| EV-11-4 (token env エラー消失) | grep count = 0 | (dev push 後) |
| EV-11-5 (runtime-smoke 起動) | `runtime-smoke-staging` job 起動 | (dev push 後) |

## DoD 充足状況 (ローカル時点)

| Task | AC | 状態 |
| ---- | -- | ---- |
| task-01 | AC-1 (workflow-shell-lint green) | CI 実行待ち |
| task-01 | AC-2 (Path Validation Error 0) | CI 実行待ち |
| task-01 | AC-3 (他 caller 無変更 green) | grep gate clean / CI 実行待ち |
| task-01 | AC-4 (actionlint clean) | ✅ ローカル exit 0 |
| task-02 | AC-1〜AC-3 (deploy-staging green) | dev push + Secret 登録後 |
| task-02 | AC-4 (actionlint clean) | ✅ ローカル exit 0 |
| task-02 | AC-5 (staging secret 2 件存在) | ユーザー承認後の Secret 登録待ち |
| task-02 | AC-6 (実 token 値の混入なし) | ✅ git diff grep clean |
