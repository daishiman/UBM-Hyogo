# Phase 9: 品質保証

> `implementation_mode: verify_existing`（landed at PR #1064 / `745c95115`）。本 Phase は landed 実装に対し line budget / link / mirror parity / トークン正本を一括判定する読み替えで実施する。新規生成物はない。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 9 |
| 名称 | 品質保証 |
| 種別 | 検証（verify_existing: 品質一括判定） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 8（リファクタリング） |

## 目的

landed 実装に対しトークン正本 / 命名（`*.spec.tsx`）/ D1 境界 / `apps/api` 不変 / typecheck・lint の 5 項目を一括判定し、inventory 5 ファイルの present 判定と spec 7 it green を確認する。

## 実行タスク

- 品質チェック 5 項目（HEX なし / `*.spec.tsx` / D1 非アクセス / apps/api 変更ゼロ / typecheck・lint）を判定表化する（§1）。
- inventory 5 ファイルを present 判定（git tracked）で確認する（§2）。
- spec 観点（7 it・ルート実行）を記録する（§3）。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`

## 成果物

- 本 Phase 9 検証結果（品質 5 項目判定表 / inventory present 判定 / spec 7 it green 記録）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## 1. 品質チェック項目

| # | 項目 | 検証手段 | 期待 |
|---|------|---------|------|
| (1) | HEX 直書き・`bg-[#xxx]`・`text-[#xxx]`・inline style なし（token CSS variable arbitrary value のみ） | `pnpm --filter @ubm-hyogo/web verify-design-tokens` / `pnpm lint`（`verify:no-inline-style` 含む） | PASS |
| (2) | 新規 spec は `*.spec.tsx` のみ（`*.test.tsx` なし）— 不変条件 #8 | `ReflectionTimingNote.spec.tsx` の命名確認 | PASS |
| (3) | `apps/web` から D1 直接アクセスなし（公開 `GET /public/stats` 経由のみ）— 不変条件 #5 | コンポーネントは props 受領のみ・fetch は page 側 | PASS |
| (4) | `apps/api` 変更ゼロ（既存 API のみ接続） | `git diff dev...HEAD -- apps/api`（空） | PASS |
| (5) | typecheck / lint green | `mise exec -- pnpm typecheck` / `pnpm lint` | PASS |

## 2. ファイル存在（[FB-UI-02-1]）

削除タスクではないため inventory 5 ファイルは全て **present** 判定（git tracked で確認）:

| ファイル | 種別 | 判定 |
|---------|------|------|
| `apps/web/src/components/public/ReflectionTimingNote.tsx` | source | present |
| `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx` | spec | present |
| `apps/web/src/app/(public)/members/page.tsx` | wiring | present |
| `apps/web/src/app/(member)/profile/page.tsx` | wiring | present |
| `docs/00-getting-started-manual/specs/03-data-fetching.md`（反映 SLA 節） | doc | present |

## 3. spec 観点（7 it）

`pnpm exec vitest run apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`（リポジトリルートから実行）で 7 it green を期待。最終同期表示 / fallback / 反映目安 / surface 別 testid / aria-label を網羅。

## 完了条件

- [x] トークン正本・命名・D1 境界・API 不変・typecheck/lint の 5 項目を判定表化した（全 PASS）。
- [x] inventory 5 ファイルを present 判定（git tracked）で確認した。
- [x] spec 観点（7 it・ルート実行）を記録した。
