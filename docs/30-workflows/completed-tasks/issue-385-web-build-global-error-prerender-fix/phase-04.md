[実装区分: 実装仕様書]

# Phase 4: テスト戦略 — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 4 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Plan A（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + 4 route handler / `oauth-client.ts` の dynamic import 化）が `pnpm build` / `pnpm build:cloudflare` を緑化し、既存テスト群を破壊しないことを、build smoke を一次 evidence とした 5 レイヤテスト戦略で検証する境界を定める。本 Phase は実装・実測を行わず、テスト計画と evidence path のみを定める。本 Phase 内で実コード変更・commit / push / PR は実施しない（CONST_007 単一サイクル / index.md scope out）。

## テスト原則

- 一次 evidence は build smoke（`pnpm --filter @ubm-hyogo/web build` / `build:cloudflare`）。`useContext` null 文字列の非出現と exit code 0 を AC-1〜AC-3 の正本判定に据える。
- lazy factory の振る舞い等価性は **TypeScript 型 (export shape 維持) と build ログ** で担保し、新規 unit test は追加しない（過剰検証回避）。`getAuth()` は単に `await import("next-auth")` を遅延させる薄いラッパであり、副作用は next-auth に閉じる。
- 既存テスト (`apps/web/app/api/me/[...path]/route.test.ts` / `apps/web/app/api/auth/callback/email/route.test.ts`) は **PASS させ続ける**。mock 戦略の切替（`auth` / `signIn` 直接 mock → `getAuth` 戻り値 mock）が必要になる場合は Phase 5 runbook 内で実装し、本 Phase は方針のみ定義する。
- top-level `next-auth` import 撤廃の regression 防止は AC-6（`rg` ベース source guard）で担保する。
- regression matrix は build / build:cloudflare / typecheck / lint / 既存 vitest の 5 経路。

## テスト境界の整理（5 レイヤ）

| レイヤ | 対象 | 実行方式 | 実行タイミング | 紐付く AC |
| --- | --- | --- | --- | --- |
| L1: build smoke | `pnpm --filter @ubm-hyogo/web build` exit 0 + `useContext` null 文字列非出現 | shell 実行（手動） | Phase 11 | AC-1, AC-3 |
| L2: cloudflare build smoke | `pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0 + `apps/web/.open-next/worker.js` 生成 | shell 実行（手動） | Phase 11 | AC-2, AC-3 |
| L3: source guard | `apps/web/src/lib/auth.ts` に top-level `next-auth` value import 不在（type-only は許容） | `rg` ベース | Phase 5 / Phase 11 | AC-6 |
| L4: 静的解析 | `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web lint` exit 0 | shell 実行 | Phase 9 / Phase 11 | AC-4, AC-5, AC-7 |
| L5: 既存 vitest | `apps/web/app/api/me/[...path]/route.test.ts` / `apps/web/app/api/auth/callback/email/route.test.ts` PASS | `pnpm --filter @ubm-hyogo/web test` | Phase 5 (mock 切替時) / Phase 11 | AC-9 |

## L1: build smoke の境界

### 検証コマンド

```bash
# clean state
rm -rf apps/web/.next apps/web/.open-next

# build 実行
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee /tmp/issue-385-build.log

# exit code
echo "EXIT=$?"

# useContext null 文字列の非出現を確認
grep -n "Cannot read properties of null (reading 'useContext')" /tmp/issue-385-build.log || echo "OK: useContext null not found"
grep -nE "/(_global-error|_not-found)" /tmp/issue-385-build.log
```

### 期待出力

- exit code 0
- 標準出力末尾に "Compiled successfully" 系メッセージ
- `/_global-error` / `/_not-found` のラインが Static / Prerendered として完了する
- `useContext` null 文字列が grep で 0 hit

### prerender artifact 検査

```bash
ls -la apps/web/.next/server/app/_global-error.html 2>&1 || true
ls -la apps/web/.next/server/app/_not-found.html 2>&1 || true
```

build が exit 0 で完了した時点で `.next/server/app` 配下の prerender 成果物が存在することを補助 evidence として記録する。

### evidence path

- `outputs/phase-04/main.md`（test plan）
- `outputs/phase-11/build-smoke.md`（実測時の build stdout 抜粋・grep 結果サマリ・artifact ls）
- `outputs/phase-11/prerender-output-check.md`（`/_global-error` / `/_not-found` artifact の有無）

## L2: cloudflare build smoke の境界

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee /tmp/issue-385-build-cf.log
echo "EXIT=$?"

ls -la apps/web/.open-next/worker.js
grep -n "Cannot read properties of null (reading 'useContext')" /tmp/issue-385-build-cf.log || echo "OK"
```

### 期待出力

- exit code 0
- `apps/web/.open-next/worker.js` が生成される
- `useContext` null 文字列 0 hit

### evidence path

- `outputs/phase-04/main.md`
- `outputs/phase-11/build-cloudflare-smoke.md`（実測 stdout 抜粋・worker.js ls）

## L3: source guard の境界

### テスト観点

`apps/web/src/lib/auth.ts` に top-level の `next-auth` / `next-auth/providers/*` / `next-auth/jwt` の **value import** が再混入すると Phase 1 で確定した真因が再発する。type-only import (`import type { ... } from "next-auth"`) は build 時にコード生成されないため許容する。

### 検証コマンド

```bash
# value import の検出（type-only は除外）
rg -n '^import\s+(?!type)' apps/web/src/lib/auth.ts | rg 'from ["'\'']next-auth' && {
  echo "NG: top-level next-auth value import detected (issue-385 regression)"
  exit 1
} || echo "OK: no top-level next-auth value import"

# oauth-client.ts も同様
rg -n '^import\s+(?!type).*from ["'\'']next-auth/react' apps/web/src/lib/auth/oauth-client.ts && {
  echo "NG: top-level next-auth/react value import in oauth-client.ts"
  exit 1
} || echo "OK"
```

### 実装委譲

- 本タスクは guard の **手動検証コマンド設計のみ** を行う。CI workflow / lefthook hook への組み込みは別タスクへ委譲し、Phase 5 完了後に user 承認を得て実施する。

### evidence path

- `outputs/phase-04/main.md`（guard 設計）
- `outputs/phase-11/build-smoke.md`（手動 grep 結果）

## L4: 静的解析の境界

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee /tmp/issue-385-typecheck.log
echo "TYPECHECK_EXIT=$?"

mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 | tee /tmp/issue-385-lint.log
echo "LINT_EXIT=$?"
```

### 期待出力

- typecheck / lint いずれも exit 0
- `getAuth()` の戻り値型が現行 `auth.ts` の export shape (`handlers`, `auth`, `signIn`, `signOut`) と互換であり、4 route handler / middleware 側の型推論が破綻しない（AC-7 を型レベルで担保）
- `package.json` の version 据置（next / react / react-dom / next-auth）と整合し、依存解決で peer warning の新規発生がない（AC-8）

### evidence path

- `outputs/phase-09/main.md`（QA 実行ログサマリ）
- `outputs/phase-11/build-smoke.md`（同一実行サイクルで取得した場合）

## L5: 既存 vitest の境界

### 影響評価対象

| ファイル | 現行 mock | Plan A 適用後の影響 |
| --- | --- | --- |
| `apps/web/app/api/me/[...path]/route.test.ts` | `vi.mock("@/lib/auth", () => ({ auth: vi.fn(...) }))` 等で `auth` を直接 mock | route 側が `const { auth } = await getAuth();` に変わるため、mock 対象を `getAuth` の戻り値に切替必要 |
| `apps/web/app/api/auth/callback/email/route.test.ts` | `vi.mock("@/lib/auth", () => ({ signIn: vi.fn(...) }))` で `signIn` を直接 mock | 同上、`getAuth` の戻り値 mock 形式に切替必要 |

### mock 切替方針

```ts
// Before (現行)
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(/* session */),
  signIn: vi.fn(),
}));

// After (Plan A)
import { getAuth } from "@/lib/auth";
vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getAuth).mockResolvedValue({
    auth: vi.fn().mockResolvedValue(/* session */),
    signIn: vi.fn(),
    signOut: vi.fn(),
    handlers: { GET: vi.fn(), POST: vi.fn() },
  } as unknown as Awaited<ReturnType<typeof getAuth>>);
});
```

- 既存 assertion は `getAuth` 戻り値の `auth` / `signIn` 関数 mock に対して行えば等価
- `auth.ts` の export 群（`fetchSessionResolve` / `buildAuthConfig` / `AuthEnv` 等の純粋関数・型）は据え置きのため、それらを利用する他テストには影響しない

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  app/api/me/[...path]/route.test.ts \
  app/api/auth/callback/email/route.test.ts
echo "EXIT=$?"
```

### 新規テスト不要の根拠

- `getAuth()` は `await import("next-auth")` の遅延と既存 `NextAuth(buildAuthConfig(env))` 呼び出しを関数内に移すだけの薄いラッパであり、新規ロジックを持たない
- 振る舞いの等価性は次の 3 点で十分担保される:
  1. TypeScript 型による export shape 維持（AC-7）
  2. build smoke による prerender 経路の実通過（AC-1〜AC-3）
  3. 既存 vitest による route handler の振る舞い再現（AC-9）
- lazy 化のための追加 unit test（例: `getAuth() の戻り値が handlers/auth/signIn を含むことを assert`）は型で自動検証されるため不要

### evidence path

- `outputs/phase-04/main.md`（mock 切替方針）
- `outputs/phase-11/build-smoke.md`（test 実行サマリ・exit code・PASS 件数）

## regression matrix

| 経路 | 検証観点 | 期待結果 | 担当レイヤ |
| --- | --- | --- | --- |
| `pnpm build` | prerender 段階で `useContext` null 非出現 + exit 0 | PASS | L1 |
| `pnpm build:cloudflare` | OpenNext worker 生成 + 同上 | PASS | L2 |
| typecheck | export shape 互換 / 型推論 PASS | PASS | L4 |
| lint | 既存ルール違反なし | PASS | L4 |
| 既存 vitest (me / callback) | mock 切替後も既存 assertion PASS | PASS | L5 |
| source guard (`auth.ts`) | top-level next-auth value import 不在 | PASS | L3 |

## fixture / mock 方針

- 本 issue は build smoke 中心 + 既存 vitest mock 切替のため、新規 fixture は作成しない
- `getAuth` の mock は各 test ファイル内で `vi.mock("@/lib/auth", () => ({ getAuth: vi.fn() }))` + `beforeEach` で `mockResolvedValue` 設定の形式に統一
- next-auth 実体を import する mock helper を新設しない（dynamic import の遅延性質を壊すため）
- secret 値・実 OAuth レスポンスを fixture に書かない（不変条件 #16）

## ローカル実行コマンド一覧

```bash
# 依存（Node 24 / pnpm 10 経由）
mise exec -- pnpm install --force

# 静的解析
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 既存テスト
mise exec -- pnpm --filter @ubm-hyogo/web test

# build smoke
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

# source guard（手動）
rg -n '^import\s+(?!type)' apps/web/src/lib/auth.ts | rg 'from ["'\'']next-auth'
rg -n '^import\s+(?!type).*from ["'\'']next-auth/react' apps/web/src/lib/auth/oauth-client.ts
```

## 変更対象ファイル一覧（テスト戦略観点）

| ファイル | テスト関与 | 関与内容 |
| --- | --- | --- |
| `apps/web/src/lib/auth.ts` | L1 / L2 / L3 / L4 / L5 | lazy factory 化対象 / source guard 対象 / 型互換確認 |
| `apps/web/src/lib/auth/oauth-client.ts` | L1 / L2 / L3 / L4 | dynamic import 化対象 / source guard 対象 |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | L1 / L2 / L4 | handlers 取得経路差替え |
| `apps/web/app/api/auth/callback/email/route.ts` | L1 / L2 / L4 / L5 | signIn 取得経路差替え / 既存テスト mock 切替 |
| `apps/web/app/api/admin/[...path]/route.ts` | L1 / L2 / L4 | auth 取得経路差替え |
| `apps/web/app/api/me/[...path]/route.ts` | L1 / L2 / L4 / L5 | 同上 / 既存テスト mock 切替 |
| `apps/web/app/api/me/[...path]/route.test.ts` | L5 | mock 形式を `getAuth` 戻り値方式へ切替 |
| `apps/web/app/api/auth/callback/email/route.test.ts` | L5 | 同上 |
| `apps/web/middleware.ts` | L4 | 変更なし。typecheck で副作用ゼロ確認 |
| `apps/web/next.config.ts` / `apps/web/package.json` | L4 / dependency hygiene | next.config は変更なし。package.json は build script 環境明示のみ、AC-8 で dependency version 据置を担保 |

## 関数シグネチャ（テスト対象）

| 対象 | シグネチャ | テスト観点 |
| --- | --- | --- |
| `getAuth` | `(env?: AuthEnv) => Promise<{ handlers: { GET, POST }, auth, signIn, signOut }>` | export shape 互換 / 型推論 PASS / 並行呼び出しで native ESM cache を経由する |
| `fetchSessionResolve` | 既存維持 | 純粋関数のため Plan A 影響なし |
| `buildAuthConfig` | 既存維持 | 同上 |

## 入出力（build smoke）

| 入力 | 出力 |
| --- | --- |
| `apps/web/src/lib/auth.ts` (lazy factory) + 4 route handler (lazy 取得) | `apps/web/.next/server/app/_global-error.*` 静的成果物 |
| 同上 | `apps/web/.open-next/worker.js`（cloudflare build） |
| build stdout | `/tmp/issue-385-build*.log`（grep evidence 抽出元） |
| 既存 vitest (mock 切替後) | exit 0 / 全 PASS |

## DoD

- L1〜L5 の検証コマンド・期待出力・evidence path が確定している
- 一次 evidence (build smoke) と二次 evidence (source guard / 静的解析 / 既存 vitest) の優先順位が明記されている
- regression matrix に build / build:cloudflare / typecheck / lint / vitest / source guard が揃っている
- AC-1〜AC-9 すべてに紐付くレイヤが少なくとも 1 つ存在する
- mock 切替方針（既存 2 ファイル）が `getAuth` 戻り値 mock 形式で統一されている
- 新規 unit test を追加しない根拠が明記されている

## approval gate（自走禁止）

1. CI workflow / lefthook hook への source guard 追加は別タスクで user 承認後に実施
2. 新規 unit test の追加は本 Phase 時点では不要と判定する（追加要否判断は Phase 9 再評価）
3. dependency / version bump は本 Phase テスト戦略から除外（AC-8）

## 実行タスク

1. 5 レイヤ（L1-L5）の境界・コマンド・期待出力を確定する。完了条件: 5 レイヤすべてに検証コマンドと evidence path が紐付く。
2. AC-1〜AC-9 と L1-L5 の対応が取れることを確認する。完了条件: 各 AC が 1 つ以上のレイヤでカバーされる。
3. 既存 vitest 2 ファイルの mock 切替方針を確定する。完了条件: `getAuth` 戻り値 mock 形式の before/after コード例が揃う。
4. source guard（L3）の rg コマンドを type-only import 許容で確定する。完了条件: 行頭固定 + 否定先読みで value import のみを hit させる。
5. 新規 unit test 不要の根拠を明記する。完了条件: 型 / build / 既存 vitest の 3 点で等価性担保が説明される。

## 参照資料

- `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/index.md`（AC-1〜AC-9 / Plan A 全体方針）
- `phase-01.md`〜`phase-03.md`（要件 / 設計 / 設計レビュー）
- `apps/web/src/lib/auth.ts` / `apps/web/src/lib/auth/oauth-client.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts` / `apps/web/app/api/auth/callback/email/route.ts`
- `apps/web/app/api/admin/[...path]/route.ts` / `apps/web/app/api/me/[...path]/route.ts`
- `apps/web/app/api/me/[...path]/route.test.ts` / `apps/web/app/api/auth/callback/email/route.test.ts`
- `apps/web/middleware.ts` / `apps/web/next.config.ts` / `apps/web/package.json`
- Next.js 16 App Router docs / next-auth 5.x docs

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではコード変更、deploy、commit / push / PR、dependency 更新を行わない
- 実装・実測時は Phase 5（実装ランブック）/ Phase 11（実測 evidence）に従う

## 統合テスト連携

- 上流: Phase 1（要件定義）/ Phase 2（設計）/ Phase 3（設計レビュー）
- 下流: Phase 5（実装ランブック）/ Phase 6（異常系）/ Phase 9（QA）/ Phase 11（実測）
- 並行: P11-PRD-003 / P11-PRD-004（build 緑化後に検証可能化）

## 多角的チェック観点

- 不変条件 #5（D1 access boundary）: テストは `apps/web` build / vitest に閉じる
- 不変条件 #14（Cloudflare free-tier）: build 成果物の構造変化は worker.js 内部のみ、新規 binding ゼロ
- 不変条件 #16（secret values never documented）: build / test ログに env 値が混入する場合は evidence 抜粋から除外
- 未実装 / 未実測を PASS と扱わない: source guard (L3) / 静的解析 (L4) のみで AC-1〜AC-3 (build smoke) を満たしたとみなさない
- 過剰検証を避ける: lazy factory に対する追加 unit test は型で代替

## サブタスク管理

- [ ] refs を確認した
- [ ] 5 レイヤ（L1-L5）の境界を確定した
- [ ] regression matrix を確定した
- [ ] AC-1〜AC-9 ↔ レイヤ対応を確定した
- [ ] mock 切替方針（既存 vitest 2 ファイル）を確定した
- [ ] source guard (L3) の type-only 許容 rg を確定した
- [ ] 新規 unit test 不要の根拠を明記した
- [ ] approval gate を明記した
- [ ] outputs/phase-04/main.md を作成した

## 成果物

- `outputs/phase-04/main.md`（5 レイヤテスト境界 / regression matrix / mock 切替方針 / source guard 設計 / AC ↔ レイヤ対応）

## 完了条件

- L1〜L5 すべてに検証コマンドと evidence path が紐付いている
- 一次 evidence (build smoke) と二次 evidence (guard / 静的解析 / 既存 vitest) の優先順位が明記されている
- AC-1〜AC-9 すべてが 1 つ以上のレイヤでカバーされている
- 既存 vitest 2 ファイルの mock 切替方針が `getAuth` 戻り値 mock で確定している
- source guard (L3) の rg コマンドが type-only import を誤検知しない

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] secret 値・実行ログ実値を記録していない

## 次 Phase への引き渡し

Phase 5（実装ランブック）へ次を渡す:

- 5 レイヤテスト境界と検証コマンド一式
- 一次 evidence (build smoke) を緑化することが Phase 5 の DoD であること
- L5 既存 vitest の mock 切替（`getAuth` 戻り値 mock 形式）を Phase 5 内で実装すること
- L3 source guard を Phase 5 完了後に CI 別タスクへ委譲すること
- regression matrix（build / build:cloudflare / typecheck / lint / vitest / guard）
- approval gate（CI guard 別タスク委譲 / 新規テスト追加禁止 / version bump 禁止）
