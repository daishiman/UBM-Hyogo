# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 9 |
| 下流 | Phase 11 |
| 状態 | pending |

## 目的

GO/NO-GO 判定。

## 判定基準

| 軸 | 基準 | 結果 |
| --- | --- | --- |
| 上流 Wave AC | 01a / 01b 完了 | TBD |
| 本タスク AC | AC-1〜AC-9 | TBD |
| 不変条件 | #5 / #13 / #14 / #15 / #10 | TBD |
| 品質 | Q-1〜Q-5 | TBD |
| 無料枠 | reads/writes < 5% | TBD（試算 0.24% / 0.11%） |
| 02a / 02c 相互 import | 0 | TBD |
| Phase 8 DRY | 5 カテゴリ | TBD |
| Phase 9 secret | 5 項目 | TBD |

## blocker 一覧

| ID | blocker | 影響 | 対処 |
| --- | --- | --- | --- |
| B-1 | 01a で `member_attendance` の PK 制約が宣言されていない | AC-2 不能 | 01a に diff |
| B-2 | 01a で `tag_definitions` 6 カテゴリ seed 未投入 | AC-6 fail | 01a 完了確認 |
| B-3 | 01b で `MeetingWithAttendance` 型に `attendees` 配列が無い | builder（02a 側）で型不一致 | 01b に diff |
| B-4 | dep-cruiser config が 02c 未配置 | AC-9 検証不能 | 02c 進捗待ち |
| B-5 | `schema_diff_queue` の `type` カラム index が 01a に無い | AC-5 が遅い | 01a に index 追加依頼 |

## open question

| Q | 問い | 想定解 |
| --- | --- | --- |
| OQ-1 | `transitionStatus` で `reviewing → reviewing` を許可するか | NO（idempotent でない、状態遷移定義に明示） |
| OQ-2 | `addAttendance` で 3 種 reason を返すか、enum 化するか | discriminated union で十分 |
| OQ-3 | `schemaQuestions.updateStableKey` を repository 層で許可するか | 許可（07b workflow のみが呼ぶ規約は route 層） |
| OQ-4 | `tag_definitions.active = false` の tag を listByCategory で含めるか | 含めない（active=true filter） |
| OQ-5 | meeting attendance の `assignedBy` は admin email か admin_user_id か | admin email（02c で確認） |

## 4 条件最終

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 03a / 04c / 07a/b/c が並列着手可 |
| 実現性 | PASS | reads 0.24% / writes 0.11% |
| 整合性 | PASS | 状態遷移 + PK 制約で structural |
| 運用性 | PASS | sync 失敗時 idempotent（INSERT OR REPLACE / supersede） |

## レビューチェックリスト

- [ ] AC-1〜AC-9 全て test 設計済み
- [ ] 不変条件 #5/#13/#14/#15/#10 全てに case
- [ ] Phase 9 Q-1〜Q-5 pass 想定
- [ ] 無料枠 < 5%
- [ ] blocker B-1〜B-5 のうち実在するものに plan
- [ ] open question OQ-1〜OQ-5 に解
- [ ] 02a / 02c 相互 import ゼロ想定

## 実行タスク

1. GO/NO-GO 基準を `outputs/phase-10/go-no-go.md`
2. blocker / open question / 4 条件を `outputs/phase-10/main.md`
3. GO マーク

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 1〜9 outputs | レビュー対象 |
| 参考 | 02a / 02c | 相互 import 確認 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 11 | smoke 範囲 |
| 03a / 04c / 07a/b/c | GO 後着手 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 上流 AC | — | 01a / 01b |
| 不変条件 | #5 #13 #14 #15 #10 | blocker 無し |
| 並列独立 | — | 02a / 02c blocker 無し |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | GO/NO-GO 基準 | pending |
| 2 | blocker | pending |
| 3 | open question | pending |
| 4 | 4 条件 | pending |
| 5 | GO マーク | pending |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-10/main.md | blocker / OQ / 4 条件 |
| outputs/phase-10/go-no-go.md | GO/NO-GO |

## 完了条件

- [ ] 8 軸判定
- [ ] blocker / OQ 顕在化
- [ ] 4 条件 PASS
- [ ] GO マーク

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-10/* 配置済み
- [ ] GO 判定 or 戻し計画
- [ ] artifacts.json の Phase 10 を completed

## 次 Phase

- 次: Phase 11
- 引き継ぎ事項: GO + open question
- ブロック条件: NO-GO なら戻し
