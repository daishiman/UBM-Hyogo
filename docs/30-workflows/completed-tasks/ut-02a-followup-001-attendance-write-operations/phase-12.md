# Phase 12: ドキュメント更新

実装区分: 実装仕様書

## 12.1 outputs 一覧

| 成果物 | 配置 | 内容 |
| --- | --- | --- |
| implementation-guide | `outputs/phase-12/implementation-guide.md` | Writer 実装の手引き / 既存 read path との関係 |
| system-spec-update | `outputs/phase-12/system-spec-update-summary.md` | 既存 06c-E / 07c 実装正本への吸収と aiworkflow-requirements index 同期 |
| documentation-changelog | `outputs/phase-12/documentation-changelog.md` | 本タスクで更新したドキュメント一覧 |
| unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` | 02a Phase 12 unassigned-task の本項目を「解消済み」更新する反映表 |
| skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements skill への feedback |
| compliance-check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | CONST_001〜CONST_007 適合確認 |

## 12.2 implementation-guide 概要

- 既存 `addAttendance` / `removeAttendance` を write 正本として維持し、過剰な Writer 抽象を追加しないパターン
- `MeetingSessionId` の cast helper 利用例
- audit_log 結線の最小コード断片
- read path との一貫性確認方法（write 後に `findByMemberIds` で観測）
- 中学生レベル概念説明（task-specification-creator skill Phase 12 ガイド準拠）:
  - 「会員さんが集会に来た／来なかったを記録する蛇口」
  - 「同じ人が同じ集会に二重登録される事故を、データベースの鍵で物理的に止めている」
  - 「誰がいつ操作したかを必ずログに残すため、こっそり書き換えできない仕組みになっている」

## 12.3 system-spec-update 影響

| spec ファイル | 変更内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | attendance write close-out の即時導線を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | UT-02A attendance write operations close-out 行を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | implemented-local / resolved-by-existing 06c-E / 07c として登録 |
| `.claude/skills/aiworkflow-requirements/changelog/20260506-ut-02a-attendance-write-operations-closeout.md` | same-wave sync 履歴を追加 |

`docs/00-getting-started-manual/specs/*` は今回差分では直接編集しない。既存 06c-E / 07c が API / DB / admin gate 正本をすでに同期済みであり、本 close-out は起票元未タスクと索引を resolved-by-existing へ揃える。

## 12.4 02a Phase 12 unassigned-task 反映

起票元 unassigned task `docs/30-workflows/unassigned-task/task-ut-02a-attendance-write-operations-001.md` に解消記録を追記:

```markdown
## 7. 解消記録（2026-05-06）

- close-out workflow: `docs/30-workflows/ut-02a-followup-001-attendance-write-operations/`
- 解消先: 06c-E / 07c 既存実装
```

## 12.5 documentation-changelog

実装完了時に以下を `outputs/phase-12/documentation-changelog.md` に列挙:
- index.md / phase-01〜13.md（本仕様書群）
- aiworkflow-requirements index / changelog 更新（12.3）
- 起票元 unassigned task 解消記録（12.4）
- runtime curl / UI smoke は `CONTRACT_ONLY_NOT_EXECUTED` と明記

## 12.6 skill-feedback-report

| skill | 観察 / 提案 |
| --- | --- |
| task-specification-creator | 既存実装の硬化タスクでも 13 phases フォーマットがフィットすることを確認。ただし「現状ベースライン」節を Phase 1 標準に格上げする提案 |
| aiworkflow-requirements | `01-api-schema.md` への admin route 追記の経路は確立済み。13-mvp-auth.md への admin gate 利用例の集約場所が散在している点を改善提案 |

## 12.7 CONST_001〜007 適合確認（compliance-check）

| 制約 | 適合 | 根拠 |
| --- | --- | --- |
| CONST_001 設計書（Phase 1-3）完成までタスク仕様書（Phase 4 以降）に着手しない | ✅ | 本仕様書は Phase 1→2→3→4... の順で作成 |
| CONST_002 コミット・PR・push 禁止（指示なし） | ✅ | 本タスクは spec drafted のみ |
| CONST_003 テンプレート機械適用ではなくタスク特性最適化 | ✅ | 「現状ベースライン」節 / 既存実装の硬化方針 / Writer 抽象化判断を本タスク固有に展開 |
| CONST_004 デフォルトは実装仕様書 | ✅ | 全 phase 冒頭に「実装区分: 実装仕様書」明記 |
| CONST_005 実装仕様書必須項目 | ✅ | Phase 2.5 変更ファイル一覧 / 2.6 入出力定義 / 2.7 ローカル実行コマンド / 2.8 DoD 完備 |
| CONST_006 実装の「実行」は本プロンプト責務外 | ✅ | 既存 06c-E / 07c 実装を吸収し、本 review cycle では route error contract と canonical route tests を補正 |
| CONST_007 1 サイクル内完了スコープ / 先送り禁止 | ✅ | scope out は将来拡張点として明記、別 Issue (followup-002, 004) と独立 |

## 12.8 DoD

- 12.1 全 outputs が `outputs/phase-12/` に存在
- 12.3 aiworkflow-requirements index / changelog 更新が反映済み
- 12.4 起票元 unassigned task が「解消済み」更新済み
- 12.7 compliance-check 全 ✅
