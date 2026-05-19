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

## 関連参照

- [[workflow-ut-07c-followup-001-attendance-csv-import-artifact-inventory]]
- [[api-endpoints]]
- [[task-workflow-active]]
