# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
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
| 必須 | outputs/phase-02/schema-alias-workflow-design.md | レビュー対象 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | stableKey + alias |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | `/admin/schema` 集約 |

## Alternative 3 案

### 案 A: assigned 状態を再オープン可能（assigned → unresolved）

- pros: alias 設定ミスの修正が容易
- cons: stableKey 履歴が混乱、back-fill が逆方向に必要、audit が複雑化、不変条件 #14 の `/admin/schema` 一元化精神を弱める
- 不変条件影響: #14 の「schema 変更を集約」する性質に反し、再オープンと再 apply の循環で履歴が辿りにくくなる
- 判定: **MAJOR**（不採用、修正は新規 schema_versions + 新 diff_queue で）

### 案 B: dry-run mode を別 endpoint (`GET /admin/schema/aliases/preview`) にする

- pros: GET と POST の責務分離が明確
- cons: 04c 側で 2 endpoint 必要、UI の state 管理が複雑化、dryRun と apply で param drift のリスク
- 不変条件影響: なし（API 表現の差異）
- 判定: **MINOR**（不採用、`POST + dryRun=true` で endpoint を統合）

### 案 C: back-fill を Cron Trigger で非同期分割

- pros: Workers 30s 制限の緩和、巨大 schema 変更にも対応
- cons: queue.status を「assigning」中間状態にする必要、UI 側で進捗表示が必要、audit_log が分割される、CPU 30s で 100 行/batch なら数万行 OK のため過剰設計
- 不変条件影響: なし（実装複雑度のみ）
- 判定: **MINOR**（不採用、現時点では過剰、Phase 9 で性能計測後に再評価）

### 採用案: Phase 2 案（unidirectional + tx + dryRun 統合 + 同期 back-fill）

- 不変条件 #14 を最も自然に守れる
- D1 batch で監査整合性確保
- POST + flag で UI 側がシンプル
- back-fill は 100 行/batch で 30s 内に余裕あり

## PASS / MINOR / MAJOR 判定

| 案 | 判定 | 採否 |
| --- | --- | --- |
| A: 再オープン可能 | MAJOR | 不採用 |
| B: dryRun を GET 別 endpoint | MINOR | 不採用 |
| C: cron 分割 back-fill | MINOR | 不採用（再評価条件あり） |
| Phase 2 案 | PASS | 採用 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案を test 戦略の前提に |
| Phase 7 | 設計選択の根拠 |
| Phase 9 | 案 C 再評価のトリガー条件（back-fill 計測） |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #14 | 案 A の「再オープン」を不採用 | unidirectional + 集約 |
| #1 | 全案で stableKey はコード固定なし | schema_questions 経由 |
| #5 | 全案で workflow を apps/api 内に閉じる | data access boundary |
| 監査 | apply のみ audit、dryRun は無記録 | log 整理 |

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
- [ ] 判定（A が MAJOR、B/C が MINOR、Phase 2 案が PASS）
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
| 採用設計 | unidirectional state machine + tx + dryRun 統合 + 同期 back-fill |
| 確定 module | schemaAliasAssign, recommendAliases, schemaDiffRoutes, schemaAliasValidation, backfillResponseFields |
| open question | back-fill 性能（数万行で 30s 内か）を Phase 9 で計測、超過なら案 C へ移行 |
| blocker | なし（上流 02b/02c/03a/04c の repo / endpoint signature 確定が前提） |
