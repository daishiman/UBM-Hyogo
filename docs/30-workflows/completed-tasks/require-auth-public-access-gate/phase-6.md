# Phase 6: テスト拡充（fail path・回帰 guard）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 6 / 13 |
| 名称 | テスト拡充 |
| 種別 | 実行仕様（テスト追加） |
| 前提 | Phase 5 で全 TC（TC-1-1〜TC-6-3）が GREEN |
| 目的範囲 | Phase 4 で固めた happy path / 基本 fail path に対し、**回帰 guard（認証済み regression / 既存ゲート維持）と境界 fail path（多経路 session / encode / throw / M-2 branch）**を追加する |
| 不変条件 | 新規テストは `*.spec.{ts,tsx}` のみ（不変条件 #8）。既存 `/profile`・`/admin/*` ゲートテストは変更せず GREEN 維持を確認する（AC-10） |

## 目的

Phase 4 が「仕様の固定（Red→Green の最小集合）」だったのに対し、Phase 6 は「壊れ方の網羅」を担う。
認証済みユーザーが従来どおり閲覧できること（AC-4 / AC-10 リグレッション無し）、内部認証 bypass が両消費者で機能すること、
session が Bearer / Cookie の両経路で通ること、redirect 値が正しく encode されること、fail-closed が全経路で保持されること、
そして M-2（`INTERNAL_AUTH_SECRET` 未設定 branch）が明示的にテストされていることを追加 TC で固定する。

## 実行タスク

1. 拡充対象テストファイルと追加 TC を表で確定する（第 6.1 節）。
2. fail path・回帰 guard の追加テストケースを定義する（第 6.2 節）。
3. 既存 `/profile`・`/admin/*` ゲート spec の GREEN 維持を回帰条件として確認する（RG-1・AC-10）。
4. M-2（`INTERNAL_AUTH_SECRET` 未設定 branch）の close を Phase 7 へ引き継ぐ。

### 6.1 拡充対象テストファイルと追加 TC

| # | spec ファイル | 種別 | 追加 TC |
|---|--------------|------|--------|
| F2 | `apps/web/app/(public)/layout.spec.tsx` | 追記 | TC-6-A1〜A3（認証済み regression / encode） |
| F3 | `apps/api/src/middleware/require-public-access.spec.ts` | 追記 | TC-6-B1〜B5（多経路 session / M-2 branch / fail-closed） |
| F4 | `apps/api/src/routes/public/index.contract.spec.ts` | 追記 | TC-6-C1〜C2（内部認証 bypass の全 endpoint 回帰） |
| F5 | `apps/og/src/__tests__/member-source.spec.ts` | 追記 | TC-6-D1（HTTP fallback の内部認証回帰） |
| F7 | `apps/web/src/lib/fetch/public.spec.ts`（既存）/ または `public.ts` 隣接 spec | 追記 | TC-6-E1〜E2（cookie 転送 regression） |
| F8 | `apps/api/src/middleware/require-admin.authz.spec.ts`（既存・**変更しない**） | 回帰確認のみ | RG-1（GREEN 維持確認） |

### 6.2 追加テストケース定義

#### F2 拡充: `(public)/layout.spec.tsx`

| TC | 条件 | 検証する観測値 | 期待値 | 対応 |
|----|------|--------------|--------|------|
| TC-6-A1 | 認証済み・`x-pathname=/members/abc` | children と `sidebar-shell-stub` の両方 | 描画される（深いパスでも regression 無し） | AC-4 |
| TC-6-A2 | 未認証・`x-pathname=/members?tag=a b`（query + space） | notice CTA の `href` | `/login?redirect=` + `encodeURIComponent("/members?tag=a b")`（`%3F` / `%20` を含む） | AC-2 |
| TC-6-A3 | 未認証・`x-pathname` ヘッダ欠落（`null`） | notice CTA の `href` | `/login?redirect=%2F`（既定 `"/"` にフォールバック・throw しない） | AC-2 / fail-closed |

#### F3 拡充: `require-public-access.spec.ts`

| TC | 条件 | env | 検証する観測値 | 期待値 | 対応 |
|----|------|-----|--------------|--------|------|
| TC-6-B1 | `Authorization: Bearer <有効 jwt>` と `Cookie: <有効 jwt>` を同時付与 | `AUTH_SECRET` 設定 | `res.status` | `200`（Bearer 優先でも両立で 200） | AC-6 |
| TC-6-B2 | `Cookie: __Secure-authjs.session-token=<有効 jwt>`（Secure prefix 名） | `AUTH_SECRET` 設定 | `res.status` | `200`（cookie 名バリエーション対応） | AC-6 |
| TC-6-B3 | `AUTH_SECRET` **未設定** + `Authorization: Bearer <jwt>` | `INTERNAL_AUTH_SECRET` のみ設定 | `res.status` | `401`（session 基盤 env 欠落は公開しない） | AC-9 fail-closed |
| TC-6-B4 | `X-Internal-Auth: ""`（空文字）+ session 無し | `INTERNAL_AUTH_SECRET` 設定 | `res.status` | `401`（空ヘッダで内部経路が誤って通らない） | AC-9 |
| TC-6-B5 | `X-Internal-Auth: <正>` + 同時に壊れた `Authorization: Bearer xxx` | `AUTH_SECRET` + `INTERNAL_AUTH_SECRET` 設定 | `res.status` | `200`（session 失敗でも内部認証で通る・OR 判定） | AC-6/AC-7 |

#### F4 拡充: `index.contract.spec.ts`

| TC | 条件 | 検証する観測値 | 期待値 | 対応 |
|----|------|--------------|--------|------|
| TC-6-C1 | 4 endpoint 全てに `X-Internal-Auth: <正>` 付与（`it.each` で網羅） | 各 `res.status` | 全て `200`（内部 bypass の全 endpoint 回帰） | AC-7 |
| TC-6-C2 | 4 endpoint 全てに `X-Internal-Auth: <誤>` 付与（`it.each`） | 各 `res.status` | 全て `401`（誤 secret は全 endpoint で遮断） | AC-6 |

#### F5 拡充: `member-source.spec.ts`

| TC | 条件 | 検証する観測値 | 期待値 | 対応 |
|----|------|--------------|--------|------|
| TC-6-D1 | service binding 不在・HTTP fallback 経路・`INTERNAL_AUTH_SECRET: "s3cr3t"` | `fetchImpl` 呼び出しの header `X-Internal-Auth` | `"s3cr3t"`（fallback 経路でも内部認証付与・回帰） | AC-7 |

#### F7 拡充: `fetch/public.spec.ts`（web cookie 転送 regression）

> 既存 `apps/web/src/lib/fetch/public.spec.ts` があるため追記。なければ新規作成し命名は `*.spec.ts`。

モック方針: `next/headers` の `cookies()` を `vi.mock` し、`{ toString: () => "authjs.session-token=tok" }` 相当を返す。transport（`selectAndFetch`）をスパイ化して送信 header を観測する。`vi.stubGlobal("window", ...)` は使わず、必要なら `Object.defineProperty` を用いる（happy-dom pitfall）。

| TC | 条件 | 検証する観測値 | 期待値 | 対応 |
|----|------|--------------|--------|------|
| TC-6-E1 | RSC cookie あり（認証済み） | API fetch の `Cookie` ヘッダ | session cookie 値が転送される（`authjs.session-token=...` を含む） | AC-8 |
| TC-6-E2 | RSC cookie 無し（cookies() が空） | fetch 実行 | throw せず Cookie ヘッダ無し（または空）で送る（C1 ゲートで未認証時は本関数未到達のため 401 は許容範囲） | AC-8 / fail-closed |

#### F8 回帰確認: `require-admin.authz.spec.ts`（変更しない）

| RG | 条件 | 期待値 | 対応 |
|----|------|--------|------|
| RG-1 | 既存 `require-admin` / `/admin/*` ゲートテストを **無改変で** 実行 | 全 GREEN 維持（本タスクが admin ゲートに干渉していないことの証明） | AC-10 |

> RG-1 は新規 TC を追加せず、Phase 9（品質保証）でのフルスイート実行時に GREEN を確認する回帰ゲート。`/profile` 関連の既存ゲートテストがあれば同様に GREEN 維持を確認する。

### 6.3 M-2 解決確認（Phase 7 への引き継ぎ）

Phase 4 の TC-3-8 / TC-3-9 と本 Phase の TC-6-B3 で「`INTERNAL_AUTH_SECRET` 未設定 / `AUTH_SECRET` 未設定」の branch を網羅した。
Phase 7（カバレッジ確認）で `require-public-access.ts` の branch coverage を実測し、env 未設定 branch が hit していることを確認して M-2 を close する。

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| AC / MINOR 定義 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-1.md` / `phase-3.md` | TC と AC-4/7/8/9/10・M-2 の対応 |
| Phase 4 TC 一覧 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-4.md` | 重複回避・拡充の基準点 |
| 既存 admin authz spec | `apps/api/src/middleware/require-admin.authz.spec.ts` | RG-1 回帰確認・JWT 署名 helper 流用 |
| 既存 web fetch spec | `apps/web/src/lib/fetch/public.spec.ts` | F7 追記の基準 |
| 既存 og spec | `apps/og/src/__tests__/member-source.spec.ts` | F5 拡充の基準 |

## 実行手順

> ルートからのフルパス指定（package dir 相対は include glob 非マッチの既知 pitfall）。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test "apps/web/app/(public)/layout.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/lib/fetch/public.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/middleware/require-public-access.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/public/index.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/og test apps/og/src/__tests__/member-source.spec.ts
# 回帰（無改変・GREEN 維持確認）
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/middleware/require-admin.authz.spec.ts
```

1. 6.2 の追加 TC（TC-6-A1〜TC-6-E2）を各 spec へ追記する（Phase 4 の TC と重複しないこと）。
2. 各 targeted run で追加 TC が GREEN であることを確認する。
3. RG-1: `require-admin.authz.spec.ts`（および存在する `/profile` ゲート spec）を**無改変で**実行し GREEN を確認する（AC-10）。
4. M-2 branch（TC-3-8 / TC-3-9 / TC-6-B3）が GREEN であることを確認し、Phase 7 の branch coverage 実測へ引き継ぐ。

## 統合テスト連携

- 認証済み regression（TC-6-A1 / TC-6-E1）+ 内部認証 bypass（TC-6-C1 / TC-6-D1）で「正当利用者は壊れず、未認証だけ遮断」を両面から固定。
- RG-1 で既存 admin / profile ゲートへの非干渉（AC-10）を回帰ゲート化。
- Phase 9 のフルスイートでこれら全 spec の GREEN を最終確認する。

## 多角的チェック観点（AIが判断）

- 回帰の網羅: 認証済み（A1/E1）・内部 bypass（C1/D1）・既存ゲート（RG-1）の 3 軸で「壊していない」を証明。
- OR 判定の境界: TC-6-B5（session 失敗 + 内部認証成功 → 200）で「OR ガード」の論理が部分失敗でも成立することを固定。
- fail-closed の全経路: throw（A3）・env 未設定（B3）・空ヘッダ（B4）・誤 secret（C2）で「判定不能 / 不正 → 公開しない」を多経路で網羅。
- M-2 の close 準備: env 未設定 branch を Phase 7 の branch coverage 実測対象として明示。

## サブタスク管理

- [ ] F2 に TC-6-A1〜A3 追記（認証済み regression / encode / pathname 欠落）
- [ ] F3 に TC-6-B1〜B5 追記（多経路 session / M-2 / fail-closed）
- [ ] F4 に TC-6-C1〜C2 追記（全 endpoint 内部認証 bypass / 誤 secret 遮断）
- [ ] F5 に TC-6-D1 追記（HTTP fallback 内部認証）
- [ ] F7 に TC-6-E1〜E2 追記（cookie 転送 regression）
- [ ] RG-1: 既存 admin / profile ゲート spec を無改変で GREEN 維持確認（AC-10）
- [ ] M-2 branch（TC-3-8/3-9/6-B3）GREEN 確認・Phase 7 へ引き継ぎ

## 成果物

| 成果物 | 配置 |
|--------|------|
| layout 拡充 spec | `apps/web/app/(public)/layout.spec.tsx`（追記） |
| middleware 拡充 spec | `apps/api/src/middleware/require-public-access.spec.ts`（追記） |
| contract 拡充 spec | `apps/api/src/routes/public/index.contract.spec.ts`（追記） |
| og 拡充 spec | `apps/og/src/__tests__/member-source.spec.ts`（追記） |
| web fetch 拡充 spec | `apps/web/src/lib/fetch/public.spec.ts`（追記） |
| 本実行仕様 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-6.md` |

## 完了条件

- [ ] 追加 TC（TC-6-A1〜TC-6-E2）が全て GREEN
- [ ] RG-1（既存 admin / profile ゲート spec）が無改変で GREEN 維持（AC-10）
- [ ] 認証済み regression（A1/E1）・内部認証 bypass（C1/D1）が GREEN
- [ ] fail-closed の全経路（throw / env 未設定 / 空ヘッダ / 誤 secret）が TC で固定されている
- [ ] M-2 branch（INTERNAL_AUTH_SECRET 未設定）が GREEN で Phase 7 引き継ぎ可能

## タスク100%実行確認【必須】

- [ ] fail path（多経路 session / encode / throw / M-2 branch）の追加 TC を表で明記した
- [ ] 認証済み regression / 内部認証 bypass の回帰 guard を記述した
- [ ] 既存 `/profile`・`/admin/*` ゲートテストの GREEN 維持（AC-10）を完了条件に含めた
- [ ] ルートからのフルパス targeted run コマンドを記述した

## 次Phase

[phase-7.md](phase-7.md) — カバレッジ確認（変更ファイルの line/branch 実測・M-2 close）
