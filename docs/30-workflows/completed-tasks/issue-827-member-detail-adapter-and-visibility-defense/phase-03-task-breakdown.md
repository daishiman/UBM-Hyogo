# Phase 3: タスク分解

## 単一タスク構成（1 サイクル内完了）

| Step | 内容 | 対象ファイル | 種別 |
|------|------|-------------|------|
| S1 | adapter 新規作成 | `apps/web/src/lib/adapters/member-detail.ts` | 新規 |
| S2 | adapter 単体テスト | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 新規 |
| S3 | `MemberDetailSections.tsx` から `kind !== "url"` filter を撤去（adapter に責務移管） | `apps/web/src/components/public/MemberDetailSections.tsx` | 編集 |
| S4 | page.tsx を adapter 経由に置換 | `apps/web/app/(public)/members/[id]/page.tsx` | 編集 |
| S5 | 既存 component test 更新（adapter 移管後の挙動に整合） | `apps/web/src/components/public/__tests__/MemberDetailSections.component.spec.tsx` | 編集 |
| S6 | 検証コマンド一括実行 | — | 実行 |

## 分割しない理由 (CONST_007)

- 全 6 step は同一 PR で完結する最小機能単位。並列分割は依存上不可能（S3 は S1 完了前提、S4 は S1 + S3 前提、S5 は S3 前提）。
- 後送り無し。
