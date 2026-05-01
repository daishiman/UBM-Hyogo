# Phase 12 (4/6): Unassigned Task Detection

> ステータス: spec_created / docs-only / NON_VISUAL
> 本タスク完了時点で残る未タスクを起票候補化する（Phase 6 / Phase 10 / Phase 11 で蓄積した open question を集約）。

---

## 1. 未タスク候補一覧

### Candidate U1: `total_rows` mismatch alert と自動 full backfill 起動

| 項目 | 内容 |
| --- | --- |
| 由来 | Phase 6 FC-10「Sheets 行削除 chunk 跨ぎ大量」 |
| 内容 | `total_rows` mismatch を検出した際に自動で full backfill endpoint をキックする運用 |
| 親タスク候補 | UT-09 |
| 規模 | 中（detection ロジック + 監視配線） |
| 緊急度 | LOW（手動 full backfill で代替可） |
| 起票推奨 | docs/30-workflows/unassigned-task/ にて起票候補 |

### Candidate U2: stale lock TTL の現実校正

| 項目 | 内容 |
| --- | --- |
| 由来 | Phase 6 残存リスク |
| 内容 | `sync_locks.expires_at` の TTL 既定 10 分が staging 実測に対し過剰 / 過少か再校正 |
| 親タスク候補 | UT-08（監視）|
| 規模 | 小 |
| 緊急度 | LOW |
| 起票推奨 | UT-08 サブタスクとして検討 |

### Candidate U3: UT-01 上流仕様の加筆 PR

| 項目 | 内容 |
| --- | --- |
| 由来 | Phase 8 §4 / Phase 12 system-spec-update-summary §2 |
| 内容 | `completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/` 配下に jitter ±20% / chunk index 単位の注記を加筆 |
| 親タスク候補 | docs-update follow-up |
| 規模 | 小（2 ファイル各数行加筆） |
| 緊急度 | MEDIUM（後続 onboarding 時の参照ずれ防止） |
| close-out | 本レビューで起票元 unassigned と aiworkflow-requirements indexes / database-schema へ反映済み。completed-tasks 配下の歴史的成果物は直接編集しない |

### Candidate U4: aiworkflow-requirements indexes の retry / offset 索引追補

| 項目 | 内容 |
| --- | --- |
| 由来 | Phase 12 system-spec-update-summary §6 |
| 内容 | `quick-reference.md` / `topic-map.md` に U-UT01-09 確定値を索引化 |
| 親タスク候補 | docs-update follow-up または UT-09 完了時 |
| 規模 | 小 |
| 緊急度 | LOW |
| 起票推奨 | UT-09 の Phase 12 で wire-in |

## 2. 既起票タスクとの境界確認

| 既起票 | 直交確認 |
| --- | --- |
| UT-09（実装） | 本タスクの canonical 確定値を反映する責務、本タスクの Phase 5 ランブックを起点とする |
| U-UT01-07（ledger 整合） | `processed_offset` 列追加の物理 migration 発行責務 |
| U-UT01-08（enum 統一） | 完全直交、追加申し送りなし |

## 3. 起票推奨優先度

| Candidate | 優先度 | 現在の扱い |
| --- | --- | --- |
| U3（UT-01 加筆） | MEDIUM | 起票元 / 正本索引反映で同 wave 解消。歴史的 completed output は不変維持 |
| U1（mismatch alert） | LOW | 大きな自動運用変更のため UT-09 完了後に再判定。現時点では手動 full backfill 代替で未タスク化しない |
| U2（stale lock TTL） | LOW | UT-08 / 09b 監視実測の一部として扱い、単独起票しない |
| U4（indexes 追補） | LOW | 本レビューで `quick-reference.md` / `resource-map.md` / `database-schema.md` / `task-workflow-active.md` へ反映済み |

## 4. open question 0 件確認

Phase 10 §7 で振り分けた open question はすべて本ファイルに転記済み。**未振り分け 0 件**。

## 5. 完了条件チェック

- [x] open question 受け皿明示
- [x] 未タスク 4 候補抽出
- [x] 同 wave 解消 / 既存タスク吸収 / 後日再判定を分類
- [x] 既起票タスクとの境界確認
- [x] 起票推奨優先度
