# Phase 7: カバレッジ確認

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 6: [`phase-6-test-additions.md`](./phase-6-test-additions.md)

---

## 1. 計測対象

| パッケージ | ファイル | 目標 |
|----------|---------|------|
| `@ubm-hyogo/shared` | `src/zod/sync-log.ts` | line / branch / function 100% |
| `@ubm-hyogo/api` | `src/sync/audit.ts` / `manual.ts` / `scheduled.ts` / `backfill.ts` | 既存比 ±0pt（regression なし） |

---

## 2. 実行コマンド

```bash
# shared 単体
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --coverage

# apps/api 全体（既存比較用）
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage
```

vitest の coverage 出力 (`packages/shared/coverage/coverage-summary.json` / text summary) を参照する。

---

## 3. 期待カバレッジ値

### 3.1 `packages/shared/src/zod/sync-log.ts`

| metric | 期待 | 根拠 |
|--------|-----|------|
| Lines | 100% | 純粋な schema 定義のみで分岐なし |
| Statements | 100% | 同上 |
| Branches | 100%（branch なし = 0/0） | enum / object schema は branch を持たない |
| Functions | 100%（function なし = 0/0） | export のみ |

> vitest が `0/0 = 100%` と表示するか `N/A` と表示するかは設定依存。`N/A` の場合は line / statement カバレッジを採用。

### 3.2 `apps/api/src/sync/` 既存ファイル

Phase 5 改修後は `lockTriggerOf` 関数 1 つが削除されるため、test 計算上の denominator が減る。既存 contract spec の expectation を canonical 値に置換することで coverage は保持される。

| ファイル | 改修前比 | 確認 |
|---------|--------|------|
| `audit.ts` | -1 関数（`lockTriggerOf` 削除） | line coverage は±0pt または微増 |
| `manual.ts` | ±0 | 行数変化なし |
| `scheduled.ts` | ±0 | 文字列置換のみ |
| `backfill.ts` | ±0 | 変更なし |

---

## 4. 判定基準

| 判定 | 条件 |
|------|------|
| GO（Phase 8 進行） | `sync-log.ts` が line ≥ 100%（branch / function は N/A 許容） かつ apps/api regression なし |
| HOLD（Phase 6 へ戻り） | `sync-log.ts` line < 100%（test 抜け） |
| HOLD（実装見直し） | apps/api 既存 line coverage が改修前比 -5pt 以上低下 |

### 4.1 line < 100% が出た場合の対応

未到達 line を `vitest --coverage` の line annotation で特定し、Phase 6 §2 のテストケースを補強。基本的に schema 定義のみのため未到達はゼロを想定。

### 4.2 evidence 保存

`outputs/phase-11/` に `coverage-shared.log` として保存する（Phase 11 evidence と統合）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --coverage \
  > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/coverage-shared.log 2>&1
```

---

## 5. Phase 7 DoD

- [ ] `pnpm --filter @ubm-hyogo/shared test -- --coverage` の `sync-log.ts` line coverage = 100%
- [ ] `apps/api/src/sync/**` の line coverage が改修前比 -5pt 以下に収まる
- [ ] `outputs/phase-11/coverage-shared.log` に summary 保存
