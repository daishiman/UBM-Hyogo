# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 設計の alternative 3 案を比較し、PASS / MINOR / MAJOR 判定で確定する。

## 実行タスク

1. alternative 3 案
2. PASS-MINOR-MAJOR 判定
3. handoff to Phase 4

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/tag-queue-state-machine.md | レビュー対象 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | queue 仕様 |

## Alternative 3 案

### 案 A: confirmed 状態を再オープン可能（confirmed → candidate）
- pros: タグ修正が容易、運用ミス回復
- cons: 不変条件 #13 の「unidirectional」を破る、audit が複雑化、追跡性低下
- 不変条件影響: #13 の精神（一度確定したら queue は閉じる）に反する
- 判定: **MAJOR**（不採用、修正は新規 queue を作る運用で）

### 案 B: tx を使わず順次実行
- pros: コード簡潔
- cons: queue UPDATE 後に member_tags INSERT 失敗で不整合、audit 抜け
- 不変条件影響: 監査整合性が破綻
- 判定: **MAJOR**（不採用）

### 案 C: candidate 投入を cron で行う
- pros: sync 失敗時の影響を切り離せる
- cons: candidate 投入が遅延（最長 1 cron 周期）、admin の体感が悪化
- 不変条件影響: なし
- 判定: **MINOR**（不採用、03b sync 内 hook の方が即時性高い）

### 採用案: Phase 2 案（unidirectional + tx + 03b hook）
- 不変条件 #13 を最も自然に守れる
- tx で監査整合性確保
- 03b hook で即時性

## PASS / MINOR / MAJOR 判定

| 案 | 判定 | 採否 |
| --- | --- | --- |
| A: 再オープン可能 | MAJOR | 不採用 |
| B: tx なし | MAJOR | 不採用 |
| C: cron 投入 | MINOR | 不採用 |
| Phase 2 案 | PASS | 採用 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案を test 戦略の前提に |
| Phase 7 | 設計選択の根拠 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #13 | 案 A の「再オープン」を不採用 | unidirectional |
| #5 | 全案で workflow を apps/api 内に閉じる | data access boundary |
| 監査 | 案 B の「tx なし」を不採用 | 整合性 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 起こし | 3 | pending | A/B/C |
| 2 | 判定 | 3 | pending | PASS/MINOR/MAJOR |
| 3 | handoff 表 | 3 | pending | Phase 4 入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | alternative 比較 + 判定 |
| メタ | artifacts.json | Phase 3 を completed |

## 完了条件

- [ ] alternative 3 案
- [ ] 判定（A/B が MAJOR で不採用）
- [ ] handoff 表

## タスク100%実行確認

- 全 alternative 記載
- 採用案確定
- artifacts.json で phase 3 を completed

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ: 採用案を test 戦略へ
- ブロック条件: 評価未完了なら次へ進めない

## Handoff to Phase 4

| 項目 | 内容 |
| --- | --- |
| 採用設計 | unidirectional state machine + tx + 03b hook |
| 確定 module | tagQueueResolve, enqueueTagCandidate, tagQueueRoutes, tagQueueValidation |
| open question | D1 batch の semi-tx 性能特性（Phase 9 で計測） |
| blocker | なし（上流 02b/02c/04c の repo signature 確定が前提） |
