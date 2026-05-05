# Phase 5: 実装ランブック — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 5 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 設計と Phase 4 テスト戦略をもとに、`apps/api` / `apps/web` の実装手順をステップ単位で確定する。本 Phase 自体ではコード作成・commit・push・PR 作成を行わない。

## 変更対象ファイル一覧（CONST_005）

| 種別 | パス |
| --- | --- |
| 編集 | `apps/api/src/routes/me/schemas.ts` |
| 編集 | `apps/api/src/routes/me/services.ts` |
| 編集 | `apps/api/src/routes/me/index.ts` |
| 新規 | `apps/api/src/routes/me/__tests__/services.pending.test.ts` |
| 拡張 | `apps/api/src/routes/me/__tests__/index.profile.test.ts`（既存があれば） |
| 拡張 | `apps/api/src/routes/me/__tests__/schemas.test.ts`（または同等） |
| 編集 | `apps/web/src/lib/api/me-types.ts` |
| 拡張 | `apps/web/src/lib/api/me-types.test-d.ts` |
| 編集 | `apps/web/app/profile/page.tsx` |
| 編集 | `apps/web/app/profile/_components/RequestActionPanel.tsx` |
| 編集（軽微） | `apps/web/app/profile/_components/VisibilityRequest.client.tsx` |
| 編集（軽微） | `apps/web/app/profile/_components/DeleteRequest.client.tsx` |
| 拡張 | `apps/web/app/profile/_components/__tests__/RequestActionPanel.test.tsx` |
| 新規 | `apps/web/playwright/tests/profile-pending-sticky.spec.ts` |
| 変更なし（S3） | `apps/web/app/api/me/[...path]/route.ts` |

## 主要関数シグネチャ（CONST_005）

```ts
// apps/api/src/routes/me/services.ts
export async function getPendingRequestsForMember(
  ctx: DbCtx,
  memberId: MemberId,
): Promise<PendingRequests>;

// apps/api/src/routes/me/schemas.ts
export const PendingRequestsZ: z.ZodType<PendingRequests>;
export type PendingRequests = {
  visibility?: { queueId: string; status: "pending"; createdAt: string; desiredState: "hidden" | "public" };
  delete?: { queueId: string; status: "pending"; createdAt: string };
};
```

## 入出力・副作用（CONST_005）

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `getPendingRequestsForMember` | `ctx`, `memberId` | `PendingRequests` | D1 SELECT のみ |
| `GET /me/profile` ハンドラ | session | `MeProfileResponse` | services 呼び出しによる D1 read |

## 実装ステップ

### ステップ0: baseline 取得

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test --run
mise exec -- pnpm --filter @ubm/web test --run
rg -n "pendingRequests|getPendingRequestsForMember" apps/
```

- typecheck/lint/test 全 GREEN
- grep 0 hit（既実装なし）

### ステップ1: schema 拡張（TDD）

1. TC-U-06/07 を Red にする
2. `apps/api/src/routes/me/schemas.ts` に `PendingVisibilityRequestZ` / `PendingDeleteRequestZ` / `PendingRequestsZ` を追加
3. `MeProfileResponseZ` に `pendingRequests` を追加（必須 field、デフォルト `{}`）
4. zod parse Green

### ステップ2: services 関数追加（TDD）

1. TC-U-01..05 を Red
2. `apps/api/src/routes/me/services.ts` に `getPendingRequestsForMember(db, memberId)` 追加
3. クエリ: `admin_member_notes` テーブルから `member_id = ?` AND `request_status = 'pending'` AND `note_type IN ('visibility_request','delete_request')` を SELECT
4. visibility 用と delete 用に振り分けて返す（同種複数ある場合は `ORDER BY created_at DESC LIMIT 1`）
5. Green

### ステップ3: route ハンドラ拡張（TDD）

1. TC-I-01..04 を Red
2. `apps/api/src/routes/me/index.ts` の `GET /me/profile` ハンドラで `getPendingRequestsForMember` を呼び、response に合成
3. zod parse → JSON で返却
4. Green

### ステップ4: BFF passthrough（変更なし確認）

```bash
# :memberId が web API path に出ていないことを確認（S3, 不変条件 #11）
rg -n ":memberId|members/[^\"/]+" apps/web/app/api/
```

### ステップ5: profile page (Server Component) で server fetch

1. `apps/web/src/lib/api/me-types.ts` に `PendingRequests` mirror を追加し、`MeProfileResponse.pendingRequests` を必須 field にする
2. `apps/web/app/profile/page.tsx` で既存 `fetchMeProfile()` 由来の `pendingRequests` を取り出す
3. `<RequestActionPanel pendingRequests={profile.pendingRequests} ... />` に渡す

### ステップ6: RequestActionPanel disabled 判定書き換え（TDD）

1. TC-U-08..11 を Red
2. props に `pendingRequests` を追加
3. `pendingVisibility = pendingRequests.visibility ?? localOptimistic.visibility` の優先順位（S1）
4. 該当ボタン disabled、`<RequestPendingBanner type="..." createdAt={...} />` を表示
5. submit 完了後は `router.refresh()` で server を再 fetch
6. Green

### ステップ7: VisibilityRequest / DeleteRequest client の調整

- submit-in-flight の local state は維持（ユーザー操作直後の体感のため）
- ただし正本は server pending（S1）。submit 完了後 `router.refresh()` を呼ぶ

### ステップ8: E2E 追加（TDD）

1. TC-E-01..06 を Red
2. `apps/web/playwright/tests/profile-pending-sticky.spec.ts` を新設
3. mock: `GET /api/me/profile` が `pendingRequests` を返す
4. Green

### ステップ9: 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test --run
mise exec -- pnpm --filter @ubm/web test --run
mise exec -- pnpm --filter @ubm/web exec playwright test profile-pending-sticky
mise exec -- pnpm --filter @ubm/web test --run --coverage
```

PASS 条件:

| コマンド | 期待 |
| --- | --- |
| typecheck | error 0 |
| lint | warn/error 0 |
| api test | TC-U-01..05/07/06 + TC-I-01..06 PASS |
| web test | TC-U-08..11 PASS |
| playwright | TC-E-01..06 PASS |
| coverage | Line ≥ 80%、Branch ≥ 60%、Function ≥ 80% |

### ステップ10: 不変条件 grep（CI gate 候補）

```bash
rg -n "cloudflare:d1|D1Database" apps/web/                                            # 0 hit (#5)
rg -n ":memberId|/members/[^\"/]+" apps/web/app/api/                                  # 0 hit (#11)
rg -n "name=\"(displayName|email|kana|address|phone)\"" apps/web/app/profile/_components/Request*.tsx  # 0 hit (#4)
rg -n "DUPLICATE_PENDING_REQUEST" apps/api/src/routes/me/                                     # 既存ヒット維持・追加 error code なし (S5)
```

### ステップ11: 失敗時の自動修復方針

- typecheck 失敗: `z.infer` 同期破れ・unused import・null 許容を最小差分で修正
- lint 失敗: `pnpm lint --fix` 先行
- test 失敗: TC ID で原因切り分け
- E2E flaky: route mock の応答 shape を Phase 2 schema と再突合

## ローカル実行・検証コマンド（CONST_005）

上記ステップ9 と同一。

## DoD（Phase 5）

- [ ] ステップ 1..10 で触るファイルが全て確定
- [ ] 各ステップに対応 TC ID が紐付く
- [ ] 検証コマンドと PASS 条件が表で確定
- [ ] 不変条件 #4/#5/#11 grep が記載されている
- [ ] CONST_005 必須項目を満たす

## 多角的チェック観点

- ステップ番号と触るファイルが 1:1 対応
- Server / Client component 境界を変えていない
- BFF passthrough を変更していない（S3）
- 楽観的更新を server 正本より優先していない（S1）
- 新 error code を増やしていない（S5）

## サブタスク管理

- [ ] ステップ 0..11 確定
- [ ] TC ID 紐付け
- [ ] grep gate 記載
- [ ] `outputs/phase-05/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| 実装ランブック | `outputs/phase-05/main.md` |

## 完了条件

- [ ] CONST_005 必須項目（変更ファイル / 関数シグネチャ / 入出力 / テスト方針 / 検証コマンド / DoD）が揃う
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装コード・commit・push・PR は実行していない
- [ ] 06b-B の復活ではない

## 次 Phase への引き渡し

Phase 6 へ、ステップごとのエラー経路、grep gate を渡す。
