# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

採用案 A を実装する手順を runbook + 擬似コードで固定する。本タスクは spec_created なのでコードを書かないが、後続実装タスクが順番通りに迷わず実装できる粒度の placeholder を残す。

## Runbook

### Step 1: middleware を先に実装

1. `apps/api/src/middleware/session.ts` を作成
2. Auth.js の cookie / JWT を検証し、`context.set('user', { email, memberId, responseId, isAdmin })` で注入
3. 検証失敗時は `c.json({ code: 'UNAUTHENTICATED' }, 401)`
4. session 検証は 05a の Auth.js 設定に依存。本タスクは consumer として helper を呼ぶだけ

### Step 2: self-member-only middleware

1. `apps/api/src/middleware/self-member-only.ts` を作成
2. handler 内で `context.get('user').memberId` のみ参照可能にする helper を export
3. path に `:memberId` が現れる route を本ファイル import すると tsc error になるよう型で禁止

### Step 3: rate limit middleware

1. `apps/api/src/middleware/rate-limit-self-request.ts` を作成
2. session 単位で Cloudflare Workers KV か D1 ベースの counter で 5 req/min
3. 超過で 429 + `Retry-After` header

### Step 4: services 実装

1. `apps/api/src/services/edit-response-url.ts`: 03b の currentResponseResolver から取得、null 時は `RESPONDER_URL` env を返す
2. `apps/api/src/services/self-request-queue.ts`: hasPending → false なら admin_member_notes に insert、true なら 409

### Step 5: handler 実装（4 endpoint）

1. `routes/me/get-session.ts`: session middleware → SessionUser を組成 → authGateState 解決 → return
2. `routes/me/get-profile.ts`: session middleware → memberRepo / responseFieldsRepo / fieldVisibilityRepo を呼ぶ → MemberProfile + statusSummary + editResponseUrl + fallbackResponderUrl を return
3. `routes/me/post-visibility-request.ts`: session + rate-limit → self-request-queue.append('visibility_request', ...) → audit_log.record → 202
4. `routes/me/post-delete-request.ts`: 同上で type='delete_request'

### Step 6: router マウント

1. `apps/api/src/routes/me/index.ts` で 4 handler を `app.route('/me', meRouter)`
2. apps/api 全体 router の `/me` 配下に組み込む

### Step 7: test 走らせる

1. `pnpm --filter api test` で unit + contract + integration を一括実行
2. 失敗箇所を test → 実装の順で潰す
3. authz test が全 pass するまで Phase 6 に進まない

## 擬似コード

```ts
// apps/api/src/middleware/session.ts (placeholder)
export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await verifyAuthJsSession(c.req.raw); // 05a が提供する helper
  if (!session?.user?.memberId) {
    return c.json({ code: 'UNAUTHENTICATED' }, 401);
  }
  const status = await memberStatusRepo.findByMemberId(session.user.memberId);
  const authGateState = resolveAuthGateState(status); // active / rules_declined / deleted
  if (authGateState === 'deleted') {
    return c.json({ code: 'DELETED', authGateState }, 410);
  }
  c.set('user', { ...session.user, authGateState });
  return next();
};

// apps/api/src/routes/me/get-session.ts (placeholder)
export const getSessionHandler: Handler = (c) => {
  const user = c.get('user');
  return c.json<GetMeResponse>({
    user: { email: user.email, memberId: user.memberId, responseId: user.responseId, isAdmin: user.isAdmin },
    authGateState: user.authGateState,
  });
};

// apps/api/src/routes/me/get-profile.ts (placeholder)
export const getProfileHandler: Handler = async (c) => {
  const user = c.get('user'); // memberId は session のみから取得（path に :memberId 禁止）
  const profile = await loadMemberProfileForSelf(user.memberId);
  const editUrl = await editResponseUrlService.resolve(user.memberId);
  return c.json<GetMeProfileResponse>({
    profile,
    statusSummary: { ...profile.status, isDeleted: false },
    editResponseUrl: editUrl,
    fallbackResponderUrl: c.env.RESPONDER_URL,
  });
};

// apps/api/src/routes/me/post-visibility-request.ts (placeholder)
export const postVisibilityRequestHandler: Handler = async (c) => {
  const user = c.get('user');
  const body = await PostVisibilityRequestBodySchema.parseAsync(await c.req.json());
  if (await selfRequestQueue.hasPending('visibility_request', user.memberId)) {
    return c.json({ code: 'DUPLICATE_PENDING_REQUEST' }, 409);
  }
  const queueId = await selfRequestQueue.append({
    type: 'visibility_request',
    memberId: user.memberId,
    desiredState: body.desiredState,
    reason: body.reason,
  });
  await auditLogRepo.record({ action: 'self.visibility_request', target: user.memberId, queueId });
  return c.json({ queueId, type: 'visibility_request', status: 'pending', createdAt: new Date().toISOString() }, 202);
};
```

## Sanity check

- [ ] PATCH /me/profile が router に存在しない
- [ ] path に `:memberId` を持つ route が `/me/*` に存在しない
- [ ] GET /me/profile の response 型に `notes` プロパティがない
- [ ] visibility/delete request handler は admin_member_notes / audit_log の 2 ヶ所しか書き込まない
- [ ] response_fields 系の write は一切呼ばれない

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | session 設計 |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | request API |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | テーブル定義 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook に従い実装した結果の異常系を検証 |
| Phase 7 | AC matrix の row を runbook step と紐付け |
| Phase 8 | middleware 共通化を DRY 化で評価 |

## 多角的チェック観点（不変条件マッピング）

- #4: PATCH 系 placeholder を Sanity check で禁止
- #5: D1 アクセスを repository 経由に統一（apps/api 内のみ）
- #11: path に :memberId 禁止を Sanity check
- #12: handler が response 型に notes を入れない（zod parse で検出）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 7 step 確定 | 5 | pending | outputs/phase-05/runbook.md |
| 2 | 擬似コード 4 endpoint | 5 | pending | outputs/phase-05/pseudocode.md |
| 3 | sanity check | 5 | pending | チェックリスト |
| 4 | apps/api/src 配置確認 | 5 | pending | path レベルで一意 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 主成果物 |
| ドキュメント | outputs/phase-05/runbook.md | 7 step 詳細 |
| ドキュメント | outputs/phase-05/pseudocode.md | 4 endpoint placeholder |
| メタ | artifacts.json | Phase 5 を completed に更新 |

## 完了条件

- [ ] 7 step が順序付きで記述
- [ ] 4 endpoint の擬似コードが配置されている
- [ ] Sanity check 5 項目が pass する設計
- [ ] 上流 02a / 02c / 03b の helper 名が runbook 内に登場

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 5 を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: runbook の step ごとに失敗系シナリオを洗い出す
- ブロック条件: 擬似コードに PATCH /me/profile が紛れている場合は次 Phase に進まない
