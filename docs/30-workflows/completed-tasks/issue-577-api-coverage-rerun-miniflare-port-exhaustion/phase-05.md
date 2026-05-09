# Phase 5 —（該当時）`vitest.config.ts` patch 実装スケルトン

## 目的

Phase 3 matrix で採用された軸を、必要な場合だけ root `vitest.config.ts` または `apps/api/package.json` に最小差分で patch する仕様を固定する。本 Phase は「triage 採用」確定後にのみ Phase 11 で実行する。no-code verification close-out 時はスキップ。

## 入力 / 前提

- Phase 3 で確定した採用軸（B / A / C / D いずれか 1 つ。E は調査結果のみ）
- 現行 root `vitest.config.ts`

## 想定変更ファイル

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `vitest.config.ts` | 編集（条件付） | 恒久採用が必要な場合のみ、既存 `test` object を保持したまま `test.pool` / worker 上限 / `test.fileParallelism` のいずれかを最小差分で追加 |
| `apps/api/package.json` | 編集（条件付） | `test:coverage` script に shard / pool / worker flag を持たせる場合 |

## 手順

1. 採用軸が B（`--maxWorkers=1 --minWorkers=1`）の場合の patch スケルトン:
   ```ts
   // vitest.config.ts (excerpt)
   export default defineConfig({
     test: {
       // Keep existing environment / include / timeout / coverage settings and add only worker cap.
       maxWorkers: 1,
       minWorkers: 1,
     },
   });
   ```
2. 採用軸が A（`pool=forks`）の場合の patch スケルトン:
   ```ts
   export default defineConfig({
     test: {
       pool: 'forks',
       poolOptions: {
         forks: { singleFork: false },
       },
     },
   });
   ```
3. 採用軸が C（`--no-file-parallelism`）の場合の patch スケルトン:
   ```ts
   export default defineConfig({
     test: { fileParallelism: false },
   });
   ```
4. patch 適用前に既存 config の他フィールドへの副作用がないことを `mise exec -- pnpm typecheck` と `mise exec -- pnpm lint` で確認する。

## 関数 / 型シグネチャ

- `defineConfig({ test: UserConfig['test'] })` の既存 `test` object を保持し、`pool` / worker cap / `fileParallelism` を追加するのみ。既存の `environment` / `coverage` / `include` / `timeout` を落とさない。新規 export なし。

## 成果物

- `outputs/phase-05/main.md`（採用軸ごとの patch スケルトン + 影響評価）

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage 2>&1 | tail -50
```

## 完了条件（DoD）

- [ ] 採用軸に対応する patch スケルトンが本 Phase output に記述されている。
- [ ] typecheck / lint が green。
- [ ] patch 適用後の rerun で PASS が得られている（Phase 11 で確定）。
