# Phase 4: テスト戦略

## 4.1 テストレーンと位置

| Lane                | ファイル                                                                                    | 種別           |
| ------------------- | ------------------------------------------------------------------------------------------- | -------------- |
| repository (D1)     | `apps/api/src/repository/__tests__/identities.autolink.spec.ts`（新規）                    | unit (vitest)  |
| contract (Hono)     | `apps/api/src/routes/auth/session-resolve.contract.spec.ts`（拡張）                         | contract       |
| diagnostics         | `apps/api/src/diagnostics/forms-pipeline.spec.ts`（既存に H2 flag derive ケース追記）       | unit           |
| migration idempotent | `apps/api/src/repository/__tests__/identities.autolink.spec.ts` 内の repeated auto-link case | unit           |

## 4.2 テストケース一覧

### B-01 backfill / auto-link helper（identities.autolink.spec.ts）

| ID    | ケース                                                                                                       | 期待                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| B-01a | member_responses に email=A の row 1 件あり、member_identities に同 email row なし                          | auto-link 後、member_identities row 1 件追加                       |
| B-01b | 同 email で response 3 件（submitted_at が前後）                                                            | current_response_id = 最新、first_response_id = 最古              |
| B-01c | 同一 email で 2 つの異なる bridge member_id                                                                  | MIN(member_id) が採用される。重複 INSERT は発生しない             |
| B-01d | 同一データで backfill を 2 回連続適用                                                                        | 2 回目は 0 row 追加。table の content が一致                      |
| B-01e | member_responses.response_email = NULL / 空文字                                                              | backfill 対象外。スキップされる                                   |
| B-01f | 既存 member_identities row（同 email 別 member_id）                                                          | 上書きされない（C5）                                              |
| B-01g | email casing 違い（`Foo@Example.com` vs `foo@example.com`）                                                 | LOWER 正規化で同一とみなされ 1 row のみ追加                      |

### B-02 session-resolve auto-link（session-resolve.contract.spec.ts）

| ID    | ケース                                                                                                        | 期待                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| B-02a | member_identities なし / member_responses に email 一致あり / status.rules_consent=consented                | auto-link 実行 → memberId 返却 / gateReason=null                                       |
| B-02b | member_identities なし / member_responses なし                                                                | unregistered（既存挙動維持）                                                          |
| B-02c | member_identities なし / member_responses に email 一致あり / status なし                                    | auto-link 後 status 欠損で rules_declined を返す                                       |
| B-02d | member_identities 既存（既に link 済）                                                                        | auto-link 経路を通らず既存 path で返す（regression）                                  |
| B-02e | auto-link 競合: 1 回目で UNIQUE 違反、再 SELECT で hit                                                       | race-safe に動作し memberId を返す                                                    |

### B-03 diagnostic flag（forms-pipeline.spec.ts）

| ID    | ケース                                                                                  | 期待                                                                      |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| B-03a | identityHealth.membersWithoutIdentity > 0 を含む snapshot                              | hypothesisFlags に `H2_identityMismatchSuspected: true` が立つこと        |
| B-03b | membersWithoutIdentity = 0 / identitiesWithoutMember = 0                                | H2 flag が false                                                          |

## 4.3 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- identities.autolink
mise exec -- pnpm --filter @ubm-hyogo/api test -- session-resolve.contract
mise exec -- pnpm --filter @ubm-hyogo/api test -- forms-pipeline
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 4.4 fixture 設計

`apps/api/src/repository/__fixtures__/d1mock.ts` または `__tests__/_setup.ts` の既存パターンに合わせ、test 用 `member_responses` / `member_identities` の seed helper を spec ファイル内 closure に実装する（新規 fixture ファイル追加は不要）。

## 4.5 E2E スコープ

E2E (Playwright) には**含めない**。Auth.js Google OAuth flow の自動化スコープ外。staging 手動 evidence に委ねる（Phase 11）。
