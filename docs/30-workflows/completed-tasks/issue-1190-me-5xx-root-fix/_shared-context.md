# _shared-context.md — issue-1190-me-5xx-root-fix（SSOT）

`[実装区分: 実装仕様書]`（NON_VISUAL / apps/api `/me` 系の 5xx 構造的根治 + 契約テスト）

本ファイルは本ワークフローの **単一正本（SSOT）** である。Phase 1-13 の各仕様書・index.md・artifacts.json と矛盾が生じた場合、本ファイルが優先する。

---

## 0. メタ情報

| 項目 | 値 |
|------|------|
| workflow_id | `issue-1190-me-5xx-root-fix` |
| canonical_root | `docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix` |
| 対象 Issue | [#1190](https://github.com/daishiman/UBM-Hyogo/issues/1190) `[profile-session FU C-2] /me 5xx の根治（session-resolver / API worker / D1）` |
| Issue 状態（2026-06-12 確認） | **OPEN**（`closedAt: null`・`priority:medium` / `type:bugfix` / `status:unassigned` / `area:api`）。ユーザー認識「クローズド」と異なるが、本仕様書は Issue 状態を変更せず（クローズドのまま扱う指示に従い GitHub mutation は一切行わない）作成する |
| ブランチ | `docs/issue-1190-me-5xx-root-fix-spec` |
| 起点 | `origin/dev`（52ade3866）。`main`（61bd5b5a6）は HEAD の祖先で同期済み |
| taskType | `implementation` |
| visualEvidence | NON_VISUAL（API エラーハンドリング・ログ・テストのみ。UI 表現変更なし） |
| implementation_mode | `existing-hardening`（既存 route/middleware の防御強化。新規 endpoint なし） |
| workflow_state | `implemented_local_evidence_captured`（本サイクルでコード実装・ローカル検証まで完了。commit・PR は user-gated） |
| 想定 PR base | `dev` |
| 実装区分の根拠（CONST_004） | 目的「/me 5xx の根治」はコード変更（fail-soft 統一・例外分類・テスト追加）なしに達成不可能なため実装仕様書。ユーザー指示も実装仕様書を明示 |
| CONST_007 | 全タスク（T01-T04）を後続実装プロンプト 1 サイクルで完了可能なスコープに収める。先送り分割なし |

---

## 1. Issue #1190 の現行コード最適化（再定義）

### 1.1 起票時（2026-06-09）の前提

- 親 WF `profile-session-fetch-failure-investigation` は AC-6 で **apps/api 非接触**を不変条件としたため、「5xx を発生させているコード経路の特定と根治」が構造的に未着手のまま C-2 として分離された。
- 状態は `deferred_pending_root_cause`：「真因が H4（5xx）と確定し、例外箇所が特定されてから着手」「真因が H3(410)/H5(transport) なら close 候補」。
- staging 実機テスト（MT-A〜MT-D）はlocal present/staging pending（user-gated）で、真因（H3/H4/H5）は本ツリー内の記録上未確定。

### 1.2 現行コード監査（2026-06-12・本ワークフロー Phase 1）による再定義

起票時に存在しなかった／見落とされていた事実：

1. **グローバル構造化エラーハンドラは既設**：`apps/api/src/index.ts:195` の `app.onError(errorHandler)`（`apps/api/src/middleware/error-handler.ts`）が未捕捉例外を `ApiError.fromUnknown(err, "UBM-5000")` → `application/problem+json`（status/traceId/x-request-id）+ `logError`（stack/cause/path/method）へ整形する。`/me` は `apps/api/src/index.ts:225` で同一 app 配下にマウントされており適用対象。**「5xx が不透明」という起票時の問題は worker ログレベルでは半分解消済み**。
2. **しかし 5xx を発生させる経路は依然実在し、コード監査で特定可能**（§2 詳細）。「例外箇所が特定されてから着手」という deferred ブロッカーは、staging 実機を待たずとも**静的監査で解消できる**。
3. **エラーコード体系に `UBM-5001`（Database Error / 500）と `UBM-5500`（Service Unavailable / 503）が定義済みなのに `/me` 系経路では未使用**。D1 例外が全て汎用 `UBM-5000` に丸まり、「session-guard で落ちたのか builder で落ちたのか」をログ 1 件で確定できない。
4. **fail-soft 方針が `/me/profile` 内で不統一**：`photoUrl`（`.catch(() => undefined)`・200 維持）と `editResponseUrl`（services 内 try/catch → null・F-11）は fail-soft 済みだが、`getPendingRequestsForMember` だけ fail-hard で、二次データの D1 例外が**マイページ全体を 500 にする**。

### 1.3 再定義された根本問題（本 WF が解決するもの）

| ID | 問題 | 現行コード根拠 | 種別 |
|----|------|---------------|------|
| F-1 | `/me/profile` の二次データ fail-soft 不統一：`getPendingRequestsForMember` の例外で全体 500 | `apps/api/src/routes/me/index.ts:181`（保護なし）vs `:183-185`（photoUrl は `.catch`）・`services.ts:156-162`（editUrl は try/catch） | バグ（回避可能な 5xx） |
| F-2 | 一次データ D1 例外の分類不足：`sessionGuard` の D1 lookup と `buildMemberProfile` の例外が汎用 `UBM-5000` になり発生 scope を特定不能 | `apps/api/src/middleware/session-guard.ts:84-87`・`apps/api/src/routes/me/index.ts:170-175`（いずれも try/catch なし → onError で `UBM-5000`） | 可観測性ギャップ |
| F-3 | `/me` 系 5xx の契約テスト不在：D1 例外注入時のレスポンス shape / status / fail-soft 挙動を固定するテストがない | `apps/api/src/routes/me/index.contract.spec.ts` は 200/401/404 系のみ | テストギャップ |

> **真因仮説（H3/H4/H5）との関係**: 本 WF は「staging 事象の真因が H4 だったか」の確定を**待たない**。F-1〜F-3 は真因がどれであっても現行コードに実在する欠陥／ギャップであり、これを解消すれば (a) H4 だった場合は根治、(b) H4 でなかった場合も再発時に worker ログ 1 件（`UBM-5001` + scope context）で即時確定できる。これが「Issue を現在のコードに最適化して根本的な問題を解決する」の意味である。

---

## 2. 現行コード ground truth（Phase 1 監査結果・2026-06-12 / HEAD 52ade3866）

### 2.1 5xx 発生経路マップ（`/me`・`/me/profile`）

| # | 経路 | ファイル:行 | 現状 | 例外時の結果 |
|---|------|-------------|------|--------------|
| P1 | `sessionGuard` → `Promise.all([findIdentityByMemberId, getStatus])` | `apps/api/src/middleware/session-guard.ts:84-87` | try/catch なし | onError → 500 `UBM-5000`（`/me/*` 全 endpoint 共倒れ） |
| P2 | `sessionGuard` → `findAdminByEmail` | `apps/api/src/middleware/session-guard.ts:105` | try/catch なし | 同上 |
| P3 | `GET /me/profile` → `buildMemberProfile`（D1 複数クエリ：`apps/api/src/repository/_shared/builder.ts:320-381`） | `apps/api/src/routes/me/index.ts:170-175` | try/catch なし | onError → 500 `UBM-5000` |
| P4 | `GET /me/profile` → `getPendingRequestsForMember` | `apps/api/src/routes/me/index.ts:181` | try/catch なし | onError → 500 `UBM-5000`（**二次データなのに全体 500**） |
| P5 | `GET /me/profile` → `resolveEditResponseUrl` | `apps/api/src/routes/me/services.ts:152-163` | **fail-soft 済**（try/catch → null・F-11） | 200 維持 |
| P6 | `GET /me/profile` → `resolveMyPhotoUrl` | `apps/api/src/routes/me/index.ts:183-185` | **fail-soft 済**（`.catch(() => undefined)`） | 200 維持 |
| P7 | `me-session-resolver` → `validateAuthSecretEnv` | `apps/api/src/middleware/me-session-resolver.ts:54-63` | **防御済**（try/catch → logError → null → 401） | 401 |
| P8 | `me-session-resolver` → `verifySessionJwt` | `apps/api/src/middleware/me-session-resolver.ts:65` | 失敗時 null 返却（throw しない設計）。401 へ | 401 |

### 2.2 既設インフラ（変更しない・利用する）

| 部品 | パス | 要点 |
|------|------|------|
| グローバルエラーハンドラ | `apps/api/src/middleware/error-handler.ts` | `isApiError(err) ? err : ApiError.fromUnknown(err, "UBM-5000")` → problem+json（status / x-request-id / x-trace-id）+ `logError`（stack / cause / sqlStatement / context / path / method）。development のみ debug 同梱 |
| エラーコード体系 | `packages/shared/src/errors.ts` | `UBM-5000`(500 Internal) / `UBM-5001`(500 Database Error) / `UBM-5101`(500 Compensation) / `UBM-5500`(503 Service Unavailable)。`ApiError.log` に `stack` / `sqlStatement` / `cause` / `context` を保持可能 |
| 構造化ログ | `@ubm-hyogo/shared/logging` の `logError` | error-handler 経由で出力。`wrangler tail`（`bash scripts/cf.sh` 経由）で実機確認可能 |
| web 側 degrade | `apps/web/app/(member)/profile/page.tsx:40-73`・`_lib/session-error-display.ts`・`src/lib/server-fetch/safe-fetch.ts` | `/me` 5xx は `MEMBER_SESSION_5xx` → `data-cause="session-5xx"`（「サーバー側でセッション確認に失敗しました」）として既に graceful degrade 済み。**apps/web は本 WF 非接触** |

### 2.3 既存テスト

| ファイル | カバー範囲 | ギャップ |
|----------|-----------|----------|
| `apps/api/src/routes/me/index.contract.spec.ts` | `GET /me`・`GET /me/profile` 正常系（200）・pendingRequests 振り分け・editResponseUrl null fallback | **D1 例外注入 → 5xx shape / fail-soft のテストなし** |
| `apps/web/app/(member)/profile/page.spec.tsx:87-130` | web 側 503 degrade（session-5xx）・410・transport 区別 | web 側は充足（変更不要） |

---

## 3. タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 対象問題 | 変更種別 | 概要 |
|--------|------|----------|----------|------|
| T01 | `apps/api/src/routes/me/index.ts` | F-1 | 編集 | `getPendingRequestsForMember` 呼び出しの fail-soft 化（失敗時 `{}` + 構造化 `logError`・200 維持）。photoUrl / editUrl と方針統一 |
| T02 | `apps/api/src/middleware/session-guard.ts`・`apps/api/src/routes/me/index.ts` | F-2 | 編集 | 一次データ D1 例外を `ApiError`（`UBM-5001` + `context.scope`）へ分類して rethrow。status は 500 のまま（**/me status 体系不変**）。scope: `me-session-guard` / `me-profile-builder` |
| T03 | `apps/api/src/routes/me/index.contract.spec.ts` | F-3 | 編集 | D1 例外注入の契約テスト：P1/P2/P3 → 500 problem+json（`UBM-5001`）、P4 → 200 + `pendingRequests: {}`（fail-soft）、既存 200/401/404/410 回帰。新規 spec ファイルは作らず既存 `/me` contract spec へ集約 |
| T04 | `docs/`（本 WF 配下）+ Issue #1190 コメント草稿 | 1.2 の再定義 | 新規（docs） | Issue 本文の現行コード最適化注記（deferred ブロッカー解消・経路特定済み）の**草稿**作成。GitHub への反映（コメント投稿・ラベル変更・close）は user-gated |

### 3.1 主要シグネチャ / 構造（CONST_005）

> 実装詳細（正確な import・ApiError コンストラクタ引数・既存テストの fake provider 構造）は Phase 2/4/5 で `packages/shared/src/errors.ts` と既存 spec を読んで確定すること。以下は設計意図の正本。

**T01（fail-soft 統一）** — `apps/api/src/routes/me/index.ts` の `GET /profile` 内：

```ts
// Before: const pendingRequests = await getPendingRequestsForMember(providerCtx, user.memberId);
// After（photoUrl と同じ fail-soft 方針・logError は @ubm-hyogo/shared/logging）:
const pendingRequests = await getPendingRequestsForMember(providerCtx, user.memberId)
  .catch((err: unknown) => {
    logError({ code: "UBM-5001", status: 500, message: "pendingRequests fail-soft",
      path: "/me/profile", log: { cause: ... }, context: { scope: "me-pending-requests" } });
    return {} as PendingRequests;  // MeProfileResponseZ は空 object を許容（PendingRequests は optional フィールドのみ）
  });
```

**T02（例外分類）** — 例外を握り潰さず分類して rethrow（onError が整形・ログ）：

```ts
// session-guard.ts: Promise.all を try/catch で包み
catch (err) { throw new ApiError({ code: "UBM-5001", cause: err, context: { scope: "me-session-guard" } }); }
// routes/me/index.ts: buildMemberProfile 呼び出しを同様に
catch (err) { throw new ApiError({ code: "UBM-5001", cause: err, context: { scope: "me-profile-builder" } }); }
```

- `ApiError` コンストラクタの正確な引数名（`cause`/`context` の受け口）は `packages/shared/src/errors.ts` を読んで Phase 4 で確定する。
- **不変条件 #11**: `context` に memberId / email を入れない（scope 文字列と cause の name/message のみ）。

**T03（テスト）** — 既存 `index.contract.spec.ts` に D1 failure proxy と `app.onError(errorHandler)` 付き harness を追加し、throw する fake D1 を注入：

- TC-1: sessionGuard の identity/status lookup throw → `GET /me` が 500・problem+json・`code: "UBM-5001"`
- TC-2: sessionGuard の admin lookup throw → `GET /me` が 500・problem+json・`code: "UBM-5001"`
- TC-3: `buildMemberProfile` throw → `GET /me/profile` が 500・`UBM-5001`
- TC-4: `getPendingRequestsForMember` throw → `GET /me/profile` が **200**・`pendingRequests: {}`・profile 本体は完全

---

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

---

## 5. 不変条件（CLAUDE.md / プロジェクト準拠）

- 既存 API endpoint surface（`/me` path・shape・status 体系）を変更しない。**5xx の「発生のしかた」を変える（分類・fail-soft）だけで、意図された status（401/404/410/200）は不変**。
- D1 直接アクセスは `apps/api` に閉じる（#5）。D1 schema 変更なし。
- 不変条件 #11: memberId を response / ログ context に露出しない。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。
- `wrangler` 直叩き禁止（実機確認は `bash scripts/cf.sh` 経由・user-gated）。
- GAS prototype 非参照。Google Form 仕様変更なし。

---

## 6. ローカル実行・検証コマンド（CONST_005）

```bash
# focused tests
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts -t issue-1190
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts

# 型・lint
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint

# 非接触確認
git diff --stat -- apps/web
git diff --stat -- apps/api/migrations

# 仕様書ゲート
pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix
pnpm gate-metadata:validate
```

> vitest の focused 実行は monorepo root 基準（`--root=. --config=vitest.d1.config.ts <パス>`）。D1 fixture を使うため通常の `vitest.config.ts` ではなく D1 config を使う。

## 7. DoD（Definition of Done）

1. T01-T03 のコード変更が適用され、focused vitest 全緑・API typecheck/lint exit 0。
2. AC-1〜AC-8 充足（grep / diff 証跡を Phase 11 に記録）。
3. T04 草稿が Phase 12 成果物に存在。
4. apps/web・migrations・新規 endpoint の diff ゼロ。
5. commit / push / PR / Issue mutation / staging deploy は**未実行**（user-gated・Phase 13 で承認待ち）。

---

## 8. スコープ外

| 事象 | 理由 / 対応先 |
|------|---------------|
| staging 実機での真因確定（MT-A〜MT-D 実走・wrangler tail） | user-gated。本 WF は真因確定に依存しない設計（§1.3） |
| H3（410 / is_deleted）復帰運用 | Issue #1189 系（別 Issue）の責務 |
| H5（transport 失敗）の根治 | `profile-session-staging-transport-recovery` WF（別ブランチ・進行中）の責務。本 WF と編集領域非重複（あちらは apps/web / env 層） |
| apps/web のエラー表示文言変更 | 既に degrade 済み（§2.2）。変更不要 |
| Issue #1190 の close / ラベル変更 / コメント投稿 | user-gated（AC-10） |
| `/me` 以外の route（admin / public）への同型 hardening 横展開 | 本 Issue の責務外。Phase 12 未タスク検出で扱う（同サイクル解消不能な外部依存なし＝原則起票せず、検出時のみ記録） |

## 9. 用語集

| 用語 | 定義 |
|------|------|
| fail-soft | 二次データ取得失敗時に endpoint 全体を 5xx にせず、当該フィールドを欠落/空値にして 200 を維持する方針（photoUrl / editUrl の既存前例） |
| fail-hard | 例外をそのまま伝播させ endpoint 全体をエラーにする挙動 |
| 一次データ | `/me/profile` の `profile` 本体（これ無しでは response が成立しない）。session-guard の identity/status も一次 |
| 二次データ | `pendingRequests` / `editResponseUrl` / `photoUrl`（欠けても profile 表示は成立する） |
| scope context | `ApiError.log.context.scope` に入れる発生箇所識別子（`me-session-guard` / `me-profile-builder` / `me-pending-requests`） |
| problem+json | `error-handler.ts` が返す `application/problem+json` 形式（status / code / traceId） |

## 10. 正本順位（衝突時）

1. 本 `_shared-context.md`（SSOT）
2. `index.md`（SCOPE）
3. `outputs/phase-{1,2,3}/phase-N.md`（設計の正本）
4. `outputs/phase-5/task-0N-*.md`（実装仕様書本体）
5. `docs/00-getting-started-manual/specs/*.md`（`01-api-schema.md` / `02-auth.md` / `13-mvp-auth.md`）
6. Issue #1190 本文（起票時前提は §1.2 の監査結果で上書き）
