# Phase 12: ドキュメント整備（必須 7 成果物）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント整備 |
| 前 Phase | 11 (runtime evidence) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |

## 目的

task-specification-creator skill の Phase 12 仕様（6 必須タスク + 7 ファイル実体）を満たす。

## 必須成果物（7 ファイル）

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリ + 7 ファイル実在確認 |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生向け概念説明 + Part 2 技術者向け実装ガイド |
| 3 | `outputs/phase-12/documentation-changelog.md` | docs/aiworkflow-requirements skill 等への変更点列挙 |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件でも出力） |
| 5 | `outputs/phase-12/skill-feedback-report.md` | テンプレ / ワークフロー / ドキュメント観点（改善なしでも出力） |
| 6 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements skill / specs 更新サマリ |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | コンプライアンスチェック |

## Task 12-1: 実装ガイド

### Part 1: 中学生レベル概念説明（必須）

- 「admin が『その依頼を承認しました／お断りしました』を決めると、メンバー本人にメールでお知らせする仕組み」
- なぜメールを直接送らないのか: 管理者の作業はDBの更新を確実に終わらせる必要があり、メール送信に失敗してもDB更新は取り消したくない。だから「送るべきメールのリスト」だけ先に作って、別の人（cron worker）が後から順番に送る
- 失敗したらどうする: 何度かリトライ → それでもだめなら「お手上げボックス（DLQ）」に入れて人が見る

### Part 2: 技術者向け実装ガイド

- アーキテクチャ図（resolve API → outbox enqueue / scheduled cron → claim → Resend → ledger）
- 主要シグネチャ（`enqueueNotification` / `runNotificationDispatchTick` / `createMailDispatcher`）
- 運用手順
  - DLQ 再投入: `UPDATE notification_outbox SET status='pending', retry_count=0, next_attempt_at=now WHERE notification_id=?`
  - 緊急停止: wrangler.toml の cron entry をコメントアウトして deploy
  - migration rollback: `outputs/phase-10/rollback.sql`
- 監視項目
  - DLQ 件数（`SELECT count(*) FROM notification_outbox WHERE status='dlq'`）
  - 24h 以内 sent / failed 比率
  - enqueue 失敗 warning ログ件数

## Task 12-2: システム仕様書更新

更新対象（Step 1-A: SSOT、Step 1-B: skill references、Step 1-C: docs/specs）:

| ファイル | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | resolve 後の通知経路（outbox + dispatcher）追記 |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | `notification_outbox` / `notification_ledger` テーブル定義追記 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | resolve API 副作用に「通知 enqueue（best-effort）」追記 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Issue #401 即時導線と env 正本名を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory に Issue #401 を追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow として Issue #401 を追記 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 本タスク完了 entry（現行 skill は LOGS fragment 方式） |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 履歴 entry |

Step 2（条件付き）: indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
```

## Task 12-3: ドキュメント変更履歴

`outputs/phase-12/documentation-changelog.md` に上記 5 ファイルの canonical absolute path を列挙（SKILL.md だけ列挙して LOGS.md 省略は FAIL）。

## Task 12-4: 未タスク検出

`outputs/phase-12/unassigned-task-detection.md` に以下を記載:

- 検出された未タスク: 0 件
  - admin 通知監視 UI（DLQ 件数 / sent 比率の dashboard 表示）は現時点では作らない。audit ledger と SQL 監視で本タスクの AC を満たし、運用観察ニーズが顕在化していないため未タスク化しない。
- coverage layer 表（該当なしのため省略可、その旨明記）

## Task 12-5: skill フィードバック

`outputs/phase-12/skill-feedback-report.md`:

- テンプレ改善: なし（既存 phase-template-phase11 NON_VISUAL evidence が本タスクに合致）
- ワークフロー改善: なし
- ドキュメント改善: なし（必須 3 観点記載は固定）

## Task 12-6: コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md`:

- [ ] 7 成果物すべて実在
- [ ] CONST_005 必須項目（変更ファイル / シグネチャ / 入出力 / テスト / コマンド / DoD）全 phase に記載
- [ ] CONST_007 1 サイクル完了スコープ
- [ ] PASS_BOUNDARY 区分明示

## 状態運用

- workflow root state: `spec_created` → 実装着手後は `implementation_in_progress` → runtime evidence 取得後 `runtime_evidence_captured` → Phase 12 全完了で `implementation_complete_pending_pr`
- spec_created / docs-only / NON_VISUAL のうち本タスクは `implementation` + `NON_VISUAL`。Phase 12 だけで `completed` に昇格しない。runtime evidence と Phase 13 user approval gate が残る場合は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を使い、`PASS` 単独表記を避ける。

## 完了条件

- [ ] 7 成果物すべて作成
- [ ] aiworkflow-requirements skill 5 ファイル更新
- [ ] indexes 再生成（変更があれば）
- [ ] CONST_005 / CONST_007 適合確認

## 次 Phase

次: 13 (コミット・PR 作成)。

## 実行タスク

1. strict 7 files を作成する
2. aiworkflow-requirements を same-wave sync する
3. compliance check を作成する

## 成果物/実行手順

必須成果物（7 ファイル）表を参照する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
