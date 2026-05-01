# Phase 8: DRY 化 / リファクタ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Issue | #109 [UT-02A] tag_assignment_queue 管理 Repository / Workflow |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

02a で実装した tag_assignment_queue 管理 Repository / Workflow の重複コードを抽出し、02b queue repository および 03a stableKey alias queue と共有可能な helper を `apps/api/src/lib/queue/` に集約する。02a `memberTags.ts` の read-only 維持（不変条件 #13）を崩さないことを構造的に担保する。

## 実行タスク

1. 02b queue repository（`tag_alias_queue`）と 02a queue repository の重複抽出
2. 03a stableKey alias queue との API 形状（enqueue / transition / retry / DLQ）の統合検討
3. 共通 retry / DLQ helper を `apps/api/src/lib/queue/` に集約
4. IPC 契約ドリフト確認（`apps/web` から D1 / queue を直接参照していないこと）
5. queue alias 仕様語 `candidate / confirmed / rejected` ↔ DB 実装語 `queued / resolved / rejected / dlq` の変換層を 1 箇所に集約

## Before / After

| 区分 | Before | After | 理由 |
| --- | --- | --- | --- |
| repository 関数名 | `insertQueueRow`, `pushTagQueue`, `addCandidate` | `enqueueTagAssignment` | `<subject><action>` 統一、02b/03a と命名整合 |
| status transition | 各 workflow で inline `UPDATE ... WHERE status=?` | `applyQueueTransition(d1, { from, to, queueId })` | guarded update を 1 関数に集約 |
| retry / DLQ | repository 内に inline 記述 | `apps/api/src/lib/queue/retryPolicy.ts` | 02b / 03a と共有 |
| status enum | 各所で literal 文字列 | `apps/api/src/lib/queue/status.ts` の const + zod enum | drift 防止 |
| audit action | `queue.insert`, `queue_resolved` | `admin.tag.queue_enqueued` / `admin.tag.queue_resolved` / `admin.tag.queue_rejected` / `admin.tag.queue_dlq` | 既存 auditAction 命名規則統一 |
| 仕様語 ↔ DB 語 変換 | workflow ごとに inline | `apps/api/src/lib/queue/aliasMap.ts` の `toSpecState(dbState)` / `toDbState(specState)` | 単一情報源 |
| idempotency key | route ごとに inline | `apps/api/src/lib/queue/idempotency.ts` の `withIdempotencyKey()` | 重複排除 |

## 共通化対象

| 種別 | path | 用途 |
| --- | --- | --- |
| util | `apps/api/src/lib/queue/index.ts` | barrel export |
| util | `apps/api/src/lib/queue/status.ts` | status enum / 仕様語マッピング |
| util | `apps/api/src/lib/queue/retryPolicy.ts` | retry attempts / backoff / DLQ 移送 |
| util | `apps/api/src/lib/queue/idempotency.ts` | idempotency key 解決 |
| util | `apps/api/src/lib/queue/aliasMap.ts` | `candidate/confirmed/rejected` ↔ `queued/resolved/rejected/dlq` |
| util | `apps/api/src/lib/d1Tx.ts` | guarded update wrapper（07a 既出 / 02a も同 wrapper を使用） |
| util | `apps/api/src/lib/auditLog.ts` | audit_log INSERT 共通関数 |
| type | `packages/shared/types/admin.ts` | `TagAssignmentQueueRow` / `QueueTransitionResult` |

## 命名規則

| 対象 | 規則 |
| --- | --- |
| repository 関数 | `<subject><Action>` (`enqueueTagAssignment`, `transitionQueueStatus`, `moveToDlq`) |
| route file | `apps/api/src/routes/admin/tagQueue.ts` |
| schema file | `apps/api/src/schemas/tagQueue<Action>.ts` |
| audit action | `<entity>.<verb>[.<state>]`（`admin.tag.queue_*`） |
| status enum | DB 値で保持し境界（API response / schema）でのみ仕様語に変換 |

## IPC 契約ドリフト確認

| 観点 | 検証コマンド | 期待 |
| --- | --- | --- |
| apps/web から D1 直接参照なし | `grep -RIn "DB_BINDING\|d1.prepare" apps/web/src` | 0 件 |
| apps/web から queue repository 直接 import なし | `grep -RIn "from.*lib/queue" apps/web/src` | 0 件 |
| 02a memberTags.ts に write 経路なし | `grep -RIn "INSERT INTO member_tags\|UPDATE member_tags" apps/api/src` | tagQueueResolve workflow 経由のみ（直接 call 0 件） |
| queue 状態遷移の単一窓口 | `grep -RIn "UPDATE tag_assignment_queue" apps/api/src` | `applyQueueTransition` 内のみ |

## 多角的チェック観点

| 不変条件 | DRY 担保 | 確認 |
| --- | --- | --- |
| #5 D1 直接アクセスは apps/api 内に閉じる | apps/web に queue / D1 参照なし | grep |
| #13 02a memberTags.ts read-only 維持 | write は tagQueueResolve workflow 経由のみ | grep |
| 監査 | auditLog 共通関数を全 transition が呼ぶ | grep + unit test |
| retry / DLQ 仕様一貫性 | 02a / 02b / 03a で同一 retryPolicy を使用 | import 経路確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `index.md` | scope / AC / 依存 |
| 必須 | `outputs/phase-07/ac-matrix.md` | AC trace |
| 必須 | `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/phase-08.md` | 命名統一の先例 |
| 参考 | `apps/api/src/lib/d1Tx.ts` | guarded update wrapper |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before/After 7 行 | 8 | pending | 命名統一 |
| 2 | 共通 helper 集約 | 8 | pending | `lib/queue/` 5 件 |
| 3 | 仕様語 ↔ DB 語 変換 | 8 | pending | aliasMap 単一窓口 |
| 4 | IPC 契約 grep 検証 | 8 | pending | apps/web 直接参照 0 |
| 5 | memberTags.ts write 経路 grep | 8 | pending | 0 件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | typecheck で命名統一を検証、grep で IPC drift 0 件を確認 |
| 02b / 03a タスク | `lib/queue/` を共有依存として参照 |
| Phase 11 | 仕様語 ↔ DB 語の変換ログを evidence で確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-08/main.md` | Before / After 表と共通化対象 |
| ドキュメント | `outputs/phase-08/refactor-targets.md` | helper 集約対象一覧と移動表 |
| メタ | `artifacts.json` | Phase 8 を completed |

## 完了条件

- [ ] Before / After 7 行が記録されている
- [ ] `apps/api/src/lib/queue/` への共通化対象 5 件が確定
- [ ] 仕様語 ↔ DB 語 変換が 1 箇所に集約
- [ ] IPC 契約ドリフト grep が 0 件
- [ ] 02a memberTags.ts への write 経路が grep で 0 件
- [ ] 既存 unit / contract test が refactor 後も継続成功
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認

- 全項目記載
- artifacts.json で phase 8 を completed
- refactor 後にユニット / contract テストが継続成功すること

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ: 命名統一 / helper 集約結果を typecheck と grep で検証
- ブロック条件: helper 集約が未完、または IPC drift > 0 件なら差し戻し
