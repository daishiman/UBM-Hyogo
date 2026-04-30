# Phase 5 成果物 — 実装ランブック概要 (08a)

## 1. 目的と Phase 4 引き取り

Phase 4 で確定した 5 種 verify suite と 16 項目の補強リストを、後続実装者が手順通り実行できる runbook（7 ステップ）と擬似コード（test-signatures.md）に展開する。`apps/api` には既に約 83 件の test が存在するため、本 Phase は **「ゼロから作る」ではなく「補強と命名統一」** が主軸になる。

## 2. 構成

| 成果物 | 役割 |
| --- | --- |
| `runbook.md` | 7 ステップの実装手順。依存追加 → vitest.config 差分 → helpers 整備 → 補強実装 → CI yml |
| `test-signatures.md` | 5 種 suite の擬似コード（実 file path 付き） |
| `main.md`（本ファイル）| ステップ間の依存と sanity check |

## 3. 7 ステップ概要（詳細は runbook.md）

| Step | 内容 | 依存資産 |
| --- | --- | --- |
| 1 | 依存追加 (`@vitest/coverage-v8`, `better-sqlite3`, `msw` 等) | apps/api/package.json |
| 2 | `vitest.config.ts` の coverage threshold + typecheck enabled 差分 | 既存 vitest.config |
| 3 | `apps/api/test/helpers/` `apps/api/test/mocks/` 整備（app / auth / seed / msw server） | 既存 `__fakes__/fakeD1.ts` / `__fixtures__/*` 流用 |
| 4 | contract test 補強（me 4 件新規 / public 4 件新規 / admin 20 件強化 / 不変条件 5 件追加） | Phase 4 §3.1 補強リスト |
| 5 | repo unit 補強（dashboard / publicMembers 新規 + 既存 fixture 5 件拡張） | Phase 4 §3.2 |
| 6 | authz / type / lint suite 新規（9 マトリクス集約 spec / brand.type-test.ts / import-boundary.test.ts） | Phase 4 §3.3-5 |
| 7 | `.github/workflows/api-tests.yml` placeholder | CLAUDE.md CI 方針 |

## 4. 既存実装との衝突回避

- 既存 `*.test.ts` は **削除しない**。Phase 8 DRY 化で `*.contract.spec.ts` へ rename する移行計画は別 PR（本タスクは spec のみ）。
- 既存 `repository/__tests__/brand.test.ts` は runtime test として残し、本タスクの type test は `packages/shared/src/__tests__/brand.type-test.ts` に **共存**配置。
- `middleware/require-admin.test.ts` は単一 middleware 単位として残し、9 マトリクス集約 spec を `middleware/__tests__/authz.spec.ts` に新設。

## 5. sanity check

```bash
# local
mise exec -- pnpm --filter @ubm-hyogo/api test
# expected: ≥ 274 tests pass（既存 83 + 補強 約 75 + 既存ベース増加分）

# coverage
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
# expected: statements ≥ 85%, branches ≥ 80%

# typecheck
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck
# expected: brand.type-test.ts の `@ts-expect-error` 行数だけ「期待された型エラー」検知

# lint boundary
mise exec -- pnpm --filter @ubm-hyogo/api test -- import-boundary
# expected: grep 結果 0 件で pass
```

## 6. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | step ごとに発生しうる failure を異常系へ |
| Phase 7 | AC × runbook step マッピング |
| Phase 9 | step 7 CI workflow yml の secret hygiene 確認 |
| 下流 09a / 09b | CI workflow を release runbook へ |

## 7. 多角的チェック観点

- 不変条件 **#1**: msw handler に `extraFields` を含む応答を必ず 1 件用意（runbook Step 3）
- 不変条件 **#2**: zod enum で `responseEmail` を fields に含めない（contract / type 双方）
- 不変条件 **#5**: authz spec を 1 ファイル集約、9 マトリクス維持（Step 6）
- 不変条件 **#6**: lint test を CI で必須実行（Step 7）
- 不変条件 **#7**: deleted_members fixture を seed に含める（Step 3）
- 不変条件 **#11**: profile 編集 path 404 contract（Step 4）
- a11y: 本 task UI なし（08b 担当）
- 無料枠: in-memory sqlite + 単 process で CI 5 min 以内

## 8. 完了条件チェック

- [x] runbook 7 step（runbook.md）
- [x] vitest.config / helpers / CI yml placeholder（runbook.md）
- [x] 5 suite test signature 集約（test-signatures.md）
- [x] sanity check 4 コマンド（§5）

## 9. 次 Phase への引き継ぎ

- runbook step ごとの failure（例: msw が intercept できない / sqlite が D1 固有 SQL を解釈できない）を Phase 6 異常系の検証対象に
- Phase 4 補強リスト 16 項目を Phase 7 AC matrix の trace 行に変換
