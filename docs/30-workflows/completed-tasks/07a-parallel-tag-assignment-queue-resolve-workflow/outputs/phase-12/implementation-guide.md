# 07a: tag_assignment_queue resolve workflow — implementation-guide

## Part 1: 初学者向けの説明

なぜ必要か。会員が回答した内容からタグを付けるとき、すぐに名簿へ書き込むと間違ったタグが混ざる可能性がある。たとえば教室の係が提出物を集め、先生が確認してから名簿に丸を付けるイメージにすると、確認前のものと確認後のものを分けられる。

何をしたか。今回作ったものは、タグ候補をいったん確認待ちの箱に入れ、管理者が「承認」または「却下」を選べる仕組みである。承認されたものだけが会員のタグ一覧に入る。却下するときは理由を残すので、あとからなぜ入れなかったかを確認できる。

### 今回作ったもの

- 回答取り込み後にタグ候補を確認待ちへ入れる処理
- 管理者がタグ候補を承認または却下する処理
- 承認時だけ会員タグへ反映する守り
- 却下理由と操作記録を残す仕組み
- 管理画面から承認・却下を呼び出すためのつなぎ込み

## Part 2: 技術者向けの実装詳細

### 概要

管理者が `/admin/tags` で tag candidate を **confirmed**（承認＝member_tags に反映）または **rejected**（却下＝reason 必須）するための workflow を実装した。03b の forms response sync 直後に candidate 自動投入する hook も追加し、不変条件 #13（tag は queue 経由のみ）を担保している。

### 主な変更

| path | 変更 |
| --- | --- |
| `apps/api/src/workflows/tagQueueResolve.ts` | **新規** resolve workflow（state machine + guarded update + audit） |
| `apps/api/src/workflows/tagCandidateEnqueue.ts` | **新規** 03b sync hook 用 candidate enqueue |
| `apps/api/src/schemas/tagQueueResolve.ts` | **新規** zod discriminatedUnion |
| `apps/api/src/routes/admin/tags-queue.ts` | resolve handler を workflow 呼び出しに差し替え（zod body 必須化、エラーコード→http status マッピング） |
| `apps/api/src/repository/tagQueue.ts` | `TagQueueStatus` に `rejected` 追加、`ALLOWED_TRANSITIONS` を queued→{resolved,rejected}, reviewing→{rejected} まで拡張 |
| `apps/api/src/jobs/sync-forms-responses.ts` | response 取り込み後に `enqueueTagCandidate` を呼ぶ step 7 を追加 |
| `apps/web/src/lib/admin/api.ts` / `TagQueuePanel.tsx` | resolve body を confirmed/rejected discriminated union に追従、`rejected` filter を追加 |
| `packages/shared/src/{zod,types}/identity` | `TagAssignmentQueueItem.status` に `rejected` を追加 |
| `apps/api/src/{workflows,schemas,routes/admin}/*.test.ts` | 新規・更新テスト 33 ケース |

### TypeScript 型定義

```ts
type TagQueueResolveBody =
  | { action: "confirmed"; tagCodes: string[] }
  | { action: "rejected"; reason: string };

type TagQueueResolveResult = {
  queueId: string;
  status: "resolved" | "rejected";
  resolvedAt: string;
  memberId: string;
  tagCodes?: string[];
  reason?: string;
  idempotent: boolean;
};
```

### 状態遷移

```
[*] -- 03b sync hook --> queued (candidate)
queued      --> resolved (confirmed) | rejected
resolved    --> resolved (idempotent / 同 tagCodes)
rejected    --> rejected (idempotent / 同 reason)
resolved/rejected -> 終端（逆走は 409）
```

### APIシグネチャ

`POST /admin/tags/queue/:queueId/resolve`

```ts
resolveTagQueue(queueId: string, body: TagQueueResolveBody): Promise<TagQueueResolveResult>
```

### 使用例

```ts
await resolveTagQueue("queue_123", {
  action: "confirmed",
  tagCodes: ["interest-ai", "interest-dx"],
});

await resolveTagQueue("queue_456", {
  action: "rejected",
  reason: "duplicate registration",
});
```

Request body (zod discriminatedUnion):
```json
{ "action": "confirmed", "tagCodes": ["interest-ai", "interest-dx"] }
```

Response 200:
```json
{
  "ok": true,
  "result": {
    "queueId": "q_xxx",
    "status": "resolved" | "rejected",
    "resolvedAt": "2026-04-30T...",
    "memberId": "m_xxx",
    "tagCodes": ["..."],          // confirmed のみ
    "reason": "...",              // rejected のみ
    "idempotent": false           // 既終端で同 payload 再投入時 true
  }
}
```

### エラーハンドリング

| http | error code | 状況 |
| --- | --- | --- |
| 400 | (zod) / missing_tag_codes / missing_reason | body 不正 |
| 401 | - | session なし |
| 403 | - | 非 admin |
| 404 | queue_not_found | queueId 不在 |
| 409 | state_conflict / idempotent_payload_mismatch / race_lost | 不可逆遷移試行・別 payload・並行 race |
| 422 | unknown_tag_code / member_deleted | tag_definitions 未登録 / 削除済み member |

### エッジケース

- 既に終端状態の queue へ同じ payload を送った場合は `idempotent: true` で返す。
- 既に終端状態の queue へ別 payload を送った場合は 409 にする。
- 並行 POST で guarded update に負けた場合は 409 にする。
- unknown tag code または削除済み member は会員タグへ反映しない。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| status alias | `candidate -> queued`, `confirmed -> resolved`, `rejected -> rejected` |
| terminal status | `resolved`, `rejected` |
| audit action | `tag_queue.resolve.confirmed`, `tag_queue.resolve.rejected` |
| NON_VISUAL evidence | Vitest / API smoke / D1 SQL |

### 不変条件

- **#5**: workflow は `apps/api/src/workflows/` 配下、`apps/web` から D1 直接 import なし（grep gate PASS）
- **#13**: `member_tags` への INSERT は本 workflow 内 guarded update 成功後のみ（grep gate PASS）。03b sync hook 経由の candidate 投入と admin の resolve 経由しか member_tags は更新されない

### テスト構成

| layer | 対象 |
| --- | --- |
| schema | `TagQueueResolveBody` discriminated union |
| workflow | guarded update / idempotent / race |
| route | admin gate / HTTP error mapping |
| repository | queue status transition |
| web client | `resolveTagQueue(queueId, body)` body contract |

### 品質ゲート結果

```
typecheck: PASS (0 errors)
lint:      PASS (lint = tsc --noEmit)
test:      PASS (69 files / 406 tests)
```

### Phase 11 / visual evidence

本タスクは API-only / NON_VISUAL であり、`apps/web` 画面差分はない。スクリーンショットは N/A。代替 evidence は Phase 11 の API smoke 手順、D1 観測 SQL、Vitest (`apps/api`) とし、UI 連携の実ブラウザ確認は 08b Playwright E2E / 09a staging smoke に委譲する。

### handoff

- **08a** (api contract / authorization tests): 本 workflow の追加 contract テストを実装
- **08b** (Playwright E2E): `/admin/tags` UI から resolve → `/admin/members` で tag 反映を E2E で検証（AC-9）
- **UT-07A-03**: staging で並行 POST race smoke を検証
- **refactor 候補**: `apps/api/src/repository/memberTags.ts` の `assignTagsToMember` は production caller がなくなったため削除可能（別タスク）

### 参照

- 仕様: [docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/](..)
- state machine: [phase-02/tag-queue-state-machine.md](../phase-02/tag-queue-state-machine.md)
- AC マトリクス: [phase-07/ac-matrix.md](../phase-07/ac-matrix.md)
- 品質ゲート: [phase-09/main.md](../phase-09/main.md)
