---
phase: 11
title: Evidence inventory — outputs/phase-11 配下に保存する成果物一覧
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
---

# Phase 11 — Evidence Inventory

[実装区分: 実装仕様書]

## 1. canonical evidence base path

```
docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/outputs/phase-11/
```

## 2. Evidence ファイル一覧

| # | ファイル名 | 種別 | 取得コマンド | 必須/任意 |
|---|----------|------|------------|----------|
| 1 | `typecheck.log` | text log | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/typecheck.log` | 必須 |
| 2 | `lint.log` | text log | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/lint.log` | 必須 |
| 3 | `build.log` | text log | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/build.log` | 必須 |
| 4 | `grep-hex.txt` | text | `grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/globals.css > outputs/phase-11/grep-hex.txt; true` | 必須 |
| 5 | `grep-arbitrary-tailwind.txt` | text | `grep -nE '\b(bg\|text)-\[#' apps/web/src/styles/globals.css > outputs/phase-11/grep-arbitrary-tailwind.txt; true` | 必須 |
| 6 | `grep-selectors.txt` | text | `grep -nE '\[data-(route\|section\|card\|shell\|text)' apps/web/src/styles/globals.css > outputs/phase-11/grep-selectors.txt` | 必須 |
| 7 | `verify-design-tokens.log` | text log | `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts 2>&1 \| tee outputs/phase-11/verify-design-tokens.log` | 必須 |
| 8 | `verify-pr-ready.log` | text log | `bash scripts/verify-pr-ready.sh 2>&1 \| tee outputs/phase-11/verify-pr-ready.log` | 必須 |
| 9 | `globals-css-diff.patch` | unified diff | `git diff dev -- apps/web/src/styles/globals.css > outputs/phase-11/globals-css-diff.patch` | 必須 |
| 10 | `section-presence.txt` | text | `grep -n 'parallel-01 P1-' apps/web/src/styles/globals.css > outputs/phase-11/section-presence.txt` | 必須 |

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

## 4. visual evidence（参考）

本 SW では visual snapshot は serial-07 で取得するため、本 Phase 11 inventory には含めない。serial-07 完了時に下記 4 件が追加される予定:

- `outputs/phase-11/visual/top.png`（serial-07 配下）
- `outputs/phase-11/visual/members-list.png`
- `outputs/phase-11/visual/member-detail.png`
- `outputs/phase-11/visual/admin-dashboard.png`

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
        └── section-presence.txt
```

## 6. evidence 物理存在チェック

`scripts/verify-phase11-evidence.ts`（既存 CI gate）で evidence ファイルの実在を検証する。本 SW では上記 10 ファイルが必須として登録される。
