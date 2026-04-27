# 適用したリファクタ Before/After 一覧（Phase 8 成果物）

## 前提

Phase 5 実装は Phase 2 設計をそのまま実体化したため、リファクタ対象テーブル 7 件のうち 5 件は「design-as-built」（実装時点で既にリファクタ済み）。Phase 8 で実コード変更が発生したのは 2 件（consumer 側 import の subpath 化）。

## 実コード変更箇所（2 件）

### 変更 1: `apps/api/src/middleware/error-handler.ts` — subpath import への置換

**Before**

```ts
import {
  ApiError,
  isApiError,
  logError,
  type ApiErrorClientView,
  type StructuredLogInput,
} from "@ubm-hyogo/shared";
```

**After**

```ts
import {
  ApiError,
  isApiError,
  type ApiErrorClientView,
} from "@ubm-hyogo/shared/errors";
import { logError, type StructuredLogInput } from "@ubm-hyogo/shared/logging";
```

**理由**: root barrel 経由を避け、関心ドメインごとに subpath を分離することで navigation drift を構造的に防ぐ。errors / logging を 2 つの独立 import 文に分けることで、各シンボルがどのモジュール由来かが import 文だけで自明になる。

**影響**: なし（同一型定義を参照、ランタイム挙動・ビルド成果物に変更なし）。

### 変更 2: `apps/web/app/lib/api-client.ts` — subpath import への置換

**Before**

```ts
import type { ApiErrorClientView, UbmErrorCode } from "@ubm-hyogo/shared";
```

**After**

```ts
import type { ApiErrorClientView, UbmErrorCode } from "@ubm-hyogo/shared/errors";
```

**理由**: 変更 1 と同じ。`apps/web` 側も errors subpath を直接参照することで、`apps/api` と同一の import 経路を持つことになり、契約整合の grep 容易性が上がる。

**影響**: なし（型 import のみで実行時バンドルに影響なし）。

## design-as-built 確認（5 件）

以下はリファクタ対象テーブルの「After」が Phase 5 実装時点で達成されていることを確認した項目。コード変更不要。

### 1. エラーコード定数の集約 — `packages/shared/src/errors.ts`

```ts
export type UbmErrorCode =
  | "UBM-1000" | "UBM-1001" | "UBM-1002" | "UBM-1404"
  | "UBM-4001" | "UBM-4002" | "UBM-4003"
  | "UBM-5000" | "UBM-5001" | "UBM-5101" | "UBM-5500"
  | "UBM-6001" | "UBM-6002" | "UBM-6003" | "UBM-6004";

export const UBM_ERROR_CODES = {
  "UBM-1000": { status: 400, title: "Bad Request",            defaultDetail: "リクエストが不正です。" },
  // ... 全 15 件
} as const satisfies Record<UbmErrorCode, UbmErrorCodeMeta>;
```

→ Phase 8 ステップ 1（refactor table #1）が達成済み。

### 2. ApiError ファクトリ — `packages/shared/src/errors.ts`

`ApiError` コンストラクタが `code` のみを必須とし、`UBM_ERROR_CODES[code]` から `status`/`title`/`defaultDetail` を自動ルックアップ。`fromUnknown(err, fallbackCode)` 静的ファクトリで Error/string/unknown を 3 分岐で正規化。

→ Phase 8 ステップ 1（refactor table #2）が達成済み。

### 3. withRetry の preset 化 — `packages/shared/src/retry.ts`

```ts
export const SHEETS_RETRY_PRESET = {
  maxAttempts: 2,
  baseDelayMs: 100,
  totalTimeoutMs: 800,
  classify: defaultClassify,
  failureCode: "UBM-6001",
} as const satisfies RetryOptions;
```

→ Phase 8 ステップ 1（refactor table #3）が達成済み。

### 4. runWithCompensation ヘルパ — `packages/shared/src/db/transaction.ts`

```ts
export async function runWithCompensation<T>(
  steps: ReadonlyArray<CompensationStep>,
  options?: RunWithCompensationOptions,
): Promise<T[]>
```

逆順 compensate / 二重失敗時 `UBM-5101` / `recordDeadLetter` フックを標準化。

→ Phase 8 ステップ 1（refactor table #4）が達成済み。

### 5. logging ヘルパの DRY 化 — `packages/shared/src/logging.ts`

`logError` / `logWarn` / `logInfo` / `logDebug` 4 関数 + `sanitize` ヘルパで JSON 1 行出力を統一。`SENSITIVE_KEY_SUBSTRINGS` 11 件の substring REDACT を内蔵。

→ Phase 8 ステップ 1（refactor table #5）が達成済み。

### 6. errorHandler の例外分岐集約 — `apps/api/src/middleware/error-handler.ts`

```ts
const apiError = isApiError(err) ? err : ApiError.fromUnknown(err, "UBM-5000");
```

if 連鎖を 1 行に集約。Error/string/unknown の 3 分岐は `ApiError.fromUnknown` 内部に局所化。

→ Phase 8 ステップ 1（refactor table #6）が達成済み。

## 後続 Phase に持ち越す項目（1 件）

### 7. ドキュメントクロスリンク整備

`apps/api/docs/error-handling.md` は Phase 12 で新規作成する。その時点で `doc/00-getting-started-manual/specs/01-api-schema.md` への相対パス + アンカーを明示し、双方向リンクを整備する。

→ Phase 12 で実施。

## ステップ別実行記録

### ステップ 1: duplicate / navigation drift の洗い出し

```bash
$ grep -rn "from \"@ubm-hyogo/shared\"" apps/ packages/ --include="*.ts" --include="*.tsx"
apps/web/app/lib/api-client.ts:1:import type { ApiErrorClientView, UbmErrorCode } from "@ubm-hyogo/shared";
apps/web/app/page.tsx:1:import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";
apps/api/src/middleware/error-handler.ts:8:} from "@ubm-hyogo/shared";
apps/api/src/index.ts:3:import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";
packages/integrations/src/index.ts:1:import { runtimeFoundation } from "@ubm-hyogo/shared";

$ grep -rn "from \"@ubm-hyogo/shared/" apps/ packages/ --include="*.ts" --include="*.tsx"
（出力なし — Phase 8 開始時点では subpath import が未使用）
```

抽出結果:
- error handling 関連: 2 件（apps/api error-handler.ts, apps/web api-client.ts）→ subpath 化対象
- runtimeFoundation 関連: 3 件（apps/web page.tsx, apps/api index.ts, packages/integrations index.ts）→ root barrel のまま許容（UT-10 スコープ外）

### ステップ 2: リファクタ案の確定

7 件中 5 件を「design-as-built」、2 件を「実コード変更」、1 件を「Phase 12 で実施」と分類。

### ステップ 3: 適用と検証

- 上記の 2 件で subpath import に置換
- `mise exec -- pnpm typecheck` → ✅ PASS（4 workspace projects 全件 Done）

```
> ubm-hyogo@0.1.0 typecheck /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260427-063447-wt-4
> pnpm -r typecheck

Scope: 4 of 5 workspace projects
packages/shared typecheck: Done
apps/web typecheck: Done
packages/integrations typecheck: Done
apps/api typecheck: Done
```

## 完了確認

- [x] 7 件のリファクタ対象テーブルすべて状態を記録（5 design-as-built + 1 実装変更 2 件 + 1 後続 Phase）
- [x] subpath export が package.json に明示済み
- [x] consumer 側 import が subpath に統一（error handling 関連）
- [x] No-functional-change を typecheck PASS で確認
- [x] runtimeFoundation 系 import が root barrel に残ることは UT-10 スコープ外として許容（理由を明記）
