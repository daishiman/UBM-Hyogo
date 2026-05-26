# Phase 3: Task Breakdown — SRP 単位の独立タスク

## 1. Overview

案 B 採用に基づき、11 ファイル編集を SRP 単位で独立タスクとして分解する。T2 は同じ責務（page-local breadcrumb から root label を除去）を持つ admin page 群の機械的一括更新として扱う。

## 2. タスク一覧

| # | task_id | 対象ファイル | 責務 | 依存 |
|---|---------|--------------|------|------|
| T1 | `issue-894-T1-layout-wire-breadcrumb-slot` | `apps/web/app/(admin)/layout.tsx` | topbar の `breadcrumb` slot に `<Breadcrumb items=[{label:"管理"}]/>` を注入 / `Breadcrumb` import 追加 | なし |
| T2 | `issue-894-T2-page-breadcrumbs-localize` | `apps/web/app/(admin)/admin/{page,members,requests,tags,schema,audit,identity-conflicts,meetings}/page.tsx` | page-local breadcrumb から先頭「管理」を除去し現在地のみへ | T1 |
| T3 | `issue-894-T3-breadcrumb-primitive-regression-spec` | `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx` | 最終 item が current span になり、非最終 href item のみ link になる contract を固定 | T1 |
| T4 | `issue-894-T4-layout-spec-add-breadcrumb-assertion` | `apps/web/app/(admin)/layout.spec.tsx` | breadcrumb slot 内に primitive（`data-component="breadcrumb"`）が出現する assertion 追記 / 既存 data-* 契約は維持 | T1 |

## 3. 粒度の根拠

- T2 は複数ファイルだが、責務は「root label の ownership 移管」だけで単一。8 page を分けるより、同じ grep gate で閉じる方が漏れが少ない。
- T3 は `Breadcrumb` primitive の契約を実テスト化し、topbar の静的 current label と既存 page-local current 表示の両方を担保する。
- T4 は実装と spec の整合確認を担当（実装後の検証ステップ）。
- 各タスクの行数差分は概ね 1〜4 行で、レビュー単位として最小化されている。

## 4. 実行順

```
T1 (layout.tsx) → T2 (8 page-local breadcrumbs) → T3 (Breadcrumb.spec.tsx) → T4 (layout.spec.tsx)
```

ただし T2 / T3 は順序入替可。T4 は T1 完了後ならいつでも可。1 PR にまとめる前提のため commit は機能単位で 1〜2 個に集約してもよい（例: T1+T4 を「topbar slot wiring」、T2+T3 を「page breadcrumbs localization」）。

## 5. スコープ外（明示）

- AdminPageHeader 未導入ページ（tags / meetings / schema / requests / identity-conflicts / audit）への AdminPageHeader 導入: **本タスクの対象外**。ただし既存 `Breadcrumb` consumer の先頭 root label 除去は本タスクの対象。
- AdminTopbar primitive 自体の変更（slot signature 不変）。
- Breadcrumb primitive 自体の変更（item interface 不変）。
- design token / global CSS の変更。
