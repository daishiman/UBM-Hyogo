# T02: 一次データ D1 例外の `UBM-5001` 分類 rethrow（F-2）

`[実装区分: 実装仕様書]`

> 依存: なし（最初に着手するタスク）。T01 は本タスクの後（同一ファイル編集の直列化）。
> 正本参照: `../../_shared-context.md`（§3 T02）/ `../phase-2/phase-2.md`（§3 ApiError 実契約・§5 Before/After）/ `../phase-4/phase-4.md`（§1 problem+json 契約・§2.1 形 A ログ契約・§4 TC-1/TC-2）

## 変更対象ファイル一覧

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| 1 | `apps/api/src/middleware/session-guard.ts` | 編集 | P1（`Promise.all` :84-87）と P2（`findAdminByEmail` :105）へ `.catch` 分類 rethrow 追加 + `ApiError` import 追加 |
| 2 | `apps/api/src/routes/me/index.ts` | 編集 | P3（`buildMemberProfile` 呼び出し :170-175）へ `.catch` 分類 rethrow 追加 + `ApiError` import 追加 |

新規ファイル・削除ファイルなし。`error-handler.ts` / `apps/api/src/index.ts` / repository 層は**無変更**（既設 onError が整形・ログを担う）。

## 主要シグネチャ / Before/After diff（Phase 2 §3/§5 確定契約に準拠）

**確定契約**: `ApiError`（`packages/shared/src/errors.ts:91-108`）のコンストラクタは `ApiErrorOptions` を受け、**`cause` / `context` はトップレベル引数ではなく `log: ApiErrorLogExtra = { stack?, sqlStatement?, externalResponseBody?, context?, cause? }` 配下**で渡す。

```ts
// --- 共通 import（両ファイルの先頭に追加） ---
import { ApiError } from "@ubm-hyogo/shared/errors";   // error-handler.ts と同一 import path

// --- session-guard.ts P1（現行 :84-87）---
// Before
const [identity, status] = await Promise.all([
  findIdentityByMemberId(ctx, memberId),
  getStatus(ctx, memberId),
]);
// After（.catch handler が常に throw → 戻り型 never で const 構造を維持）
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

// --- session-guard.ts P2（現行 :105）---
// Before
const adminRow = await findAdminByEmail(ctx, toAdminEmail(session.email));
// After（scope は P1 と同一 "me-session-guard"。識別子を増やさない）
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

// --- routes/me/index.ts P3（現行 :170-175）---
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

- `status` / `detail` / `title` は省略（meta から `500` / `"データベース操作に失敗しました。"` / `"Database Error"`。member 固有情報なしで安全）。
- `stack` の条件付き引き継ぎは `ApiError.fromUnknown`（`errors.ts:129-149`）と同等のログ品質を保つため。
- **R1 代替実装（typecheck 不調時のみ）**: `.catch((err): never => ...)` の型推論が union に `never` を残す等で typecheck が通らない場合は、同等の `try { ... } catch (err) { throw new ApiError({...}) }` + `let` 宣言へ機械的に書き換えてよい（挙動同一・Phase 3 R1）。

## 入力・出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | P1/P2/P3 の D1 系呼び出しの rejected promise |
| 出力 | `ApiError`（`code: "UBM-5001"`・`log.cause` に元例外・`log.context.scope` に発生箇所識別子）を rethrow。**握り潰さない**（一次データは fail-hard 維持） |
| 副作用（ログ） | 本タスク自身はログを出さない。既設 onError（`apps/api/src/index.ts:195` → `error-handler.ts`）が problem+json 整形 + `logError`（形 A・Phase 4 §2.1）を 1 回だけ出す（二重ログなし） |
| response への影響 | status 500・problem+json（Phase 4 §1）。**shape は従来の `UBM-5000` 時と同一構造**（code/title/detail の値のみ変化）。client に scope/cause は一切出ない（`toClientJSON` が `log` を含まない） |
| 成功時 | 挙動完全不変 |
| 対象外 | 同期 throw（`asMemberId` 等の brand 変換）は分類対象外 — 従来どおり `UBM-5000` で onError に落ちる（挙動不変） |

## テスト方針

実テストは T03 が実装する。対応ケース:

- **TC-1**（`session-guard.spec.ts` 新規）: `failingDb(db, /member_identities|member_status/)` → `GET /me` が 500・problem+json・`code: "UBM-5001"`・ログ `context.scope: "me-session-guard"`。
- **TC-2**（`index.contract.spec.ts` 追記）: `failingDb(db, /response_fields/)` → `GET /me/profile` が 500・`UBM-5001`・`context.scope: "me-profile-builder"`。
- **P6-2**（Phase 6）: `failingDb(db, /admin_users/)` → P2 経路も `UBM-5001` + `me-session-guard`。
- **P6-7/P6-8**（Phase 6）: 401（session null / identity 不整合）・410（is_deleted）の既存 status 優先順位が不変。
- 期待値の正本は Phase 4 §1/§2.1/§4。

## ローカル実行・検証コマンド

```bash
# focused tests（monorepo root 基準。T03 実装後に有効）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts \
  

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 不変条件 #11 grep gate（全ヒットが literal { scope: "..." } のみであること）
grep -n "context: {" apps/api/src/middleware/session-guard.ts apps/api/src/routes/me/index.ts

# 非接触確認
git diff --stat -- apps/web   # 空であること
```

## 完了条件（DoD）

- [ ] P1/P2 の D1 例外が `UBM-5001` + `context.scope="me-session-guard"` で分類される（AC-2・TC-1/P6-2 green）。
- [ ] P3 の例外が `UBM-5001` + `context.scope="me-profile-builder"` で分類される（AC-3・TC-2 green）。
- [ ] status 500・problem+json shape・401/404/410 の既存分岐が全て不変（AC-4・TC-4/P6-7/P6-8 green）。
- [ ] grep gate: `context: {` の全ヒットが literal scope 文字列のみ（AC-5）。
- [ ] `pnpm typecheck` / `pnpm lint` exit 0（AC-8）。
- [ ] `error-handler.ts` / `apps/api/src/index.ts` / repository 層に diff がない。

## 不変条件

- `/me` の status 体系（200/401/404/410/5xx）・response shape・path 不変。**code の `UBM-5000`→`UBM-5001` 変化はログ・problem+json の `code`/`title`/`detail` 値のみで、フィールド構造は不変**（AC-4）。
- 不変条件 #11: `context` は literal `{ scope: "me-session-guard" | "me-profile-builder" }` のみ。memberId / email / 動的値を入れない（Phase 2 §6 の 3 層保証）。
- apps/web 非接触（AC-6）。D1 schema・新規 endpoint なし（AC-7）。
- repository 層に scope を持ち込まない（再利用境界・Phase 3 §2）。`UBM-5500` 不使用。
