# Phase 3 — 設計レビュー

## 1. Review Verdict

GO。既存 API contract を広げずに `/members` の情報密度を改善する方針は妥当。

## 2. 確認観点

| 観点 | 判定 |
| --- | --- |
| API / DB 影響 | なし |
| list density | `MemberTable` branch を撤去し、`MemberGrid` + `MemberCard density="list"` に統一 |
| 情報設計 | current list fields のみ使用 |
| visual evidence | Playwright spec はあり、screenshot は pending_runtime として明示 |

## 3. 指摘と対応

| 指摘 | 対応 |
| --- | --- |
| prototype 由来の `businessOverview` / `tags` を要求すると API scope が膨らむ | 明示的に scope-out |
| list header と row DOM の列数がずれると visual review が難しい | `MemberCard density="list"` を 5 col row に分岐 |
| `TagPicker` heading slot が nested `data-role` になりやすい | heading は string として渡す |

## 4. DoD

- [x] 実装境界が current contract と整合
- [x] route branch が `MemberGrid` に一本化
- [x] Phase 11 pending が成功扱いになっていない
