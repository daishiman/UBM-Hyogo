# Phase 7 — カバレッジ確認

## 目的

本サイクルで**変更・新規した関数／変更行のみ**を対象に line / branch カバレッジを確認する方針を固定する。既存の不変モジュール（API/detector/repository・既存 test-accounts seed）はカバレッジ対象に含めない（FB-BEFORE-QUIT-002 / Feedback 5：対象範囲を変更ファイルへ限定）。

## 成果物

- カバレッジ対象 / 対象外の明示表。
- 関数別カバレッジ目標と証跡記録方針。

## カバレッジ対象（変更・新規ファイル）

| パス | 種別 | カバレッジ目標 | 検証経路 |
| --- | --- | --- | --- |
| `apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts` | 新規（純データ＋純関数） | **line 100% / branch 100%** | `identityConflictGlossary.spec.ts`（既知 2 キー＋fallback 分岐＝branch 全網羅） |
| `apps/web/src/components/admin/IdentityConflictGuide.tsx` | 新規（stateless） | line 100%（描画 1 経路） | `IdentityConflictGuide.spec.tsx` |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集（**変更行のみ**＝文言・glossary 経由 badge） | 変更行の line/branch を回帰テストで通過 | `IdentityConflictRow.spec.tsx`（merge/dismiss/error 分岐） |
| `apps/api/src/testing/identity-conflicts/build-seed-sql.ts` | 新規（生成関数） | **line / branch を seed 経路で網羅**（seed/cleanup 両ビルダー） | `identity-conflict-seed.contract.spec.ts` |
| `apps/api/src/testing/identity-conflicts/catalog.ts` | 新規（純データ） | データ参照のみ（実行分岐なし＝line 通過で十分） | contract test 経由で import |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 編集（文言＋Guide 差込） | 変更行（文言・Guide 配置）を描画テストで通過 | page 描画テスト（既存があれば変更行を、無ければ Guide 差込を Row/Guide テストで間接担保） |

> `catalog.ts` は branch を持たない純データのため、line 通過（contract test の import + builder 実行）で十分とみなす。

## カバレッジ対象外（不変・本サイクル非変更）

| パス | 除外理由 |
| --- | --- |
| `apps/api/src/routes/admin/identity-conflicts.ts` | API 不変（AC-8）。本サイクル無変更 |
| `apps/api/src/repository/identity-conflict.ts` | 不変。参照のみ |
| `apps/api/src/services/admin/identity-conflict-detector.ts` | 不変。検出ロジックは既存テストでカバー済 |
| `packages/shared`（identity-conflict 型） | 不変（AC-8） |
| `apps/api/src/testing/test-accounts/*` / `test-accounts-seed.sql` / その contract | 既存 seed（分離方針・[§6.1 注記](./shared-context.md)）。本サイクル無変更 |
| `apps/web/src/components/admin/IdentityConflictAnnouncer.tsx` | aria-live container 無変更（[phase-1 inventory](./phase-1-requirements.md)） |

## カバレッジ実測・証跡方針

- 実測は focused 範囲で実行し、**変更した関数の line/branch 実測値**を Phase 9 QA の証跡（または `outputs/phase-11`）に残す。
  ```bash
  # 対象限定の coverage（変更ファイルへ絞る）
  mise exec -- pnpm exec vitest run --coverage --root=. --config=vitest.config.ts \
    apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts \
    apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
    apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx \
    apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts
  ```
- 証跡には対象ファイルの `% Stmts / % Branch / % Funcs / % Lines` を記録（glossary は 100/100 を満たすこと）。
- カバレッジ閾値は**プロジェクト既定（coverage-guard）**に従う。本タスクで新規しきい値は設けない。
- 既存ファイルの未変更行のカバレッジ低下は本タスクの責務外（変更行のみを対象とする方針を明記）。

## 完了条件

- [ ] カバレッジ対象を変更・新規ファイルへ限定する表を確定した。
- [ ] glossary は line/branch 100% 目標、build-seed-sql は seed/cleanup 両経路網羅を明記した。
- [ ] 対象外（API/detector/repository/既存 seed）を明示した。
- [ ] 変更関数の line/branch 実測値を証跡に残す方針を記載した。
