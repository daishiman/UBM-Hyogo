# Phase 12 / Task 12-5: スキルフィードバックレポート

`[実装区分: 実装完了]` / `workflow_state: implemented_local_evidence_captured`

## 1. テンプレート改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| 親保持データの optional 注入による表示名解決 | 子 component が ID しか持たない結果を表示する際、親が保持する list から `Record<id, {fullName}>` を `useMemo` 構築して optional prop 注入すると、API contract を膨らませず後方互換に表示名解決できる | 既存 Phase 2 設計観点で吸収可能。新規 skill 変更は no-op |
| nullish fallback による後方互換表示 | `membersById?.[id]?.fullName ?? id` / `map.get(id) ?? \`${id}（未登録）\`` で表示名未解決でも UI が壊れない | 既存 lessons の「後方互換 UI 拡張」観点で十分。新規ルール化は no-op |

## 2. ワークフロー改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| implementation target 明確時の same-wave close-out | 当初 spec-only だったが、CONST_004/005 と既存 skill rule に従い同一サイクルで実コード・focused test・Phase 11/12・aiworkflow sync まで昇格した | 既存 implementation target physical existence gate で十分 |
| VISUAL two-tier evidence | local component evidence と local screenshot は present、staging authenticated screenshot は optional pending（user-gated）と分離することで false green を避けた | 既存 two-tier evidence rule で十分 |
| PII 最小化 | docs 初期案の `responseEmail` 供給を撤回し、実装は `fullName` のみにした | 新規 rule 不要。今回 inventory に実例として残す |

## 3. ドキュメント改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| identifier drift 防止 | docs を `fullName` only / `Map#get` / TC-BAB-TAG-06/07 / screenshots path に統一した | 現行 W1-02b-3 ルールで十分 |
| stale state grep | 古い状態語彙の残存は implemented local close-out の最大リスク | compliance の stale-reference gate で確認する |

## 総括

SKILL.md 本体へ昇格すべき新ルールは検出されなかった。既存の implementation target physical existence gate、same-wave sync rule、VISUAL two-tier evidence rule で今回の改善を説明できる。
