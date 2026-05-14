# Phase 11: リリース準備

## 必要 evidence 一覧

| ファイル | 取得方法 | 必須 |
|---------|---------|------|
| `outputs/phase-11/branch-protection-dev-pre.json` | Phase 6 Step 1 | ✅ |
| `outputs/phase-11/branch-protection-main-pre.json` | Phase 6 Step 1 | ✅ |
| `outputs/phase-11/branch-protection-dev-post.json` | Phase 6 Step 7 | ✅ |
| `outputs/phase-11/branch-protection-main-post.json` | Phase 6 Step 7 | ✅ |
| `outputs/phase-11/runtime-evidence/required-contexts-dev.txt` | Phase 6 Step 8 | ✅ |
| `outputs/phase-11/runtime-evidence/required-contexts-main.txt` | Phase 6 Step 8 | ✅ |
| `outputs/phase-11/runtime-evidence/apply-result.txt` | Phase 6 Step 6 の stdout | ✅ |
| `outputs/phase-11/runtime-evidence/verify-result.txt` | Phase 6 Step 9 の stdout | ✅ |
| `outputs/phase-11/runtime-evidence/lighthouse-run.txt` | Phase 8 S-4 の `gh run watch` ログ | 推奨 |
| `outputs/phase-11/runtime-evidence/pr-checks.txt` | Phase 8 S-5 の `gh pr checks` ログ | 推奨 |

## evidence 保存スクリプト（参考）

```bash
EVI=docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/runtime-evidence
mkdir -p "$EVI"

# apply 結果
bash .github/branch-protection/apply.sh all 2>&1 \
  | tee "$EVI/apply-result.txt"

# verify 結果
bash scripts/verify-branch-protection.sh 2>&1 \
  | tee "$EVI/verify-result.txt"
```

## redaction 検査

evidence 内に以下のキーワードが含まれていないことを `grep -r` で検査:

- `ghp_` / `github_pat_`（PAT）
- `cf_` 始まりのトークン
- `op://`（こちらは参照表記なので含まれていても OK だが、念のため確認）

## release note 雛形

```
## E2E Quality Uplift — Stage 3 (Issue #608 完了)

- branch protection に E2E 集約 gate + Lighthouse の hard CI gate を登録
- dev/main: ci / Validate Build / coverage-gate + e2e-tests-coverage-gate + lighthouse-ci
- `.github/branch-protection/` に desired contexts manifest を置き、drift 検査スクリプトを追加
- lighthouse workflow の prod server 起動を nohup + wait-on で安定化
```

## release 前最終チェック

- [ ] 全 evidence ファイルが揃っている（必須 8 件）
- [ ] redaction 検査 pass
- [ ] CLAUDE.md 不変条件 drift なし
- [ ] PR CI / Lighthouse runtime evidence 取得前は `workflow_state=implemented_local_runtime_pending`、取得後のみ `completed`
