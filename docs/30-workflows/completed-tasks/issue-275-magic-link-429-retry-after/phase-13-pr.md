# Phase 13: PR 作成

> 実装区分: **実装完了仕様書**（commit / push / PR は user-gated）

## 1. ブランチ

`feat/issue-275-magic-link-429-retry-after`（実装時に worktree で作成 / `dev` から分岐）。

## 2. base ブランチ

`dev`（CLAUDE.md ポリシー / memory `feedback_default_branch_dev`）

## 3. PR 前チェック

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
git status --porcelain      # 空であること
git diff dev...HEAD --name-only   # 変更ファイル一覧確認
```

## 4. PR title

```
feat(issue-275): MagicLinkForm 429 Retry-After server-truth countdown
```

## 5. PR body テンプレート

```markdown
## Summary

- `apps/web/src/lib/auth/magic-link-client.ts` に `MagicLinkRateLimitedError extends MagicLinkRequestError` を追加し、429 を typed error として throw
- `Retry-After` ヘッダー → body `retryAfterSec` → default 60 の順で server-truth な待機秒を解決
- `apps/web/app/login/_components/MagicLinkForm.client.tsx` の catch で typed error を判別し、`setCooldown(retryAfterSec)` で server-truth countdown を起動（URL state は `input` 維持）
- 上記 2 ファイルの spec に 429 受信ケース 6 件追加（client 4 / form 2）

Refs #275（OPEN のまま実装 — Issue 状態は変更しない。本 PR で API 側の既存 `Retry-After` 応答を Web client + Form に整合させる）

## 変更ファイル

- `apps/web/src/lib/auth/magic-link-client.ts`（修正：typed error + 429 解析）
- `apps/web/src/lib/auth/magic-link-client.spec.ts`（修正：4 ケース追加）
- `apps/web/app/login/_components/MagicLinkForm.client.tsx`（修正：catch 内 429 分岐）
- `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx`（修正：2 ケース追加）

## Test plan

- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @ubm-hyogo/web test` PASS（既存 + 新規 6 ケース）
- [ ] `pnpm --filter @ubm-hyogo/web build` PASS（OpenNext Workers bundle）
- [ ] 手動: 同一 email 5 回以上連打 → 429 + countdown 表示 + 0 で再 enable
- [ ] 手動: 200 OK 経路で既存 60s cooldown / state=sent 遷移に regression なし
- [ ] 手動: 500 etc 非 429 error で既存通り `?state=error` 遷移
```

## 6. 作成コマンド

```bash
gh pr create --base dev --title "feat(issue-275): MagicLinkForm 429 Retry-After server-truth countdown" --body "$(cat <<'EOF'
... (上記テンプレート)
EOF
)"
```

> CLAUDE.md「PR 作成の完全自律フロー」に従う。本サイクルではコード実装と local evidence は完了済みだが、PR 自体はユーザー承認まで作らない。

## 7. OPEN issue へのリンク戦略

Issue #275 は現在 `OPEN`。ユーザー指示により本 PR では:

- 冒頭に `Refs #275`（`Closes` ではなく `Refs`）
- 本文に「Issue は OPEN のまま、本 PR で AC を充足する。CLOSE 判断は user-gated」旨を明記
- PR merge 後の Issue mutation（コメント追記 / 状態変更）は user-gated

## 8. 関連ドキュメントの追従更新（PR 内で同時実施）

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `quick-reference.md` / `references/task-workflow-active.md` は本サイクルで同期済み
- `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md` は consumed pointer として本 workflow へ接続済み
- PR merge 後に `docs/30-workflows/issue-275-magic-link-429-retry-after/` を `docs/30-workflows/completed-tasks/` 配下へ移動するかは、ユーザー承認後の close-out 操作として扱う
