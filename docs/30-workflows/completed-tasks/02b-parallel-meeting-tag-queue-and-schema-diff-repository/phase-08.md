# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 7 |
| 下流 | Phase 9 |
| 状態 | completed |

## 目的

7 ファイルの命名 / path / SQL を DRY 化、02a / 02c との共有点を整理。

## DRY 対象

### 1. 命名

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| repository ファイル | `meeting.ts` / `meetings.ts` | `meetings.ts`（複数形） | 02a と統一、テーブルが複数行を扱う |
| status enum | `TagQueueState` / `TagQueueStatus` | `TagQueueStatus` | 02a の `MemberStatusRow` と整合（`Status` を採用） |
| エラー class | `InvalidTransition` / `IllegalStateTransition` | `IllegalStateTransition` | 既存例外と命名統一 |
| 結果 type | `Result<T>` / `AddAttendanceResult` | discriminated union（`{ ok: true } | { ok: false; reason }`） | 結果型を関数別に明示 |

### 2. path

| Before | After | 理由 |
| --- | --- | --- |
| `apps/api/src/repository/meeting.ts` | `apps/api/src/repository/meetings.ts` | 複数形 |
| `apps/api/test/repository-02b/` | `apps/api/src/repository/__tests__/` | 02a と colocate 統一 |
| `apps/api/fixtures-02b/` | `apps/api/src/repository/__fixtures__/` | 同上 |

### 3. shared with 02a / 02c

| 共有点 | 場所 | 担当 |
| --- | --- | --- |
| `_shared/db.ts` (DbCtx) | 02a が source | 02a |
| `_shared/brand.ts` | 02a が source | 02a |
| dependency-cruiser config | 02c メイン | 02c |
| in-memory D1 fixture loader | 02c | 02c |
| 02a の `member_status` 参照（`attendance.listAttendableMembers` 内 JOIN） | SQL JOIN で読む（import せず） | 02b（read-only SQL） |

### 4. test の DRY

| Before | After |
| --- | --- |
| `setupD1()` を毎 test で呼ぶ | `__tests__/_setup.ts` を 02c が共通化、02b は import |
| fixture を inline | `__fixtures__/*.fixture.ts` から import |
| `expect(row.status).toBe("queued")` 連発 | `expectTagQueue(row, expected)` ヘルパー |

### 5. SQL の DRY

| Before | After |
| --- | --- |
| `SELECT * FROM ...` を inline | `_shared/sql.ts` に `selectMeetings()` / `selectAttendance()` helper |
| status enum 文字列を SQL に直書き | `TagQueueStatus` 型から派生（drift 防止） |
| `INSERT INTO ... VALUES (?1, ?2, ...)` の重複 | `_shared/sql.ts` に `insertSql(table, cols)` helper |

## Before / After 集約

| カテゴリ | Before | After | 削減 |
| --- | --- | --- | --- |
| 命名 | 4 種揺れ | 0 | 100% |
| path | 3 種揺れ | 0 | 100% |
| shared | 5 件 | 02a/02b/02c で正本確定 | redundant 0 |
| test | 3 種重複 | 0 | 100% |
| SQL | 3 種重複 | 0 | 100% |

## 実行タスク

1. Before/After 表を `outputs/phase-08/before-after.md`
2. shared 共有点を `outputs/phase-08/main.md`
3. 命名 / path / SQL ルール
4. test ヘルパー signature

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 runbook | 対象 placeholder |
| 必須 | Phase 7 ac-matrix | 触れる範囲 |
| 参考 | 02a / 02c | 共有合意 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 9 | DRY 後 lint/typecheck |
| 02a / 02c | shared 合意 |
| 03a / 04c / 07a/b/c | After 命名で実装 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| boundary | #5 | `_shared/` 共有が `apps/api/src/repository/` 配下 |
| 02a 共有 | — | `_shared/db.ts` / `_shared/brand.ts` の正本が 02a |
| schema 集約 | #14 | schema 系 3 ファイルが repository 配下に閉じる |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 命名 | completed |
| 2 | path | completed |
| 3 | shared | completed |
| 4 | test | completed |
| 5 | SQL | completed |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-08/main.md | DRY ルール + 共有 |
| outputs/phase-08/before-after.md | 5 カテゴリ |

## 完了条件

- [ ] 5 カテゴリ Before/After 一致
- [ ] 02a / 02c との共有合意明示
- [ ] test helper signature 定義

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-08/* 配置済み
- [ ] artifacts.json の Phase 8 を completed

## 次 Phase

- 次: Phase 9
- 引き継ぎ事項: Before/After + 共有合意
- ブロック条件: 02a/02c と矛盾なら Phase 8 再実行
