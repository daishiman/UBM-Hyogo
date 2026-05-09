# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 13 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

ユーザー明示の PR 作成許可後、`dev` 既定 base で PR を作成する。

## 実行タスク

- [ ] G1〜G4 各 gate でユーザー承認を得る
- [ ] PR URL を最終レポートに 1 回だけ記載する

## 参照資料

- CLAUDE.md §「PR作成の完全自律フロー」
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-13/main.md`

## 前提

- Phase 11 evidence 一式が揃っている（runtime 未取得時は `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 明記）
- Phase 12 の strict 7 必須出力ファイルが揃っている
- ユーザーから明示の PR 作成許可を得ている（task-specification-creator skill 重要ルール）

## G1-G4 multi-stage approval gate

| gate | 内容 | 承認必要 |
| --- | --- | --- |
| G1 | 実装着手（コード実装サイクル開始） | yes |
| G2 | local PASS 5 点 + Playwright runtime 取得 | yes |
| G3 | screenshot / axe / coverage の Phase 11 evidence 確定 | yes |
| G4 | commit + push + PR 作成 | yes |

合算承認禁止。各 gate 個別に user 承認を得る。

## PR 作成手順（既定 base = `dev`）

1. `git fetch origin dev`
2. ローカル `dev` を `origin/dev` に fast-forward
3. 作業ブランチに `dev` をマージ。コンフリクトは CLAUDE.md §コンフリクト解消の既定方針に従う
4. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / focused unit / build / Playwright を、Phase 11 evidence 方針に従って実行する。未実行項目は PR body で `[x]` にしない
5. `git status --porcelain` を空にする（全ファイル add）
6. `git diff dev...HEAD --name-only` を取得し、Phase 10 §Diff scope 規律と一致するか確認
7. `gh pr create --base dev --title "<title>" --body "$(cat <<'EOF' ... EOF)"` で PR 作成

### PR title 案

```
feat(web): public top + members list (prototype-aligned, /public/stats + /public/members) (task-11)
```

### PR body テンプレ

```markdown
## Summary
- 公開トップ `/` を Hero / Stats / ZoneIntro / Timeline + 任意 MemberGrid（recent 6）で再構成
- `/(public)/members` を Filters（q / zone / status / tag / sort / density）+ MemberGrid|MemberTable 切替 + Pagination meta + EmptyState で再構成
- `lib/api/public.ts` を新設し、`@ubm-hyogo/shared` Zod スキーマで `parse()（strict 定義済み schema）`
- URL を search 状態の正本化（`?q=...&zone=...&tag=a&tag=b&sort=name&density=list&page=1`）
- 既存 API（`/public/stats`, `/public/members`）のみ消費。`apps/api` 変更なし
- token 直書き 0 件 / D1 直接アクセス 0 件 / `'use client'` は MemberFilters / DensityToggle のみ

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint`
- [ ] `pnpm --filter @ubm-hyogo/web test src/components/public src/lib/url src/lib/api/public`
- [ ] `pnpm --filter @ubm-hyogo/web build`
- [ ] `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts`
- [ ] axe critical=0（5 ケース）

## Screenshots
- outputs/phase-11/evidence/home-screenshot.png
- outputs/phase-11/evidence/members-comfy-screenshot.png
- outputs/phase-11/evidence/members-list-screenshot.png
- outputs/phase-11/evidence/members-empty-screenshot.png

## Evidence
- docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence/

## Refs
- 一次原典: docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-11-w5-par-public-top-and-member-list.md
- 仕様書: docs/30-workflows/task-11-public-top-and-member-list/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## completed-tasks 移動

PR merge 後（次サイクル）、本 spec dir を `docs/30-workflows/completed-tasks/task-11-public-top-and-member-list/` に `git mv` で移動する。`git rm -r` 純削除は禁止（completed-tasks-policy）。

## 完了条件

- [ ] PR URL が報告されている
- [ ] 採用ブランチ / 自動修復内容 / 解消したコンフリクト / 残課題が最終レポートに 1 回だけ記載
- [ ] ユーザー承認なく commit / push / PR 作成を行っていない
- [ ] G1〜G4 の各 gate でユーザー承認を取得した記録がある
