# Phase 5: 実装手順

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 5
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 5 (実装) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-5-implementation.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
> 2026-05-25 にコード実装済み。commit / push / PR / staging runtime は user-gated。

## 1. 改修順序

1. `apps/web/src/lib/admin/api.ts` の `removeAttendance` を DELETE 直叩きへ切替（§2.1）
2. `apps/web/src/components/admin/MeetingPanel.tsx` の `attendanceMutation` を 2 mutation に分割（§2.2）
3. `onAdd` と `confirm` の trigger 呼び出しを差し替え（§2.3）
4. `apps/web/src/lib/admin/__tests__/api.spec.ts` と `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx` を既存拡張し、helper DELETE / remove retry / Idempotency-Key / 4xx no-retry / 404 race を RED → GREEN で実装
5. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck && pnpm --filter @ubm-hyogo/web lint`
6. focused vitest で helper spec + component spec + hook 既存 spec の回帰確認

## 2. ファイル別差分

### 2.1 `apps/web/src/lib/admin/api.ts`

```diff
-export const removeAttendance = (sessionId: string, memberId: string) =>
-  call(`/meetings/${encodeURIComponent(sessionId)}/attendances`, "POST", {
-    memberId,
-    attended: false,
-  });
+export const removeAttendance = (sessionId: string, memberId: string) =>
+  call(
+    `/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
+    "DELETE",
+  );
```

> **注記**: `call` の現行シグネチャ（`apps/web/src/lib/admin/api.ts` 内部 helper）が `(path, method, body?)` で body 省略可なら上記でよい。body 必須な型なら `undefined` 明示。実装時に確認。

### 2.2 `apps/web/src/components/admin/MeetingPanel.tsx`

```diff
-  const attendanceMutation = useAdminMutation<MeetingMutationResponse>(
-    "/api/admin/meetings/attendances",
-    "POST",
-    {
-      refreshOnSuccess: false,
-      mutationFn: (payload) => {
-        const { sessionId, memberId, attended: isAttended } = payload as {
-          sessionId: string;
-          memberId: string;
-          attended: boolean;
-        };
-        return unwrapAdminResult<MeetingMutationResponse>(
-          isAttended ? addAttendance(sessionId, memberId) : removeAttendance(sessionId, memberId),
-        );
-      },
-    },
-  );
+  const addAttendanceMutation = useAdminMutation<MeetingMutationResponse>(
+    "/api/admin/meetings/attendances",
+    "POST",
+    {
+      refreshOnSuccess: false,
+      mutationFn: (payload) => {
+        const { sessionId, memberId } = payload as {
+          sessionId: string;
+          memberId: string;
+        };
+        return unwrapAdminResult<MeetingMutationResponse>(
+          addAttendance(sessionId, memberId),
+        );
+      },
+    },
+  );
+  const removeAttendanceMutation = useAdminMutation<MeetingMutationResponse>(
+    // endpoint は trigger 時に endpointOverride で置換する。placeholder は型整合のためのみ
+    "/api/admin/meetings/__placeholder__/attendance/__placeholder__",
+    "DELETE",
+    {
+      refreshOnSuccess: false,
+      retry: { maxAttempts: 3 },
+      idempotencyKey: () => crypto.randomUUID(),
+    },
+  );
```

### 2.3 trigger 差し替え

```diff
-    await attendanceMutation.trigger(
-      { sessionId, memberId, attended: true },
-    );
+    await addAttendanceMutation.trigger({ sessionId, memberId });
```

```diff
-      await attendanceMutation.trigger({ sessionId, memberId, attended: false });
+      await removeAttendanceMutation.trigger(
+        null,
+        `/api/admin/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
+      );
```

> **payload=null の実装時注意**: hook の `JSON.stringify(null)` は `"null"` 文字列を body に乗せる。API 側 (`app.delete(...)` route) は body を読まないため副作用なしの想定だが、middleware が JSON parse を強制するなら `payload={}` に切替える。実装時に Hono middleware を確認。

### 2.4 spec 拡張（実装済み）

- `apps/web/src/lib/admin/__tests__/api.spec.ts`: `addAttendance` は POST alias、`removeAttendance` は DELETE `/meetings/:sessionId/attendance/:memberId` を呼ぶことを固定。
- `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx`: 既存の confirm / toast / optimistic UI coverage に、DELETE fetch 経路・body `"null"`・`Idempotency-Key` header・4xx no-retry・5xx retry（3 attempts）・404 race を追加。

## 3. 検証コマンド

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx \
  apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts \
  --reporter=default

mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## 4. DoD（Definition of Done）

- [ ] AC-1〜AC-8 すべて満たす
- [x] focused Vitest 3 files / 97 tests PASS
- [ ] 既存 hook spec の TC-13..19 / TC-27..29 / TC-TY-01 が無回帰
- [ ] `pnpm typecheck` / `pnpm lint` 0 error
- [ ] `useAdminMutation.ts` 本体に diff なし
- [ ] `apps/api/src/routes/admin/attendance.ts` に diff なし
- [ ] `outputs/phase-11/` に local vitest 実行 log を配置
- [ ] commit / push / PR は user 明示承認後のみ実行
