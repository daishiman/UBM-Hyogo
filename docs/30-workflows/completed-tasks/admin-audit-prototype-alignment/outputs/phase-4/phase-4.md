# Phase 4: 実装計画

> workflow: admin-audit-prototype-alignment

## 実装順序

1. Task A: `page.tsx` を `AdminPageHeader` 採用へ変更し、`AuditLogPanel` を `Card` / `FormField` / `Input` / `Select` / `Button` / `buttonVariants` / `Banner tone="warning"` / `tbl` に寄せる。
2. Task B: `/admin/audit` 404 を H1〜H5 で切り分け、local contract test で route mount と `ADMIN_FETCH_404` reason を固定する。
3. Task A/B 統合: 正常系 staging visual baseline は Task B 完了後に取得する。Task B 未完了中は error banner と fixture/unit test で Task A を検証する。

## 依存関係

| 項目 | 判定 |
|------|------|
| UI 実装 vs API 切り分け | 並列可 |
| 正常系 visual baseline | Task B 復旧後 |
| staging deploy / secret mutation / authenticated screenshot | user-gated |

