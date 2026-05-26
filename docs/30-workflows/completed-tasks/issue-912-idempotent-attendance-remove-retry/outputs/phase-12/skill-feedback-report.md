# Skill Feedback Report — issue-912

## Skill 反映結果

実装・Vitest 実行完了後、以下を同 wave で反映した。

| skill | 反映先 |
|---|---|
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-912-idempotent-attendance-remove-retry-2026-05.md`, `references/workflow-issue-912-idempotent-attendance-remove-retry-artifact-inventory.md`, `indexes/resource-map.md`, `indexes/quick-reference.md`, `references/task-workflow-active.md`, `references/lessons-learned.md`, `LOGS/_legacy.md` |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` |

### L-I912-001: 冪等 endpoint が既存なのに UI が非冪等 POST + mutationFn を選ぶ事象

- 症状: server 側に DELETE 等の冪等 endpoint があるが、UI 側が 1 つの mutation で「同 endpoint への POST + `attended:true|false` の body 分岐」+ `mutationFn` の合体経路を選んでしまい、`useAdminMutation` の retry/timeout/abort/idempotencyKey が一切効かない
- 発見方法: `apps/api/src/routes/admin/` で `app.(put|delete)(` を grep し、UI 側の対応 caller が `useAdminMutation(..., "POST"|"PATCH", { mutationFn })` になっていないかを照合
- 修正パターン: mutation を 2 本に分割し、冪等側を素の fetch 経路 + `retry` + `idempotencyKey` で opt-in

### L-I912-002: `useAdminMutation` 最初の運用 retry caller の最小 opt-in 形

```ts
useAdminMutation(endpoint, "DELETE", {
  retry: { maxAttempts: 3 },
  idempotencyKey: () => crypto.randomUUID(),
});
```

- `mutationFn` を**使わない**ことが retry 発火の前提（hook L207-217 分岐）
- POST/PATCH に同じ options を書くと TC-TY-01 と同じ型エラーで弾かれる

### L-I912-003: `trigger(payload, endpointOverride)` を可変 path 化に使うパターン

- hook シグネチャ（L178）の第 2 引数 `endpointOverride` を利用すると、宣言時の placeholder endpoint を trigger 時に動的 path に置換できる
- `encodeURIComponent` を path segment ごとに適用すること

### L-I912-004: DELETE で payload を渡す際の hook fetch 仕様

- hook は `JSON.stringify(payload)` を常に body に乗せる（method 不問）
- DELETE で payload=null を渡すと body=`"null"`、payload=undefined だと body=`undefined`（JSON 化されない場合あり）
- 副作用は Hono の DELETE route handler が body を読むかどうかに依存。実装時に必ず route handler 実装を確認する

### L-I912-005: 「冪等 endpoint × POST + mutationFn 罠」検出 grep

```bash
grep -rn 'useAdminMutation.*"POST".*mutationFn\|useAdminMutation.*"PATCH".*mutationFn' apps/web/src/components/admin
```

ヒットしたら server 側に対応 PUT/DELETE があるか調査し、あれば冪等経路への切替を検討する。
