[実装区分: 実装仕様書]

# Phase 13: PR 作成

## 1. ブランチ

`fix/verify-design-tokens-og-route-exclude`（または既存 worktree ブランチ）。

## 2. base ブランチ

`dev`（CLAUDE.md ポリシー / memory `feedback_default_branch_dev`）。

## 3. PR 前チェック

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens          # exit 0 を確認
bash scripts/verify-pr-ready.sh
git status --porcelain                    # 空であること
git diff dev...HEAD --name-only           # 変更ファイル一覧確認
```

## 4. PR title

```
fix: verify-design-tokens exclude route handler convention (opengraph-image/route.tsx etc)
```

## 5. PR body テンプレート

```markdown
## Summary

- `scripts/verify-design-tokens.ts` の `colorLiteralExcludes` に Next.js Metadata Files route handler convention 4 件 (`opengraph-image/route.tsx`, `twitter-image/route.tsx`, `icon/route.tsx`, `apple-icon/route.tsx`) を追加
- 既存 root convention 4 件 (`opengraph-image.tsx` 等) と対称形にし、`next/og` `ImageResponse` (satori) で技術的に HEX literal が必須な領域を同一バケットで exclude
- Issue #806 (commit c10e0e39a, 2026-05-20) で追加された動的 OG image route が PR #175 で `verify-design-tokens` failure を引き起こしていたのを修正

## Refs

- PR #175（failure 元の PR）
- Issue #806 / commit c10e0e39a（route handler convention を追加した parent change）

## Test plan

- [x] `mise exec -- pnpm verify:tokens` exit 0（local）
- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [ ] `bash scripts/verify-pr-ready.sh` PASS（初回は `indexes:rebuild` drift を検出。生成 index を取り込み後に再実行）
- [ ] CI `verify-design-tokens` green
- [ ] drift canary regression: 一時的に `apps/web/src/lib/_drift_canary.ts` に HEX を入れて exit 1 を確認 → 削除（Phase 11 TC-3）
- [ ] 境界誤マッチ確認: `apps/web/app/_canary_not_og/route.tsx` で exit 1 を確認 → 削除（Phase 11 TC-4）

## 不変条件との整合

CLAUDE.md「OKLch トークン正本化 (HEX 直書き禁止)」原則は維持される。本 PR は satori が CSS variable を解決できないという技術的制約により HEX 必須となる 4 種類の Next.js Metadata Files route handler のみを対象とした最小限の exclude 拡張。通常の UI コンポーネント / page / layout への HEX 直書き禁止は完全に維持される（Phase 11 TC-3 で regression 確認）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 6. 作成コマンド

```bash
gh pr create --base dev --title "fix: verify-design-tokens exclude route handler convention (opengraph-image/route.tsx etc)" --body "$(cat <<'EOF'
... (上記テンプレート)
EOF
)"
```

> CLAUDE.md「PR 作成の完全自律フロー」に従う。**本仕様書作成プロンプトではコード実装と PR 作成は実行しない**。実装フェーズで別途実行する。

## 7. スクリーンショット

本タスクは `visual_category: NON_VISUAL`（CI 検査スクリプト修正）のため、PR 本文に Screenshots セクションを **含めない**。Evidence は terminal output (`outputs/phase-11/*.txt`) で代替する。

## 8. 関連 issue / PR

- PR #175: 本修正がない場合、`verify-design-tokens` job が permanent fail
- Issue #806: 動的 OG image route の追加元（CLOSED 済み・追加 commit は c10e0e39a）
- 本 PR は新規 issue を起票せず、PR description で背景を完結させる（修正範囲 4 行 + spec）
