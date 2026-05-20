---
phase: 13
title: Commit / PR draft — ブランチ・コミットメッセージ・PR title/body 案
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 13: Commit / PR Draft

[実装区分: 実装仕様書]

## 1. ブランチ

| 項目 | 値 |
|------|-----|
| base | `dev`（CLAUDE.md「既定の PR base ブランチは dev」） |
| topic | `feat/ui-foundation-parallel-01-globals-css-rhythm` |
| 起点 | `origin/dev` の最新 |

ブランチ作成コマンド（ワークツリー起動直後の例）:

```bash
git fetch origin dev
git switch -c feat/ui-foundation-parallel-01-globals-css-rhythm origin/dev
```

## 2. コミット粒度

CSS selector と admin shell width の小さな実装変更、および同一
sub-workflow の証跡更新だけなので、**1 コミットに集約**する。

### 2.1 コミットメッセージ案

```
feat(ui-foundation): parallel-01 globals.css に page-level rhythm 5 セクション追加

- [x] P1-1 page surface: body / [data-route] 既定背景
- [x] P1-2 section rhythm: [data-section] / [data-section-rhythm] 縦余白
- [x] P1-3 card chrome: [data-card] / [data-card-tone] 4 種
- [x] P1-4 shell surface: [data-shell] topbar/sidebar/footer
- [x] P1-5 typography scale: [data-text] display/title/section/card/body/caption/eyebrow
- [x] P1-6 admin shell width: md:grid-cols-[272px_1fr]

CSS 値はすべて var(--ubm-*) 経由。HEX/px 直書きなし。既存 @layer base と
parallel-09 規則には触れない。admin shell は既存 grid width の 1 行変更のみ。

Refs docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/
```

evidence ファイルを含める場合は同一コミット内に置く。

## 3. PR

### 3.1 PR title 案

```
feat(ui-foundation/parallel-01): globals.css @layer components に page-level rhythm 追加
```

70 文字以内。

### 3.2 PR body 案（diff-to-pr Phase 13 仕様準拠）

```markdown
## Summary

- [x] `apps/web/src/styles/globals.css` の `@layer components` にプロトタイプの page-level rhythm を翻訳して 5 セクション追加（P1-1〜P1-5）
- [x] `apps/web/app/(admin)/layout.tsx` の admin sidebar grid 幅を `272px` に調整
- [x] 19 routes 全画面が attribute だけでプロトタイプの雰囲気を継承できる仕組みを実装
- [x] すべて `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` / `var(--ubm-shadow-*)` 経由、HEX 直書きゼロ

## 変更ファイル

- [x] `apps/web/src/styles/globals.css`（追加挿入のみ、約 +130 行）
- [x] `apps/web/app/(admin)/layout.tsx`（admin grid width の 1 行変更）

## 追加 selector

| カテゴリ | selector |
|---------|---------|
| Page surface | `[data-route]` |
| Section rhythm | `[data-section]`, `[data-section-rhythm="compact\|comfortable\|loose"]` |
| Card chrome | `[data-card]`, `[data-card-tone="panel\|surface\|emphasis\|flat"]` |
| Shell surface | `[data-shell="topbar\|sidebar\|footer"]` |
| Typography | `[data-text="display\|title\|section\|card\|body\|caption\|eyebrow"]` |

## DoD（Phase 8）

- [x] P1-1 page surface 追加
- [x] P1-2 section rhythm 追加
- [x] P1-3 card chrome 追加
- [x] P1-4 shell surface 追加
- [x] P1-5 typography scale 追加
- [x] P1-6 admin shell width 追加
- [x] grep gate (HEX/bg-[#/text-[#) 0 件
- [x] G1 typecheck / G2 lint / G3 build / G4 verify-design-tokens / G5 verify-pr-ready green

## Test plan

- [x] `mise exec -- pnpm typecheck` green
- [x] `mise exec -- pnpm lint` green
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web build` green
- [x] `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts` exit 0
- [x] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] visual snapshot は serial-07 で取得（parallel-01 では delegated pending）

## 関連

- [x] workflow: `docs/30-workflows/ui-prototype-design-system-foundation/`
- [x] sub-workflow: `parallel-01-globals-css-rhythm/`
- [x] 後続: parallel-02 / parallel-03 / parallel-04（並列）→ serial-05 以降

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(ui-foundation/parallel-01): globals.css @layer components に page-level rhythm 追加" --body "$(cat <<'EOF'
（§3.2 の body をここに）
EOF
)"
```

## 5. PR 作成前チェックリスト

- [ ] `git status --porcelain` が PR 作成前に review 対象差分だけである
- [x] `git diff --name-only` が `apps/web/src/styles/globals.css`、`apps/web/app/(admin)/layout.tsx`、本 SW docs / evidence、同 wave の仕様同期ファイルに限定されている
- [x] `outputs/phase-11/` の required evidence 11 件が物理存在
- [x] PR body に DoD 項目すべてを列挙
- [ ] base が `dev` であることを PR 作成時に確認（`main` ではない）

## 6. マージ後

- [ ] `dev` ブランチに統合（user-gated）
- [x] 後続 parallel-02 / parallel-03 / parallel-04 / serial-05〜07 の実装着手可能
- [ ] visual regression（serial-07）で本 SW の効果を最終確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `13` |
| status | `runtime_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |

## 目的

この Phase は既存本文の内容を、task-specification-creator の共通骨格に沿って実行可能な仕様として扱う。

## 実行タスク

1. 既存本文の Phase 固有タスクを実行する。
2. `apps/web/src/styles/globals.css` の P1-1〜P1-5 selector contract と矛盾しないことを確認する。
3. Phase 11 evidence と Phase 12 strict 7 の境界を `VISUAL_ON_EXECUTION` として維持する。

## 参照資料

- `docs/30-workflows/ui-prototype-design-system-foundation/index.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md`
- `apps/web/src/styles/globals.css`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/` の local selector evidence
- `outputs/phase-12/` の strict 7 files

## 完了条件

- [x] `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm` が error 0 である。
- [x] P1-1〜P1-5 selector が `globals.css` に存在する。
- [x] root workflow 全体の visual runtime evidence は serial-07 に委譲され、parallel-01 は `runtime_pending` として閉じる。

## 統合テスト連携

- CSS selector presence は `outputs/phase-11/section-presence.txt` と `grep-selectors.txt` で確認する。
- visual screenshot は `serial-07-regression-evidence/` の責務として後続 runtime evidence に接続する。
