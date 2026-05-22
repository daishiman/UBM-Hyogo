# Phase 3: 設計レビューゲート

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 3 |
| 名称 | 設計レビューゲート |
| 依存Phase | Phase 1, Phase 2 |
| 次Phase | Phase 4 |

## 目的

Phase 2 の統合設計が、既存 UI baseline と task-10 契約を同時に満たすかを判定する。

## 実行タスク

- Task 3-1: Phase 1 の AC-1〜AC-10 と Phase 2 C/M/R 表を照合する。
- Task 3-2: 既存 export 破壊リスクを MAJOR 条件として確認する。
- Task 3-3: token / a11y / RSC 境界を review matrix で確認する。
- Task 3-4: Phase 4 contract RED に進めるか判定する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | AC |
| Phase 2 | `phase-02.md` | C/M/R |
| Phase 4 | `phase-04.md` | RED tests |

## 実行手順

| 観点 | PASS 条件 | MAJOR 条件 |
| --- | --- | --- |
| API 互換 | 既存 export が残る | 既存 export 削除 |
| task-10 契約 | 11 primitive が barrel から import 可能 | 直接 import 前提 |
| RSC 境界 | client component は Sidebar / 既存 interactive primitives に限定 | server component 汚染 |
| token | OKLch utility / CSS var のみ | HEX 直書き |
| tests | contract RED が現行不足を検出 | import error のみを RED と誤認 |

## 統合テスト連携

Phase 3 ではテストを実行せず、Phase 4 の contract test matrix へ GO / NO-GO を渡す。coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% は Phase 7 以降の gate として維持する。

## 多角的チェック観点（AIが判断）

| 条件 | 判定観点 |
| --- | --- |
| 矛盾なし | 既存 15 primitive baseline と task-10 11 primitive 契約が共存する |
| 漏れなし | C/M/R 表に全 current export と不足 export がある |
| 整合性あり | PascalCase file naming と barrel import を統一する |
| 依存関係整合 | task-11..17 が task-10 完了後に進める |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| review matrix | `outputs/phase-03/main.md` |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 3 main | `outputs/phase-03/main.md` |

## 完了条件

- [ ] PASS / MINOR / MAJOR の判定を記録している。
- [ ] MAJOR がある場合は Phase 2 へ戻す。
- [ ] PASS の場合のみ Phase 4 へ進む。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を Phase 7 へ引き継いでいる。

## タスク100%実行確認【必須】

- [ ] Task 3-1 完了
- [ ] Task 3-2 完了
- [ ] Task 3-3 完了
- [ ] Task 3-4 完了

## 次Phase

Phase 4 で contract tests を作成し RED を確認する。
