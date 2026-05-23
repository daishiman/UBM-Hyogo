# Phase 3 — vitest 並列度制御 / pool / shard 設計

## 目的

EADDRNOTAVAIL 再現時の triage matrix を「1 因子ずつ切り分け」で確定するため、軸候補と各軸の取り得る値を Phase 3 で固定する。

## 入力 / 前提

- 現行 `vitest.config.ts` の `pool` / `poolOptions`
- vitest docs（pool=threads / forks / vmThreads / vmForks）
- Miniflare instance 数（test 数 × describe 数 × beforeAll/afterAll の生成タイミング）依存

## 手順

1. 軸候補を以下で確定する:

   | 軸 | 値候補 | ねらい |
   | --- | --- | --- |
   | A. `pool` | `threads`（baseline） / `forks` / `vmThreads` | プロセス分離による socket pool の独立 |
   | B. CLI worker cap | `--maxWorkers=1 --minWorkers=1`, `--maxWorkers=2 --minWorkers=1`, default | Miniflare instance 同時数の上限制御。Vitest help に出る CLI を優先し、config patch は最後に検討 |
   | C. `--no-file-parallelism` | on / off | ファイル単位の直列化 |
   | D. `--shard` | `1/2`, `2/2` | 2 分割で port pressure を半減 |
   | E. test grouping | D1 を使う test を別 project に分離 | Miniflare reuse 戦略の影響切り分け |

2. matrix 実行順序を「単純→複雑」で固定する:
   1. baseline rerun（無変更で 3 回）
   2. 軸 B: `--maxWorkers=1 --minWorkers=1`
   3. 軸 A: `pool=forks`
   4. 軸 C: `--no-file-parallelism`
   5. 軸 D: `--shard=1/2` と `--shard=2/2`
   6. 軸 E: 採用は最後（影響範囲大）

3. 各 matrix run の停止条件: 「rerun PASS」が得られた時点で以降の軸を停止し、最小侵襲で採用する。
4. Phase 5 で patch 化する場合の優先順位: B → A → C → D。E（test grouping）は調査結果として記録し、恒久 grouping は別 task にしないと責務が膨らむ場合だけ Phase 12 でエスカレーションする。

## 成果物

- `outputs/phase-03/main.md`（matrix 軸表 + 実行順序 + 停止条件 + 採用優先度）

## 検証コマンド

```bash
mise exec -- pnpm vitest --help | head -50
cat vitest.config.ts
```

## 完了条件（DoD）

- [ ] 軸 A〜E の値候補と意図が表で記録されている。
- [ ] matrix 実行順序と停止条件が再現可能に書かれている。
- [ ] 採用優先度（侵襲度順）が決まっている。
