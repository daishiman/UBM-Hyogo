# Phase 11 before/after evidence

## Status

`runtime_partial` — ローカル apps/api unit shard 計測済 / d1 / web / packages / CI matrix wall-clock は実装 PR push 後計測予定。

## ローカル実測 (2026-05-11)

| Metric | Value | Source |
| --- | --- | --- |
| `apps/api test:coverage:unit` wall-clock | 678.65s (1 ファイル transform timeout で fail、44 件中 43 PASS / 240 tests 全件 PASS) | local vitest run (default threads) |
| `apps/api test:coverage:d1` wall-clock | runtime_pending | local 計測予定 |
| `apps/web test:coverage:web` wall-clock | runtime_pending | local 計測予定 |
| `packages/*` test:coverage wall-clock | runtime_pending | local 計測予定 |
| Disjoint 検証 | PASS (unit=44, d1=94, union=138, intersection=0) | `vitest list` ベース |

## 既知 issue (ローカル unit 実行で観測)

- `apps/api/src/notification-mail-config.spec.ts` の suite import が
  `Timeout calling "fetch" with "/packages/shared/src/types/auth.ts","ssr"` で fail。
  これは Vite SSR transform の fetch timeout 由来で、既存 `test:coverage` (`--maxWorkers=1`) の
  serial 化で抑制されていた可能性が高い。assertion 自体は全件 PASS (240/240) のため
  本 split による logical regression ではないが、unit group は thread pool で並列化するため
  顕在化する。フォローアップ手段:
  - 同サイクル対応: `test:coverage:unit` script に `--maxWorkers=1 --minWorkers=1` を付与し、CI shard failure を避ける
  - 恒久対応: 当該 spec が import するモジュール chain を整理し SSR transform を不要にする
  - 別タスク化: 不要。本サイクルで暫定回避を実コードへ反映済み

## CI matrix wall-clock (取得手順)

実装 PR 作成・CI 実行後に以下で取得:

```bash
# before: 現行 single coverage-gate (本 PR 直前の dev)
gh run list --workflow ci.yml --branch dev --limit 5 \
  --json databaseId,createdAt,updatedAt,conclusion,jobs

# after: 本 PR 上の matrix run
gh run view <RUN_ID> --json jobs \
  | jq '.jobs[] | select(.name | startswith("coverage-gate")) | {name, startedAt, completedAt}'
```

## 期待される結果 (要更新フィールド)

| Metric | Before (TBD) | After (TBD) | 短縮率目標 |
| --- | --- | --- | --- |
| CI `coverage-gate` wall-clock | TBD | matrix 最大 + aggregate | ≥30% 短縮目標 |
| CI total wall-clock | TBD | TBD | ≥20% 短縮目標 |
| billed minutes | TBD | TBD | ±0 〜 増加可 (並列で billed 自体は微増もありえる) |
| `apps/api` coverage pct (merge 後) | ≥80% | ≥80% | 維持 |
| `apps/web` coverage pct | ≥80% | ≥80% | 維持 |
| packages coverage pct | ≥80% | ≥80% | 維持 |
| port exhaustion grep hits | 0 件 | 0 件 (必須) | 維持 |

## 完了条件

- [ ] 実装 PR push 後の CI run で matrix wall-clock 取得
- [ ] before/after を上記表に書き込み
- [x] ローカル disjoint 検証 PASS
- [ ] 短縮率を算出し DoD 達成判定
- [ ] port exhaustion 検出が 0 件であることを CI shard log で grep 確認
