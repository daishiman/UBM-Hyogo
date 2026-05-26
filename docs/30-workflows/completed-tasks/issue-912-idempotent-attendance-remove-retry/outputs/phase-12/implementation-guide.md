# Implementation Guide — issue-912

## 目的

issue-842 で整備済みの `useAdminMutation` reliability policy（retry / idempotencyKey / overload 型ガード）を、admin 出席解除経路で **初の運用 caller** として opt-in 有効化する。

## Part 1 — 中学生レベル概念説明

### なぜ必要か

出席解除の操作は、ネットワークが一瞬失敗したときに管理者がもう一度押したくなる操作です。たとえば名簿から名前を消す作業で、途中でペンが止まったら「消せたのか、まだなのか」が分からず同じ作業をもう一度してしまう、という状態に似ています。

### 何をするか

安全に何度試しても同じ結果になる「出席解除」だけを、失敗時に自動でもう一度試せる経路へ切り替えます。出席登録は同じ人を二重登録する危険があるため、今までどおり自動再試行しません。

### 今回作ったもの

- 出席解除を既存の DELETE endpoint へ向ける helper
- 登録用 POST と解除用 DELETE を分けた `MeetingPanel`
- 解除だけが retry と `Idempotency-Key` header を使うことを確認するテスト

- **冪等（idempotent）** とは: 「同じボタンを 2 回押しても結果が同じ」性質。出席解除を 2 回試しても「もう解除されてる」状態は変わらない。だから **安全に何度でも試せる**
- **retry（自動再試行）** とは: ネット回線が一瞬詰まって失敗したとき、コンピュータが自分で「もう一回」を試す仕組み。人がもう一度押す代わりに自動でやる
- **Idempotency-Key** とは: 「これは同じ操作のリクエストですよ」という ID。サーバが見て「あ、この ID もう処理した」と気付けば二重処理を防げる。今回はサーバ側 dedupe は未実装だが、ヘッダだけ送っておけば将来効くようになる
- **mutationFn 経路** とは: 古い書き方で、`fetch` の代わりに自分で関数を渡すパターン。これだと自動 retry / タイムアウト / 中断 / Idempotency-Key 全部効かない（昔のコードを壊さないためにわざと残してある後方互換）

## なぜこれが必要か

issue-842 で「retry / idempotency 機構」を作ったが、現状 admin の mutation はすべて POST/PATCH（非冪等）なので **誰も retry を使っていない**。せっかく作った機能が dead code 化する恐れがあった。

調査したら `apps/api` 側に **既に冪等 DELETE endpoint がある** のに、UI 側が古い POST + mutationFn の合体経路で叩いていたため reliability を享受できていないことが判明。これを切り替えれば「初の運用 caller」が誕生する。

## Part 2 — 技術者向け実装詳細

### TypeScript 型定義

```ts
interface MeetingMutationResponse {
  ok?: boolean;
}

type RemoveAttendanceTrigger = (
  payload: null,
  endpointOverride: string,
) => Promise<MeetingMutationResponse>;
```

### APIシグネチャ

```ts
removeAttendance(sessionId: string, memberId: string)
// DELETE /api/admin/meetings/:sessionId/attendance/:memberId

useAdminMutation<MeetingMutationResponse>(endpoint, "DELETE", {
  refreshOnSuccess: false,
  retry: { maxAttempts: 3 },
  idempotencyKey: () => crypto.randomUUID(),
});
```

### 使用例

```ts
await removeAttendanceMutation.trigger(
  null,
  `/api/admin/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
);
```

### エラーハンドリング

- 5xx / network error: `retry.maxAttempts=3` に従い再試行する
- 4xx: retry しない
- 404: 既に解除済み race として既存の optimistic removal/toast を維持する
- 409/422: 登録側 POST の既存 toast policy を維持する

### エッジケース

- `memberId` や `sessionId` に `/` が含まれる場合は path segment ごとに `encodeURIComponent` する
- DELETE payload は `null` に固定し、hook が送る body は `"null"` としてテストで固定する
- server 側 dedupe は未実装だが、DELETE endpoint が naturally idempotent なので二重削除は 404 race で吸収できる

### Visual evidence boundary

本タスクは `NON_VISUAL`。admin UI の表示・レイアウト・操作導線を変えず、内部 mutation 経路を POST + `mutationFn` から DELETE + hook fetch path へ差し替える変更である。Phase 11 の正本 evidence は screenshot ではなく `outputs/phase-11/evidence/focused-vitest.log` とする。

### 設定項目と定数一覧

| 項目 | 値 |
|---|---|
| retry maxAttempts | `3` |
| retry backoff | hook default (`baseDelayMs=200`, `maxDelayMs=2000`) |
| idempotency key | `crypto.randomUUID()` |
| DELETE payload | `null` |

### テスト構成

| spec | 目的 |
|---|---|
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | helper が DELETE route を呼ぶこと |
| `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx` | retry / header / 4xx no retry / 404 race |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | hook policy regression |

## 変更概要

| ファイル | 変更内容 |
|---|---|
| `apps/web/src/lib/admin/api.ts` | `removeAttendance` を `DELETE /meetings/:sessionId/attendance/:memberId` 直叩きに切替 |
| `apps/web/src/components/admin/MeetingPanel.tsx` | `attendanceMutation` を `addAttendanceMutation`（既存 POST）と `removeAttendanceMutation`（新規 DELETE + retry + idempotencyKey）に分割 |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | helper が登録 POST と解除 DELETE endpoint を使い分けること |
| `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx` | retry / header / 4xx no retry / 404 race |

## 実装スニペット

### 1. helper 切替

```ts
// apps/web/src/lib/admin/api.ts
export const removeAttendance = (sessionId: string, memberId: string) =>
  call(
    `/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
    "DELETE",
  );
```

### 2. mutation 分割

```ts
// apps/web/src/components/admin/MeetingPanel.tsx
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
  "/api/admin/meetings/__placeholder__/attendance/__placeholder__",
  "DELETE",
  {
    refreshOnSuccess: false,
    retry: { maxAttempts: 3 },
    idempotencyKey: () => crypto.randomUUID(),
  },
);
```

### 3. trigger 差し替え

```ts
// 登録（onAdd 内）
await addAttendanceMutation.trigger({ sessionId, memberId });

// 解除（confirm 内 kind === "remove"）
await removeAttendanceMutation.trigger(
  null,
  `/api/admin/meetings/${encodeURIComponent(sessionId)}/attendance/${encodeURIComponent(memberId)}`,
);
```

## 注意点

1. **`mutationFn` 経路を使わない**: 解除側で `mutationFn` を渡すと TC-27/28 と同じく timeout/retry/abort/idempotency-key が一切効かなくなる
2. **`endpointOverride`**: `useAdminMutation` の `trigger(payload, endpointOverride?)` を使い、可変 path を override で渡す。placeholder endpoint は型整合のための飾り
3. **payload=null の DELETE body**: hook は `JSON.stringify(payload)` を必ず body に乗せる。`null` を渡すと body は `"null"`。Hono の DELETE route は body を読まないので副作用なし。spec で `body === "null"` を固定する
4. **既存挙動の保持**: 404 race の楽観 UI 戻し / 409・422 toast / `router.refresh` は仕様維持

## DoD

- AC-1〜AC-8 全充足
- focused Vitest 3 files / 97 tests PASS
- 既存 hook spec 無回帰
- `pnpm typecheck` / `pnpm lint` 0 error
