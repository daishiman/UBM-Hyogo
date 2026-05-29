# Phase 5: 実装設計

## 5.1 変更対象ファイル一覧

| 種別 | パス                                                                          | 概要                                                            |
| ---- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 新規 | `apps/api/migrations/0021_backfill_member_identities.sql`                      | 過去データ救済 backfill                                         |
| 編集 | `apps/api/src/repository/identities.ts`                                        | `tryAutoLinkIdentityByEmail` を追加                             |
| 編集 | `apps/api/src/routes/auth/session-resolve.ts`                                  | auto-link 経路を inline                                         |
| 編集 | `apps/api/src/diagnostics/forms-pipeline.ts`                                   | `H2_identityMismatchSuspected` の derive 条件に `membersWithoutIdentity > 0` を追加 |
| 新規 | `apps/api/src/repository/__tests__/identities.autolink.spec.ts`                | backfill helper / auto-link helper の unit test                 |
| 編集 | `apps/api/src/routes/auth/session-resolve.contract.spec.ts`                    | auto-link contract test                                         |
| 編集 | `apps/api/src/diagnostics/forms-pipeline.spec.ts`                              | H2 flag derive test                                             |
| 編集 | `docs/00-getting-started-manual/specs/02-auth.md`                              | auto-link 仕様の追記（1 節）                                    |

## 5.2 関数シグネチャ

### `apps/api/src/repository/identities.ts`（追加）

```ts
export interface AutoLinkCandidate {
  member_id: string;
  response_email: string;
  current_response_id: string;
  first_response_id: string;
  last_submitted_at: string;
}

/**
 * member_responses から email 一致 row を集計し、member_identities への INSERT 候補を返す。
 * NULL / 空文字の response_email は対象外。tag_assignment_queue bridge があれば既存 member_id を優先する。
 */
export async function findAutoLinkCandidateByEmail(
  c: DbCtx,
  email: ResponseEmail,
): Promise<AutoLinkCandidate | null>;

/**
 * candidate を member_identities に INSERT OR IGNORE する。
 * 既存 row があれば差分なしで返す。INSERT 後の row を再 SELECT して返す。
 * 冪等。
 */
export async function backfillIdentityFromCandidate(
  c: DbCtx,
  candidate: AutoLinkCandidate,
): Promise<MemberIdentityRow | null>;

/**
 * 一連の auto-link を 1 関数で行うコンビネータ。
 * 既存 identity あり → 即返す。なし → candidate 探索 → backfill → 再 SELECT。
 */
export async function tryAutoLinkIdentityByEmail(
  c: DbCtx,
  email: ResponseEmail,
): Promise<MemberIdentityRow | null>;
```

### `apps/api/src/routes/auth/session-resolve.ts`（変更）

```ts
// L47 の find を変更
const identity =
  (await findIdentityByEmail(ctx, asResponseEmail(email))) ??
  (await tryAutoLinkIdentityByEmail(ctx, asResponseEmail(email)));

if (!identity) {
  return c.json({
    memberId: null,
    isAdmin: false,
    gateReason: "unregistered" satisfies GateReason,
  });
}
// 以降の status / isAdmin lookup は変更なし
```

### `apps/api/src/diagnostics/forms-pipeline.ts`（変更）

```ts
// deriveFormsPipelineHypotheses の H2 条件に OR 追加
H2_identityMismatchSuspected:
  input.identityHealth.identitiesWithoutMember > 0 ||
  input.identityHealth.membersWithoutIdentity > 0,
```

## 5.3 入出力・副作用

| 関数                                | 入力             | 出力                    | 副作用                                       |
| ----------------------------------- | ---------------- | ----------------------- | -------------------------------------------- |
| `findAutoLinkCandidateByEmail`      | DbCtx, email     | `AutoLinkCandidate \| null` | なし（read-only）                           |
| `backfillIdentityFromCandidate`     | DbCtx, candidate | `MemberIdentityRow \| null` | `INSERT OR IGNORE INTO member_identities` |
| `tryAutoLinkIdentityByEmail`        | DbCtx, email     | `MemberIdentityRow \| null` | 上記の副作用を内包                          |

## 5.4 既存コードへの影響

| ファイル                                    | 影響                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/api/src/routes/auth/session-resolve.ts` | 戻り値の shape は変わらない（既存 contract test は再利用可能）                        |
| `apps/web/src/lib/auth.ts`                  | 変更なし（API 側で完結）                                                              |
| `apps/api/src/jobs/sync-forms-responses.ts` | 変更なし（既存 upsert ロジック維持）                                                  |
| `apps/api/src/diagnostics/member-diagnosis.ts` | 変更なし（既存 H2_identityMissing 判定は member 単位で別軸）                          |

## 5.5 実装順序

1. `identities.ts` に純関数 3 つを追加（test がまず通る形）
2. `identities.autolink.spec.ts` を新規作成し B-01a〜B-01g を green に
3. `session-resolve.ts` に auto-link を統合
4. `session-resolve.contract.spec.ts` を拡張し B-02a〜B-02e を green に
5. `forms-pipeline.ts` の H2 condition を更新、`forms-pipeline.spec.ts` で B-03a/b を green に
6. `0021_backfill_member_identities.sql` を追加
7. `pnpm typecheck && pnpm lint && pnpm --filter api test` で全 green
8. `docs/00-getting-started-manual/specs/02-auth.md` に auto-link 1 節を追記
