# Phase 12 Main

[実装区分: 実装仕様書]

Status: `implemented_local_evidence_captured` — Lane B-D と local regression specs は実コードへ反映済み。staging deploy / authenticated runtime screenshot / commit / push / PR 作成は user-gated。

## 本サイクルの完了範囲

- Phase 1〜4: 仕様書一式（要件 / 設計 / 設計レビュー / テスト計画）completed
- Phase 5: 実装 — `page.tsx` / `SchemaDiffPanel.tsx` / `AdminSidebar.tsx` / CSS / page spec を反映
- Phase 6: テスト追加 — page/panel/sidebar specs と primitive adoption gate を更新
- Phase 7: カバレッジ目標仕様書
- Phase 8: リファクタ仕様書（RF-1〜RF-5）
- Phase 9: QA 実行コマンド + 合否基準
- Phase 10: 最終レビュー チェックリスト
- Phase 11: authenticated runtime visual は user-gated、local web Vitest は PASS
- Phase 12: 本ドキュメント群
- Phase 13: PR 作成手順（user-gated）

## User-gated boundary

- Phase 11 manual test / authenticated runtime screenshot
- Phase 13 commit / push / PR 作成
- staging deploy refresh（Lane A 修復のため要）

## Local Evidence

```text
mise exec -- pnpm --filter @ubm-hyogo/web test --run 'apps/web/app/(admin)/admin/schema/page.spec.tsx' 'apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx' 'apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx' 'apps/web/src/components/admin/__tests__/primitive-adoption.spec.ts'
Result: 158 files passed, 1147 tests passed, 1 skipped
Evidence file: outputs/phase-11/local-web-vitest.txt
```

## 検証コマンド（仕様書整合）

```bash
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm indexes:rebuild
bash scripts/verify-pr-ready.sh
```

すべて exit 0 を期待。
