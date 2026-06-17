# T03: `/me` 系 5xx の契約テスト（F-3・TC-1〜TC-4）

`[実装区分: 実装仕様書]`

> 依存: **T01/T02 の後に着手**（確定 diff に対する RED→GREEN 確認。TDD で先にテストを書いて RED 確認してから T01/T02 を実装する順序も可・期待値は Phase 4 で固定済み）。
> 正本参照: `../phase-4/phase-4.md`（§1-§4 が期待値の正本）/ `../phase-6/phase-6.md`（拡充ケース P6-1〜P6-9）/ `../phase-2/phase-2.md`（§7 テスト戦略）

## 変更対象ファイル一覧

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| 1 | `apps/api/src/routes/me/index.contract.spec.ts` | 編集 | D1 failure proxy と `app.onError(errorHandler)` 付き harness を追加し、TC-1〜TC-4 を既存 `/me` contract spec に集約。既存 describe・期待値は**一切変更しない**（TC-4 回帰 guard） |

production コードの変更なし。新規 spec ファイルは作らず既存 `index.contract.spec.ts` へ追記する。`*.test.ts` は作らない（不変条件 #8）。

## 主要シグネチャ（spec 内ローカル fixture・Phase 4 §3 確定契約）

```ts
// 既存 index.contract.spec.ts 内のローカル fixture として定義する。

// (a) onError 付きハーネス: createMeRoute に app.onError(errorHandler) を直接設定する。
//     request path は既存 spec と同じ "/" / "/profile" を使う。
const buildApp = (
  env: InMemoryD1,
  sessionEmail: string | null = "user1@example.com",
  dbOverride?: D1Database,
) => { /* existing local harness + app.onError(errorHandler) */ };

// (b) SQL パターン選択式 failing D1 Proxy（Phase 4 §3.2）
const failingDb = (real: D1Database, pattern: RegExp): D1Database =>
  new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === "prepare") {
        return (sql: string) => {
          if (pattern.test(sql)) throw new Error("simulated D1 failure");
          return target.prepare(sql);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });

// (c) ログ捕捉: vi.spyOn(console, "error")。捕捉行（JSON 1 行文字列）を JSON.parse して
//     構造化アサート + 文字列 not.toContain 併用（Phase 3 R3）
```

## テストケース（期待値の正本は Phase 4 §4。ここでは配置と Given/When/Then の要点のみ）

| ケース | 配置 | Given（注入） | When | Then（要点） |
|--------|------|---------------|------|--------------|
| TC-1 | `index.contract.spec.ts` | `buildApp(env, "user1@example.com", failingDb(db, /member_identities/))` | `GET /me` | 500・`application/problem+json`・body `code:"UBM-5001"` / body に `m_001` / `user1@example.com` 非含有 |
| TC-2 | `index.contract.spec.ts` | `buildApp(env, "user1@example.com", failingDb(db, /admin_users/))` | `GET /me` | 500・`application/problem+json`・body `code:"UBM-5001"` / body に `m_001` / `user1@example.com` 非含有 |
| TC-3 | `index.contract.spec.ts` | `buildApp(env, "user1@example.com", failingDb(db, /response_fields/))` | `GET /me/profile` | 500・`UBM-5001`・body に `m_001` / `user1@example.com` 非含有 |
| TC-4 | `index.contract.spec.ts` | `buildApp(env, "user1@example.com", failingDb(db, /admin_member_notes/))` | `GET /me/profile` | **200**・`MeProfileResponseZ.parse` 成功・`pendingRequests` `toEqual({})`・`profile.memberId:"m_001"` |
| 回帰 | 既存 describe 群 | 注入なし | 既存全件 | 回帰ゼロ（34/34 PASS・期待値の編集禁止） |
| P6-1〜P6-9 | Phase 6 参照 | `../phase-6/phase-6.md` §1 | — | 回帰 guard・境界（fail-soft ログ 1 回・P2 admin_users 分類・410/401 優先・non-Error throw・header/leak 検査） |

テスト命名: 新規ケースは `TC-1:`〜`TC-4:` / `P6-n:` プレフィックス + 日本語題（Phase 1 §8）。

## 入力・出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | InMemoryD1（`setupD1()` + 既存 `seedMember` fixture）・failing Proxy・fake `resolveSession` |
| 出力 | vitest 実行結果（node 環境で決定的。staging 実機非依存） |
| 副作用 | なし（`vi.spyOn(console, "error")` は `mockRestore` で必ず解除し、他テストのログ出力を汚染しない） |

## ローカル実行・検証コマンド

```bash
# focused tests（monorepo root 基準。--filter 経由やディレクトリ内直実行は
# include glob 不一致で "No test files found" になる既知の罠）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts -t issue-1190
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts

# 型・lint
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint

# 非接触確認
git diff --stat -- apps/web   # 空であること
```

## 完了条件（DoD）

- [x] TC-1〜TC-4 が Phase 4 §4 の期待値どおり green（AC-1/AC-2/AC-3）。
- [x] 既存テスト全件が**期待値無編集**で green（AC-4 回帰ゼロ、34/34 PASS）。
- [x] leak アサーション（body に `m_001`・`user1@example.com` 非含有）green（AC-5）。
- [x] 新規 spec ファイルは作らず、既存 `index.contract.spec.ts` に集約した。API typecheck / lint exit 0（AC-8）。
- [x] focused vitest が monorepo root 基準コマンドで全件 PASS。

## 不変条件

- 既存テストの期待値・fixture を変更しない（`/me` status 体系不変の機械的保証・AC-4）。
- 不変条件 #11: テスト自身も memberId/email の**非含有を検証する側**であり、新規アサーションで session email 等をログへ出力させない。
- 新規 test ファイルは `*.spec.ts` のみ（`*.test.*` 禁止・不変条件 #8）。
- apps/web のテスト・コードに非接触（AC-6）。production コード diff なし（テストのみ）。
