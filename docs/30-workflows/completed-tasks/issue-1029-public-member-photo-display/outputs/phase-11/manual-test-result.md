# Phase 11 手動テスト結果（implemented_local_runtime_pending / local visual captured）

> **[実装区分: 実装仕様書]**。本 workflow は `implemented_local_runtime_pending`（実コード配線・ローカル focused test/typecheck 完了、外部 ops pending）。本ファイルは Phase 12 compliance が status=present で参照する実体ファイル。local runtime screenshot PNG は取得済み。

## 0. 証跡ステータス

| 項目 | 値 |
|------|-----|
| workflow_state | `implemented_local_runtime_pending` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| screenshot 取得状況 | **present**（local Playwright mock runtime で 3 PNG 取得） |
| 本ファイルの役割 | ローカル証跡の主ソース + staging/R2 user-gated 境界の記録 |

## 1. runtime screenshot 取得結果（[Feedback 4]）

- public photoUrl の実装（schema optional / batch helper / resolver DI / route presign / UI src 配線）は完了している。
- local mock API に public-safe `photoUrl` を注入し、一覧/詳細で `.ui-avatar--photo img` の DOM と screenshot を確認した。
- 実 R2 presigned URL の staging screenshot には R2 secrets と deploy が必要で、これは user-gated。local visual は完了、staging visual は外部 ops として分離する。

## 2. ローカル証跡の主ソース

### 2.1 自動テスト（source-level 検証）

| テストファイル | 結果 | 検証 AC |
|----------------------|-------------|---------|
| `packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts` | PASS（16 tests。list/profile `photoUrl` + `.strict()`） | AC-2/AC-6 |
| `apps/api/src/repository/__tests__/member-photos.batch.spec.ts` | PASS（5 tests） | AC-8 |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | PASS（9 tests） | AC-3/AC-8 |
| `apps/api/src/use-cases/public/__tests__/get-public-member-profile.spec.ts` | PASS（10 tests） | AC-4 |
| `apps/api/src/routes/public/index.contract.spec.ts` | PASS（12 tests。route presign / photoなし / gate不通過） | AC-3/AC-4/AC-6/AC-8 |
| `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` | PASS（6 tests） | AC-3/AC-5 |
| `apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx` | PASS（5 tests） | AC-4/AC-5 |

証跡ログ:

- `outputs/phase-11/evidence/focused-vitest.log`
- `outputs/phase-11/evidence/public-route-contract.log`

### 2.2 screenshot（local Playwright runtime / VISUAL）

| canonical 名 | 検証 AC | 取得環境 |
|--------------|---------|---------|
| `public-members-photo-list-desktop.png` | AC-3/AC-5 | local Playwright mock runtime |
| `public-member-photo-detail-desktop.png` | AC-4/AC-5 | local Playwright mock runtime |
| `public-members-photo-list-mobile.png` | AC-3/AC-5 | local Playwright mock runtime |

## 3. source-level 検証（[WEEKGRD-01]）

R2 環境に依存しない source-level 検証。

- [x] `pnpm --filter @ubm-hyogo/shared typecheck` exit 0（`outputs/phase-11/evidence/shared-typecheck.log`）
- [x] `pnpm --filter @ubm-hyogo/api typecheck` exit 0（`outputs/phase-11/evidence/api-typecheck.log`）
- [x] `pnpm --filter @ubm-hyogo/web typecheck` exit 0（`outputs/phase-11/evidence/web-typecheck.log`）
- [x] `pnpm --filter @ubm-hyogo/shared lint` exit 0（`outputs/phase-11/evidence/shared-lint.log`）
- [x] `pnpm --filter @ubm-hyogo/api lint` exit 0（`outputs/phase-11/evidence/api-lint.log`）
- [x] `pnpm --filter @ubm-hyogo/web lint` exit 0（`outputs/phase-11/evidence/web-lint.log`）
- [x] 上記 2.1 の自動テスト全件 GREEN
- [x] view-model `.strict()` parse test で余分な公開不可キーを reject（AC-6）
- [x] `apps/web/src` R2 / `member_photos` 直接参照 grep gate 0 hits（`outputs/phase-11/evidence/web-r2-boundary-grep.log`）
- [x] `pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/issue-1029-public-member-photo-display.spec.ts` exit 0（`outputs/phase-11/evidence/playwright-public-photo.log`）
- [x] Phase 12 compliance verifier PASS（`outputs/phase-11/evidence/phase12-compliance-verify.log`）

## 4. 環境ブロッカー（user-gated・別カテゴリ / [WEEKGRD-01]）

source-level 検証とは別カテゴリで、runtime 検証に必要な環境ブロッカーを記録する。

| ブロッカー | 区分 | 影響する検証 |
|------------|------|-------------|
| R2 bucket `ubm-hyogo-member-photos-staging` 未作成 | user-gated | 写真ありの `<img>` screenshot（AC-3/AC-4） |
| `R2_*` secret 未投入 | user-gated | presigned URL 生成 → 写真表示 |
| staging deploy 未実施 | user-gated | staging での実 R2 presigned URL public 閲覧 capture |

> 上記が解消するまでは `implemented_local_runtime_pending`（local runtime 完了・external staging/R2 ops 保留）として扱う。partial fix ではない（Phase 10 格下げ基準参照）。

## 5. 結論

- 実 screenshot は **3 枚**（local Playwright mock runtime）。
- 自動テスト・route contract・typecheck・local Playwright の source/runtime 検証は PASS。
- staging の実 R2 presigned URL 検証は環境ブロッカー解消（user-gated）後に実施。
