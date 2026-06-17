# Phase 2: 設計

## メタ情報
正本: `outputs/phase-2/phase-2.md` / 上位 SSOT: `../../_shared-context.md`

## 目的
一次/二次データの fail-soft 境界設計・ApiError 分類設計（実コンストラクタ契約で確定）・T01/T02 の Before/After・不変条件 #11 の機械的保証・テスト戦略・validation path を固定する。

## 1. レーン設計（3 並列以下 / validation 直列）

| レーン | タスク | 領域 | 依存 |
|--------|--------|------|------|
| A | T02 | `apps/api/src/middleware/session-guard.ts` + `apps/api/src/routes/me/index.ts`（一次データ分類 rethrow） | 独立（既設 errorHandler を変更せず利用） |
| B | T01 | `apps/api/src/routes/me/index.ts`（P4 fail-soft 化） | T02 と同一ファイルを触るため **A → B の順で直列**（編集衝突回避。設計上の依存はなし） |
| C | T03 → T04 | `index.contract.spec.ts` 追記 + `session-guard.spec.ts` 新規 → Issue 最適化草稿（docs） | T01/T02 の確定 diff に依存（期待値は Phase 4 で契約固定） |

validation lane（Phase 9）は直列で締める。

## 2. fail-soft 境界設計（一次/二次データ・中核）

### 2.1 境界の定義（SSOT §9 準拠）

| 区分 | データ | 例外時の設計 | 根拠 |
|------|--------|-------------|------|
| 一次データ | session-guard の identity/status/admin lookup（P1/P2）・`profile` 本体（P3） | **fail-hard 維持 + 分類**：`UBM-5001` + `context.scope` で rethrow → onError が 500 problem+json 化 | これ無しでは response が成立しない。誤魔化して 200 を返すと「ログインしているのに空画面」という嘘になる |
| 二次データ | `pendingRequests`（P4）・`editResponseUrl`（P5・済）・`photoUrl`（P6・済） | **fail-soft**：当該フィールドを空値/欠落にして 200 維持 + 構造化 `logError` | 欠けても profile 表示は成立する。既存前例 P5/P6 と方針統一 |

### 2.2 設計判断（後続実装者向けの確定事項）

1. **status は 500 のまま**（`UBM-5001` の meta status=500）。`UBM-5500`（503）への変更は status 体系変更にあたるため**行わない**（AC-4 / 不変条件）。
2. **catch 位置は呼び出し側**（session-guard / route handler）。repository 層（`findIdentityByMemberId` 等）には触らない — repository は他 route からも使われ、scope（「/me のどこで落ちたか」）は呼び出し側でしか確定できないため。
3. **P4 の fallback 値は `{}`**。`PendingRequests`（`apps/api/src/routes/me/schemas.ts`）は `visibility?`/`delete?` の optional フィールドのみで `{}` が zod valid（既存テスト「pending が無い場合は pendingRequests={}」で確認済み）。UI は「申請中バナーが出ない」だけの degrade に留まる。
4. **分類 helper の共通化（純関数抽出）はしない**。catch ブロックは 3 箇所・各 5 行程度であり、新規ファイル/新規 export を増やすより重複を許容する（existing-hardening 方針）。Phase 8 で抽出の要否を再評価する。

## 3. ApiError 分類設計（実コンストラクタ契約・確定）

### 3.1 実契約（`packages/shared/src/errors.ts:54-108` Read 済み）

```ts
export interface ApiErrorLogExtra {
  stack?: string;
  sqlStatement?: string;
  externalResponseBody?: string;
  context?: Record<string, unknown>;
  cause?: unknown;
}
export interface ApiErrorOptions {
  code: UbmErrorCode;       // "UBM-5001" → meta { status: 500, title: "Database Error" }
  status?: number;          // 省略時 meta.status（500）
  title?: string; detail?: string; type?: string; instance?: string; traceId?: string;
  log?: ApiErrorLogExtra;   // ← cause / context はここ（トップレベルではない）
}
constructor(options: ApiErrorOptions)
```

> **SSOT §3.1 擬似コードとの乖離注記**: SSOT の `new ApiError({ code: "UBM-5001", cause: err, context: {...} })` は設計意図のスケッチであり、実引数では `cause`/`context` は **`log` オプション配下**に入れる。本節が正（SSOT §3.1 自身が「正確な引数名は errors.ts を読んで確定すること」と委譲済み・正本順位は SSOT §10 で本 outputs が Issue 由来情報より上位）。

### 3.2 正確なコンストラクタ呼び出し例（T02 で 3 箇所共通のパターン）

```ts
import { ApiError } from "@ubm-hyogo/shared/errors";   // error-handler.ts と同一 import path

throw new ApiError({
  code: "UBM-5001",
  log: {
    cause: err,
    context: { scope: "me-session-guard" },            // ← scope 文字列のみ。memberId/email 禁止（#11）
    ...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {}),
  },
});
```

- `status` は省略（meta から 500）。`detail` も省略（meta の「データベース操作に失敗しました。」が client に出る。member 固有情報なしで安全）。
- `stack` を条件付きで引き継ぐのは `ApiError.fromUnknown`（errors.ts:129-149）と同等のログ品質を保つため。`errorHandler` は `apiError.log.stack` があるときのみ `log.stack` に出力し、`log.cause` は Error なら `{name, message}` へ縮約、`apiError.log.context` は payload トップレベル `context` へ転記する（error-handler.ts:55-79 確認済み）。
- client へ返る problem+json（`toClientJSON`）は `type/title/status/detail/instance/code/traceId` のみで、**`log`（cause/context/stack）は一切含まれない** — scope はログ専用であり response shape は不変（AC-4）。

## 4. T01（F-1: P4 fail-soft 化）Before/After

`apps/api/src/routes/me/index.ts` GET /profile 内（:181）:

```ts
// Before
const pendingRequests = await getPendingRequestsForMember(providerCtx, user.memberId);

// After（photoUrl :183-185 と同じ .catch 方式で統一。logError は @ubm-hyogo/shared/logging）
const pendingRequests = await getPendingRequestsForMember(providerCtx, user.memberId).catch(
  (err: unknown): PendingRequests => {
    logError({
      code: "UBM-5001",
      status: 500,
      message: "pendingRequests fail-soft",
      path: "/me/profile",
      context: { scope: "me-pending-requests" },
      log: { cause: err },
    });
    return {};
  },
);
```

追加 import（同ファイル先頭）:

```ts
import { logError } from "@ubm-hyogo/shared/logging";
import type { PendingRequests } from "./schemas";   // services.ts:19 と同じ import 元
```

- `logError` の `StructuredLogInput` は `message` 必須・`context`/`log` はトップレベルにある（logging.ts:3-20。**ApiError とはフィールド配置が異なる**点に注意）。`sanitize()`（logging.ts:43-73）が Error instance を `{name, message, stackPreview(5行)}` へ自動変換するため `cause: err` を生のまま渡してよい。
- `status: 500` は「fail-soft しなければ 500 だった」ことの記録であり、response status は 200（degrade 成功）。
- `MeProfileResponseZ.parse(body)` は変更不要（`pendingRequests: {}` は既存の valid ケース）。

## 5. T02（F-2: P1-P3 の分類 rethrow）Before/After

### 5.1 `apps/api/src/middleware/session-guard.ts`（P1: :84-87 / P2: :105）

```ts
// 追加 import
import { ApiError } from "@ubm-hyogo/shared/errors";

// P1 Before
const [identity, status] = await Promise.all([
  findIdentityByMemberId(ctx, memberId),
  getStatus(ctx, memberId),
]);
// P1 After（.catch の handler が常に throw → 戻り型 never で const 構造は維持できる）
const [identity, status] = await Promise.all([
  findIdentityByMemberId(ctx, memberId),
  getStatus(ctx, memberId),
]).catch((err: unknown): never => {
  throw new ApiError({
    code: "UBM-5001",
    log: {
      cause: err,
      context: { scope: "me-session-guard" },
      ...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {}),
    },
  });
});

// P2 Before
const adminRow = await findAdminByEmail(ctx, toAdminEmail(session.email));
// P2 After（scope は P1 と同一 "me-session-guard"。識別子を増やさない）
const adminRow = await findAdminByEmail(ctx, toAdminEmail(session.email)).catch(
  (err: unknown): never => {
    throw new ApiError({
      code: "UBM-5001",
      log: {
        cause: err,
        context: { scope: "me-session-guard" },
        ...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {}),
      },
    });
  },
);
```

### 5.2 `apps/api/src/routes/me/index.ts`（P3: :170-175）

```ts
// Before
const profile = await buildMemberProfile(
  { ...ctx, var: { attendanceProvider: c.var.attendanceProvider } },
  user.memberId,
  { attendancePage: { limit: ATTENDANCE_PAGE_DEFAULT_LIMIT } },
);
// After
const profile = await buildMemberProfile(
  { ...ctx, var: { attendanceProvider: c.var.attendanceProvider } },
  user.memberId,
  { attendancePage: { limit: ATTENDANCE_PAGE_DEFAULT_LIMIT } },
).catch((err: unknown): never => {
  throw new ApiError({
    code: "UBM-5001",
    log: {
      cause: err,
      context: { scope: "me-profile-builder" },
      ...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {}),
    },
  });
});
```

- onError（`apps/api/src/index.ts:195` 既設）が `isApiError` 分岐で本 ApiError をそのまま problem+json + logError 整形する。**error-handler / index.ts は無変更**。
- 同期 throw（`asMemberId` 等の brand 変換）は対象外 — D1 例外分類が責務であり、それらは従来どおり `UBM-5000` で onError に落ちる（挙動不変）。

## 6. 不変条件 #11（memberId / email 非露出）の機械的保証

| 層 | 保証方法 |
|----|---------|
| 型・構造 | `context` に入れる値は literal `{ scope: "me-session-guard" \| "me-profile-builder" \| "me-pending-requests" }` のみ（本設計の 3 呼び出し例が全列挙。動的値・変数を context に入れる記述を仕様として禁止） |
| response | `toClientJSON()` が `log` を構造的に含まない（errors.ts:110-120）ため、scope/cause すら client に出ない。T03 で response body `not.toContain("m_001")` / `not.toContain("user1@example.com")` をアサート |
| ログ | T03 で `vi.spyOn(console, "error")` により構造化ログ行を捕捉し、`context.scope` の存在と **`m_001` / session email の非含有**を同一行に対してアサート（cause.message に SQL や id が混入しないことの canary） |
| grep gate | Phase 9/11 で `grep -n "context: {" apps/api/src/middleware/session-guard.ts apps/api/src/routes/me/index.ts` の全ヒットが `{ scope: "..." }` 固定文字列のみであることを記録（AC-5 証跡） |

> 補足: `sanitize()` は `session`/`token` 等の機微キーを `[REDACTED]` 化するが **memberId/email は対象外**。よって #11 の保証は「最初から入れない + テスト/grep で固定」が正であり、sanitize に依存しない。

## 7. テスト戦略（T03・既存 spec の実パターン準拠）

### 7.1 既存パターン（`index.contract.spec.ts` Read 済み）

- fake session 注入: `createMeRoute({ resolveSession: async () => ({ email, memberId: "m_001" }) })`（spec:50-61）。
- D1: `setupD1()`（InMemoryD1）+ fixture seed。env は `{ DB: env.db as unknown as D1Database, ... }` を `app.request(path, init, e)` の第 3 引数で渡す。

### 7.2 throw させる fake の注入方法（新規・設計確定）

**(a) onError 付きハーネス**: 既存 spec は `createMeRoute()` の sub-app を直接叩いており onError が無い（Hono 既定の text 500 になる）。5xx の problem+json shape を検証するには production マウント（`index.ts:195,224-229`）を最小再現する wrapper を spec 内に作る:

```ts
import { Hono } from "hono";
import { errorHandler } from "../../middleware/error-handler";

const buildAppWithErrorHandler = (env: InMemoryD1, sessionEmail?: string | null) => {
  const { app: meApp, env: e } = buildApp(env, sessionEmail);
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/", meApp);
  return { app, env: e };
};
```

**(b) SQL パターン選択式 failing D1**: 経路ごとに「どの D1 クエリで落とすか」を SQL 文字列で選択する Proxy。sessionGuard と buildMemberProfile は同テーブル（member_identities/member_status）を読むため、**呼び分けはテーブルではなく fail パターンで行う**:

```ts
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
```

| TC | 注入 | リクエスト | 期待値 |
|----|------|-----------|--------|
| TC-1 | `failingDb(db, /member_identities|member_status/)` — 最初の D1 接触が sessionGuard なので全クエリ fail で P1 を踏む | `GET /me`（ハーネス経由） | 500・`content-type: application/problem+json`・body `code: "UBM-5001"`・`x-request-id`/`x-trace-id` 付与。console.error 捕捉行に `context.scope === "me-session-guard"`。body/ログに `m_001`・email 非含有 |
| TC-2 | `failingDb(db, /response_fields|member_responses/)` — sessionGuard のクエリは通り、buildMemberProfile 内の response 系クエリ（builder.ts:319-381）で fail し P3 を踏む | `GET /me/profile` | 500・`UBM-5001`・`context.scope === "me-profile-builder"` |
| TC-3 | `failingDb(db, /admin_member_notes/)` — GET 経路で同テーブルを読むのは `getPendingRequestsForMember` のみ（P4） | `GET /me/profile` | **200**・`MeProfileResponseZ.parse` 成功・`pendingRequests` が `{}`・`profile`/`editResponseUrl`/`fallbackResponderUrl` は完全。console.error に `scope: "me-pending-requests"` |
| TC-4 | 注入なし（既存テスト全件） | 既存 describe 群 | 回帰ゼロ（200/401/410/202/409/422/403/429 すべて緑維持） |

- TC-1 は ``（新規）に middleware 単体 + ハーネスで配置し、TC-2/TC-3 は `index.contract.spec.ts` へ追記する（どちらも fake パターンは上記 (a)(b) を共有してよい。重複定義は spec 内ローカルで許容）。
- TC-2 の fail パターンは実装時に builder.ts の実 SQL（`member_responses`/`response_fields`/`member_field_visibility`）を確認して 1 テーブルへ絞ってよい（Phase 4 の期待値表で確定）。

## 8. エラーハンドリング表（After の全体像）

| 経路 | 例外時 status | code | scope（ログのみ） | response への影響 |
|------|--------------|------|-------------------|-------------------|
| P1 sessionGuard identity/status | 500（不変） | `UBM-5000`→**`UBM-5001`** | `me-session-guard` | problem+json（shape 不変・detail は meta 既定文） |
| P2 sessionGuard findAdminByEmail | 500（不変） | →**`UBM-5001`** | `me-session-guard` | 同上 |
| P3 buildMemberProfile | 500（不変） | →**`UBM-5001`** | `me-profile-builder` | 同上 |
| P4 getPendingRequestsForMember | **500 → 200** | （logError に `UBM-5001` 記録） | `me-pending-requests` | `pendingRequests: {}` で degrade |
| P5 resolveEditResponseUrl | 200（既存・不変） | — | — | null → fallbackResponderUrl |
| P6 resolveMyPhotoUrl | 200（既存・不変） | — | — | photoUrl 省略 |
| P7/P8 me-session-resolver | 401（既存・不変） | — | — | UNAUTHENTICATED |
| 上記以外の未捕捉例外 | 500（既存・不変） | `UBM-5000`（fromUnknown） | — | 従来どおり onError |

## 9. validation path（CONST_005）

```bash
# focused tests（T03 確定パス）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts \
  

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 非接触確認（AC-6/AC-7）
git diff --stat -- apps/web        # 空
git status --porcelain | grep -v docs/   # migrations/新規 route なし

# 不変条件 #11 grep gate（AC-5）
grep -n "context: {" apps/api/src/middleware/session-guard.ts apps/api/src/routes/me/index.ts

# 仕様書ゲート
pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix
pnpm gate-metadata:validate
```

> vitest focused 実行は monorepo root 基準（`--root=. --config=vitest.config.ts <パス>`）。`--filter` 経由やディレクトリ内直実行は include glob 不一致で "No test files found" になる（既知の罠）。

## 10. 既存コンポーネント再利用
新規 production ファイル・新規エラーコード・新規ログイベントを作らない。既設の `errorHandler` / `ApiError`（`UBM-5001` 既定義）/ `logError` + `sanitize` / `PendingRequests` 型 / 既存 fake 注入パターン（`createMeRoute({ resolveSession })` + InMemoryD1）を再利用し、追加は catch ブロック 4 箇所・import 数行・spec 1 新規に留める。

## 統合テスト連携
node 環境 vitest（InMemoryD1 + failing Proxy）で 5xx 分類・fail-soft を検証。staging 実機の `UBM-5001` ログ確認（`wrangler tail`・`scripts/cf.sh` 経由）は Phase 11 手動手順（user-gated）。

## 参照資料
- `../phase-1/phase-1.md` / `../../_shared-context.md`
- `packages/shared/src/errors.ts` / `logging.ts`、`apps/api/src/middleware/error-handler.ts` / `session-guard.ts`、`apps/api/src/routes/me/index.ts` / `services.ts` / `index.contract.spec.ts`

## 成果物
- `outputs/phase-2/phase-2.md`

## 完了条件
- [x] fail-soft 境界・ApiError 実契約（乖離注記込み）・T01/T02 Before/After・#11 機械的保証・テスト戦略・validation path を固定した。

## 次 Phase への引き継ぎ
- 設計の結合点は (1) `.catch` rethrow が onError に届く前提（既設・無変更）、(2) failing D1 Proxy の SQL パターンが経路を一意に選択できる前提、の 2 点。Phase 3 でリスク評価する。
- `UBM-5500` 不使用・status 500 維持・repository 層非接触・helper 共通化なし（Phase 8 再評価）が確定済みの設計判断。
- Phase 3 は本設計を 4 条件（シンプルさ・正本整合・テスト容易性・ロールバック容易性）で評価し、CONST_007（1 サイクル完了）妥当性と GO/NO-GO を判定する。
- Phase 4 は §7.2 の TC 期待値表を I/O 契約（problem+json フィールド・logError payload・zod shape）として確定する。
