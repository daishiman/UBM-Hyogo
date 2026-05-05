# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check の 6 成果物を生成。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. implementation-guide.md（中学生 + 技術者）
2. system-spec-update-summary.md
3. documentation-changelog.md
4. unassigned-task-detection.md
5. skill-feedback-report.md
6. phase12-task-spec-compliance-check.md

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/ | 全成果物 |
| 必須 | doc/00-getting-started-manual/specs/01, 08, 11 | spec sync |

## Part 1 中学生レベル概念説明 (例え話)

スキーマエイリアス workflow は「教科書の用語ふりがな帳」。
- 古い質問文の名前（stableKey）と、新しいフォームの質問文を見比べて、同じものを「同じふりがな」で結びつける
- 結びつける前に「もし変えたらどれくらい影響があるか」を試算（dryRun = 試算モード）
- OK なら本当に書き換える（apply = 確定モード）
- 過去のテスト答案にも新しいふりがなを振り直す（back-fill = 過去問題への遡及更新）
- 一度確定したら戻せない（記録性）。間違えたら新しい schema_version で対応

## Part 2 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow |
| key outputs | outputs/phase-02/schema-alias-workflow-design.md, outputs/phase-05/schema-alias-implementation-runbook.md |
| upstream | 04c, 06c, 03a, 02b, 02c |
| downstream | 08a, 08b |
| validation focus | AC 10 + 不変条件 #1, #14 |
| key innovation | dryRun / apply 統合 endpoint + idempotent back-fill + Levenshtein 推奨 |

## system spec 更新概要

- specs/01-api-schema.md の「stableKey は schema_questions で管理」を本 workflow で担保
- specs/11-admin-management.md の「schema 変更は /admin/schema 集約」を schemaAliasAssign 単独 path で実現
- specs/08-free-database.md の `schema_diff_queue.status` enum が `queued | resolved` と一致
- specs/08-free-database.md の `schema_questions.stableKey` UNIQUE constraint (schema_version_id, stableKey) を確認

## documentation-changelog

| 日付 | 変更 | 影響 |
| --- | --- | --- |
| 2026-04-26 | schemaAliasAssign workflow 設計確定（apply / dryRun 統合） | apps/api |
| 2026-04-26 | recommendAliases service 確定（Levenshtein + section/index） | apps/api |
| 2026-04-26 | backfillResponseFields batch 設計確定（100 行/batch + idempotent） | apps/api |
| 2026-04-26 | unidirectional state machine 確定（queued → resolved） | DB constraint |
| 2026-04-26 | audit_log の action prefix `schema_diff.alias_resolved` 確定 | audit |
| 2026-04-26 | dryRun mode を audit 対象外と明記 | log 整理 |

## unassigned-task-detection

| 未割当項目 | 理由 | 登録先候補 |
| --- | --- | --- |
| alias 自動推論 ML | spec 11 で手動承認のみ | 採用しない |
| schema_versions 作成 | 03a の責務 | 03a に集約済 |
| resolved → queued 再オープン | unidirectional | 採用しない（新 schema_version で対応） |
| back-fill cron 分割 | 現行の同期 batch で 25s 内、将来的に条件を満たす場合は別 task | 性能超過時に別 task として登録 |

## skill feedback

| skill | feedback |
| --- | --- |
| task-specification-creator | apply / dryRun のような mode union を持つ workflow の handler signature を TS の discriminated union として記述する pattern を template に追加 |
| aiworkflow-requirements | back-fill 系 workflow の CPU budget 中断 / idempotent 続行 patterns の reference があると良い |

## phase12-task-spec-compliance-check

| 不変条件 | 遵守 | 根拠 |
| --- | --- | --- |
| #1 schema 固定しない | OK | stableKey はコード内 string literal なし、schema_questions row 経由のみ |
| #2 consent キー統一 | N/A | alias workflow は publicConsent / rulesConsent を扱うが、本 workflow は alias 確定のみ |
| #3 responseEmail = system | N/A | 関連なし |
| #4 本人本文編集禁止 | N/A | schema 変更のみ |
| #5 D1 直接アクセス禁止 | OK | apps/api 内のみ |
| #6 GAS prototype 非昇格 | OK | spec のみ参照 |
| #7 responseId と memberId 混同 | N/A | schema 系のみ |
| #8 localStorage 非正本 | N/A | server side |
| #9 /no-access 不依存 | OK | endpoint のみ |
| #10 無料枠内 | OK | 5030 writes/月 |
| #11 他人本文編集禁止 | N/A | schema 変更のみ |
| #12 admin_member_notes 漏れ | N/A | schema のみ |
| #13 tag は queue 経由 | N/A | schema queue だが member_tags とは別 |
| #14 schema 集約 | OK | UPDATE schema_questions が schemaAliasAssign 単独 path |
| #15 attendance 重複防止 | N/A | schema のみ |

## LOGS.md 記録

- 変更要約: schema alias assign workflow 仕様完成
- 判定根拠: AC 10 trace、不変条件 #1, #14 担保
- 未解決事項: back-fill 性能 (10000 行) を Phase 9 計測、超過時 cron 分割（案 C）へ移行

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR description |
| 後続 wave | implementation-guide |

## 多角的チェック観点

| 不変条件 | 確認 | 結果 |
| --- | --- | --- |
| #1, #14 | compliance check で OK | OK |
| spec sync | specs/01, 08, 11 と齟齬なし | OK |
| handoff | 08a/b に渡せる成果物 | OK |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | Part 1+2 |
| 2 | system-spec-update | 12 | pending | spec 反映 |
| 3 | changelog | 12 | pending | 履歴 |
| 4 | queued | 12 | pending | 未処理 |
| 5 | skill feedback | 12 | pending | 改善 |
| 6 | compliance check | 12 | pending | trace |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリー |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1+2 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 反映 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未処理 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 改善 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | trace |
| メタ | artifacts.json | Phase 12 を completed |

## 完了条件

- [ ] 6 成果物作成
- [ ] compliance check 全項目評価
- [ ] spec sync 漏れなし

## タスク100%実行確認

- 全 6 成果物
- artifacts.json で phase 12 を completed

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ: 6 成果物を PR description
- ブロック条件: violation あれば差し戻し
