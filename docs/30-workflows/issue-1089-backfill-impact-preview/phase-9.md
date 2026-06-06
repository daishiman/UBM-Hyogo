# Phase 9 — 品質保証

**[実装区分: 実装仕様書 / implementation_mode: new]**

> 本 Phase は preview 経路追加の品質ゲートを一括判定する。typecheck / lint / targeted vitest（4 ファイル）に加え、
> AC-3（既存契約不変）/ OKLch トークン準拠 / D1 直接アクセス境界（apps/api 閉域）/ preview の read-only 保証 /
> design-token gate を**検証可能なコマンドと PASS 基準**で固定する。
> line budget / link / mirror parity / index drift は本タスクの判定対象外（`apps/web` + `apps/api` の機能差分のみで skill / indexes に影響しないため）。

---

## 1. 一括判定コマンド表

| # | 観点 | 検証コマンド | PASS 基準 |
|---|------|-------------|----------|
| Q1 | 型チェック（全体） | `mise exec -- pnpm typecheck` | exit 0 / 型エラー 0 件 |
| Q2 | Lint（全体・`verify:no-inline-style` 含む） | `mise exec -- pnpm lint` | exit 0 / 違反 0 件 |
| Q3 | backend targeted vitest（preview 関数 + route dryRun） | `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run apps/api/src/jobs/sync-forms-responses.contract.spec.ts apps/api/src/routes/admin/responses-sync.contract.spec.ts` | 全ケース green / fail 0 |
| Q4 | frontend targeted vitest（staged UI + preview schema） | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | 全ケース green / fail 0（TC-B2 staged 化後も承認保証を等価に担保） |

> [FB-UI-02-2] 全件実行による SIGKILL を避けるため、vitest は上記 4 ファイルを targeted 指定する。

---

## 2. 不変条件チェック表

| # | 観点 | 検証コマンド | PASS 基準 |
|---|------|-------------|----------|
| I1 | AC-3 既存契約不変（`SyncResultSchema` / `SyncRunResponseSchema` / `?fullSync` 経路を破壊しない） | `git diff dev...HEAD -- apps/web/src/features/admin/diagnostics/manual-sync.ts` | `SyncResultSchema` / `SyncRunResponseSchema` / `SYNC_RESPONSES_PATH` の既存定義行に変更が無く、追加は preview schema のみ（差分は追加行に限定） |
| I2 | OKLch トークン準拠 / HEX 禁止（不変条件 #2） | `grep -rnE '#[0-9a-fA-F]{3,8}\b' apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 空ヒット（HEX 直書き無し） |
| I3 | design-token gate（`verify-design-tokens` 相当） | `grep -rnE 'bg-\[#\|text-\[#' apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 空ヒット（`bg-[#xxx]` / `text-[#xxx]` 無し） |
| I4 | D1 直接アクセス境界（apps/api 閉域・不変条件 #5）| `grep -rnE "from ['\"].*apps/api\|@ubm-hyogo/api" apps/web/src/features/admin/diagnostics/manual-sync.ts apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 空ヒット（`apps/web` から `apps/api` を import しない / contract は `manual-sync.ts` に zod 再宣言） |
| I5 | admin mutation 経路（不変条件 #10） | `grep -n '@/features/admin/hooks/useAdminMutation' apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 1 件以上ヒット（preview mutation も同 hook 経由） |
| I6 | legacy mutation 不使用（不変条件 #10 補） | `grep -n '@/lib/useAdminMutation' apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 空ヒット |
| I7 | preview read-only 保証（lock / ledger / write 非実行・不変条件 #3） | `grep -nE 'acquireSyncLock\|processResponse\|sync_jobs\|\bstart\b\|\bsucceed\b\|\bfail\b' apps/api/src/jobs/sync-forms-responses.ts` で `previewResponseSync` 関数本体内に該当呼出が無いことを目視 + contract test（TC-P-noWrite）で spy 未呼出を assert | `previewResponseSync` 本体に `acquireSyncLock` / `processResponse` / ledger（`start`/`succeed`/`fail`）呼出が無い。TC-P-noWrite で各 spy が 0 回呼出 |
| I8 | PII 非露出（不変条件 #7） | `grep -nE 'responseEmail\|responseId\|questionId' apps/api/src/routes/admin/responses-sync.ts` の dryRun 応答 body を確認 + contract test | preview 応答 body は件数（`responseCount` / `estimatedWrites` / `pagesScanned` / `capped`）のみ。PII / 識別子を返さない（500 でも `error:"preview_failed"` のみ） |
| I9 | test suffix 規約（不変条件 #8） | `git diff dev...HEAD --name-only -- '*.spec.ts' '*.spec.tsx' '*.contract.spec.ts'` | frontend は `*.spec.tsx`、backend は `*.contract.spec.ts` のみ（`*.test.{ts,tsx}` 無し） |

---

## 3. 削除なしタスクの扱い（[FB-UI-02-1]）

- 本タスクは preview 経路の **追加のみ**で、既存機能・既存 route・既存 schema の**削除を含まない**（AC-3）。
- したがって「削除に伴う stub / dead code 残置の確認」は **N/A（該当なし）**。
- 既存 `?fullSync` 経路・`SyncResultSchema` は不変のまま残し、preview は opt-in（`?dryRun=true`）として並置する。

---

## 4. 各チェックの判定基準

- **PASS 条件**: Q1〜Q4 が全 green、I1〜I9 が全て期待結果を満たすこと。
- **即 FAIL（不変条件違反）**: I1（AC-3 退行）/ I2・I3（HEX / design-token）/ I4（D1 境界）/ I7（preview read-only）/ I8（PII 露出）のいずれかが違反した場合は不変条件違反のため即 FAIL。原因（実装ミス / dev 同期由来の混入）を切り分けてから修正する。
- **切り分け対象**: Q1 / Q2 の FAIL は dev 同期由来の周辺差分の可能性があるため、本タスクの変更面に起因するか確認してから判定する。
- design-token gate（I2 / I3）は `verify-design-tokens` CI gate と等価の grep を手元で先行実行し、CI fail を未然に防ぐ。

---

## 完了条件

- [x] Q1 typecheck（全体）が exit 0 であることを確認した
- [x] Q2 lint（`verify:no-inline-style` 含む）が exit 0 であることを確認した
- [x] Q3・Q4 targeted vitest（backend 2 + frontend 2 の 4 ファイル）が全 green であることを確認した（[FB-UI-02-2]）
- [x] I1 AC-3 既存契約不変（`SyncResultSchema` / `?fullSync` 経路）を確認した
- [x] I2・I3 OKLch トークン準拠 / design-token gate（HEX・`bg-[#`・`text-[#` grep 0 件）を確認した
- [x] I4 D1 直接アクセス境界（`apps/web` → `apps/api` 非 import）を確認した
- [x] I5・I6 admin mutation 経路（`useAdminMutation` 経由 / legacy 不使用・不変条件 #10）を確認した
- [x] I7 preview read-only 保証（lock / ledger / `processResponse` 未呼出）を確認した
- [x] I8 PII 非露出 / I9 test suffix 規約を確認した
- [x] 削除なしタスクのため stub 確認が N/A であることを明記した（[FB-UI-02-1]）
- [x] line budget / link / mirror parity / index drift が本タスクの判定対象外であることを明記した
