# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

resolve workflow の state machine、tx 境界、handler 構造、candidate 投入 hook、audit log 連携を設計する。

## 実行タスク

1. state machine 図 (Mermaid)
2. tx 境界（queue 更新 + member_tags + audit を atomic に）
3. handler 関数の signature 設計
4. candidate 投入 hook の設計（03b に渡すインターフェース）
5. audit_log payload 構造

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | 状態遷移表 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | tx model |
| 必須 | doc/02-application-implementation/02b-parallel-meeting-tag-queue-and-schema-diff-repository/index.md | queue repo signature |
| 必須 | doc/02-application-implementation/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/index.md | audit repo signature |

## 実行手順

### ステップ 1: state machine 図
（下記 Mermaid 参照）

### ステップ 2: tx 境界
- D1 batch（D1 は serializable batch しかないため、wrapper で transaction emulation）
- 失敗時は queue update を含む全 statement が rollback される設計
- batch ステートメント: ① SELECT queue (status check) ② UPDATE queue ③ INSERT member_tags ④ INSERT audit_log

### ステップ 3: handler signature
```ts
// apps/api/src/workflows/tagQueueResolve.ts
export async function tagQueueResolve(
  env: Env,
  input: { queueId: string; actorUserId: string; action: 'confirmed' | 'rejected'; tagCodes?: string[]; reason?: string }
): Promise<{ queueId: string; status: 'confirmed' | 'rejected'; resolvedAt: string; memberId: string; tagCodes?: string[] }>
```

### ステップ 4: candidate 投入 hook
- 03b の `forms.responses.list` 完了後に呼ぶ
- `enqueueTagCandidate(env, { memberId, responseId })` を export
- 既に未解決 queue が存在 or member_tags が空でない場合は skip

### ステップ 5: audit_log payload
```json
{
  "actor": "admin.userId",
  "action": "tag_queue.resolve.confirmed",
  "target": { "type": "tag_assignment_queue", "id": "queue_xxx" },
  "payload": { "memberId": "...", "tagCodes": ["ai", "dx"] },
  "occurredAt": "2026-04-26T..."
}
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | alternative 評価 |
| Phase 4 | tx 境界を test 対象に |
| Phase 5 | 擬似コード作成 |
| Phase 8 | 共通化（audit log 構造） |

## 多角的チェック観点

| 不変条件 | 設計担保 | 理由 |
| --- | --- | --- |
| #5 | workflow は apps/api/src/workflows 内、外部 import なし | data access boundary |
| #13 | member_tags への INSERT は本 workflow 経由のみ（その他 path 禁止） | grep で検出可能 |
| 認可境界 | endpoint 側の admin gate を信頼、workflow は actor のみ受ける | 二重チェックは endpoint で |
| 無料枠 | 1 resolve = 4 D1 ops（batch） | 100k/日内 |
| audit | 全 resolve が audit_log に残る | 操作トレース |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | state machine 図 | 2 | pending | Mermaid |
| 2 | tx 境界 | 2 | pending | D1 batch |
| 3 | handler signature | 2 | pending | TS type |
| 4 | candidate 投入 hook | 2 | pending | 03b 連携 |
| 5 | audit payload | 2 | pending | JSON shape |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | サマリー |
| ドキュメント | outputs/phase-02/tag-queue-state-machine.md | Mermaid + tx 境界 + handler |
| メタ | artifacts.json | Phase 2 を completed |

## 完了条件

- [ ] state machine 図が valid Mermaid
- [ ] tx 境界に「全 4 ステートメントの atomic 性」明記
- [ ] handler signature が TS で記述
- [ ] candidate 投入 hook の interface 確定
- [ ] audit payload structure 確定

## タスク100%実行確認

- 全成果物が outputs/phase-02 配下
- 不変条件 #5, #13 に設計上の担保
- artifacts.json で phase 2 を completed

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ: state machine + handler signature を alternative 評価へ
- ブロック条件: state machine 未確定なら次へ進めない

## 構成図 (Mermaid)

```mermaid
stateDiagram-v2
  [*] --> candidate: 03b forms sync hook<br/>enqueueTagCandidate
  candidate --> confirmed: action=confirmed<br/>tagCodes ⊆ tag_definitions
  candidate --> rejected: action=rejected<br/>reason!=""
  confirmed --> confirmed: idempotent<br/>(same tagCodes, no new audit)
  rejected --> rejected: idempotent<br/>(same reason, no new audit)
  confirmed --> [X]: ❌ 409 (state conflict)
  rejected --> [X]: ❌ 409 (state conflict)
  note right of confirmed: tx atomic:<br/>1) UPDATE queue<br/>2) INSERT member_tags<br/>3) INSERT audit_log
  note right of rejected: tx atomic:<br/>1) UPDATE queue<br/>2) INSERT audit_log
```

## 環境変数一覧

| 区分 | 代表値 | 置き場所 | 利用箇所 |
| --- | --- | --- | --- |
| D1 binding | DB | wrangler binding | workflow 内 |

## 設定値表

| 項目 | 方針 | 根拠 |
| --- | --- | --- |
| tx 実装 | D1 batch | Cloudflare D1 制約 |
| state model | candidate / confirmed / rejected | unidirectional |
| candidate 投入 | 03b sync hook | 即時性 |
| audit | 全 resolve に entry | 監査要件 |

## 依存マトリクス

| 種別 | 対象 | 役割 |
| --- | --- | --- |
| 上流 | 04c endpoint | 呼び出し元 |
| 上流 | 06c UI | resolve POST |
| 上流 | 03b sync | candidate 投入 |
| 上流 | 02b repo | queue / member_tags / tag_definitions |
| 上流 | 02c repo | audit_log |
| 下流 | 08a test | unit / contract |
| 下流 | 08b test | E2E |

## Module 設計

| module | path | 責務 |
| --- | --- | --- |
| tagQueueResolve | apps/api/src/workflows/tagQueueResolve.ts | resolve 本体 |
| enqueueTagCandidate | apps/api/src/workflows/tagCandidateEnqueue.ts | 03b から呼ぶ |
| tagQueueRoutes | apps/api/src/routes/admin/tagQueue.ts | endpoint handler |
| tagQueueValidation | apps/api/src/schemas/tagQueueResolve.ts | zod schema |
