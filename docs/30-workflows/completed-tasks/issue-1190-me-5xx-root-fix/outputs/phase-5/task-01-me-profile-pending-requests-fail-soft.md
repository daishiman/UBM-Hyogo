# T01: `/me/profile` pendingRequests の fail-soft 化（F-1）

`[実装区分: 実装仕様書]`

> 依存: **T02 の後に着手**（同一ファイル `apps/api/src/routes/me/index.ts` を編集するため。設計上の依存はなし）。
> 正本参照: `../../_shared-context.md`（§3 T01・§9 用語）/ `../phase-2/phase-2.md`（§2 fail-soft 境界・§4 Before/After）/ `../phase-4/phase-4.md`（§2.2 形 B ログ契約・§4 TC-3）

## 変更対象ファイル一覧

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| 1 | `apps/api/src/routes/me/index.ts` | 編集 | GET /profile 内 `getPendingRequestsForMember` 呼び出し（:181）へ `.catch` fail-soft 追加 + import 2 行追加 |

新規ファイル・削除ファイルなし。`services.ts`（`getPendingRequestsForMember` 本体）は**触らない**（catch は呼び出し側・Phase 2 §2.2）。

## Before/After diff（Phase 2 §4 確定契約に準拠）

```ts
// --- import（ファイル先頭に追加） ---
import { logError } from "@ubm-hyogo/shared/logging";
import type { PendingRequests } from "./schemas";

// --- GET /profile 内（現行 :181）---
// Before
const pendingRequests = await getPendingRequestsForMember(providerCtx, user.memberId);

// After（photoUrl :183-185 と同じ .catch 方式で統一）
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

- `logError` の引数は `StructuredLogInput`（`packages/shared/src/logging.ts:20`）で **`context` / `log` はトップレベル**（`ApiError` の `log` 配下とは配置が異なる点に注意）。
- `sanitize()`（`logging.ts:43-73`）が Error instance を `{name, message, stackPreview}` へ自動変換するため `cause: err` は生のまま渡してよい。
- `status: 500` は「fail-soft しなければ 500 だった」ことの記録。response status は 200。
- `path: "/me/profile"` は production path のリテラル固定（テストハーネスの mount に依存しない・Phase 4 §2.2）。

## 入力・出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `getPendingRequestsForMember(providerCtx, user.memberId)` の rejected promise（D1 例外等） |
| 出力 | fallback 値 `{}`（`PendingRequests` は `visibility?`/`delete?` の optional フィールドのみで `{}` は zod valid。既存テスト「pending が無い場合は pendingRequests={}」が前例） |
| 副作用（ログ） | `console.error` に構造化 JSON 1 行（Phase 4 §2.2 形 B）。**例外 1 回につきログ 1 回だけ**（rethrow しないため onError は発火しない＝二重ログなし） |
| response への影響 | `GET /me/profile` は 200 維持。`pendingRequests: {}` で degrade（UI は「申請中バナーが出ない」のみ）。`profile`/`editResponseUrl`/`fallbackResponderUrl`/`photoUrl` は無影響 |
| 成功時 | 挙動完全不変（`.catch` は reject 時のみ発火） |

## テスト方針

実テストは T03 が実装する（本タスクは production diff のみ）。対応ケース:

- **TC-3**（`index.contract.spec.ts` 追記）: `failingDb(db, /admin_member_notes/)` 注入 → `GET /me/profile` が **200** + `pendingRequests: {}` + `MeProfileResponseZ.parse` 成功 + ログに `context.scope: "me-pending-requests"`。期待値の正本は Phase 4 §4。
- **P6-1**（Phase 6）: 同条件で `console.error` 呼び出しが**ちょうど 1 回**。
- **TC-4 回帰**: 既存 pendingRequests 振り分けテスト（visibility/delete/resolved）が全て緑維持。

## ローカル実行・検証コマンド

```bash
# focused tests（monorepo root 基準。T03 実装後に有効）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/routes/me/index.contract.spec.ts

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 非接触確認
git diff --stat -- apps/web   # 空であること
```

## 完了条件（DoD）

- [ ] `getPendingRequestsForMember` の例外で `GET /me/profile` が 200 + `pendingRequests: {}` を返す（AC-1・TC-3 green）。
- [ ] fail-soft 時に形 B ログ（`UBM-5001`・`scope: "me-pending-requests"`）が**ちょうど 1 回**出る（P6-1 green）。
- [ ] 成功経路（pending あり/なし/resolved）の既存テストが回帰ゼロ（TC-4・AC-4）。
- [ ] `pnpm typecheck` / `pnpm lint` exit 0（AC-8）。
- [ ] `services.ts` / repository 層 / `error-handler.ts` に diff がない。

## 不変条件

- `/me` の status 体系・response shape（`MeProfileResponseZ`）・path 不変。本タスクは「P4 例外時 500 → 200」の degrade 化のみで、意図された status は変えない（AC-4）。
- 不変条件 #11: `context` は literal `{ scope: "me-pending-requests" }` 固定。memberId / email を `context`・`message` に入れない。
- apps/web 非接触（AC-6）。D1 schema・新規 endpoint なし（AC-7）。
- 新規エラーコード・新規ログイベントを作らない（既定義 `UBM-5001` と既存 `logError` のみ使用）。
