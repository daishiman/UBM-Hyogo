---
phase: 8
title: DoD — 完了の客観判定基準
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 8: DoD（Definition of Done）

[実装区分: 実装仕様書]

## 1. 完了判定リスト

下記 7 項目をすべて満たして本 SW を「完了」とする。

| # | 判定項目 | 検証方法 |
|---|---------|---------|
| 1 | `apps/web/src/styles/globals.css` に P1-1〜P1-5 の 5 セクションが既存 selector hooks と G9-7 focus-visible のあいだに挿入されている | `grep -n 'parallel-01 P1-' apps/web/src/styles/globals.css` で 5 件 |
| 2 | `[data-route]` / `[data-section]` / `[data-card]` / `[data-shell]` / `[data-text]` の全 selector が globals.css に存在 | `grep -nE '\[data-(route\|section\|card\|shell\|text)' apps/web/src/styles/globals.css` で全件 hit |
| 3 | 本 SW 追加分に HEX 直書き / `bg-[#` / `text-[#` が 0 件 | Phase 6 §2 の grep gate 全 0 |
| 4 | `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm build` が exit 0 | Phase 11 に build.log 等を保存 |
| 5 | `verify-design-tokens` CI gate が green | CI 上で確認、`outputs/phase-11/verify-design-tokens.log` |
| 6 | `bash scripts/verify-pr-ready.sh` が exit 0 | `outputs/phase-11/verify-pr-ready.log` |
| 7 | `tokens.css` / `@layer base` / 既存 parallel-09 規則 / focus-visible 既存規則を変更していない | `git diff -- apps/web/src/styles/tokens.css` が空、globals.css の diff が P1-1〜P1-5 挿入のみ |
| 8 | admin shell width の差分が `md:grid-cols-[272px_1fr]` への 1 行変更だけである | `git diff -- apps/web/app/(admin)/layout.tsx` |

## 2. 非完了とみなすケース

- P1-1〜P1-5 のいずれかが欠落
- `[data-card-tone="emphasis"]` 等の modifier が欠けている
- 既存 `@layer base` の body 規則を上書きしている
- typography に絶対色（HEX）が混入
- 本 SW で `tokens.css` を編集している（責務外）
- 本 SW の許容範囲を超えて `app/` 配下の TSX を編集している（許容は admin shell width の 1 行のみ）

## 3. 完了報告フォーマット

PR description（Phase 13）に下記を含める:

```
- [x] P1-1 page surface 追加
- [x] P1-2 section rhythm 追加
- [x] P1-3 card chrome 追加
- [x] P1-4 shell surface 追加
- [x] P1-5 typography scale 追加
- [x] P1-6 admin shell width 追加
- [x] grep gate (HEX/bg-[#/text-[#) 0 件
- [x] G1-G5 quality gates green
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `8` |
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
