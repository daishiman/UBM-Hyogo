# UT-02A: tag_assignment_queue 管理 Repository / Workflow — formal stub

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-imp-02a-tag-assignment-queue-management-001 |
| タスク名 | tag_assignment_queue 管理 Repository / Workflow |
| 分類 | 機能追加 / repository 基盤 |
| 対象機能 | Forms→tag 反映パイプラインの queue 書き込み側 |
| 優先度 | 高 |
| 見積もり規模 | 中規模 |
| ステータス | implemented-local（Phase 1〜12 完了、Phase 13 はユーザー承認待ち） |
| 発見元 | 02a Phase 12 unassigned-task-detection #3 |
| 発見日 | 2026-04-26 |
| 仕様書作成日 | 2026-05-01 |
| GitHub Issue | #109（CLOSED） |
| Wave | 2-plus |
| 推奨担当 | 03a (forms schema sync and stablekey alias queue) または 07a (tag assignment queue resolve workflow) |

## 概要

02a `apps/api/src/repositories/memberTags.ts` は **read-only** に固定されており、tag 割当の queue 書込み・状態遷移は別タスクへ委譲されている。
しかし `tag_assignment_queue` の write 経路自体が未実装のため、現状では **Forms→tag 反映が成立しない**。
本タスクで queue の CRUD / 状態遷移 / idempotency / retry / DLQ を持つ repository を新設し、03b の forms sync hook と 07a の resolve workflow を接続する。

## 受入条件（要約）

- `tag_assignment_queue` の CRUD と状態遷移を扱う repository が `apps/api` 内に存在する。
- idempotency key（`memberId + responseId`。現行 candidate は tagCode 未確定）で重複 enqueue を防止する。
- retry（指数バックオフ 3 回）と DLQ（同一 table の `status='dlq'`）が動作する。
- 02a `memberTags.ts` の read-only 制約が **型レベル test**（vitest --typecheck）で固定されている。
- 不変条件 #5（D1 直接アクセスは `apps/api` 内）と #13（`member_tags` への書込みは 07a resolve 経由のみ）を遵守する。

## 不変条件

- #5: D1 直接アクセスは `apps/api` 内に閉じる。`apps/web` から本 repository を import しない。
- #13: `member_tags` の書込みは 07a queue resolve 経由のみ。本タスクは queue のみ操作。
- 02a `memberTags.ts` の read-only 制約を維持する（write 系 export を禁止する型 test を pass させ続ける）。

## 関連タスク

- 上流: 02a, 02b, 03a
- 下流: 07a（本タスクの queue を消費する resolve workflow）, 08a（contract test）

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/memberTags.ts` / `apps/api/src/repository/tagQueue.ts`
- 症状: 02a 側の `memberTags.ts` は read-only 境界を守る必要がある一方、Forms 同期から tag candidate を投入する write 経路が未確立で、07a resolve workflow が消費する queue 行を生成できない。
- 参照: `docs/30-workflows/completed-tasks/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md` #3、`docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `member_tags` へ直接書き込む実装が混入し、不変条件 #13 を破る | Phase 4 で type-level test と grep を追加し、write は 07a resolve workflow の guarded update 後だけに限定する |
| `tag_assignment_queue` の status 語が 07a 正本と drift する | Phase 2 / Phase 7 で `candidate/confirmed/rejected` と `queued/resolved/rejected/dlq` の対応表を固定し、migration / repository / shared schema を grep 照合する |
| idempotency key が粗すぎて別 response の候補を潰す | `<memberId>:<responseId>` を最小単位にし、同一 response の重複 enqueue は既存 queueId を返し、別 response は別 key として test する |
| retry 失敗行が pending に残り続ける | MAX_RETRY=3 超過時に `status='dlq'` へ隔離し、Phase 11 の NON_VISUAL evidence で listPending から除外されることを確認する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api test -- tagAssignmentQueue
```

期待: enqueue / idempotency / transition / retry / DLQ / read-only type test がすべて PASS。

### 統合検証

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT status, COUNT(*) FROM tag_assignment_queue GROUP BY status;"
rg -n "INSERT INTO member_tags|UPDATE member_tags" apps/api/src/repository/memberTags.ts apps/api/src/repository/tagAssignmentQueue.ts
```

期待: queue status が `queued/resolved/rejected/dlq` のみで表現され、02a `memberTags.ts` に write 経路がない。

## スコープ

### 含む

- `tag_assignment_queue` の CRUD / list / state transition / idempotency / retry / DLQ を扱う repository 設計と実装。
- 03b Forms sync hook から呼べる `enqueueTagCandidate(env, payload)` public API。
- 02a `memberTags.ts` read-only 制約を固定する type-level / grep test。
- migration SQL と repository 型の grep 照合。

### 含まない

- 07a resolve workflow 本体（既存 07a workflow が消費側を担当）。
- `member_tags` への直接 INSERT / UPDATE 経路。
- 自己申告タグ UI、tag_definitions seed、schema_diff_queue、attendance queue。

## 本タスク仕様書（正本）

- index: `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/index.md`
- Phase 1（要件定義）: `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/phase-01.md`
- Phase 2（設計）: `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/phase-02.md`
- Phase 3（設計レビュー）: `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/phase-03.md`
- artifacts: `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/artifacts.json`

## 備考

- GitHub Issue #109 は CLOSED 状態のままだが、構造的欠落の解消が必要なため正式な仕様書として保存する。
- 正本仕様書は Phase 1〜12 の実装・NON_VISUAL evidence・ドキュメント同期まで完了済み。Phase 13 の commit / push / PR 作成はユーザー承認待ち。
