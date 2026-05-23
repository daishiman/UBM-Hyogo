# Phase 13: PR 作成

## PR 作成手順

### 前提

- 作業ブランチ: `docs/issue-608-e2e-quality-uplift-stage-3`
- base ブランチ: `dev`
- 全 Phase 1-12 完了済み
- branch protection apply は **ユーザー明示承認後** に実施済み（Phase 6 Step 6）
- evidence ファイル一式が `outputs/phase-11/` 配下に揃っている

### PR タイトル

```
[stage-3] CI gate hard-lock: E2E + Lighthouse + branch protection (closes #608 post-close)
```

### PR 本文テンプレート

```markdown
## Summary
- Issue #608 の残作業を完遂。E2E + Lighthouse を branch protection の required status check に登録し、PR ブロッキング gate として hard-lock 化。
- `.github/branch-protection/{dev,main}.json` を desired contexts manifest とし、`apply.sh` で fresh GET から contexts を差し替え、CLAUDE.md governance invariants を正規化して idempotent に適用可能に。
- `scripts/verify-branch-protection.sh` で drift 検査を CLI 化（CLAUDE.md UT-GOV-001 系拡張）。
- `lighthouse.yml` の prod server 起動を `nohup` + `wait-on` で安定化。

## 変更ファイル
- 新規: `.github/branch-protection/{dev,main}.json`, `apply.sh`, `README.md`
- 新規: `scripts/verify-branch-protection.sh`
- 編集: `.github/workflows/lighthouse.yml`
- 新規: `docs/30-workflows/e2e-quality-uplift-stage-3/` 一式 + outputs evidence

## branch protection diff（dev）

Before:
- ci, Validate Build, coverage-gate

After:
- ci, Validate Build, coverage-gate
- **e2e-tests-coverage-gate**
- **lighthouse-ci**

## branch protection diff（main）

Before:
- ci, Validate Build, coverage-gate

After:
- 上記 + e2e-tests-coverage-gate + lighthouse-ci

## CLAUDE.md 不変条件 drift 検査

- `required_pull_request_reviews=null` ✅
- `enforce_admins=true` ✅（CLAUDE.md invariant として正規化）
- `lock_branch=false` ✅
- `required_linear_history=true` ✅（drift 修正含む）

## Test plan

- [ ] `jq -e . .github/branch-protection/{dev,main}.json` exit 0
- [ ] `bash -n .github/branch-protection/apply.sh && bash -n scripts/verify-branch-protection.sh`
- [ ] `bash scripts/verify-branch-protection.sh` 出力 `PASS branch protection verification`
- [ ] `gh pr checks` で `e2e-tests-coverage-gate` / `lighthouse-ci` が Required 表示
- [ ] lighthouse workflow が wait-on step で完了
- [ ] evidence ファイル 8 件が `outputs/phase-11/` に配置

## Closes
Closes #608 (post-close completion: Issue は CLOSED のままで受け入れ条件を達成)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### PR 作成コマンド

```bash
gh pr create --base dev --head docs/issue-608-e2e-quality-uplift-stage-3 \
  --title "[stage-3] CI gate hard-lock: E2E + Lighthouse + branch protection (closes #608 post-close)" \
  --body "$(cat <<'EOF'
... (上記本文を貼り付け) ...
EOF
)"
```

## マージ後の作業

- PR CI required 表示と Lighthouse workflow run evidence 取得後にのみ `index.md` の workflow_state を `completed` に更新
- `e2e-quality-uplift` umbrella の close-out 判定: Stage 3 完了をもって umbrella を closed に
- Issue #608 へのコメント（任意）: 「post-close で受け入れ条件達成。PR #<N> 参照」

## ロールバック手順（緊急時）

1. `outputs/phase-11/branch-protection-dev-pre.json` を retrieve
2. `gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection --input <pre-derived>` で復旧
   - rollback 時も CLAUDE.md invariants を維持するかは user-gated governance 判断として扱う
3. 同じ手順で main も復旧
4. revert PR を作成（`.github/branch-protection/` 配下を削除 + `lighthouse.yml` を元に戻す）

## 完了報告フォーマット

```
PR URL: <作成された PR URL>
採用ブランチ: docs/issue-608-e2e-quality-uplift-stage-3
base: dev
新規 contexts (dev/main): e2e-tests-coverage-gate + lighthouse-ci
drift 検査: OK
残課題: なし
```
