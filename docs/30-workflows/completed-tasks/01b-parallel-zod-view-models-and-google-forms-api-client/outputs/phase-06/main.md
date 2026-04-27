# Phase 6: 異常系検証 — 成果物

> 仕様書: `phase-06.md` を再構成した最終版。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| Phase | 6 / 13 |
| 上流 | Phase 5（実装ランブック） |
| 下流 | Phase 7（AC マトリクス） |
| 状態 | done |

## 2. 目的

型 / zod / Forms client / ESLint の **異常系 18 ケース** を列挙し、各ケースで test と挙動を確定する。不変条件 #1/#2/#3/#5/#6/#7 のうち trigger される項目を明示する。

## 3. 18 異常系ケースサマリ

| レイヤ | ケース数 |
| --- | --- |
| 型レイヤ | 5 |
| zod レイヤ | 7 |
| Forms client レイヤ | 4 |
| ESLint / boundary レイヤ | 2 |
| **合計** | **18** |

> 詳細は `failure-modes.md` を参照。

## 4. 不変条件 trigger summary

| 不変条件 | trigger ケース |
| --- | --- |
| #1（schema 抽象） | 1, 2, 4, 6, 11 |
| #2（consent キー統一） | 9, 10 |
| #3（responseEmail system field） | 3, 7 |
| #4（admin-managed 分離） | 5 |
| #5（D1 / boundary） | 14, 15, 16, 17, 18 |
| #6（GAS prototype 非昇格） | 12 |
| #7（branded distinct） | 1, 8 |

## 5. 完了確認

- [x] 18 case + 期待挙動 + 不変条件 trigger 確定
- [x] failure-modes.md 配置

## 6. 実装結果（テスト反映）

- 18 case のうち type レイヤ 5 件は tsc strict で検出。
- zod レイヤ 7 件は vitest（130 件中の一部）で検出。
- Forms client レイヤ 4 件は fetch mock で検出（backoff / token refresh / max retry）。
- boundary レイヤ 2 件は `scripts/lint-boundaries.mjs` で検出。
- 全件 PASS（期待通りの failure / error を返すことを確認）。
