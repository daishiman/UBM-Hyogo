---
phase: 8
title: Definition of Done
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 8 — Definition of Done

[実装区分: 実装仕様書]

## 1. DoD チェックリスト

### 1.1 機能 DoD

- [ ] G3-1: tag pill `aria-selected="true"` で背景塗りつぶしが視覚反映される
- [ ] G3-1: tag pill hover で border-color が `--ubm-color-border-strong` に変化
- [ ] G3-2: member card hover で border-color / box-shadow が transition 経由で変化
- [ ] G3-2: member card 内 link focus 時に focus-within で accent outline 表示
- [ ] G3-3: `data-visibility="public"` で左 border `--ubm-color-ok` と同色 dot marker 表示
- [ ] G3-3: `data-visibility="member"` で左 border `--ubm-color-zone-b` と同色 dot marker 表示
- [ ] G3-3: `data-visibility="admin"` で左 border `--ubm-color-danger` と同色 dot marker 表示

### 1.2 品質 DoD

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] HEX 直書き 0 件 (`grep -rEn 'bg-\[#\|text-\[#\|border-\[#' apps/web/src`)
- [ ] verify-design-tokens CI gate green
- [ ] Playwright visual snapshot 9 種 (tag-pill-default / tag-pill-selected / tag-pill-hover / member-card-default / member-card-hover / member-card-focus / visibility-public / visibility-member / visibility-admin) baseline 更新済
- [ ] axe a11y violations 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0

### 1.3 ドキュメント DoD

- [ ] 本サブワークフローの phase-01..13 が `spec_created` 状態
- [ ] `phase-11-evidence-inventory.md` に snapshot ファイルと静的検証 log が列挙され、未取得 runtime screenshot は `pending` として明示されている
- [ ] PR 本文に Phase 5 の追加 CSS 抜粋が含まれている
- [ ] CHANGELOG / 30-workflows LOGS に本サブワークフロー完了が追記されている

### 1.4 構造 DoD

- [ ] `globals.css` への追加が `/* === parallel-02 G3-[123] ... === */` start/end マーカーで完備
- [ ] parallel-01 と同時に commit する場合、両者のマーカーが別れていること
- [ ] 既存 parallel-09 G9-1..G9-7 ブロックを変更していないこと

## 2. 失敗判定

次のいずれかが満たされない場合、サブワークフロー未完了とする:

- 機能 DoD のうち 1 項目でも未達
- 品質 DoD のうち typecheck / lint / build / verify-design-tokens / verify-pr-ready のいずれかが fail
- 構造 DoD のマーカー違反

## 3. CONST_007 適合

本サブワークフローは 1 サイクル内で完了する。先送りタスクなし。
