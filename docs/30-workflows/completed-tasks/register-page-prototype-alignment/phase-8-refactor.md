---
phase: 8
title: リファクタ
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 8 — リファクタ

[実装区分: 実装仕様書]

## 1. データ集約

- `RegisterStepGrid` の `DEFAULT_STEPS` と `RegisterFaq` の `DEFAULT_FAQ`、および Bottom CTA / Hero のコピー文言は、再利用・国際化を視野に共通モジュールへ集約する。
  - 候補: `apps/web/src/lib/content/register.ts` 新規（または既存 `apps/web/src/lib/constants/` 配下に追記）。
  - 集約レベルは「コピー定数のみ」に留め、コンポーネント側で format を行う（i18n は本 PR スコープ外）。
- ただし新規モジュール作成によりテスト面が広がる場合は、各 component ファイル内の `const DEFAULT_*` で完結させ、Phase 12 implementation-guide に「将来 i18n 時に共通モジュール化する」と TODO を残す。

## 2. magic number / inline style 排除

- プロトタイプの `style={{ fontSize: 32, lineHeight: 1.25 }}` 等は採用しない。`serif` / `h-section` / `body` / `small` / `muted` 等の既存 utility class で表現する。
- `var(--accent)` 等の CSS 変数参照のみで色を扱い、HEX / RGB 直書きは禁止（Phase 5 §5 の grep gate で 0 件確認）。
- 装飾用の radial-gradient 背景は `register-hero__bg` class として `globals.css` に最小宣言で追加し、色は `color-mix(in oklch, var(--accent) 16%, transparent)` のみ。

## 3. 重複の整理

- 旧 `RegisterCallout` で使っていた同意リスト専用構造を撤去し、`RegisterHeroCallout` で hero CTA / metrics / consent 補足へ責務を再配置する。
- 旧 `consent-list` / `cta-button` 等の local class は新構造で不要になれば削除し、stale CSS を残さない。

## 4. 検証

```bash
mise exec -- pnpm --filter web lint
mise exec -- pnpm --filter web typecheck
grep -nE 'bg-\[#|text-\[#|#[0-9a-fA-F]{6}' apps/web/src/components/public/Register*.tsx apps/web/src/components/public/FormPreviewSections.tsx
```
