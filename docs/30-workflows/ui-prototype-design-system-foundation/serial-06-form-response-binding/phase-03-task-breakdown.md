---
phase: 3
title: タスク分解 — SRP に沿った最小単位への分解
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. 分解原則

Clean Code SRP に沿い、1 ファイル 1 責務で分解する。adapter / primitive / route / fixture / test の 5 系統に分離する。

## 2. タスク一覧

| ID | タスク | ファイル（絶対パス） | 所要 | 依存 |
|----|-------|---------------------|-----|------|
| T-01 | adapter 実装（pure function, visibility filter, unknown kind 防御） | `apps/web/src/lib/adapters/member-detail.ts` | M | — |
| T-02 | adapter unit spec | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | M | T-01 |
| T-03 | fixture（代表 Member 1 件、6 sections × 各 visibility 混在） | `apps/web/src/fixtures/public-member-profile.ts` | S | — |
| T-04 | MemberDetail primitive 新規 or 編集 | `apps/web/src/components/public/MemberDetail.tsx` | M | T-01 |
| T-05 | page.tsx fetch + adapter + notFound 配線 | `apps/web/app/(public)/members/[id]/page.tsx` | M | T-01, T-04 |
| T-06 | Playwright visual spec | `apps/web/tests/e2e/public-member-detail.spec.ts` | M | T-03, T-05 |
| T-07 | Playwright visibility filter assertion（`visibility=member|admin` が DOM に無いこと） | T-06 に同梱 | S | T-06 |
| T-08 | Phase 11 evidence 集約 | `outputs/phase-11/evidence.md` | S | T-06 |

サイズ目安: S = 30 行未満 / M = 30〜150 行 / L = 150 行以上

## 3. 依存グラフ

```
T-03 (fixture)
T-01 (adapter) ─ T-02 (adapter spec)
              └ T-04 (MemberDetail) ─ T-05 (page.tsx) ─ T-06 (Playwright) ─ T-07
                                                                       └ T-08
```

## 4. 並列実行ポリシー

- T-01 と T-03 は同時着手可
- T-02 は T-01 完了後に着手
- T-04 / T-05 は T-01 完了後に着手可（T-04 → T-05 順）
- T-06 以降は T-05 完了後

## 5. 単一責務原則チェック

| ファイル | 単一責務 |
|---------|---------|
| `adapters/member-detail.ts` | API response → primitive props 整形のみ。fetch / I/O を含まない |
| `fixtures/public-member-profile.ts` | 代表 case の data 提供のみ |
| `MemberDetail.tsx` | composition layer。fetch / adapter を呼ばない |
| `page.tsx` | URL params parse / fetch / adapter 呼び出し / notFound 分岐のみ。JSX 組み立ては primitive に委譲 |

## 6. 完了条件

- 全 8 タスクが done
- adapter spec が green（`pnpm --filter @ubm-hyogo/web test`）
- Playwright spec が green（chromium 1 case）

## 7. 参照

- Phase 2 アーキテクチャ図
- `apps/web/src/components/public/` 既存 primitive 群
