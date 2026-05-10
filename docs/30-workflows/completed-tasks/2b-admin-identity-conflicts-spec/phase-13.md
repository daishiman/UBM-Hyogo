# Phase 13 — PR 作成

> ⚠️ **PR 作成はユーザーの明示的な承認後にのみ実行する**（CLAUDE.md / skill 共通ルール）。

## 1. PR base ブランチ

| 環境 | base |
|------|------|
| 通常 | `dev`（既定 / CLAUDE.md ポリシー） |
| production リリース時のみ | `main` |

本 workflow は通常 sub-task のため `--base dev`。

## 2. ブランチ命名

`feat/e2e-admin-identity-conflicts-stage-2-2b`

## 3. PR 本文テンプレ

```markdown
## Summary
- `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` を新規追加（200-240 行 / 6 test / skip 0）
- 初期 list は server fixture、mutation 経路（merge / dismiss）と認可境界（admin / member / anonymous）は `page.route()` / redirect assertion で検証
- shared `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` で contract drift を即検出
- `mergedMemberId` 未使用、`targetMemberId` / `archivedSourceMemberId` 系で固定
- shared identity-conflict schemas を strict 化し、unknown-key drift を focused test で固定

## Test plan
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts`（6 PASS / 0 skip）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared test -- src/schemas/identity-conflict.test.ts`
- [ ] grep gate（Phase 10 §5）4 パターン 0 hit
- [ ] `wc -l` が 200-240 範囲内

## 不変条件チェック
- [x] 既存 API endpoint surface のみ
- [x] OKLch トークン正本化（HEX 直書きなし）
- [x] D1 直接アクセスなし
- [x] 新規 fixture 追加なし
- [x] `mergedMemberId` 未出現

Refs: 親 workflow `e2e-quality-uplift-stage-2` sub-task 2b
```

## 4. PR 作成コマンド

```bash
git push -u origin feat/e2e-admin-identity-conflicts-stage-2-2b

gh pr create --base dev --title "feat(e2e): admin-identity-conflicts.spec.ts (stage-2 sub-task 2b)" \
  --body "$(cat <<'EOF'
[本文を §3 から貼り付け]
EOF
)"
```

## 5. マルチステージ承認ゲート

| gate | 内容 | 承認形態 |
|------|------|---------|
| G1 | 実コード生成 + ローカル PASS 5 点 | ユーザー明示承認後に commit |
| G2 | push（リモート mutation） | ユーザー明示承認後に push |
| G3 | PR 作成（GitHub 上 mutation） | ユーザー明示承認後に `gh pr create` |

合算承認禁止。各 gate は独立に承認を得ること。
