# Phase 2: 設計 — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 2 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1 の AC・API 契約を、`apps/api` / `apps/web` 双方の具体的な型定義・関数シグネチャ・データフロー・コンポーネント分担まで落とす。S1（server 正本）/ S3（BFF passthrough 相乗り）/ S5（既存 error code 再利用）を構造で守る。

## 実行タスク

1. `apps/api` 側の型・services・route 拡張を確定する。
2. `apps/web` 側の Server Component / Client Component 境界と props 契約を確定する。
3. データフロー図（page → API → repo → D1 → response → UI）を文章で記述する。
4. CONST_005 必須項目（変更ファイル一覧 / 関数シグネチャ / 入出力・副作用 / テスト方針）を埋める。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 | `outputs/phase-01/main.md` |
| /me schemas | `apps/api/src/routes/me/schemas.ts` |
| /me services | `apps/api/src/routes/me/services.ts` |
| /me index | `apps/api/src/routes/me/index.ts` |
| profile page | `apps/web/app/profile/page.tsx` |
| RequestActionPanel | `apps/web/app/profile/_components/RequestActionPanel.tsx` |
| RequestPendingBanner | `apps/web/app/profile/_components/RequestPendingBanner.tsx` |
| BFF passthrough | `apps/web/app/api/me/[...path]/route.ts` |

## 変更対象ファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 編集 | `apps/api/src/routes/me/schemas.ts` | `MeProfileResponseZ` に `pendingRequests` 追加・`PendingRequestZ` 新設 |
| 編集 | `apps/api/src/routes/me/services.ts` | `getPendingRequestsForMember(memberId)` 関数を追加 |
| 編集 | `apps/api/src/routes/me/index.ts` | `GET /me/profile` ハンドラで pending を埋めて返す |
| 編集 | `apps/web/src/lib/api/me-types.ts` | web 側 `/me/profile` 型 mirror に `pendingRequests` を追加 |
| 拡張 | `apps/web/src/lib/api/me-types.test-d.ts` | API schema mirror drift を型テストで固定 |
| 編集 | `apps/web/app/profile/page.tsx` | server fetch した `pendingRequests` を `RequestActionPanel` に props 経由で渡す |
| 編集 | `apps/web/app/profile/_components/RequestActionPanel.tsx` | server pending を初期値として受領、disabled 判定を server state ベースに変更 |
| 編集（軽微） | `apps/web/app/profile/_components/VisibilityRequest.client.tsx` | submit 後の楽観的更新は維持しつつ、reload 時の正本は server に委譲 |
| 編集（軽微） | `apps/web/app/profile/_components/DeleteRequest.client.tsx` | 同上 |
| 変更なし（相乗り・S3） | `apps/web/app/api/me/[...path]/route.ts` | passthrough のみ（`:memberId` を path に出さない） |
| 変更なし（S5） | `apps/api/src/routes/me/services.ts` の `SelfRequestError` | `DUPLICATE_PENDING_REQUEST` 再利用 |

## 主要な型・関数シグネチャ（CONST_005）

### apps/api

```ts
// schemas.ts
export const PendingVisibilityRequestZ = z.object({
  queueId: z.string(),
  status: z.literal("pending"),
  createdAt: z.string().datetime(),
  desiredState: z.enum(["hidden", "public"]),
});

export const PendingDeleteRequestZ = z.object({
  queueId: z.string(),
  status: z.literal("pending"),
  createdAt: z.string().datetime(),
});

export const PendingRequestsZ = z.object({
  visibility: PendingVisibilityRequestZ.optional(),
  delete: PendingDeleteRequestZ.optional(),
});

// 既存 MeProfileResponseZ を拡張
export const MeProfileResponseZ = z.object({
  // ...既存フィールド
  pendingRequests: PendingRequestsZ,
});
export type MeProfileResponse = z.infer<typeof MeProfileResponseZ>;
```

```ts
// services.ts (追加)
export async function getPendingRequestsForMember(
  ctx: DbCtx,
  memberId: MemberId,
): Promise<{ visibility?: PendingVisibilityRequest; delete?: PendingDeleteRequest }>;
// 副作用: admin_member_notes read のみ。書き込みなし。
// 入力: memberId（session.user.memberId 解決済み）
// 出力: 各種 pending（最大各 1 件、status='pending' のみ）
// 不変条件: D1 アクセスは apps/api 内に閉じる（#5）。
```

### apps/web

```ts
// app/profile/page.tsx (Server Component)
const profile: MeProfileResponse = await fetchMeProfile();
// pendingRequests を RequestActionPanel に渡す
<RequestActionPanel
  publishState={profile.publishState}
  rulesConsent={profile.rulesConsent}
  pendingRequests={profile.pendingRequests}
/>
```

```ts
// _components/RequestActionPanel.tsx
type Props = {
  publishState: "public" | "hidden" | "unknown";
  rulesConsent: "consented" | "pending" | "rejected" | "unknown";
  pendingRequests: {
    visibility?: { queueId: string; createdAt: string; desiredState: "hidden" | "public" };
    delete?: { queueId: string; createdAt: string };
  };
};
// 内部:
// - pendingVisibility = pendingRequests.visibility ?? localOptimistic.visibility
// - pendingDelete = pendingRequests.delete ?? localOptimistic.delete
// - 該当ボタンは pendingVisibility/pendingDelete があれば disabled
// - RequestPendingBanner は server state があれば常時表示（S1）
```

## 入出力・副作用定義（CONST_005）

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `getPendingRequestsForMember` | `ctx`, `memberId` | `{ visibility?, delete? }` | `admin_member_notes` SELECT のみ |
| `GET /me/profile` ハンドラ | session（memberId 解決済み） | `MeProfileResponse`（pending 含む） | services 経由 D1 read |
| `RequestActionPanel` | props | JSX | submit 時のみ POST（local optimistic は submit-in-flight 限定 / S1） |

## データフロー

```
[Browser /profile reload]
  → Next.js Server Component (apps/web/app/profile/page.tsx)
    → fetch BFF: /api/me/profile  (apps/web/app/api/me/[...path]/route.ts passthrough・S3)
      → apps/api Hono route: GET /me/profile
        → services.getMeProfile + services.getPendingRequestsForMember
          → admin_member_notes SELECT (apps/api 内のみ・#5)
        ← MeProfileResponse{ pendingRequests: { visibility?, delete? } }
      ← passthrough
    ← profile data
  → <RequestActionPanel pendingRequests={...} />
    → server pending があれば <RequestPendingBanner> を表示し、対応ボタン disabled
```

## コンポーネント境界

| 層 | "use client" | 役割 |
| --- | --- | --- |
| `page.tsx` | server | `fetchMeProfile()` で server fetch、props を子へ |
| `RequestActionPanel.tsx` | client | server pending を初期値、submit 楽観的更新を上乗せ |
| `RequestPendingBanner.tsx` | server / client どちらでも | props のみで描画（変更なし） |
| `VisibilityRequest.client.tsx` / `DeleteRequest.client.tsx` | client | submit。submit 完了後は `router.refresh()` で server を再 fetch |

## テスト方針（CONST_005）

| レベル | 追加ファイル | ケース |
| --- | --- | --- |
| unit | `apps/api/src/routes/me/__tests__/services.pending.test.ts` | `getPendingRequestsForMember` の hit / miss / 複数 pending の最新 1 件 |
| unit | `apps/api/src/routes/me/__tests__/schemas.test.ts` 拡張 | `PendingRequestsZ` zod parse 成功 / 失敗 |
| unit | `apps/web/app/profile/_components/__tests__/RequestActionPanel.test.tsx` 拡張 | server pending 渡された時の disabled / banner 表示 |
| integration | `apps/api/src/routes/me/__tests__/index.profile.test.ts` 拡張 | `GET /me/profile` レスポンスに `pendingRequests` が含まれる |
| E2E | `apps/web/playwright/tests/profile-pending-sticky.spec.ts` | submit → reload → banner 残存・ボタン disabled |
| E2E | 同上 | 409 stale UI（古い tab）→ DUPLICATE_PENDING_REQUEST 表示 |

## ローカル実行・検証コマンド（CONST_005）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test --run
mise exec -- pnpm --filter @ubm/web test --run
mise exec -- pnpm --filter @ubm/web exec playwright test e2e/profile-pending-sticky
```

## DoD（Phase 2 設計）

- [ ] 変更ファイル一覧と種別が確定
- [ ] 型・関数シグネチャがコード化レベルで確定
- [ ] データフローが server 正本（S1）に整合
- [ ] BFF passthrough は変更しない（S3）
- [ ] 新 error code を追加していない（S5）
- [ ] CONST_005 必須項目が埋まっている

## 多角的チェック観点

- S1 server 正本: `RequestActionPanel` の disabled 判定が server pending を最優先しているか
- S2: `authGateState` enum を新規宣言していないか
- S3: `apps/web/app/api/me/[...path]/route.ts` を passthrough のまま使っているか
- S4: Phase 11 を `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` で受けられる構成か
- S5: error code を追加していないか

## サブタスク管理

- [ ] zod schema 拡張案を確定
- [ ] services 関数シグネチャを確定
- [ ] RequestActionPanel props 拡張を確定
- [ ] data flow 図を文章化
- [ ] `outputs/phase-02/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| 設計書 | `outputs/phase-02/main.md` |

## 完了条件

- [ ] CONST_005 必須項目が全て揃っている
- [ ] 不変条件 #4 / #5 / #11 を構造で守る設計になっている
- [ ] 苦戦箇所 S1 / S3 / S5 が設計に反映されている
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装コードを書いていない
- [ ] commit / push / PR を実行していない
- [ ] 06b-B の復活ではなく durable 化の追加設計である

## 次 Phase への引き渡し

Phase 3 へ、設計書、CONST_005 表、苦戦箇所 S1-S5 反映確認用の checklist を渡す。
