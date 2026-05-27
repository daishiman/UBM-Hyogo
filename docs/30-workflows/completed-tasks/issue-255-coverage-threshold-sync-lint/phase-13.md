# Phase 13: PR 作成（user 明示承認後）

> 本サイクルは local implementation complete。Phase 13 の commit / push / PR は **user 明示承認まで blocked**。

## 13.1 ステータス

| 項目 | 値 |
| --- | --- |
| status | blocked |
| blockedReason | `pending_user_approval_for_commit_push_pr` |
| 対象ブランチ | `feat/issue-255-coverage-threshold-sync-lint` |
| PR base | `dev` |

## 13.2 user 承認後の手順（CLAUDE.md PR 作成完全自律フロー準拠）

1. `git fetch origin dev` → ローカル `dev` を fast-forward 同期
2. `git checkout feat/issue-255-coverage-threshold-sync-lint`
3. `git merge dev`（conflict は CLAUDE.md「コンフリクト解消の既定方針」に従い解消）
4. 品質検証:
   - `mise exec -- pnpm install --force`
   - `mise exec -- pnpm typecheck`
   - `mise exec -- pnpm lint`
   - `mise exec -- pnpm lint:coverage-threshold`（本タスク固有）
   - `mise exec -- pnpm vitest run scripts/__tests__/coverage-threshold-lint.spec.ts`
   - `bash scripts/verify-pr-ready.sh`
5. 失敗時は最大 3 回まで自動修復し、修復差分をコミット
6. `git status --porcelain` 空 / `git diff dev...HEAD --name-only` で含まれるファイル確認
7. `gh pr create --base dev --title "feat(issue-255): coverage threshold 3点同期 lint" --body <heredoc>` で作成

## 13.3 PR 本文テンプレ

```markdown
## Summary
- coverage 80% 閾値の drift を機械検知する `scripts/coverage-threshold-lint.ts` を導入
- 2 source（aiworkflow-requirements / coverage-guard.sh）を最低 source とし、`codecov.yml` 出現で 3 source に動的拡張
- CI `coverage-threshold-lint` job を独立 workflow として追加

## Test plan
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm vitest run scripts/__tests__/coverage-threshold-lint.spec.ts` 8 tests pass
- [ ] `mise exec -- pnpm lint:coverage-threshold` exit 0 + `OK (sources=2, threshold=80)`
- [ ] dry-run: `THRESHOLD=70` 一時改変 → exit 1 + drift table
- [ ] PR 上で `coverage-threshold-lint` job が緑

Refs #255
```

## 13.4 多段ゲート

| Gate | 条件 | 対応 |
| --- | --- | --- |
| G0 | spec 完了 | this cycle で達成 |
| G1 | local focused PASS | completed this cycle |
| G2 | PR open & CI 緑 | user 承認後 |
| G3 | dev merge | user 承認後 |

G1 以降は user 明示承認後にのみ着手する。

## 13.5 Issue handling

- Issue #255 は **CLOSED 維持**（user 指示で reopen しない）
- PR 本文には `Refs #255` のみ。`Fixes #255` / `Closes #255` は使わない（既に CLOSED）

## 13.6 sync-merge 配慮

| 項目 | 対応 |
| --- | --- |
| pre-push `coverage-guard` | 本タスク push 範囲に `apps/` / `packages/` の coverage 変動なし → 通常 path で pass |
| sync-merge スキップ | merge commit がない feature push のため hook は通常通り走る |
| `pnpm sync:resolve` | 本タスク固有の改修なし |

## 13.7 production 反映

PR が dev にマージされた後、通常の `dev → main` リリース PR で main に届く。本タスク単独で main 直 PR は行わない（CLAUDE.md ブランチ戦略）。
