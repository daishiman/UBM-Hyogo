---
spec_classification: implementation_spec
state: spec_created
phase: 7
phase_name: カバレッジ
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 7: カバレッジ

## 7.1 追加 spec

- 新規 RTL spec 9 file + 構造 gate 1 file = 10 spec
- branch / function coverage への寄与は page 表層のみで小 (panel 本体は既存維持)

## 7.2 coverage threshold への影響

- 既存 coverage threshold は 3 lane (lines / branches / functions) で sync (issue-255)
- AdminPageHeader 拡張は 2 新 prop (`eyebrow` / `headingId`) を追加するため、AdminPageHeader 自身の test (既存 or 新規) で両 branch を covered する
- page 表層 RTL spec は SSR 出力の DOM assertion が主のため、coverage delta は計測誤差に近い

## 7.3 確認コマンド

```bash
mise exec -- pnpm --filter web test:coverage
```

threshold drop が起きた場合は `apps/web/src/features/admin/components/_layout/__tests__/AdminPageHeader.spec.tsx` に以下 2 case を追加して回復する:

1. `eyebrow` 指定時に `<p>` が render される
2. `eyebrow` 未指定時に `<p>` が render されない (既存採用 2 page の後方互換確認)
3. `headingId` 指定時に `<h1 id="...">` が render される

## 7.4 完了条件

coverage CI gate green。pre-existing threshold を割らないこと。
