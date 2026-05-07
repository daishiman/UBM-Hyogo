# issue-378-tag-queue-paused-flag — タスク仕様書 index

[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-378-tag-queue-paused-flag |
| ディレクトリ | docs/30-workflows/issue-378-tag-queue-paused-flag |
| Wave | post-MVP / operations guard |
| 実行種別 | serial |
| 作成日 | 2026-05-06 |
| 担当 | app-admin-ops |
| 状態 | implemented-local |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 関連 GitHub Issue | #378（CLOSED）|
| タスクID | task-issue-109-tag-queue-pause-flag-001 |

## 目的

Forms 同期から発生する `tag_assignment_queue` への candidate enqueue を、緊急時に env flag で一時停止できるようにする。
障害発生時 / queue 暴走時 / 仕様変更追従中の zero-downtime guard 経路を確保する。

## スコープ

### 含む
- `apps/api/src/env.ts` への `TAG_QUEUE_PAUSED?: string` binding 追加
- `apps/api/src/workflows/tagCandidateEnqueue.ts` の pause guard 実装と `result.reason = "paused"` 追加
- `apps/api/src/jobs/sync-forms-responses.ts` の呼び出しに flag 伝播
- `apps/api/wrangler.toml` の `[vars]` への `TAG_QUEUE_PAUSED = "false"` 追加（default disabled = enqueue 有効）
- unit test（flag 未設定 / "false" / "true" の3ケース + structured log assertion）
- runbook（`docs/30-workflows/runbooks/tag-queue-pause.md`）新規作成

### 含まない
- admin UI toggle（unassigned task 元仕様より out of scope）
- `tag_assignment_queue` schema 変更
- 07a resolve workflow への影響（resolve 側は本タスクで停止しない。enqueue 側のみ停止）

## 受入条件 (AC)

- AC-1: env binding `TAG_QUEUE_PAUSED` が定義され、未設定 / `"false"` / `"true"` の3値解釈が定まっている（default disabled = enqueue 有効）。
- AC-2: flag が true のとき、`enqueueTagCandidate` は INSERT を発行せず、`{ enqueued: false, reason: "paused" }` 相当の戻り値を返す。
- AC-3: 停止時に skip reason `paused` を含む structured log が出力される。
- AC-4: runbook（緊急停止手順 / 復旧手順 / 検証コマンド）が `docs/30-workflows/runbooks/` 配下に存在する。
- AC-5: unit test PASS（3ケース + log spy assertion）。
- AC-6: 不変条件 #5（D1 直接アクセスは apps/api 内）と #13（削除済み member は skip / `member_tags` 直接 INSERT 禁止）を遵守する。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義・GO 判定 | phase-01.md | completed |
| 2 | 設計・状態抽象化 | phase-02.md | completed |
| 3 | アーキテクチャ整合 | phase-03.md | completed |
| 4 | テスト戦略 | phase-04.md | completed |
| 5 | 実装ランブック | phase-05.md | completed |
| 6 | 失敗ケース整理 | phase-06.md | completed |
| 7 | AC マトリクス | phase-07.md | completed |
| 8 | リファクタ対象 | phase-08.md | completed |
| 9 | 品質ゲート | phase-09.md | completed |
| 10 | GO/NO-GO | phase-10.md | completed |
| 11 | NON_VISUAL evidence | phase-11.md | completed |
| 12 | ドキュメント更新 | phase-12.md | completed |
| 13 | PR 作成（user 承認ゲート） | phase-13.md | pending_user_approval |

## 触れる不変条件

- #5: D1 直接アクセスは `apps/api` に閉じる。本タスクの編集対象も `apps/api` 配下と `wrangler.toml` のみ。
- #13: 削除済み member は skip し、`member_tags` への直接 INSERT を行わない。本タスクは enqueue 経路のみ操作するため #13 は不変。

## 関連リンク

- 元 unassigned task: ../unassigned-task/task-issue-109-tag-queue-pause-flag-001.md
- 関連完了タスク: ../completed-tasks/issue-109-ut-02a-tag-assignment-queue-management/
- GitHub Issue: #378（CLOSED）
