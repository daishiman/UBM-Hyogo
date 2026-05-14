# Phase 2: アーキテクチャ設計

## 目的

vitest の **config 分割 vs projects 機能** を技術選定し、CI 並列化戦略を確定する。

## 設計選択肢

### A. 2 物理 config（`vitest.config.ts` + `vitest.d1.config.ts`）

- メリット: 既存 config への影響最小。coverage v8 reporter が config ごとに独立して動き merge しやすい。
- デメリット: 設定の重複が多少発生（array merge drift を避けるため必要箇所は明示再構成）。

### B. vitest projects 機能（単一 config に `test.projects` を定義）

- メリット: 設定を一元化できる。
- デメリット: coverage v8 と projects の組み合わせで `coverage-final.json` が project 単位で分割される事例があり、`scripts/coverage-merge.mjs` の実装が複雑化する可能性。Vitest 2.1 系のドキュメントを確認のうえ判断。

## 採用方針

**A を採用**（保守性・既存影響最小・coverage merge の確実性を優先）。

`vitest.d1.config.ts` は `mergeConfig` を使わず、plugin / resolve / optimizeDeps を明示再構成し、base config から coverage 設定だけを再利用する:

- `test.include`: D1 依存 test の glob のみ
- `test.pool`: `'forks'`
- `test.poolOptions.forks.singleFork`: `true`
- coverage の `reportsDirectory` を group ごとに分ける（CI 集約用）

## CI 並列化アーキテクチャ

```
                            ┌───────────────────────┐
                            │ coverage-gate-shard    │
                            └───────────┬───────────┘
        ┌───────────────┬──────────────┼──────────────┬─────────────┐
        ▼               ▼              ▼              ▼             ▼
   ┌─────────┐    ┌───────────┐   ┌──────────┐  ┌──────────┐
   │  web    │    │ api-unit  │   │  api-d1  │  │ packages │
   └────┬────┘    └─────┬─────┘   └────┬─────┘  └────┬─────┘
        │ artifact      │ artifact     │ artifact    │ artifact
        ▼               ▼              ▼             ▼
                ┌─────────────────────────────┐
                │ coverage-gate (aggregate)   │
                │  - download all artifacts   │
                │  - run coverage-merge.mjs   │
                │  - coverage-guard.sh --no-run│
                └─────────────────────────────┘
```

## artifact 命名

- `coverage-web` / `coverage-api-unit` / `coverage-api-d1` / `coverage-packages`
- aggregate job は `actions/download-artifact@v4` で `coverage-*` を全 download

## 完了条件

- 採用方針が確定
- CI 並列化アーキ図がある
- artifact 命名規則が確定
