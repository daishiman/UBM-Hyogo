# Phase 9: 品質保証 — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## 1. 品質ゲート判定方針

| ゲート | 判定方針 | 合格基準 |
| --- | --- | --- |
| line budget | 変更は `server-fetch.ts`（class 追加 + error path 置換）/ `safe-fetch.ts`（helper 抽出）/ spec 2 ファイル。class + guard で純増 ~25 行、helper 抽出は net ほぼ中立。新規 spec ファイルはテストのため budget 対象外。1 ファイルの過大肥大なし | 変更後も各実装ファイルが既存の責務範囲内に収まり、無関係な肥大が無いこと |
| lint | `mise exec -- pnpm lint`。boundary lint（`lint-boundaries.mjs`）で `safe-fetch.ts` → admin import が検出されないこと | violation 0 |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`。`AdminFetchError` の `readonly` フィールド・type predicate（`error is AdminFetchError`）・`statusFromError` 戻り値（`number \| null`）が型整合 | error 0 |

## 2. 旧 throw 削除確認（FB-UI-02-1）

リファクタリング後、旧形式の untyped throw が live コードに残らないことを grep で証跡化する。

```bash
# 期待: 0 件（旧 untyped throw が live で残らない）
grep -rn "throw new Error(\`admin api" apps/web/src/lib/admin/server-fetch.ts
```

| 確認 | コマンド | 期待 |
| --- | --- | --- |
| 旧 untyped throw 削除 | `grep -rn "throw new Error(\`admin api" apps/web/src/lib/admin/server-fetch.ts` | **0 件** |
| 新 typed throw 存在 | `grep -rn "throw new AdminFetchError" apps/web/src/lib/admin/server-fetch.ts` | 1 件 |
| 共通層に admin import なし | `grep -rn "AdminFetchError\|admin/server-fetch" apps/web/src/lib/server-fetch/safe-fetch.ts` | 0 件 |

> 実装後確認: 旧 `throw new Error(\`admin api` は 0 件。typed `throw new AdminFetchError` へ置換済み。

## 3. mirror parity

本タスクは **skill 変更を伴わない**（aiworkflow / task-spec-creator の references 改変なし）。workflow doc（本ディレクトリ配下）のみの追加・修正であり、root / completed-tasks の二重 mirror も発生しない。
よって **mirror parity チェックは N/A**。Phase 12 の `indexes:rebuild` drift gate も skill index に影響しないため No-op。

## 4. 検証コマンド（focused / メモリ制約対策）

全件 `pnpm test` は避け、focused に実行する。

```bash
# typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# lint（boundary lint 込み）
mise exec -- pnpm lint

# focused vitest（新規 + regression 5）
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts \
  apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts \
  apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts
```

## 5. 完了条件（Phase 9）

- [ ] line budget 判定 OK（無関係な肥大なし）
- [ ] `pnpm lint` violation 0（boundary lint で共通層 → admin import が検出されない）
- [ ] `pnpm typecheck` error 0（`@ubm-hyogo/web`）
- [ ] 旧 untyped throw grep = 0 件 / 新 typed throw grep = 1 件（FB-UI-02-1 証跡）
- [ ] mirror parity = N/A を明記（skill 無変更）
- [ ] focused vitest（新規 + regression 5）green
