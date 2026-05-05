[実装区分: 実装仕様書]

# Phase 4 合意 — テスト戦略（5 レイヤ + build smoke 一次 evidence）

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 4 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（テスト計画確定・実走は Phase 5 / Phase 11) |

## 合意 summary

Plan A の振る舞い等価性を **build smoke を一次 evidence** とした 5 レイヤ戦略で検証する。新規 unit test は追加せず、既存 vitest 2 ファイルの mock 形式を `getAuth` lazy factory shape に統一することで AC-9 をカバーする。`getAuth()` は `await import("next-auth")` を遅延させる薄いラッパであり、副作用は next-auth に閉じるため過剰検証を避ける。

## Phase deliverables

### 5 レイヤ境界

| レイヤ | 対象 | 実行方式 | 紐付く AC |
| --- | --- | --- | --- |
| L1: build smoke | `pnpm --filter @ubm-hyogo/web build` exit 0 + `useContext` null 0 hit | shell 実行 | AC-1 / AC-3 |
| L2: cloudflare build smoke | `build:cloudflare` exit 0 + `apps/web/.open-next/worker.js` 生成 | shell 実行 | AC-2 / AC-3 |
| L3: source guard | `auth.ts` / `oauth-client.ts` に top-level next-auth value import 不在 | `rg` ベース | AC-6 |
| L4: 静的解析 | typecheck / lint exit 0 | shell 実行 | AC-4 / AC-5 / AC-7 |
| L5: 既存 vitest | `me/[...path]/route.test.ts` / `auth/callback/email/route.test.ts` PASS | `pnpm test` | AC-9 |

### regression matrix

build / build:cloudflare / typecheck / lint / vitest / source guard の 6 経路すべてに期待結果と担当レイヤを紐付け。

### mock 切替方針（L5）

```
Before: vi.mock("@/lib/auth", () => ({ auth: vi.fn(), signIn: vi.fn() }))
After:  vi.mock("@/lib/auth", () => ({ getAuth: vi.fn() }));
        beforeEach(() => vi.mocked(getAuth).mockResolvedValue({
          auth: vi.fn().mockResolvedValue(/* session */),
          signIn: vi.fn(), signOut: vi.fn(),
          handlers: { GET: vi.fn(), POST: vi.fn() },
        }));
```

vi.hoisted を併用し factory 内 closure 参照の hoisting 問題を回避。import path は route.ts 側に合わせ相対 path or alias を統一。

### source guard rg 設計（L3）

```
rg -n '^import\s+(?!type)' apps/web/src/lib/auth.ts | rg 'from ["'\'']next-auth'
```

行頭固定 + 否定先読み (`(?!type)`) で type-only import を誤検知しない。

### 新規 unit test 不要の根拠

1. `getAuth()` は `await import("next-auth")` を遅延させる薄いラッパで新規ロジックを持たない
2. 振る舞い等価性は (a) TypeScript 型による export shape 維持 / (b) build smoke による prerender 経路実通過 / (c) 既存 vitest による route handler 振る舞い再現 の 3 点で十分担保

### approval gate

1. CI workflow / lefthook hook への source guard 追加は別タスク（user 承認後）
2. 新規 unit test 追加は本 Phase 時点で不要（追加要否判断は Phase 9 再評価）
3. dependency / version bump は本 Phase テスト戦略から除外（AC-8）

## 状態

- **pending**: テスト境界 / 検証コマンド / mock template / source guard が確定。実走は Phase 5（mock 切替実装）と Phase 11（build smoke 実測）。本 Phase ではコード変更・commit / push / PR・dependency 更新を実施しない

## 次 Phase への引き渡し

Phase 5（実装ランブック）へ次を渡す:

- 5 レイヤテスト境界と検証コマンド一式
- 一次 evidence (build smoke) 緑化が Phase 5 DoD であること
- L5 既存 vitest の mock 切替（`getAuth` 戻り値 mock 形式）を Phase 5 内で実装
- L3 source guard CI 統合は別タスク委譲
- regression matrix と approval gate
