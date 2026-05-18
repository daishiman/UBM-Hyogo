---
phase: 11
title: Evidence inventory — AppShell 3 系統の証跡台帳
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 11 — Evidence inventory

[実装区分: 実装仕様書]

## 1. 証跡台帳

実装完了時に以下の証跡を `outputs/phase-11/` 配下に保存し、Phase 13 PR 本文から参照する。

| ID | 種別 | 保存先 | 取得コマンド / 取得手順 |
|----|------|--------|------------------------|
| EV-01 | typecheck log | `outputs/phase-11/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/typecheck.log` |
| EV-02 | lint log | `outputs/phase-11/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/lint.log` |
| EV-03 | build log | `outputs/phase-11/web-build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/web-build.log` |
| EV-04 | layout spec log (public) | `outputs/phase-11/public-layout-spec.log` | `mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(public)/layout.spec.tsx" 2>&1 \| tee outputs/phase-11/public-layout-spec.log` |
| EV-05 | layout spec log (admin) | `outputs/phase-11/admin-layout-spec.log` | `mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx" 2>&1 \| tee outputs/phase-11/admin-layout-spec.log` |
| EV-06 | layout spec log (member) | `outputs/phase-11/member-layout-spec.log` | `mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(member)/layout.spec.tsx" 2>&1 \| tee outputs/phase-11/member-layout-spec.log` |
| EV-07 | middleware regression | `outputs/phase-11/middleware-regression.log` | `mise exec -- pnpm --filter @ubm-hyogo/web test -- "middleware.spec.ts" 2>&1 \| tee outputs/phase-11/middleware-regression.log` |
| EV-08 | verify-design-tokens | `outputs/phase-11/verify-design-tokens.log` | `bash scripts/verify-design-tokens.sh 2>&1 \| tee outputs/phase-11/verify-design-tokens.log` |
| EV-09 | verify-test-suffix | `outputs/phase-11/verify-test-suffix.log` | `bash scripts/verify-test-suffix.sh 2>&1 \| tee outputs/phase-11/verify-test-suffix.log` |
| EV-10 | git diff stat | `outputs/phase-11/diff-stat.txt` | `git diff dev...HEAD --stat -- 'apps/web/app/(*)/layout.tsx' 'apps/web/app/(*)/layout.spec.tsx' > outputs/phase-11/diff-stat.txt` |
| EV-11 | DOM scrape (public) | `outputs/phase-11/dom-scrape-public.txt` | dev server 起動後 `curl -s http://localhost:3000/ \| grep -E 'data-(theme\|route-group\|shell\|route)=' > outputs/phase-11/dom-scrape-public.txt` |
| EV-12 | DOM scrape (admin) | `outputs/phase-11/dom-scrape-admin.txt` | admin session 取得後 `curl -s -b cookies.txt http://localhost:3000/admin \| grep ... > ...` |
| EV-13 | DOM scrape (member) | `outputs/phase-11/dom-scrape-member.txt` | `curl -s http://localhost:3000/login \| grep ... > ...` |
| EV-14 | screenshot (public) | `outputs/phase-11/screen-public.png` | dev server 上で Playwright / 手動 screenshot |
| EV-15 | screenshot (admin) | `outputs/phase-11/screen-admin.png` | 同上 |
| EV-16 | screenshot (member) | `outputs/phase-11/screen-member.png` | 同上 |

## 2. 必須 vs 任意

| ID | 必須 | 任意 |
|----|------|------|
| EV-01..09 | ◯ | |
| EV-10 | ◯ | |
| EV-11..13 | | ◯（serial-07 visual で代替可） |
| EV-14..16 | | ◯（serial-07 visual evidence で代替可） |

`visualEvidence: VISUAL` workflow なので最低 1 枚の画像証跡を残す。本サブワークフロー単体で取れない場合は serial-07 取得分を参照する。

## 3. 証跡保存ディレクトリ

```
docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/
├── phase-01..13-*.md
└── outputs/
    └── phase-11/
        ├── typecheck.log
        ├── lint.log
        ├── web-build.log
        ├── public-layout-spec.log
        ├── admin-layout-spec.log
        ├── member-layout-spec.log
        ├── middleware-regression.log
        ├── verify-design-tokens.log
        ├── verify-test-suffix.log
        ├── diff-stat.txt
        ├── dom-scrape-*.txt
        └── screen-*.png
```

## 4. evidence existence validator 整合

`verify:phase11-evidence` gate（CLAUDE.md「PR作成の完全自律フロー」参照）は `outputs/phase-11/` 配下の存在を検証する。本台帳の EV-ID と inventory parser 仕様は `.claude/skills/task-specification-creator/references/phase11-evidence-inventory-parser.md` の表 schema に従う。

## 5. 取得タイミング

- EV-01..09: 全 step 完了後、Phase 7 ゲート実行時にまとめて取得
- EV-10: PR 直前
- EV-11..16: 視覚的差分が必要な場合のみ（serial-07 の baseline 取得で十分なら省略）

## 6. evidence 欠落時のフォールバック

evidence が取得できない項目は **本ファイルの該当行を残しつつ「N/A: serial-07 参照」** と記載する。空白で残さない。
