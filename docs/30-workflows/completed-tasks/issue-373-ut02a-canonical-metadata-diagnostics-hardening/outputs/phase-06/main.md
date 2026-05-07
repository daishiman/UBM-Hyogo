# Phase 6: 異常系検証 — 実行結果

| シナリオ | 検証結果 |
|---------|---------|
| sourceSpecHash drift (tmp spec に末尾追記) | `{ ok: false, reason: "sourceSpecHashDrift", expected, actual }` を返し exit 1 |
| missingSourceSpec (存在しないパス) | `{ ok: false, reason: "missingSourceSpec", path }` |
| invalidSchema (sourceSpecHash 欠落 manifest) | `{ ok: false, reason: "invalidSchema", details }` |
| determinism 違反シミュレーション | 2 連続実行で `Buffer.compare = 0` を維持 |
| adapter dryRun failure | `{ ok: false, reason: "no_alias_found" }` を resolver が伝搬 |

全シナリオが期待通りの結果を返すことをテストで自動検証。
