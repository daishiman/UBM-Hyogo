# Phase 13: PR チェックリスト

> 本タスクは **仕様書生成のみ**。実コード変更が完了した別タスクで PR を出すときに本チェックリストを参照する。user 明示承認後のみ実施する。

## 状態

`blocked` — user 明示承認 + 実コード変更タスク完了後に解除

## PR 作成前チェック

- [ ] 実コード変更タスクの全 Phase が completed
- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` で PR に含めるファイル一覧を取得
- [ ] `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映
- [ ] スクリーンショット: なし（NON_VISUAL）。PR 本文にスクリーンショットセクションを作らない
- [ ] secret 値 / bearer 値 / API token 値が diff / PR 本文 / commit message に未混入
- [ ] base ブランチ: `dev`（production リリース時のみ `main`）

## PR 本文テンプレート

```markdown
## Summary
- staging + production の runtime smoke 環境プロビジョニングを SDD 準拠で恒常運用化
- `apps/api` に CI smoke 専用の service-token endpoint（HMAC-signed / 90日 JWT）を新設
- smoke runner を production read-only 対応に拡張、production 用 workflow / allowlist / provision script / 4 runbook を整備

## Test plan
- [ ] `pnpm --filter @repo/api test` で service-token 関連テスト全 PASS
- [ ] `bash scripts/ci/__tests__/verify-env-secrets.spec.sh` PASS
- [ ] `bash scripts/smoke/__tests__/runtime-attendance-provider.spec.sh` PASS
- [ ] `actionlint .github/workflows/runtime-smoke-production.yml` 警告なし
- [ ] staging environment で smoke 再現 PASS（user-gated）
- [ ] production environment で read-only smoke PASS（user-gated）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行コマンド（user 承認後のみ）

```bash
# base ブランチ同期
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout <feature-branch>
git merge dev

# 品質検証
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# PR 作成
gh pr create --base dev --title "feat(runtime-smoke-env-provisioning): service-token endpoint + production smoke workflow" --body "$(cat <<'EOF'
...（上記テンプレート）...
EOF
)"
```

## 完了条件

- user 明示承認を得てから実施
- PR URL を最終レポートに記録

## 成果物

- `outputs/phase-13/pr-checklist.md`（本ファイル）
