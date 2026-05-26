# Phase 2: 設計

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 2
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 2 (設計) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-2-design.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
## 1. 全体方針

UI mutation 経路を 2 系統に分離し、解除側のみ冪等 DELETE + reliability を opt-in する。helper / hook / API どれも既存 surface を活用し、新規 export / 新規型 / 新規 endpoint は一切作らない。

```
┌─────────────────────────────┐
│ MeetingPanel.tsx            │
│  ├─ addAttendanceMutation   │── POST  /api/admin/meetings/attendances           (非冪等・retry 不可)
│  │    useAdminMutation(_, "POST", { mutationFn })  ← 既存挙動を維持
│  │
│  └─ removeAttendanceMutation│── DELETE /api/admin/meetings/{sessionId}/attendance/{memberId}
│       useAdminMutation(endpoint, "DELETE", {                      (冪等・retry opt-in)
│         retry: { maxAttempts: 3 },
│         idempotencyKey: () => crypto.randomUUID(),
│       })
└─────────────────────────────┘
                                  ↓
┌─────────────────────────────┐
│ apps/api/.../attendance.ts  │
│  app.delete("/meetings/:sessionId/attendance/:memberId", ...)   ← 既存・naturally idempotent
└─────────────────────────────┘
```

## 2. ファイル別差分設計

### 2.1 `apps/web/src/lib/admin/api.ts`

| 関数 | Before | After |
|---|---|---|
| `removeAttendance(sessionId, memberId)` | `call(\`/meetings/${enc(sessionId)}/attendances\`, "POST", { memberId, attended: false })` | `call(\`/meetings/${enc(sessionId)}/attendance/${enc(memberId)}\`, "DELETE")` |

**シグネチャ**:

```ts
export const removeAttendance = (sessionId: string, memberId: string) =>
  call(
    `/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
    "DELETE",
  );
```

- `call` の現行シグネチャは `call(path, method, body?)`。body 省略可なら DELETE はそのまま。body 必須なら `undefined` を渡す形に合わせる（実装時に `call` 実体を確認して合わせる）。
- `addAttendance` は無変更（POST `/attendances` + `{ attended: true }`）。
- 戻り値型は既存と互換（呼び出し元の `unwrapAdminResult` が JSON shape に依存）。

### 2.2 `apps/web/src/components/admin/MeetingPanel.tsx`

#### Before（L106-122 抜粋）

```ts
const attendanceMutation = useAdminMutation<MeetingMutationResponse>(
  "/api/admin/meetings/attendances",
  "POST",
  {
    refreshOnSuccess: false,
    mutationFn: (payload) => {
      const { sessionId, memberId, attended: isAttended } = payload as {...};
      return unwrapAdminResult<MeetingMutationResponse>(
        isAttended ? addAttendance(sessionId, memberId) : removeAttendance(sessionId, memberId),
      );
    },
  },
);
```

#### After

```ts
const addAttendanceMutation = useAdminMutation<MeetingMutationResponse>(
  "/api/admin/meetings/attendances",
  "POST",
  {
    refreshOnSuccess: false,
    mutationFn: (payload) => {
      const { sessionId, memberId } = payload as { sessionId: string; memberId: string };
      return unwrapAdminResult<MeetingMutationResponse>(addAttendance(sessionId, memberId));
    },
  },
);

const removeAttendanceMutation = useAdminMutation<MeetingMutationResponse>(
  // endpoint は trigger 時に endpointOverride で sessionId/memberId を埋め込む
  "/api/admin/meetings/__placeholder__/attendance/__placeholder__",
  "DELETE",
  {
    refreshOnSuccess: false,
    retry: { maxAttempts: 3 },
    idempotencyKey: () => crypto.randomUUID(),
  },
);
```

#### trigger 側差分

- `onAdd`（L168 付近）: `attendanceMutation.trigger({ sessionId, memberId, attended: true })` → `addAttendanceMutation.trigger({ sessionId, memberId })`
- `confirm`（L213 付近, kind === "remove"）: `attendanceMutation.trigger({ sessionId, memberId, attended: false })` → `removeAttendanceMutation.trigger(null, \`/api/admin/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}\`)`
  - `useAdminMutation` の `trigger(payload, endpointOverride?)` シグネチャ（L178）を使い、可変 path を override で渡す
  - DELETE はリクエスト body 不要だが、hook は `body: JSON.stringify(payload)` を常に付与するため、`payload` は `null` に固定する。API 側は body を読まない。

> **payload の実装注記**: hook の L225-234 は `body: JSON.stringify(payload)` を常に付与する。DELETE では `payload = null` に固定し、spec で `body === "null"` を assert する。API 側 (`app.delete(...)` route handler) は body を読まないため副作用はない。

### 2.3 既存挙動の保持マトリクス

| 既存挙動 | 保持方法 |
|---|---|
| 楽観 UI 戻し（404 race） | `confirm` 内の `if (e instanceof FetchAuthedError && e.status === 404) {...}` は無変更 |
| 409 / 422 / その他 4xx の toast | `onAdd` 側の `if 422 → "削除済み会員"` / `if 409 → "既に出席登録"` は無変更（add 側のみ） |
| 解除側 toast「削除に失敗: ...」 | `confirm` 内 else 句で `getAdminMutationMessage(e)` 表示 — 無変更 |
| `router.refresh` の呼び出しタイミング | 既存どおり `refreshOnSuccess: false` で抑制し、楽観 UI 後に local state 更新 |
| `confirm.useConfirmDialog` の throw | DELETE が retry 後も最終的に失敗した場合 `removeAttendanceMutation.trigger` は throw する。既存の `throw e` で confirm dialog 側のローディング解除フロー維持 |

## 3. 既定値の妥当性

| 項目 | 採用値 | 根拠 |
|---|---|---|
| `maxAttempts` | `3`（初回 + 2 retry） | admin 同期 UX。3 を超えると最悪 200 + 400 + 800 ms = 1.4s の待ちが発生し体感悪化。3 はリスト操作の許容上限 |
| `baseDelayMs` | 既定 200（hook DEFAULT） | exponential backoff の初期遅延として妥当 |
| `maxDelayMs` | 既定 2000（hook DEFAULT） | admin 同期 UX で 2s 超は不可 |
| `retryOn` | 既定（network error / 5xx） | 4xx は再試行で直らない。409 race は楽観 UI 戻しで吸収するため retry 対象外で正しい |
| `idempotencyKey` | `() => crypto.randomUUID()` | trigger 毎に再評価。crypto は Workers / 現代 jsdom 双方で利用可（spec で stub） |

## 4. 型・overload 観点

- `useAdminMutation("...", "DELETE", { retry, ... })` は overload L126-130 にマッチし、`UseAdminMutationIdempotentOptions<T>` を受け付ける（retry が型で渡せる）
- 誤って `addAttendanceMutation` 側に `retry` を書いたら overload L132-136 によって型エラーになる（TC-TY-01 と同じ機構）

## 5. 影響範囲

| 影響面 | 詳細 |
|---|---|
| API | なし（既存 endpoint 利用） |
| D1 | なし |
| Auth | なし（既存 admin auth middleware を通る） |
| 観測性 | なし（既存 audit log がそのまま動く） |
| 後続 caller の参考実装 | あり（将来 PUT 全体置換 caller の opt-in 宣言の参考） |

## 6. リスクと対策

| リスク | 対策 |
|---|---|
| DELETE body の payload 渡し方による server 側 parse error | `payload=null` に固定し、spec で `body` 値を assert |
| `endpointOverride` の URL encoding 漏れ | `encodeURIComponent(sessionId)` / `encodeURIComponent(memberId)` を必ず適用。spec で `fetch` 呼び出し URL を完全一致 assert |
| retry 中の楽観 UI 状態不整合 | `refreshOnSuccess: false` を維持し、`onSuccess` での local state 更新は trigger 完了後の `.then` チェーンで行う既存パターンを踏襲 |
| 後続「server 側 dedupe 無し」由来の二重書き込み | DELETE が naturally idempotent（再削除は 404 race で吸収）なため安全。AC-7 で 404 race 既存ハンドリングを spec 化 |
