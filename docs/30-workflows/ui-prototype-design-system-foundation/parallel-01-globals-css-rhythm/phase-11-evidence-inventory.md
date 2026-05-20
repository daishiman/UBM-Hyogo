---
phase: 11
title: Evidence inventory — outputs/phase-11 配下に保存する成果物一覧
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 11: Evidence Inventory

[実装区分: 実装仕様書]

## 1. canonical evidence base path

```
docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/outputs/phase-11/
```

## 2. Evidence ファイル一覧

| # | ファイル名 | 種別 | 取得コマンド | 必須/任意 |
|---|----------|------|------------|----------|
| 1 | `typecheck.log` | text log | `mise exec -- pnpm typecheck 2>&1 \| tee "$EVIDENCE_DIR/typecheck.log"` | 必須 |
| 2 | `lint.log` | text log | `mise exec -- pnpm lint 2>&1 \| tee "$EVIDENCE_DIR/lint.log"` | 必須 |
| 3 | `build.log` | text log | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee "$EVIDENCE_DIR/build.log"` | 必須 |
| 4 | `grep-hex.txt` | text | `grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/globals.css > "$EVIDENCE_DIR/grep-hex.txt"; true` | 必須 |
| 5 | `grep-arbitrary-tailwind.txt` | text | `grep -nE '\b(bg\|text)-\[#' apps/web/src/styles/globals.css > "$EVIDENCE_DIR/grep-arbitrary-tailwind.txt"; true` | 必須 |
| 6 | `grep-selectors.txt` | text | `grep -nE '\[data-(route\|section\|card\|shell\|text)' apps/web/src/styles/globals.css > "$EVIDENCE_DIR/grep-selectors.txt"` | 必須 |
| 7 | `verify-design-tokens.log` | text log | `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts 2>&1 \| tee "$EVIDENCE_DIR/verify-design-tokens.log"` | 必須 |
| 8 | `verify-pr-ready.log` | text log | `bash scripts/verify-pr-ready.sh 2>&1 \| tee "$EVIDENCE_DIR/verify-pr-ready.log"` | 必須 |
| 9 | `globals-css-diff.patch` | unified diff | `git diff -- apps/web/src/styles/globals.css > "$EVIDENCE_DIR/globals-css-diff.patch"` | 必須 |
| 10 | `section-presence.txt` | text | `grep -n 'parallel-01 P1-' apps/web/src/styles/globals.css > "$EVIDENCE_DIR/section-presence.txt"` | 必須 |
| 11 | `admin-shell-width.txt` | text | `grep -n 'md:grid-cols-\[272px_1fr\]' 'apps/web/app/(admin)/layout.tsx' > "$EVIDENCE_DIR/admin-shell-width.txt"` | 必須 |

## 3. 各 evidence の合格判定

| # | 合格条件 |
|---|---------|
| 1 | 末尾に `Tasks: ... successful` 相当、exit 0 |
| 2 | error 0 / warning 0 |
| 3 | `Compiled successfully` / exit 0 / Workers bundle 生成 |
| 4 | ファイル空 or 既存 tokens 経由参照のみ。本 SW 追加範囲に raw HEX なし |
| 5 | ファイル空 |
| 6 | `[data-route` / `[data-section` / `[data-card` / `[data-shell` / `[data-text` の各 prefix が hit |
| 7 | exit 0 |
| 8 | exit 0 |
| 9 | 既存 11-198 / 200-214 行範囲が変更されていない（追加挿入のみ） |
| 10 | 5 件（P1-1〜P1-5） |
| 11 | `md:grid-cols-[272px_1fr]` が 1 件 hit |

## 4. visual evidence（委譲・未取得）

本 SW では visual snapshot は serial-07 で取得するため、本 Phase 11 inventory の PASS 条件には含めない。parallel-01 の状態は `runtime_pending` であり、下記は serial-07 完了時に取得・保存される予定の委譲証跡である。

- [ ] `serial-07-regression-evidence/outputs/phase-11/screenshots/top.png`
- [ ] `serial-07-regression-evidence/outputs/phase-11/screenshots/members-list.png`
- [ ] `serial-07-regression-evidence/outputs/phase-11/screenshots/member-detail.png`
- [ ] `serial-07-regression-evidence/outputs/phase-11/screenshots/admin-dashboard.png`

## 5. evidence directory 構造

```
parallel-01-globals-css-rhythm/
├── phase-01-requirements.md
├── phase-02-architecture.md
├── ... (phase-03 〜 phase-13)
└── outputs/
    └── phase-11/
        ├── typecheck.log
        ├── lint.log
        ├── build.log
        ├── grep-hex.txt
        ├── grep-arbitrary-tailwind.txt
        ├── grep-selectors.txt
        ├── verify-design-tokens.log
        ├── verify-pr-ready.log
        ├── globals-css-diff.patch
        ├── section-presence.txt
        └── admin-shell-width.txt
```

## 6. evidence 物理存在チェック

上記 11 ファイルの物理存在は `test -s` または `ls "$EVIDENCE_DIR"` で確認する。grep 0 件を期待する evidence は空ファイルでも PASS とし、存在自体を必須にする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `11` |
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
