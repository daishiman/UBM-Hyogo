# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 4 (followup, serial) |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

Phase 5 の擬似コードと Phase 7 の AC マトリクスから、命名・型・path・helper signature の Before / After を確定し、`request_status` enum の共有・transaction helper 抽象化・旧 `hasPendingRequest` 実装の削除計画を整理する。下流タスク 07a / 07c での再利用性を最大化し、04b 既存実装との整合を保つ。

## Before / After

| 区分 | Before | After | 理由 |
| --- | --- | --- | --- |
| `hasPendingRequest` 判定 | 「最新行存在 = pending」（`note_type=? ORDER BY created_at DESC LIMIT 1` 由来の構造） | `EXISTS WHERE note_type=? AND request_status='pending'` | resolved 後の再申請を許容するため pending 限定に厳格化（AC-3 / AC-7） |
| RequestStatus 型 | （未定義） | `apps/api/src/repository/adminNotes.ts::RequestStatus = 'pending' \| 'resolved' \| 'rejected'` を export | 本タスクの変更面を repository に閉じ、07a / 07c は repository helper と同じ entrypoint から import する |
| AdminMemberNoteRow | `requestStatus` / `resolvedAt` / `resolvedByAdminId` 列なし | 3 列追加、それぞれ `RequestStatus \| null` / `number \| null` / `string \| null` | DDL 0007 と row mapping を統合 |
| state transition helper | （未存在） | `markResolved(c, noteId, adminId)` / `markRejected(c, noteId, adminId, reason)` を `repository/adminNotes.ts` で export | 07a / 07c が同一契約で import |
| state transition ガード | アプリ if 文（仮に書くと `if (row.status !== 'pending') throw`） | SQL 述語 `WHERE request_status='pending'` で構造的拒否 | アプリ層に状態判定ロジックを残さない（AC-6） |
| 時刻記録 | `created_at` / `updated_at` のみ（TEXT ISO8601） | `resolved_at` (INTEGER unix epoch ms) 追加。view 化時に ISO 変換 helper を別途追加可能 | `Date.now()` の直接 bind コスト削減、ソート用途中心 |
| body への reason 追記 | （未存在） | `markRejected` 内で `body = body \|\| '\n\n[rejected <iso>] <reason>'` | rejected 行に履歴を残し audit 補完 |
| `note_type` ガード | route 層で zod 検証 | `hasPendingRequest` の `noteType` 引数を `Exclude<AdminMemberNoteType, 'general'>` で型限定 | general 行への誤呼出を型レベルで拒否 |
| migration ファイル名 | （直前は 0006_admin_member_notes_type.sql） | 0007_admin_member_notes_request_status.sql | 連番 + subject + action の命名規則踏襲 |
| partial index 名 | （未存在） | `idx_admin_notes_pending_requests` | `idx_<table>_<filter>` 命名規則 |

## 共通化候補

| 種別 | path | 用途 | 適用先 |
| --- | --- | --- | --- |
| type | `apps/api/src/repository/adminNotes.ts` | `RequestStatus` enum を helper と同一 entrypoint で export | 04b-followup-001 / 07a / 07c |
| helper signature | `apps/api/src/repository/adminNotes.ts` | `markResolved` / `markRejected` の export | 07a / 07c が import |
| transaction wrapper（将来候補） | `apps/api/src/lib/d1Tx.ts` | `markResolved` の UPDATE + audit_log INSERT を 1 batch にする wrapper（07a / 07c で完成） | 本タスクは helper のみ提供、wrapper 実装は 07a 側 |
| utility | `apps/api/src/lib/time.ts`（既存があれば再利用） | `Date.now()` と ISO8601 の相互変換 | resolved_at の view 化時 |
| zod schema | `apps/api/src/schemas/_shared/requestStatus.ts`（将来） | `z.enum(['pending','resolved','rejected'])` を共有 | 07a / 07c の resolve route body |

> **本タスクで実装するのは repository 内の type export と helper signature のみ**。新規 `_shared` type ファイル、transaction wrapper、zod schema 共有は 07a / 07c の責務に委譲（過剰共通化を避ける）。

## markResolved / markRejected の transaction helper 抽象化（将来案）

下流 07a / 07c では「helper 呼出 + audit_log INSERT」を 1 batch で扱いたいニーズが出る。本タスクでは実装しないが、Phase 8 の共通化計画として記録しておく。

```ts
// 将来 07a で実装する想定（本タスクの責務外）
export const resolveWithAudit = async (c, noteId, adminId, action: 'resolved' | 'rejected', reason?: string) => {
  return c.db.batch([
    /* markResolved or markRejected の UPDATE 文 */,
    /* audit_log INSERT 文 */,
  ]);
};
```

本タスクの helper はこの wrapper から呼び出されることを想定し、戻り値を `noteId | null` の単純形に保つ（wrapper が batch 結果と組み合わせる）。

## 旧 `hasPendingRequest` 実装の削除計画

| 段階 | 対応 |
| --- | --- |
| 1. 04b 段階の実装 | 「note_type 行が 1 件以上存在するか」を判定するシンプル形（resolved も pending 扱い） |
| 2. 本タスクで置換 | `WHERE request_status='pending'` を含む厳格判定に置換 |
| 3. 削除対象 | 旧クエリは関数本体内のみで完結しているため、ファイル削除不要。関数本体の SQL 文を差し替えるだけ |
| 4. 互換性確認 | route 側 (`memberSelfRequestQueue`) は `hasPendingRequest` の boolean 戻り値のみ参照しているため signature 変更なし |
| 5. テスト更新 | 旧テスト `hasPendingRequest_returns_true_when_any_row_exists` を Phase 4 で定義した 3 ケースに置換 |

> 関数 signature は変更せず実装中身のみ差し替える。`apps/web` から呼ばれる経路は存在しない（不変条件 #5）。

## 命名規則

| 対象 | 規則 | 例 |
| --- | --- | --- |
| repository helper | `<verb><Subject>` | `hasPendingRequest`, `markResolved`, `markRejected` |
| state transition の SQL | `UPDATE <table> SET ... WHERE <pk>=? AND request_status='pending'` | 全 helper で統一 |
| migration ファイル | `<seq>_<table>_<feature>.sql` | `0007_admin_member_notes_request_status.sql` |
| partial index | `idx_<table>_<filter>` | `idx_admin_notes_pending_requests` |
| RequestStatus 値 | 小文字 + 動詞過去形 | `pending` / `resolved` / `rejected` |
| audit action（07a / 07c 側） | `<entity>.<verb>.<state>` | `admin_member_notes.resolve.resolved`（参考） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の helper signature を After に揃える |
| Phase 9 | typecheck で `adminNotes.ts` からの `RequestStatus` 型 export を確認 |
| 07a / 07c | `markResolved` / `markRejected` を import して resolve workflow を組み立てる |

## 多角的チェック観点

| 不変条件 | DRY 担保 | 確認 |
| --- | --- | --- |
| #4 | 全 SQL 文の対象 table が `admin_member_notes` のみ | grep |
| #5 | `apps/web` から helper を import する経路がない | grep `from '@/repository/adminNotes'` を apps/web 配下で検索 → 0 件 |
| #11 | helper の SQL に `member_responses` / `response_fields` への書き込み無し | grep |
| 過剰共通化回避 | transaction wrapper / zod schema 共有は本タスクで実装しない | scope 限定 |
| 命名整合 | 04b（migration 0006）の命名規則と 0007 が連番・subject 整合 | ファイル名比較 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After 表 | 8 | pending | 10 行 |
| 2 | 共通化候補抽出 | 8 | pending | 5 件 |
| 3 | transaction wrapper 将来案 | 8 | pending | 07a 委譲 |
| 4 | 旧実装削除計画 | 8 | pending | signature 維持 |
| 5 | 命名規則確定 | 8 | pending | helper / migration / index |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | helper interface |
| 必須 | phase-05.md | 擬似コード（After の根拠） |
| 必須 | phase-07.md | AC マトリクス（共通化候補抽出元） |
| 必須 | apps/api/src/repository/adminNotes.ts | Before の現状コード |
| 必須 | apps/api/migrations/0006_admin_member_notes_type.sql | 命名規則の連番起点 |
| 参考 | docs/30-workflows/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/phase-08.md | DRY 化体裁 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before / After + 共通化 + 命名規則 |
| メタ | artifacts.json | Phase 8 を completed |

## 完了条件

- [ ] Before / After が 10 行以上で命名・型・path・signature を網羅
- [ ] 共通化候補が 5 件、本タスク実装範囲と将来委譲範囲を区別
- [ ] transaction wrapper の将来案が 07a に委譲する形で記述
- [ ] 旧 `hasPendingRequest` 実装の削除計画が signature 維持で完結
- [ ] 命名規則が helper / migration / partial index / RequestStatus 値で確定
- [ ] 不変条件 #4 / #5 / #11 への影響が grep ベースで確認可能

## タスク100%実行確認

- [ ] 全実行タスク 5 件 completed
- [ ] artifacts.json で phase 8 を completed
- [ ] outputs/phase-08/main.md が Phase 9 typecheck の前提として参照可能

## 次 Phase への引き渡し

- 次: 9 (品質保証)
- 引き継ぎ: 命名統一を typecheck で確認し、`RequestStatus` 型の export 経路を lint で検証
- ブロック条件: signature 変更で route 側に破壊的変更が出る / 過剰共通化（07a 責務まで取り込む）が発生 / 命名規則が 04b 既存と矛盾 する場合は Phase 8 へ差し戻し

## 実行タスク

1. Before / After 表を 10 行以上で完成
2. 共通化候補 5 件の抽出（本タスク範囲と将来範囲を区別）
3. transaction wrapper の将来案を 07a 委譲として記録
4. 旧 `hasPendingRequest` 実装の削除計画（signature 維持）
5. 命名規則の確定
