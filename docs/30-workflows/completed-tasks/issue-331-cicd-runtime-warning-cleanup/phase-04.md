# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 4 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 検証戦略

CI 設定変更タスクのため、unit test ではなく **静的検証 + dry-run + 実 CI 実行** で担保する。

## 検証マトリクス

| ID | 種別 | 対象 | コマンド | 期待 |
| --- | --- | --- | --- | --- |
| T-1 | static | apps/api/wrangler.toml | TOML parse（`pnpm exec node -e "require('toml').parse(fs.readFileSync('apps/api/wrangler.toml','utf8'))"` 等） | parse 成功 |
| T-2 | static | apps/api/wrangler.toml | `grep -E "^\[vars\]" apps/api/wrangler.toml` | 0 行 |
| T-3 | dry-run | apps/api（production） | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run 2>&1 \| grep -i 'warning'` | 0 行（vars 由来 warning） |
| T-4 | dry-run | apps/api（staging） | 同上 `--env staging` | 0 行 |
| T-5 | static | .github/workflows/web-cd.yml | yamllint / actionlint（インストール済みなら） | エラー 0 |
| T-6 | static | .github/workflows/ | `grep -rn 'pages deploy' .github/workflows/` | 0 件 |
| T-7 | static | .github/workflows/web-cd.yml | `grep -n 'scripts/cf.sh deploy' .github/workflows/web-cd.yml` | 2 件以上（staging / production） |
| T-8 | dynamic | apps/web staging | `gh workflow run web-cd.yml --ref dev` | green |
| T-9 | dynamic | apps/web production | main マージ後の web-cd run | green、warning ゼロ |
| T-10 | sync | aiworkflow-requirements | Phase 12 で deployment-gha.md / environment-variables.md の参照を current facts に更新 | drift なし |

## ローカル実行コマンド

```bash
# T-1, T-2
grep -nE "^\[vars\]|^\[env\..*\.vars\]" apps/api/wrangler.toml

# T-3, T-4
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run 2>&1 | grep -i warning
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run 2>&1 | grep -i warning

# T-6, T-7
grep -rn 'pages deploy' .github/workflows/
grep -rn 'scripts/cf.sh deploy' .github/workflows/web-cd.yml

# T-8
gh workflow run web-cd.yml --ref dev
gh run watch
```

## NON_VISUAL 宣言

`visualEvidence: NON_VISUAL`。スクリーンショット成果物は不要。CI ログ抜粋を Phase 11 で証跡化する。

## アプリ統合テスト連携

本タスクは CI/CD 設定の修正であり、apps/api / apps/web の機能テスト追加は不要。staging deploy 後の `/healthz` smoke を Phase 11 で確認する。

## 完了条件

- [ ] T-1〜T-10 がリスト化されている
- [ ] 各検証のローカル実行コマンドが記載されている
- [ ] NON_VISUAL 宣言が明記されている

## 成果物

- `outputs/phase-04/main.md`

## 目的

本 Phase の目的を、Issue #331 の runtime warning cleanup と Workers deploy contract へ明確に接続する。

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

## 依存Phase参照

- Phase 2: `phase-02.md` / `outputs/phase-02/main.md`
- Phase 3: `phase-03.md` / `outputs/phase-03/main.md`
