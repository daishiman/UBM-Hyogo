# Phase 4: タスク分解 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 4 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

`09a-prototype-map.md` を 7 章の単位で SRP に分解し、依存関係（§2 → §3 → §6, §5 ← phase-3 §3）を確定する。

## 実行タスク

1. 章単位でサブタスクを定義する（T1〜T7）。
2. 依存関係 DAG を確定する。
3. 並列実行可能なサブタスクを識別する。

## サブタスク DAG

```
T1 §1 位置づけ                  (independent)
T2 §2 primitives mapping        (independent)
T3 §3 routes mapping            (depends T2: 主 component 列で primitives 名を参照)
T4 §4 shell / chrome mapping    (independent)
T5 §5 派生ルール 5.1〜5.8        (depends T3: derivation-rule 列との対応)
T6 §6 行範囲台帳                 (depends T2, T3, T4: 全 line range を集約)
T7 §7 改訂履歴                   (last)
```

並列可能: T1 / T2 / T4 を最初に実行、その後 T3 → T5 → T6 → T7。

## 参照資料

- task-07 §4.1〜§4.6
- Phase 2/3 outputs

## 依存 Phase 成果物参照

- Phase 1: outputs/phase-01/main.md
- Phase 2: outputs/phase-02/main.md
- Phase 3: outputs/phase-03/main.md

## 実行手順

- 各サブタスクの所要時間目安を outputs/phase-04/main.md に記録する。
- 章ごとの担当（全て Tech Writer 単独）を確認。

## 多角的チェック観点

- T3 の主 component 列が T2 で定義した primitive 名を参照すること（命名一貫性）
- T6 の行範囲が T2 / T3 / T4 全てを集約していること
- T5 の文末に「新規 primitive を生やさない」段落が必ず付くこと

## サブタスク管理

- [ ] T1 §1 位置づけ
- [ ] T2 §2 primitives 13 row
- [ ] T3 §3 routes 19 row
- [ ] T4 §4 shell 4-6 row
- [ ] T5 §5 派生ルール 8 パターン
- [ ] T6 §6 行範囲台帳 25+ row
- [ ] T7 §7 改訂履歴

## 成果物

- outputs/phase-04/main.md

## 完了条件

- [ ] サブタスク T1〜T7 が定義される
- [ ] 依存関係 DAG が記録される
- [ ] 並列可能なサブタスクが識別される

## 次 Phase への引き渡し

Phase 5 へ、サブタスク T1〜T7 と DAG を実装計画入力として渡す。
