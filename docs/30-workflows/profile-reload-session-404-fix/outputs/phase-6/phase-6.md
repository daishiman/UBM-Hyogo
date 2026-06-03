# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

T01（apps/api trailing-slash 正規化）/ T02（apps/web proxy URL 構築）/ T03（apps/web `/profile` UI）の各修正に対し、正常系だけでなく **fail path（404 / 非2xx / 401）と回帰 guard** を網羅するテストケースを確定する。とくに AC-5（フルアプリ・マウント経由で `GET /me`→401・`GET /me/`→401 になること）を、サブアプリ直叩きをバイパスしない統合テストで担保する。各テストの新規ファイルは `*.spec.{ts,tsx}` のみとし、実行する補助コマンドを固定する。

## 実行タスク

### 6.1 T01: trailing-slash 正規化 unit テスト

ファイル: `apps/api/src/middleware/__tests__/trailing-slash.spec.ts`（新規）

| ID | 入力 | 期待 | 検証観点 |
|----|------|------|----------|
| TS-1 | `GET /me/`（末尾スラッシュ） | status=308、`Location` ヘッダ=`/me`（末尾スラッシュ無し）、メソッド保持 | 末尾スラッシュ→正規化先へ 308 redirect |
| TS-2 | `GET /me`（末尾スラッシュ無し） | middleware は redirect せず `next()` へ通過（後続ハンドラ到達） | 正規 path は素通り |
| TS-3 | `GET /`（ルート単独） | redirect しない（pathname が `/` のみは正規化対象外） | ルート `/` を 308 ループさせない |
| TS-4 | `OPTIONS /me/`（CORS preflight） | 正規化を発火させない（`corsFromEnv` 側の 204 を阻害しない） | preflight 非干渉（案A の前提） |
| TS-5 | `POST /me/profile/`（body 付き末尾スラッシュ） | status=308、`Location`=`/me/profile`、308 によりメソッド `POST`・body 保持 | 308 がメソッド/body を保持 |
| TS-6 | `GET /me/?foo=bar`（query 付き末尾スラッシュ） | `Location`=`/me?foo=bar`（query 文字列を保持して末尾スラッシュのみ除去） | query 保持 |

### 6.2 T01: フルアプリ・マウント統合テスト（AC-5 中核）

ファイル: `apps/api/src/__tests__/me-route-mount.integration.spec.ts`（新規）

`apps/api/src/index.ts` がエクスポートする実 `app` を import し、`app.request(path, init, env)` でマウント経由を叩く（サブアプリ `createMeRoute` 直叩きを使わない）。

| ID | リクエスト | 期待 status | 検証観点 |
|----|-----------|-------------|----------|
| MM-1 | `GET /me`（認証 cookie 無し） | 401（**404 でないこと**を厳格 assert） | AC-5 中核。マウント解決 + sessionGuard 401 |
| MM-2 | `GET /me/`（末尾スラッシュ・認証無し） | 401（308 を Worker fetch が追従した最終結果。**404 でないこと**） | AC-4 / AC-5。末尾スラッシュが 404 に落ちない |
| MM-3 | `GET /me/profile`（認証無し） | 401（404 でないこと） | 子 path もマウント経由で 401 |
| MM-4 | `GET /nonexistent`（存在しない path） | 404（`notFoundHandler`） | 正規化が誤って全 path を吸わない negative guard |
| MM-5 | `GET /me`（正規セッション cookie 付き・最小 stub） | 200（shape 不変。レスポンス body の必須キー存在を assert） | 正常系がマウント経由でも 200（AC-7 shape 不変） |

> MM-5 のセッション stub は既存 `index.contract.spec.ts` の env / session モック生成手順を踏襲し、`session.user.memberId` のみ参照する不変条件 #11 を破らない。

### 6.3 T02: web proxy URL 構築テスト

ファイル: `apps/web/app/api/me/[...path]/route.route.spec.ts`（新規）

`fetch` をモックし、proxy ハンドラが upstream へ送る URL（第1引数）を assert する。

| ID | 入力 path | 期待 upstream URL | 検証観点 |
|----|-----------|-------------------|----------|
| PX-1 | `/api/me`（`path=[]` 空） | `${apiBase}/me`（**`/me/` を生成しないこと**を厳格 assert） | AC-6 中核。空 path バグ修正 |
| PX-2 | `/api/me/visibility-request`（`path=["visibility-request"]`） | `${apiBase}/me/visibility-request` | 既存子 path 回帰なし |
| PX-3 | `/api/me/profile`（`path=["profile"]`） | `${apiBase}/me/profile` | 同上 |
| PX-4 | `/api/me?foo=bar`（空 path + query） | `${apiBase}/me?foo=bar`（末尾スラッシュ無し + query 保持） | 空 path × query の合成 |
| PX-5 | `/api/me/attendance?year=2026`（子 path + query） | `${apiBase}/me/attendance?year=2026` | 子 path × query の合成 |

### 6.4 T03: `/profile` ページの error code 分岐テスト

ファイル: `apps/web/app/(member)/profile/page.spec.tsx`（既存に追加）

`fetchAuthed` / `safeServerFetch` をモックし、`meResult` の状態ごとに描画を assert する。

| ID | `/me` 結果 | 期待描画 | 検証観点 |
|----|-----------|----------|----------|
| PF-1 | error code=`MEMBER_SESSION_404` | `SectionError` に `actionHref="/login?redirect=/profile"` / `actionLabel="再ログイン"` が渡り CTA リンクが描画。生文字列 `fetchAuthed failed: 404` が DOM に**現れないこと** | AC-1 |
| PF-2 | error code=`MEMBER_SESSION_500`（非2xx・非404） | 一般文言 +「再読み込み」リンク（`retryHref="/profile"`）。技術文字列が**現れないこと** | AC-2 |
| PF-3 | `AuthRequiredError`（401） | `/login?redirect=/profile` への redirect が呼ばれる（`SectionError` を描画しない） | AC-3 回帰なし |
| PF-4 | `meResult.ok=true`（200） | プロフィール本体が描画され `SectionError` を描画しない | 正常系回帰なし |

### 6.5 T03: `SectionError` CTA レンダリングテスト

ファイル: `apps/web/src/components/member/__tests__/SectionError.spec.tsx`（新規）

| ID | props | 期待描画 | 検証観点 |
|----|-------|----------|----------|
| SE-1 | `actionHref` + `actionLabel` 指定 | `<a data-role="action" href={actionHref}>{actionLabel}</a>` を描画 | CTA props 拡張 |
| SE-2 | `retryHref` のみ（CTA props 無し） | 従来どおり retry リンクのみ描画、`data-role="action"` リンクを**描画しないこと** | 後方互換（既存呼び出し不変） |
| SE-3 | `actionHref` + `actionLabel` + `retryHref` 同時指定 | action リンクと retry リンクを並べて描画 | 両立 |
| SE-4 | `actionHref` のみ（`actionLabel` 欠落） | action リンクを描画しない（両方揃ったときのみ描画） | optional props ガード |

### 6.6 補助コマンド（テスト実行）

| 対象 | コマンド |
|------|---------|
| T01 unit | `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/middleware/__tests__/trailing-slash.spec.ts` |
| T01 統合 | `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/__tests__/me-route-mount.integration.spec.ts` |
| T02 proxy | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run app/api/me/\[...path\]/route.route.spec.ts` |
| T03 page | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "app/(member)/profile/page.spec.tsx"` |
| T03 SectionError | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/member/__tests__/SectionError.spec.tsx` |

## 完了条件

- [x] T01 unit（TS-1〜TS-6）/ T01 統合（MM-1〜MM-5）の fail path・回帰 guard を列挙
- [x] T02 proxy（PX-1〜PX-5）の空 path バグと回帰 guard を列挙
- [x] T03 page（PF-1〜PF-4）/ SectionError（SE-1〜SE-4）の分岐・後方互換を列挙
- [x] 新規 test ファイルがすべて `*.spec.{ts,tsx}` 規則であることを確認
- [x] 各テストの実行補助コマンドを固定

## 成果物

- `outputs/phase-6/phase-6.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | `/me` 解決 / 401・410 境界 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` レスポンス shape（MM-5 の必須キー判定基準） |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 未解決→401 の正本 |

- `outputs/phase-1/phase-1.md`（AC-1〜AC-8）
- `outputs/phase-3/phase-3.md`（T01 案A / T02 URL 構築 / T03 CTA props）

## 統合テスト連携

MM-1〜MM-5 が AC-5（マウント経由の 404 非露出）の正本テスト。Phase 7 で TS / MM / PX / PF / SE の変更ブロックに対する line/branch カバレッジ実測予定値を確定し、Phase 9 で typecheck/lint と併せ一括 PASS を確認する。
