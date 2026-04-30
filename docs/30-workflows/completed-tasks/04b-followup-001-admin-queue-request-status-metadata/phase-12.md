# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 4 (followup) |
| 実行種別 | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## 目的

Phase 12 必須 6 タスクの成果物に `main.md` サマリーを加えた 7 ファイルを生成し、`docs/00-getting-started-manual/specs/07-edit-delete.md` への queue 状態遷移節追記を反映、未タスク・skill feedback を 0 件でも明示出力する。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル
- [x] 日常生活の例え話で「困りごと → 解決後の状態」を書く
- [x] 専門用語（pending / resolved / partial index）はその場で 1 行説明
- [x] 何を作るかより先に「誰が何で困っていたか」を書く

### Part 2: 開発者・技術者レベル
- [x] DDL（ALTER TABLE / CREATE INDEX）と backfill UPDATE の SQL を全文記載
- [x] `RequestStatus` 型・`AdminMemberNoteRow` interface の TypeScript 定義
- [x] `markResolved` / `markRejected` / `hasPendingRequest` のシグネチャ・使用例・エラーハンドリング
- [x] `EXPLAIN QUERY PLAN` での partial index 検証コマンド
- [x] migration 適用 / rollback / dry-run の `scripts/cf.sh` コマンド

## 実行タスク

1. implementation-guide.md（Part 1 + Part 2）
2. system-spec-update-summary.md（specs/07-edit-delete.md 反映）
3. documentation-changelog.md
4. unassigned-task-detection.md（**0 件でも出力必須**）
5. skill-feedback-report.md（**改善点なしでも出力必須**）
6. phase12-task-spec-compliance-check.md

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/ | 全成果物 |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | 反映先 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | schema spec |
| 必須 | apps/api/migrations/0006_admin_member_notes_type.sql | 直前 migration |

## Part 1 中学生レベル概念説明（例え話）

`admin_member_notes` の本タスクは「**会員さんが『公開やめて』とお願いしたとき、運営が処理した後にもう一度『公開やめて』と言える状態にする変更**」です。

- いま: 会員さんが「公開やめて」と一度お願いすると、運営がそれを処理した後でも「もう一度お願いします」が言えない状態になっていた
- 困りごと: 「処理しました」というハンコが押されていないので、システムは「まだ処理中」と勘違いしてしまう
- これから: お願いの紙に「**処理中（pending）/ 終わった（resolved）/ 断った（rejected）**」のハンコ欄を増やして、運営が処理を終えたらハンコを押す。会員さんがもう一度お願いすると、システムは「前のお願いは終わってる」と分かるので、新しいお願いを受け付けられる
- ついでに: 「処理中の紙だけ」を素早く探せる小さなインデックス（しおり）も作るので、運営の検索も速くなる

## Part 2 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | docs/30-workflows/04b-followup-001-admin-queue-request-status-metadata |
| migration | apps/api/migrations/0007_admin_member_notes_request_status.sql |
| 追加列 | `request_status TEXT` / `resolved_at INTEGER` / `resolved_by_admin_id TEXT` |
| backfill | `UPDATE admin_member_notes SET request_status='pending' WHERE note_type IN ('visibility_request','delete_request')` |
| partial index | `CREATE INDEX idx_admin_notes_pending_requests ON admin_member_notes(member_id, note_type) WHERE request_status='pending'` |
| repository | apps/api/src/repository/adminNotes.ts |
| 型 | `type RequestStatus = 'pending' \| 'resolved' \| 'rejected'` |
| helper | `markResolved(noteId, adminId)` / `markRejected(noteId, adminId, reason)` |
| guard | `hasPendingRequest(memberId, noteType)` を `request_status='pending'` 限定化 |
| route | `routes/me/services.ts` の `memberSelfRequestQueue` ガード |
| upstream | 04b-parallel-member-self-service-api-endpoints / 02c-parallel-admin-notes-audit-sync-jobs |
| downstream | 07a-parallel-tag-assignment-queue-resolve-workflow / 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| validation focus | AC 11 件 + 不変条件 #4 / #5 / #11 |
| 検証コマンド | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm -F apps/api test` / `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --local` |

### state transition（単方向）

```
pending --markResolved--> resolved
pending --markRejected--> rejected
resolved / rejected --(*)--> 不可（UPDATE 0 件）
```

## system spec 更新概要（system-spec-update-summary.md）

- `docs/00-getting-started-manual/specs/07-edit-delete.md` に以下を追記
  - queue 状態遷移節（Mermaid stateDiagram-v2）
  - `request_status` の値定義（`pending` / `resolved` / `rejected`）
  - `resolved_at` / `resolved_by_admin_id` の意味と運用
  - 本人再申請が「resolved 行のみ存在 → 202」「pending 行存在 → 409」となる API 契約
  - 不変条件 #4 / #11 に違反していない旨の明記（admin_member_notes のみ更新、member_responses 非更新）
- `docs/00-getting-started-manual/specs/08-free-database.md` の `admin_member_notes` テーブル定義に 3 列追加とインデックスを反映

## documentation-changelog（documentation-changelog.md）

| 日付 | 変更 | 影響 |
| --- | --- | --- |
| 2026-04-30 | migration 0007 で `admin_member_notes` に request_status / resolved_at / resolved_by_admin_id 追加 | apps/api / D1 schema |
| 2026-04-30 | partial index `idx_admin_notes_pending_requests` 追加 | D1 query plan |
| 2026-04-30 | `hasPendingRequest` を `request_status='pending'` 限定化 | repository helper / routes/me |
| 2026-04-30 | `markResolved` / `markRejected` helper 追加 | 下流 07a / 07c が参照 |
| 2026-04-30 | specs/07-edit-delete.md に queue 状態遷移節追記 | spec |

## unassigned-task-detection（unassigned-task-detection.md）

**0 件でも出力必須**

| 未割当項目 | 理由 | 登録先候補 |
| --- | --- | --- |
| （該当なし） | 本タスクで認識した未タスクは 0 件 | — |

補足:
- 07a / 07c で markResolved / markRejected を呼び出す部分は当該 task の範囲であり本タスクの未タスクではない
- audit_log への state transition 連携は既存 audit 構造で吸収可能（不変条件 #11 の範囲内）

## skill-feedback-report（skill-feedback-report.md）

**改善点なしでも出力必須**

| skill | feedback |
| --- | --- |
| task-specification-creator | NON_VISUAL タスクで Phase 11 の screenshot を不要化する縮約テンプレが現状 references に明文化されていれば再利用しやすい（要確認） |
| aiworkflow-requirements | `admin_member_notes` の state transition 標準形（`pending → resolved/rejected` 単方向）を reference に標準化すると下流タスクが参照しやすい |
| github-issue-manager | 特になし（Issue #217 の Linkage は本タスクで通常運用に収まる） |

## phase12-task-spec-compliance-check（phase12-task-spec-compliance-check.md）

| 不変条件 | 遵守 | 根拠 |
| --- | --- | --- |
| #1 schema 固定しない | N/A | Form schema 非変更 |
| #2 consent キー統一 | N/A | 関連なし |
| #3 responseEmail = system | N/A | 関連なし |
| #4 response_fields 本人 PATCH 不可 / 申請別テーブル化 | ✅ | admin_member_notes のみ変更、member_responses 非更新 |
| #5 D1 直接アクセスは apps/api 内 | ✅ | 全変更が apps/api 配下 |
| #6 GAS prototype 非昇格 | N/A | 参照なし |
| #7 responseId と memberId 混同 | ✅ | branded type 維持 |
| #8 localStorage 非正本 | N/A | server side |
| #9 /no-access 不依存 | N/A | UI なし |
| #10 無料枠内 | ✅ | 300 writes/月、99.99% 余裕 |
| #11 他人本文編集禁止 | ✅ | markResolved/Rejected は admin_member_notes のみ更新 |
| #12 admin_member_notes 漏れ | ✅ | repository 経由限定 |
| #13 tag は queue 経由 | N/A | tag 非対象 |
| #14 schema 集約 | N/A | Form schema 非変更 |
| #15 attendance 重複防止 | N/A | attendance 非対象 |

## LOGS.md 記録

- 変更要約: admin_member_notes に request_status / resolved_at / resolved_by_admin_id を追加し、本人再申請 / admin resolve workflow の正本を一本化
- 判定根拠: AC 11 件 trace、不変条件 #4 / #5 / #11 PASS、無料枠 99.99% 余裕
- 未解決事項: なし（07a / 07c での helper 呼出は当該 task で実装）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR description の本文・Closes #217 |
| 下流 07a / 07c | implementation-guide.md の helper 仕様 |

## 多角的チェック観点

| 不変条件 | 確認 | 結果 |
| --- | --- | --- |
| #4 / #5 / #11 | compliance check で ✅ | OK |
| spec sync | specs/07, 08 と齟齬なし | OK |
| handoff | 07a / 07c に渡せる helper export | OK |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | completed | Part 1+2 |
| 2 | system-spec-update | 12 | completed | specs/07, 08 |
| 3 | changelog | 12 | completed | 履歴 |
| 4 | unassigned (0 件でも) | 12 | completed | 必須出力 |
| 5 | skill feedback (改善なしでも) | 12 | completed | 必須出力 |
| 6 | compliance check | 12 | completed | trace |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリー |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1+2 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 反映 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未処理（0 件でも必須） |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 改善（なしでも必須） |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 不変条件 trace |
| メタ | artifacts.json | Phase 12 を completed |

## 完了条件

- [x] Phase 12 必須 6 タスク成果物 + `main.md` の 7 ファイルすべて作成
- [x] unassigned-task-detection.md は 0 件でも出力済み
- [x] skill-feedback-report.md は改善点なしでも出力済み
- [x] specs/07-edit-delete.md と specs/08-free-database.md の更新差分を system-spec-update-summary.md に明記
- [x] compliance check 全項目評価
- [x] LOGS.md 記録

## タスク100%実行確認

- 必須 6 タスク成果物 + `main.md`
- artifacts.json で phase 12 を completed

## 次 Phase への引き渡し

- 次: 13 (PR 作成)
- 引き継ぎ: implementation-guide / changelog / compliance check を PR description に転記
- ブロック条件: 必須 6 タスク成果物または `main.md` のいずれかが欠けていれば差し戻し
