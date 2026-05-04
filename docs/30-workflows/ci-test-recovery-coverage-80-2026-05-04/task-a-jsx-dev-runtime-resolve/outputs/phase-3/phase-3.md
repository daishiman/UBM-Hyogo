# Phase 3: アーキテクチャ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-04 |
| 依存 Phase | Phase 1 / Phase 2 |

## 目的

Phase 1 / 2 の確定事項を踏まえ、PASS / MINOR / MAJOR 戻り先と Phase 4 開始条件 / Phase 13 blocked 条件、simpler alternative 検討を Task A 単位で確定する。

## 実行タスク

- タスク 1: PASS / MINOR / MAJOR 判定基準の確定
- タスク 2: Phase 4 開始条件・Phase 13 blocked 条件の明示
- タスク 3: simpler alternative 検討記録（Task A スコープ）
- タスク 4: 後続 Task C への handoff 内容の確定

## 参照資料

| 参照資料 | パス |
| --- | --- |
| 親 wave Phase 3 | `../../../outputs/phase-3/phase-3-architecture.md` |
| Phase 1 | `../phase-1/phase-1.md` |
| Phase 2 | `../phase-2/phase-2.md` |

## 実行手順

### ステップ 1: PASS / MINOR / MAJOR 判定

| 判定 | 条件 | 戻り先 |
| --- | --- | --- |
| PASS | AC-A1〜AC-A6 全て満たす | Phase 4 へ進む |
| MINOR | jsx-dev-runtime 解決済だが build に warning 残存 | Phase 5 で warning 解消 |
| MAJOR | 案 1 単独で CI 上 jsx-dev-runtime 失敗が再発 | Phase 2 へ戻り Fallback（案 2 併用）採否を再評価 |

### ステップ 2: Phase 4 開始条件 / Phase 13 blocked 条件

- Phase 4 開始条件: Phase 1-3 完了 + apps/web 失敗 baseline log 取得済み
- Phase 13 blocked 条件:
  - CI で jsx-dev-runtime 失敗が再発
  - apps/web build / typecheck の新規 regression
  - apps/web の他 test が新規に環境エラーで止まる
  - user 明示承認が無い状態での commit / push / PR

### ステップ 3: simpler alternative 検討

| 案 | 採否 | 理由 |
| --- | --- | --- |
| jsx-dev-runtime 解決失敗 test を skip | ✗ | AC-A1 / AC-A2 違反 / Task C の baseline 不可 |
| apps/web の test runner を ts-node 等へ置換 | ✗ | scope 過大 |
| `react/jsx-dev-runtime` 直 import を行う test だけ alias | ✗ | 表面的 / vitest config の特例で複雑度増 |
| **案 1（root devDep 追加）** | ◎ | 最小スコープ・CI/local 統一・将来性 |

### ステップ 4: 後続 Task C への handoff

- Task C は本 Task の Phase 6 完了（apps/web vitest が test を collect でき coverage 計測まで成立する状態）を前提とする。
- Task A の Phase 11 evidence（特に `coverage-result.md`）を Task C の Phase 1 baseline 取得 input として再利用する。

## 統合テスト連携

Phase 6 で apps/web の既存統合テスト群が regression していないことを併せて検証する。

## 多角的チェック観点（AI が判断）

- 戦略系: 案 1 単独で CI が通らない場合、Fallback 採用判断は **wave-1 締め切り内** に行う（後送り禁止）
- 問題解決系: MAJOR 判定後の loop 上限を Phase 8 / Phase 9 で 2 回までと固定

## サブタスク管理

| サブタスク | owner | 完了条件 |
| --- | --- | --- |
| 戻り先確定 | Task A | 本セクション |
| 開始 / blocked 条件 | Task A | 本セクション |

## 成果物

- `outputs/phase-3/phase-3.md`（本ファイル）

## 完了条件

- [ ] PASS / MINOR / MAJOR 戻り先が記載
- [ ] Phase 4 開始条件と Phase 13 blocked 条件が記載
- [ ] simpler alternative 検討が記載
- [ ] coverage Statements/Branches/Functions/Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）を AC として明記
- [ ] `bash scripts/coverage-guard.sh` exit 0 を検証経路として明記

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（タスク 1-4）完了

## 次 Phase

Phase 4（テスト方針）— 新規 test ファイルは作らず、既存 test の unblock を検証する command suite を確定。
