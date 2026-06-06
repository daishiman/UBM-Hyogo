# Phase 11 Manual Test Result（NON_VISUAL）

Status: `completed`（local automated evidence captured）

## NON_VISUAL 宣言

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation / seed |
| visualEvidence | **NON_VISUAL** |
| 非視覚的である理由 | UI / UX 変更なし。D1 seed データ（catalog→生成物）と生成/適用スクリプト、E2E ログイン補助の追加のみで、描画可能な画面要素を持たない |
| 証跡の主ソース | 本 wave で実行した自動テスト（下表）。スクリーンショットは作成しない |
| スクリーンショットを作らない理由 | 画面描画を伴わないため。本タスクの正しさは D1 行件数・SQL 構造・生成物 byte 一致という非視覚的事実で決まり、目視確認の対象が存在しない |

## 証跡の主ソース（自動テスト）

| spec ファイル | テストケース数 | 検証内容 | 対応 AC |
|---------------|---------------------------|----------|---------|
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | 3 | members 10 / admins 3 / meetings 3、ID 重複なし、loginable 7 件、publicListed 5 件、admin active 2 件、主要 member ID 別シナリオ整合 | AC-1, AC-2, AC-3, AC-8 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 3 | seedSql の `BEGIN TRANSACTION;…COMMIT;` 境界、素の `INSERT INTO` 不在（冪等動詞のみ）、manifest shape、cleanupSql の対象列挙 | AC-4, AC-8 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 4 | committed 版との byte 一致（drift guard）、in-memory D1 へ 2 回適用で件数不変（冪等）、cleanup 後に対象行 0 件、公開掲載 5 件・photo 4 件・SQL escape を検証 | AC-5, AC-6, AC-7, AC-9 |

> 上記ケース数は spec 設計時点の目安であり、本 wave で AC を網羅する範囲で確定する。AC-2/AC-3 の件数（7/3/5）固定 assert は必須ケースとして含める。

## 実行記録

- `node --import tsx scripts/gen-test-accounts-seed.mjs --check` → PASS（drift 0）
- `pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts` → PASS（2 files / 6 tests）
- `pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts` → PASS（1 file / 4 tests）
- `pnpm --filter @ubm-hyogo/api typecheck` → PASS
- `pnpm --filter @ubm-hyogo/web typecheck` → PASS
- `pnpm --filter @ubm-hyogo/api lint` → PASS
- `pnpm --filter @ubm-hyogo/web lint` → PASS

## スクリーンショット

なし（NON_VISUAL）。`outputs/phase-11/evidence/` 配下に画像は配置しない。PR 本文にもスクリーンショット専用セクションを設けない。

## 既知制限（user-gated・本フェーズ非実行）

- `scripts/seed-test-accounts.sh --env local` / `--env staging` による実 D1 投入・撤去（副作用あり）。
- `mint-test-account-storage-state.ts` による storage-state 生成（`AUTH_SECRET` と対象環境を要する）。
- member_photos の R2 バイナリ実体投入（別関心・別タスク）。
