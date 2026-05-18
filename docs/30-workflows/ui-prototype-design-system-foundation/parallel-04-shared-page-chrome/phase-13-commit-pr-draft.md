---
phase: 13
title: Commit / PR ドラフト
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 13 — Commit / PR ドラフト

[実装区分: 実装仕様書]

## 1. ブランチ命名

`feat/ui-foundation-shared-page-chrome`

base ブランチ: `dev`（CLAUDE.md 既定）

## 2. コミット粒度

| commit | 範囲 | message |
|--------|------|---------|
| c1 | `app/layout.tsx` | `feat(ui-foundation): root layout に data-theme + viewport + tokens import を設定` |
| c2 | `app/error.tsx` | `feat(ui-foundation): error.tsx を Card primitive 派生に再構成` |
| c3 | `app/not-found.tsx` | `feat(ui-foundation): not-found.tsx を Card + EmptyState 派生に再構成` |
| c4 | `app/loading.tsx` | `feat(ui-foundation): loading.tsx を Card primitive 派生に再構成` |
| c5 | `apps/web/app/__tests__/*.spec.tsx` | `test(ui-foundation): root chrome 4 ファイルの component spec を追加` |
| c6 | Phase 11 evidence | `docs(ui-foundation): parallel-04 evidence (typecheck / lint / build / token / pr-ready)` |

> 連続編集により diff が混在する場合は 1〜2 commit に集約してよい。Phase 8 DoD-P-01 を満たす範囲で運用判断する。

## 3. PR タイトル

```
feat(ui-foundation): parallel-04 root chrome (layout / error / not-found / loading)
```

70 文字以内（CLAUDE.md PR ガイドラインに整合）。

## 4. PR 本文ドラフト

````md
## Summary

- root `app/layout.tsx` に `<html lang="ja" data-theme="warm">` / `viewport` export / `tokens.css → globals.css` import 順を確定
- `app/error.tsx` / `not-found.tsx` / `loading.tsx` を既存 Card / EmptyState primitive 派生に再構成（新規 primitive 追加なし）
- ToastProvider を root に単一配置し、route group layout からの再 wrap を禁止

workflow root: `docs/30-workflows/ui-prototype-design-system-foundation/`
sub-workflow: `parallel-04-shared-page-chrome/`

## Changes

| ファイル | 変更内容 |
|---------|---------|
| `apps/web/app/layout.tsx` | metadata 再構成 / viewport export 追加 / tokens.css import / data-theme="warm" |
| `apps/web/app/error.tsx` | Card primitive 派生に再構成 / logger import path 統一 |
| `apps/web/app/not-found.tsx` | Card + EmptyState 派生に再構成 |
| `apps/web/app/loading.tsx` | Card 内 CardContent に skeleton 矩形を配置 |
| `apps/web/app/__tests__/*.spec.tsx` | 4 spec 新規追加 |

## Phase 11 evidence

| ID | path | gate |
|----|------|------|
| EV-01 | outputs/phase-11/typecheck.log | QG-01 |
| EV-02 | outputs/phase-11/lint.log | QG-02 |
| EV-03 | outputs/phase-11/vitest.log | QG-03 |
| EV-04 | outputs/phase-11/build.log | QG-04 |
| EV-05 | outputs/phase-11/design-tokens.log | QG-05 |
| EV-06 | outputs/phase-11/test-suffix.log | QG-06 |
| EV-07 | outputs/phase-11/pr-ready.log | QG-07 |
| EV-08 | outputs/phase-11/toast-provider-grep.txt | QG-08 |
| EV-09 | outputs/phase-11/hex-direct-grep.txt | QG-09 |

## Test plan

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__` PASS
- [ ] `pnpm --filter @ubm-hyogo/web build` success
- [ ] `pnpm verify:design-tokens` exit 0
- [ ] `pnpm verify:test-suffix` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] `grep ToastProvider apps/web/app/` → 1 件

> Draft note: this is a pre-execution checklist. Evidence logs must exist under
> `outputs/phase-11/` before any item is marked complete.

## Out of scope

- route group layout（parallel-03）
- globals.css `@layer components` 拡張（parallel-01）
- selector 規則の追加（parallel-02）
- 19 routes の page.tsx（serial-05）
- Playwright visual evidence（serial-07）

## Risk

`docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-09-risks.md` の R-02 / R-04 / R-08 を受容済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
````

## 5. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(ui-foundation): parallel-04 root chrome (layout / error / not-found / loading)" --body "$(cat <<'EOF'
（上記 §4 の本文）
EOF
)"
```

## 6. マージ後の作業

| 項目 | 内容 |
|------|------|
| 関連 sub-workflow への通知 | parallel-03 着手者に「ToastProvider 再 wrap 禁止」を再確認 |
| workflow root LOGS 追記 | `docs/30-workflows/ui-prototype-design-system-foundation/LOGS.md` に PR URL と完了日を追記 |
| 後続 sub-workflow | serial-05 が page.tsx 実装で本サブワークフローの fallback を活用 |

## 7. 完了条件

- PR が `dev` にマージされ、CI の必須 status check が全 green
- workflow root の状態が `spec_created` → `implemented`（該当 sub-workflow 部分）に進む

## 8. 参照

- Phase 8 DoD
- Phase 11 evidence inventory
- CLAUDE.md PR 作成フロー
- `.claude/commands/ai/diff-to-pr.md`
