# Phase 8 成果物 — DRY 化

## 状態
- 実行済（2026-05-01）

## 共通化対象と判断

| 候補 | DRY 化判定 | 理由 |
| --- | --- | --- |
| tsconfig.build.json の exclude pattern を packages 配下にも展開 | 見送り | apps/web は Next.js / open-next のビルドが別経路。本タスクは apps/api scope に限定（不変条件 #6 が触れる dev fixture は apps/api のみ）。 |
| dep-cruiser `no-prod-to-fixtures-or-tests` を packages にも適用 | 適用済 | rule の `from.path` を `^(apps|packages)/.+/src/` で表現済 — apps だけでなく packages でも同じ境界が効く。 |
| tsconfig.build.json を packages 共通テンプレ化 | 見送り | 各 app / package のビルド戦略が異なる（apps/web は OpenNext、apps/api は wrangler、packages は tsc）。早すぎる抽象化を避ける。 |

## 重複排除の現状

- 旧 dep-cruiser は `__tests__|__fixtures__|_shared` の３つを exclude で一括していた。
  本タスクで `__tests__` / `__fixtures__` を exclude から外し、専用 forbidden rule に
  単一化（重複ロジック解消）。
- build script は production typecheck 専用に分離。`typecheck` / `lint` / `build` の責務
  が明示的に分かれた。
