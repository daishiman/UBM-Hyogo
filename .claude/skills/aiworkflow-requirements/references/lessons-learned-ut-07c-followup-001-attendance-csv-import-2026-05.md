# Lessons Learned — UT-07C-FU-001 attendance CSV 一括 import

CSV 3-step wizard + audit_log 統合 + D1 batch insert を `apps/api` / `apps/web` 同一 wave で実装したときの再発防止ノート。

## L-UT07CFU1-001: `*.contract.spec.ts` は `vitest.d1.config.ts` 経由でしか走らない

**苦戦内容**: 通常の `pnpm --filter @ubm-hyogo/api test` は `vitest.config.ts` の `include` パターンに従い、`apps/api/src/routes/admin/attendance-import.contract.spec.ts` を pick up しなかった。Phase 7 coverage 取得で「No test files found」になり原因特定に時間を消費。

**再発防止**:
- `*.contract.spec.ts` は **必ず** `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts <path>` で実行する。
- Phase 11 evidence の test 実行 log には config path を明示する（`--config=vitest.d1.config.ts` を残す）。
- 新規 contract spec を追加するときは `vitest.d1.config.ts` の `include` パターンと一致しているか先に確認する。

## L-UT07CFU1-002: D1 `batch()` で attendance + audit を同一境界に投入する

**苦戦内容**: 当初 `forEach` で `prepare().run()` を回しており、部分 commit 状態（一部 attendance だけ insert、audit_log 漏れ）の境界事故リスクが残っていた。

**再発防止**:
- 一括書込が必要なケースは `D1Database.batch([stmt1, stmt2, ...])` で 1 transaction 境界として送る。
- audit_log は attendance insert と **同じ batch payload** に積む。別 round trip にしない。
- chunk size は `ATTENDANCE_BIND_CHUNK_SIZE = 80` を借用し、batch の bind 上限 (D1: 100 bind vars) を超えないように分割する。
- 1 chunk = 1 batch（attendance + audit）として送り、chunk 境界で失敗時の reconciliation は service 層に閉じる。

## L-UT07CFU1-003: client 側 CSV parse は papaparse + JSON payload で API へ渡す

**苦戦内容**: server 側で multipart/form-data を解析するか迷い、MVP の責務分担で時間を消費。

**再発防止**:
- MVP では **client が papaparse で parse → 構造化済み JSON 配列を API に送る** 分担に固定する。
- API は `Content-Type: application/json` のみ受ける（multipart は将来拡張）。
- 上限は `MAX_ROWS = 500` を API 側で 413 として強制し、client 側も同値を 1 箇所に集約（Web util `parse-attendance.ts`）。

## L-UT07CFU1-004: `exactOptionalPropertyTypes: true` 環境での optional field 受け渡し

**苦戦内容**: `apps/api` / `apps/web` 間で type を共有する際、`field?: string` を `field: string | undefined` に正規化しないと型エラー。

**再発防止**:
- 新規 interface 設計時は **optional は `field?: T` で書きつつ、関数 boundary 受け側では `T | undefined` を明示する**。
- 共有 type を package 化する際は、両端の strictness フラグを揃え、boundary type は `?:` を避けて `| undefined` 明示で書く。

## L-UT07CFU1-005: React 19 `JSX.Element` は `React.JSX.Element` 名前空間で参照する

**苦戦内容**: React 19 系で `JSX.Element` の global 名前空間解決が gradient で警告に変わり、`apps/web` の panel コンポーネントで型エラーが出た。

**再発防止**:
- 戻り値型を `JSX.Element` ではなく `React.JSX.Element` で書く。
- Wizard 等の panel コンポーネントは `function Panel(): React.JSX.Element { ... }` で統一する。

## L-UT07CFU1-006: 3-step wizard の confirm 有効化条件は `ok === total` で固定する

**苦戦内容**: 当初 `ok > 0` で confirm を許可していたが、行別 invalid / duplicate / deleted_member が混ざった preview を「commit ボタン押下で残り行が捨てられる」誤投入動線になっていた。

**再発防止**:
- confirm enable 条件は **`ok === total` のみ**。1 行でも非 ok があれば commit ボタンを disable にする。
- 非 ok 行を編集／除外したい場合は upload からやり直す（CSV を直す）動線に統一。
- E2E では S4 (`deleted_member`) で confirm が disable のままになることを VISUAL evidence として保持する。

## L-UT07CFU1-007: `dryRun` パラメータは安全側既定にする

**苦戦内容**: `dryRun` の typo / 省略時に commit してしまう設計を一度通過してしまった。

**再発防止**:
- `dryRun=false` を **明示** したときだけ commit する。
- それ以外（省略 / 任意の typo / `dryRun=true`）はすべて dry-run として扱う。
- パラメータパースは route ハンドラで集中処理し、service 層に既定で dry-run の boolean を渡す。

## L-UT07CFU1-008: email lookup は `normalizeEmail` (NFKC + trim + lowercase) を経由する

**苦戦内容**: CSV からの email は全角空白 / 全角@ / 末尾改行が混入しやすく、生文字列で D1 lookup すると `email_not_found` が誤発火した。

**再発防止**:
- `apps/api/src/lib/email.ts#normalizeEmail` を導入し、 **CSV → API 入口で必ず normalize** する。
- normalize は NFKC + trim + lowercase の 3 段。`Refs ut-07b alias recommendation i18n label normalization (NFKC + trim + whitespace 圧縮)` の語彙と整合させる。

## L-UT07CFU1-009: Phase-11 evidence 出力先は completed-tasks/ 配下に揃える

**苦戦内容**: e2e spec (`apps/web/playwright/tests/attendance-csv-import.spec.ts`) の `PHASE11_DIR` が
`docs/30-workflows/ut-07c-followup-001-attendance-csv-import/outputs/phase-11` を指したまま残り、
workflow が completed-tasks/ に移動した後も Playwright が旧 path に screenshot を吐いていた。
未追跡 screenshots ファイルがあるだけで `verify-phase12-compliance` の
`collect-changed-roots.ts` は `git ls-files --others --exclude-standard docs/30-workflows` で
非 completed root を検出し、Phase 12 file 不在で fail する（CI gate `verify-pr-ready`）。

**再発防止**:
- Workflow を `completed-tasks/` に移動したら、`docs/30-workflows/<task>/...` を参照している
  `apps/web/playwright/tests/*.spec.ts` / runbook / scripts の path も同時に
  `docs/30-workflows/completed-tasks/<task>/...` へ更新する。
- 旧 path 配下を `find ... -type f -delete` で空にし、空 dir も `find -type d -empty -delete` で除去する。
- PR pre-flight: 移動完了後に `bash scripts/verify-pr-ready.sh` を流して
  `verify:phase12-compliance` が PASS することを確認する。
  `git ls-files --others --exclude-standard docs/30-workflows/<task>` で空であるべき。

## L-UT07CFU1-010: mockApi seedMeetings race は self-heal で吸収する

**苦戦内容**: `attendance.spec.ts` と `attendance-csv-import.spec.ts` を並列 worker で同時実行すると、
`/__test__/seed-meetings` POST が他 worker の seed で上書きされ、`sess-1` 等の default seed meeting が
一時的に `state.meetingsSeed.meetings` から消えるケースが発生。`meetingDetailBody` / `importAttendance` が
404 を返し、UI が `step-error` に落ちて Playwright が `step-preview` を待ち続けて timeout (CI 失敗、
ローカル単体では再現しない)。

**再発防止**:
- `apps/web/playwright/fixtures/auth.ts` に `findMeetingWithSelfHeal(sessionId)` を実装し、
  default seed に含まれる sessionId は state 上書きで自動復元する（`commit a5cf06238`）。
- `meetingDetailBody` / `updateAttendance` / `importAttendance` のすべての分岐で
  `findMeetingWithSelfHeal` を経由させる（生 `find` を残さない）。
- `--all-flaky` 化の前に、ローカル単体 PASS / CI 並列 FAIL のギャップは worker 間 mutable state 競合を疑う。

## L-UT07CFU1-011: `<input type="file">` の SSR 出力は WebKit / Firefox で hydration mismatch を起こす

**苦戦内容**: `attendance-csv-import.spec.ts` が CI の mobile-webkit / desktop-firefox project でのみ
`step-preview` 待ちで timeout（chromium / ローカルでは PASS）。DOM を確認すると
`<section data-hydrated="false">` のまま停止し、Console に
`A tree hydrated but some attributes of the server rendered HTML didn't match`
`style={{caret-color:"transparent"}}` の hydration mismatch warning。WebKit / Firefox は
`<input type="file">` に `caret-color: transparent` をブラウザデフォルト or extension で
後付け injection するため SSR HTML と差分が出て、React 19 が当該 subtree の hydration を
abort → `useEffect` も走らず `data-hydrated="true"` にならない → `onChange` handler 未 bind で
`setInputFiles` が file 反映されず timeout。

**再発防止**:
- `<input type="file">` を含む subtree は **client-only render に gating** する
  （`{hydrated && <input ... />}` パターン）。SSR HTML に input が出ないので mismatch 不能。
- 併せて当該 `<input>` に `suppressHydrationWarning` を defense in depth で付ける。
- hydration signal (`data-hydrated`) は section ルートに残し、e2e は section の signal を待つ。
- ブラウザ依存の attribute injection（`caret-color`, `autocomplete`, 拡張機能 inject）が疑われたら、
  まず該当 element を client-only render に切り替えるのが最短復旧。

## L-UT07CFU1-012: Playwright e2e の expect timeout は Next.js dev `[...path]` route 初回コンパイルを吸収する 30s に伸ばす

**苦戦内容**: `attendance-csv-import.spec.ts` の `setInputFiles` 直後の
`expect(step-preview).toBeVisible()` が CI 全 project (chromium / firefox / mobile-webkit)
で 10s timeout で連続失敗。trace zip を解凍すると POST `/api/admin/meetings/sess-1/attendance/import?dryRun=true`
が `status:-1`（応答なし）で、その直後に `[Fast Refresh] rebuilding` → `done in 7418ms`
の log。原因は Next.js dev server が `app/api/admin/[...path]/route.ts` catch-all を
新 URL (`/attendance/import`) で初回 invoke した際の on-demand compile が 7-15s かかり、
expect の既定 10s timeout を超過していた（hydration mismatch 関連の caret-color warning は
別 test (`auth-gate-state`) の log で本件とは無関係）。

**再発防止**:
- `/api/admin/*` catch-all 経由の新 URL を初回 POST する e2e は、対応する expect に
  `{ timeout: 30_000 }` を明示する（dev compile + dryRun round-trip を安全に吸収）。
- 「local PASS / CI FAIL」の e2e timeout は dev compile cost を疑う → `.next` を消して
  ローカル再現可能。
- trace の `status:-1` は「リクエスト送信済み・応答未受信」のサイン。webserver log の
  `Fast Refresh rebuilding` 時間と突き合わせる。
- 真の hydration 由来の停止は trace の console に `hydration mismatch` warning が出る。
  関係 element の `data-testid` を warning ツリー内に含むかを確認してから panel 側 fix
  （suppressHydrationWarning / client-only render gating）を入れる。

## L-UT07CFU1-013: e2e mock は `apps/web/playwright/fixtures/auth.ts` と `scripts/e2e-mock-api.mjs` の 2 系統あり drift する

**苦戦内容**: `attendance-csv-import.spec.ts` がローカル単体では PASS するのに CI で
`step-preview` に到達せず timeout。trace の response body を xxd でバイト確認すると
`{"error":"MOCK_API_NOT_FOUND","method":"POST","path":"/admin/meetings/sess-1/attendance/import"}`。
`auth.ts` の mockApi (line 614 付近) は `{error, path}` のみ返し `method` field を含まないため、
この 96-byte payload は `auth.ts` 由来ではないと特定。grep で `MOCK_API_NOT_FOUND` を全リポジトリ
検索 → `scripts/e2e-mock-api.mjs:669` (本体 mock) を発見。CI は `scripts/e2e-mock-api.mjs` を
使用するが、`auth.ts` の mockApi にだけ `importAttendance` handler が追加されており、
`scripts/e2e-mock-api.mjs` には未追加 → CI 環境でのみ 404 で落ちていた。

**再発防止**:
- 新規 admin API endpoint を mock 経由で e2e に通すときは **両 mock 系統** に追加する:
  - `apps/web/playwright/fixtures/auth.ts` (ローカル `pnpm exec playwright test` の `mockApi` fixture)
  - `scripts/e2e-mock-api.mjs` (CI workflow `e2e.yml` で `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` として spawn される mock 本体)
- 「ローカル PASS / CI FAIL」かつ `status:-1` でも `Fast Refresh rebuilding` log が無い時は
  **404 (MOCK_API_NOT_FOUND) を疑う**。trace.zip → resources/*.json をバイトレベルで確認する。
- 復旧コマンド（CI artifact から response body 確認）:
  ```bash
  gh run download <run-id> -n playwright-report-<project> -D /tmp/ci-artifact
  unzip -d /tmp/trace /tmp/ci-artifact/**/trace.zip
  xxd /tmp/trace/resources/<resource-sha> | head -20
  ```
- 中長期: 両 mock を共通 module 化して divergence を構造的に潰す（task として別途切る）。

## 関連参照

- [[workflow-ut-07c-followup-001-attendance-csv-import-artifact-inventory]]
- [[api-endpoints]]
- [[task-workflow-active]]
- [[lessons-learned-phase11-evidence-path-after-completed-tasks-move]]
