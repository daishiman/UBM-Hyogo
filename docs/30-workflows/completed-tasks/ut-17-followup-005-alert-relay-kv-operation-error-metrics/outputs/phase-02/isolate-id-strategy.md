# Phase 2 成果物: isolateId 採番戦略

## Workers isolate ライフサイクル前提

Cloudflare Workers の実行モデル:

- 1 つの isolate (V8 context) が 複数 request にまたがって再利用される
- isolate はメモリ圧迫 / バージョン deploy / 長時間アイドルで破棄され、新規 isolate が起動
- module top-level 文は isolate 起動時に **1 度だけ評価** される

## 採用設計

```ts
// alert-relay.ts のモジュール top-level
const isolateId = crypto.randomUUID();
```

- isolate 起動時に **1 回** 採番される
- 同一 isolate 内の全 `logKvOperationError` 呼び出しが同じ `isolateId` を共有
- 別 isolate（別 V8 context）では別 UUID
- request ごとの採番ではないため、複数 request 跨ぎの相関が取れる

## 代替案検討

| 案 | 評価 | 不採用理由 |
| --- | --- | --- |
| request 単位採番 | × | isolate 内相関不能、emit ごとに別 UUID で集約困難 |
| `env.ISOLATE_ID` binding | × | Workers で isolate 単位の binding 分離は不可（実装不能） |
| `globalThis` への遅延セット | △ | module top と意味的に同じだが、可読性で module top が優位 |
| `Date.now()` ベース | × | 同時刻起動の isolate が衝突しうる。UUID の方が安全 |

## Runbook 解釈ガイド

- **同一 `isolateId` で連続 emit**: isolate 単位の偏った KV エラー（例: 特定 colo の KV replica drift）を疑う
- **異なる `isolateId` で分散 emit**: グローバル KV 一時障害を疑う
- isolate ID 自体は無作為 UUID で識別子としての継続性なし（deploy 跨ぎで全て変わる）
- 障害は **時間窓 + ID 多様性** の 2 軸で評価する

## テスト assertion 方針

`alert-relay.spec.ts` の TC-LOG-04 で「同一テスト実行内の 2 emit が同じ `isolateId`」を assertion 化。テストは 1 module load = 1 isolate 相当の前提で評価する（vitest worker 内）。
