---
spec_classification: implementation_spec
state: spec_created
phase: 10
phase_name: 最終レビュー
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 10: 最終レビュー

## 10.1 AC 突合

Phase 9.3 の結果と Phase 1.3 の AC 一覧を 1 対 1 突合。

| AC | 期待 | 実測 (Phase 9 結果) | 判定 |
|----|------|---------------------|------|
| AC-C1 | 9 page で AdminPageHeader 採用 | — | (実装時に埋める) |
| AC-C2 | Breadcrumb 直 import 0 件 | — | — |
| AC-C3 | Tailwind palette 0 件 | — | — |
| AC-C4 | HEX 直書き 0 件 | — | — |
| AC-C5 | identity-conflicts `<main>` 0 件 | — | — |
| AC-C6 | verify-design-tokens green | — | — |
| AC-C7 | 9 page title/eyebrow/breadcrumbs が設計表と一致 | — | — |
| AC-C8 | 新規 PageHeader component 0 件 | — | — |

## 10.2 不変条件再 grep

```bash
# I-C1: PageHeader 1 系
grep -rE 'export (default )?function.*PageHeader' apps/web/src
# 期待: AdminPageHeader 1 件のみ

# I-C2: panel file の git diff 0 行
git diff --stat dev...HEAD -- 'apps/web/src/features/admin/components/_panel/*'
# 期待: 出力なし (panel ディレクトリは touched しない)

# I-C4: HEX / palette 残存なし
grep -rE '(bg|text|border)-\[#' apps/web/app/\(admin\)/admin
```

## 10.3 観察事実との照合

- pre-existing dashboard / members 採用 2 page の振る舞いが変わっていないこと (eyebrow 未指定 → null render で従来通り)
- breadcrumb の表示順・semantic に変更なし
- `aria-labelledby` を維持している dashboard/attendance の section が引き続き機能していること

## 10.4 進行判定

すべて pass → Phase 11 へ。
fail → Phase 5 / 6 / 8 へ戻る。
