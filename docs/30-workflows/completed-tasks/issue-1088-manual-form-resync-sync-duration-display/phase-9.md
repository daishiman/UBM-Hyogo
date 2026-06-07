**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 9 — 品質保証

## 目的

issue #1088 の durationMs 実装（backend `apps/api` + frontend `apps/web` 両輪）に対し、型チェック・lint・デザイントークン・プロジェクト不変条件を一括判定し、PASS 基準を満たすことを証跡として残す。

## 9.1 ローカル検証コマンド（Node 24 を確実に使うため `mise exec --` 経由）

### typecheck

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

### lint

```bash
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/web lint
# 違反が出た場合のみ fix を試す
mise exec -- pnpm --filter @ubm-hyogo/web lint --fix
```

### design-token（HEX 直書き 0 件）

本タスクは色を扱わない（数値テキスト行の追加）が、不変条件として変更ファイルに HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` が混入していないことを確認する。

```bash
# 変更3ファイルに HEX 直書き・任意色クラスが無いこと（0件期待）
grep -nE '#[0-9a-fA-F]{3,8}\b|(bg|text|border)-\[#' \
  apps/api/src/jobs/sync-forms-responses.ts \
  apps/web/src/features/admin/diagnostics/manual-sync.ts \
  apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx
```

> UI 行は既存 `<dt>` / `<dd>` の `var(--ubm-color-...)` トークンクラスをそのまま継承し、新規の色指定を一切追加しない（既存 `resultRows().map(...)` の描画ループに durationMs 行が乗るだけ）。

## 9.2 不変条件の判定

| 不変条件 | 判定方法 | PASS 基準 |
|---------|---------|-----------|
| **D1 アクセスは `apps/api` 限定** | `apps/web` 変更2ファイル（`manual-sync.ts` / `ManualFormResyncPanel.client.tsx`）に D1 binding 参照が無いこと | `grep -n 'env.DB\|D1Database' apps/web/src/features/admin/diagnostics/manual-sync.ts apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` が **0 件**。durationMs は backend → API JSON → web proxy → schema parse の既存経路で伝搬し、web から D1 へ直接触らない |
| **計時は `apps/api` に閉包** | durationMs の算出（`now().getTime()` 計時）が `apps/api/src/jobs/sync-forms-responses.ts` 内のみで行われ、`apps/web` 側は受信した値を表示するだけであること | web 側に計時ロジック（`Date.now()` / `performance.now()` による所要時間算出）が無い |
| **schema `.strict()` 維持** | `SyncResultSchema` に `.strict()` が残存し、durationMs は `.optional()` 追加であること | `grep -n '.strict()' apps/web/src/features/admin/diagnostics/manual-sync.ts` がヒットし、`durationMs: z.number().int().nonnegative().optional()` が存在 |
| **union 退化なし** | `SyncRunResponseSchema`（ok:true / ok:false の union）が durationMs 追加後も両分岐を保持していること | `manual-sync.ts` の `z.union([...])` 構造が不変 |
| **route 素通し維持** | `apps/api/src/routes/admin/responses-sync.ts` が `runResponseSync()` の result を変更せず素通しすること（変更不要） | `responses-sync.ts` の diff が 0 行（このファイルは触らない） |
| **env アクセサ経由（apps/web）** | web 変更が `process.env.*` 直参照を増やさないこと | `grep -n 'process.env' apps/web/src/features/admin/diagnostics/manual-sync.ts apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` が増分 0 件 |
| **新規 test ファイルの suffix** | 追加テストが `*.spec.{ts,tsx}` のみであること（`*.test.*` 禁止） | 追加ファイルが `*.spec.ts` / `*.spec.tsx` のみ |

## 9.3 一括判定スクリプト（参考）

```bash
set -e
# 1) 型
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
# 2) lint
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/web lint
# 3) HEX 0件（出力が空であること）
grep -nE '#[0-9a-fA-F]{3,8}\b|(bg|text|border)-\[#' \
  apps/api/src/jobs/sync-forms-responses.ts \
  apps/web/src/features/admin/diagnostics/manual-sync.ts \
  apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx || echo "HEX: 0 件 (PASS)"
# 4) apps/web に D1 直参照が無いこと（出力が空であること）
grep -n 'env.DB\|D1Database' \
  apps/web/src/features/admin/diagnostics/manual-sync.ts \
  apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx || echo "web→D1: 0 件 (PASS)"
```

## 9.4 PASS 基準サマリ

| 検証 | PASS 基準 |
|------|-----------|
| api typecheck | exit 0・型エラー 0 |
| web typecheck | exit 0・型エラー 0 |
| api lint | exit 0・違反 0 |
| web lint | exit 0・違反 0 |
| HEX 直書き | grep 0 件 |
| web → D1 直参照 | grep 0 件（増分なし） |
| `.strict()` 維持 | ヒットあり |
| route 素通し | `responses-sync.ts` diff 0 行 |

## 完了条件（Phase 9 DoD）

- [ ] api / web の typecheck が exit 0。
- [ ] api / web の lint が exit 0（必要なら `--fix` 後に再確認）。
- [ ] 変更3ファイルに HEX 直書き 0 件。
- [ ] `apps/web` 変更に D1 直接アクセスが無い（計時は `apps/api` 閉包）。
- [ ] `SyncResultSchema` の `.strict()` 維持・`durationMs` は optional 追加・union 退化なしを確認。
- [ ] `responses-sync.ts` を変更していない（route 素通し維持）。
- [ ] 追加テストが `*.spec.{ts,tsx}` のみ。
