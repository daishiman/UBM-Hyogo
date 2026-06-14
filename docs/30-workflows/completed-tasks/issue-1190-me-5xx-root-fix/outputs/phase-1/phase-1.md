# Phase 1: 要件定義

## メタ情報
正本: `outputs/phase-1/phase-1.md` / 上位 SSOT: `../../_shared-context.md`

## 目的
Issue #1190 の起票時前提と現行コード最適化の再定義・5xx 経路マップ（P1-P8・実コード検証済み）・根本問題（F-1〜F-3）・受入条件（AC-1〜AC-10）・不変条件・スコープ外・既存テスト inventory を固定する。

## 1. Issue #1190 の起票時前提と再定義（SSOT §1）

### 1.1 起票時（2026-06-09）の前提

- 親 WF `profile-session-fetch-failure-investigation` は AC-6 で **apps/api 非接触**を不変条件としたため、「5xx を発生させているコード経路の特定と根治」は C-2 として分離され `deferred_pending_root_cause` 状態だった（「真因が H4（5xx）と確定し、例外箇所が特定されてから着手」）。
- staging 実機テスト（MT-A〜MT-D）はlocal present/staging pending（user-gated）で、真因（H3/H4/H5）は本ツリー内の記録上未確定。

### 1.2 現行コード監査（2026-06-12・HEAD 52ade3866）による再定義

1. **グローバル構造化エラーハンドラは既設**：`apps/api/src/index.ts:195` の `app.onError(errorHandler)` が未捕捉例外を `ApiError.fromUnknown(err, "UBM-5000")` → `application/problem+json` + `logError` へ整形する。`/me` は `apps/api/src/index.ts:224-229` で同一 app 配下にマウントされ適用対象（実測：`app.route("/me", createMeRoute(...))` は 224 行目開始。SSOT の「:225」は同一文の範囲内で実質乖離なし）。
2. **5xx を発生させる経路は依然実在し、静的監査で特定可能**（§2）。deferred ブロッカー「例外箇所が特定されてから着手」は staging 実機を待たずに解消した。
3. **`UBM-5001`（500 Database Error）/ `UBM-5500`（503 Service Unavailable）が `packages/shared/src/errors.ts:33,35` に定義済みなのに `/me` 系経路では未使用**。D1 例外が全て汎用 `UBM-5000` に丸まる。
4. **fail-soft 方針が `/me/profile` 内で不統一**：`photoUrl`（`.catch(() => undefined)`）と `editResponseUrl`（services 内 try/catch → null）は fail-soft 済みだが、`getPendingRequestsForMember` だけ fail-hard。

### 1.3 Issue/unassigned-task 前提の実コード検証（gate）

設計前提に引用する関数契約・行番号は全て現行コードを Read して検証した。結果：**SSOT §2.1 の行番号は全件実測と一致（乖離なし）**。

| 引用 | SSOT 値 | 実測（2026-06-12 Read） | 判定 |
|------|---------|------------------------|------|
| `session-guard.ts` Promise.all | :84-87 | :84-87（`const [identity, status] = await Promise.all([...])`） | 一致 |
| `session-guard.ts` findAdminByEmail | :105 | :105 | 一致 |
| `routes/me/index.ts` buildMemberProfile 呼び出し | :170-175 | :170-175 | 一致 |
| `routes/me/index.ts` getPendingRequestsForMember | :181 | :181 | 一致 |
| `routes/me/index.ts` photoUrl `.catch` | :183-185 | :183-185 | 一致 |
| `services.ts` resolveEditResponseUrl | :152-163（try/catch :156-162） | :152-163 / :156-162 | 一致 |
| `me-session-resolver.ts` validateAuthSecretEnv 防御 | :54-63 | :53-63（`let secret` 宣言 :53・try/catch :54-63） | 実質一致 |
| `me-session-resolver.ts` verifySessionJwt | :65 | :65 | 一致 |
| `builder.ts` buildMemberProfile 本体 | :320-381 | :319-381（export 宣言 :319） | 実質一致 |
| `index.ts` onError / /me mount | :195 / :225 | :195 / :224-229 | 実質一致 |

関数契約の検証結果（Phase 2 の設計入力）：

- **`ApiError`（`packages/shared/src/errors.ts:91-108`）**: コンストラクタは `ApiErrorOptions = { code, status?, title?, detail?, type?, instance?, traceId?, log? }` を受ける。**`cause` / `context` はトップレベル引数ではなく `log: ApiErrorLogExtra = { stack?, sqlStatement?, externalResponseBody?, context?, cause? }` 配下**。SSOT §3.1 の擬似コード `new ApiError({ code, cause, context })` は設計意図表現であり実引数とは乖離する（SSOT 自身が「正確な引数名は errors.ts を読んで確定」と注記済み）。正確な呼び出し例は Phase 2 §3 で確定した。
- **`errorHandler`（`apps/api/src/middleware/error-handler.ts:41-84`）**: `isApiError(err) ? err : ApiError.fromUnknown(err, "UBM-5000")` → problem+json（status / `x-request-id` / `x-trace-id`）+ `logError`（`apiError.log.context` は payload トップレベル `context` へ転記）。`/me` 系で `UBM-5001` の ApiError を throw すれば追加実装なしで分類ログが出る。
- **`logError`（`packages/shared/src/logging.ts:89-91`）**: `StructuredLogInput`（`message: string` 必須・`code?/status?/path?/context?/log?` 等）を受け、`sanitize()` が Error instance を `{name, message, stackPreview}` へ変換・機微キーを `[REDACTED]` 化する。
- **`getPendingRequestsForMember`（`services.ts:100-145`）**: `Promise<PendingRequests>` を返す。`PendingRequests` は optional フィールド（`visibility?`/`delete?`）のみで `{}` が valid。

## 2. 5xx 発生経路マップ（`/me`・`/me/profile`・実測検証済み）

| # | 経路 | ファイル:行 | 現状 | 例外時の結果 |
|---|------|-------------|------|--------------|
| P1 | `sessionGuard` → `Promise.all([findIdentityByMemberId, getStatus])` | `apps/api/src/middleware/session-guard.ts:84-87` | try/catch なし | onError → 500 `UBM-5000`（`/me/*` 全 endpoint 共倒れ） |
| P2 | `sessionGuard` → `findAdminByEmail` | `apps/api/src/middleware/session-guard.ts:105` | try/catch なし | 同上 |
| P3 | `GET /me/profile` → `buildMemberProfile`（D1 複数クエリ：`apps/api/src/repository/_shared/builder.ts:319-381`） | `apps/api/src/routes/me/index.ts:170-175` | try/catch なし | onError → 500 `UBM-5000` |
| P4 | `GET /me/profile` → `getPendingRequestsForMember` | `apps/api/src/routes/me/index.ts:181` | try/catch なし | onError → 500 `UBM-5000`（**二次データなのに全体 500**） |
| P5 | `GET /me/profile` → `resolveEditResponseUrl` | `apps/api/src/routes/me/services.ts:152-163` | **fail-soft 済**（try/catch → null・F-11） | 200 維持 |
| P6 | `GET /me/profile` → `resolveMyPhotoUrl` | `apps/api/src/routes/me/index.ts:183-185` | **fail-soft 済**（`.catch(() => undefined)`） | 200 維持 |
| P7 | `me-session-resolver` → `validateAuthSecretEnv` | `apps/api/src/middleware/me-session-resolver.ts:53-63` | **防御済**（try/catch → logError → null → 401） | 401 |
| P8 | `me-session-resolver` → `verifySessionJwt` | `apps/api/src/middleware/me-session-resolver.ts:65` | 失敗時 null 返却（throw しない設計）。401 へ | 401 |

> 改修対象は P1-P4 のみ。P5-P8 は既存防御を変更しない（回帰 guard のみ）。

## 3. 根本問題（F-1〜F-3）

| ID | 問題 | 現行コード根拠 | 種別 |
|----|------|---------------|------|
| F-1 | `/me/profile` の二次データ fail-soft 不統一：`getPendingRequestsForMember` の例外で全体 500 | `routes/me/index.ts:181`（保護なし）vs `:183-185`（photoUrl は `.catch`）・`services.ts:156-162`（editUrl は try/catch） | バグ（回避可能な 5xx） |
| F-2 | 一次データ D1 例外の分類不足：P1-P3 の例外が汎用 `UBM-5000` になり発生 scope を特定不能（`UBM-5001` 未使用） | `session-guard.ts:84-87,:105`・`routes/me/index.ts:170-175` | 可観測性ギャップ |
| F-3 | `/me` 系 5xx の契約テスト不在：D1 例外注入時のレスポンス shape / status / fail-soft 挙動を固定するテストがない | `index.contract.spec.ts` は 200/401/410/202/409/422/403/429 のみ（D1 例外注入 5xx は 0 件。404 PROFILE_UNAVAILABLE 分岐も直接テストなし＝SSOT §2.3 の「200/401/404 系」表記より実測は広いが、5xx 不在という結論は不変） | テストギャップ |

> **真因仮説（H3/H4/H5）との関係**（SSOT §1.3）: 本 WF は真因確定を**待たない**。F-1〜F-3 は真因がどれであっても現行コードに実在し、解消すれば (a) H4 なら根治、(b) H4 でなくても再発時に worker ログ 1 件（`UBM-5001` + scope context）で即時確定できる。

## 4. 受入条件（AC）

| ID | 条件 | 検証方法 |
|----|------|----------|
| AC-1 | `getPendingRequestsForMember` の例外で `GET /me/profile` が 500 にならず 200 + `pendingRequests: {}` で degrade する | T03 TC-3（focused vitest） |
| AC-2 | `sessionGuard` の D1 lookup 例外が `UBM-5001` + `context.scope="me-session-guard"` で分類される（status 500 / problem+json は不変） | T03 TC-1 |
| AC-3 | `buildMemberProfile` の例外が `UBM-5001` + `context.scope="me-profile-builder"` で分類される | T03 TC-2 |
| AC-4 | `/me` の status 体系（200/401/404/410/5xx）・response shape（zod schema）・path に変更がない | 既存契約テスト回帰 + `git diff` レビュー |
| AC-5 | memberId / email がエラー response・エラーログ context に露出しない（不変条件 #11） | T03 アサーション + grep |
| AC-6 | apps/web に diff がない（web 側は既に 5xx degrade 済みのため非接触） | `git diff --stat -- apps/web` 空 |
| AC-7 | D1 schema・Google Form 仕様・新規 endpoint 追加がない | `git diff` レビュー（migrations / routes 追加なし） |
| AC-8 | focused vitest（対象 spec 全件）・`pnpm typecheck`・`pnpm lint` が PASS | Phase 9 |
| AC-9 | Issue #1190 最適化草稿（T04）が「deferred ブロッカー解消の根拠＝§2 経路マップ」を含む | Phase 12 レビュー |
| AC-10 | GitHub mutation（Issue コメント・ラベル・close）・commit・push・PR・staging deploy を本サイクルで実行しない（user-gated） | Phase 13 ゲート |

## 5. 不変条件（CLAUDE.md / プロジェクト準拠）

- 既存 API endpoint surface（`/me` path・shape・status 体系）を変更しない。**5xx の「発生のしかた」を変える（分類・fail-soft）だけで、意図された status（401/404/410/200）は不変**。
- D1 直接アクセスは `apps/api` に閉じる（#5）。D1 schema 変更なし。
- 不変条件 #11: memberId / email を response / ログ context に露出しない（scope 文字列と cause の name/message のみ許容）。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。
- `wrangler` 直叩き禁止（実機確認は `bash scripts/cf.sh` 経由・user-gated）。
- GAS prototype 非参照。Google Form 仕様変更なし。

## 6. スコープ外（SSOT §8）

| 事象 | 理由 / 対応先 |
|------|---------------|
| staging 実機での真因確定（MT-A〜MT-D 実走・wrangler tail） | user-gated。本 WF は真因確定に依存しない設計 |
| H3（410 / is_deleted）復帰運用 | Issue #1189 系（別 Issue）の責務 |
| H5（transport 失敗）の根治 | `profile-session-staging-transport-recovery` WF（別ブランチ・apps/web / env 層）の責務。編集領域非重複 |
| apps/web のエラー表示文言変更 | 既に degrade 済み（`page.tsx:40-73`・`session-error-display.ts`）。変更不要 |
| Issue #1190 の close / ラベル変更 / コメント投稿 | user-gated（AC-10） |
| `/me` 以外の route（admin / public）への同型 hardening 横展開 | 本 Issue の責務外。Phase 12 未タスク検出で記録のみ |

## 7. 既存テスト inventory

| ファイル | 状態 | カバー範囲 | 本 WF での扱い |
|----------|------|-----------|---------------|
| `apps/api/src/routes/me/index.contract.spec.ts` | 既存（552 行） | `GET /me`/`GET /me/profile` 200・401・410・pendingRequests 振り分け・editResponseUrl null fallback・202/409/422/403/429。fake `resolveSession` 注入 + `setupD1`（InMemoryD1）パターン | T03 で D1 例外注入ケース（TC-2/TC-3）+ 回帰（TC-4）を追記 |
| `` | **存在しない（実測確認済み）** | — | T03 で**新規作成**（TC-1：P1/P2 の `UBM-5001` 分類。`*.spec.ts` 命名・同階層慣行は `repository-providers.spec.ts` 等に前例あり） |
| `apps/api/src/middleware/me-session-resolver.authz.spec.ts` ほか同階層/`__tests__/` 4 件 | 既存 | resolver/admin/public guard 系 | 非接触（回帰は全体 CI に委ねる） |
| `apps/web/app/(member)/profile/page.spec.tsx:87-130` | 既存 | web 側 503 degrade（session-5xx）・410・transport 区別 | **非接触**（web 側は充足） |

## 8. 命名規則（既存コードベース分析）

- scope 識別子: 既存ログイベントに合わせ **lower-kebab** の 3 値固定 — `me-session-guard` / `me-profile-builder` / `me-pending-requests`（SSOT §9）。新規識別子を増やさない。
- エラーコード: 既定義の `UBM-5001`（Database Error / 500）のみ使用。`UBM-5500` は本 WF では**不使用**（status 体系不変のため。503 化は明示的にスコープ外）。
- 新規ファイル: `session-guard.spec.ts` のみ（`*.spec.ts`・同階層配置）。production コードの新規ファイルは作らない。
- テスト命名: 既存スタイル（`AC-n:` / `F-n:` プレフィックス + 日本語題）を踏襲し、新規ケースは `TC-1:`〜`TC-4:` プレフィックスとする。

## 統合テスト連携
本タスクは node 環境 vitest（InMemoryD1 + fake resolveSession 注入）で完結する。staging 実機での 5xx 再現・`wrangler tail` による `UBM-5001` ログ確認は Phase 11 の手動手順（`scripts/cf.sh` 経由・user-gated）で代替する。apps/web 側統合テストは非接触のため追加しない。

## 参照資料
- `../../_shared-context.md`（SSOT）
- `apps/api/src/routes/me/index.ts` / `services.ts` / `schemas.ts` / `index.contract.spec.ts`
- `apps/api/src/middleware/session-guard.ts` / `me-session-resolver.ts` / `error-handler.ts`
- `packages/shared/src/errors.ts` / `packages/shared/src/logging.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md` / `02-auth.md` / `13-mvp-auth.md`

## 成果物
- `outputs/phase-1/phase-1.md`

## 完了条件
- [x] 起票時前提の再定義・経路マップ（実コード検証済み）・F-1〜F-3・AC-1〜AC-10・不変条件・スコープ外・テスト inventory・命名規則を固定した。

## 次 Phase への引き継ぎ
- P1-P4 が改修対象（P1-P3＝一次データ＝`UBM-5001` 分類 rethrow、P4＝二次データ＝fail-soft 化）。P5-P8 は不変。
- `ApiError` は `cause`/`context` を **`log` オプション配下**で受ける（§1.3 検証済み）。Phase 2 はこの実契約でコンストラクタ呼び出し例を確定する。
- scope 識別子 3 値（`me-session-guard`/`me-profile-builder`/`me-pending-requests`）と `UBM-5001` のみ使用・`UBM-5500` 不使用を設計に反映する。
- T03 は `index.contract.spec.ts` 追記 + `session-guard.spec.ts` 新規。fake 注入パターンは既存 spec の `createMeRoute({ resolveSession })` + InMemoryD1 を踏襲する。
