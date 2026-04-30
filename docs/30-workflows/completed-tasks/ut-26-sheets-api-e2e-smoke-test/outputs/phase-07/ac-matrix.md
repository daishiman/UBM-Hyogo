# Phase 7 成果物: AC マトリクス (ac-matrix.md)

| 項目 | 値 |
| --- | --- |
| タスク | UT-26 Sheets API エンドツーエンド疎通確認 |
| Phase | 7 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| 関連 | index.md (AC-1〜AC-11), phase-04.md, phase-05.md, phase-06.md, phase-11.md |

## 1. 概要

index.md で定義された AC-1〜AC-11 に対し、Phase 4 (検証手段) / Phase 5 (実装箇所) / Phase 6 (異常系 case#) / Phase 11 (手動 smoke 証跡) を縦串で結ぶトレース表。空セルを許容しない。

## 2. AC × 検証 × 実装 × 異常系 × 証跡 トレース表

| AC# | AC 内容 | Phase 4 検証手段 | Phase 5 実装箇所 | Phase 6 異常系 case# | Phase 11 証跡 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | staging Workers から `spreadsheets.values.get` が HTTP 200 で成功 | smoke スイート (success path) / contract テスト | `apps/api/src/routes/admin/smoke-sheets.ts`, `apps/api/src/index.ts` (ルート登録) | #9 (5xx), #10 (network) | `outputs/phase-11/manual-smoke-log.md` の staging 200 ログ |
| AC-2 | JWT 生成 → access token → API 呼び出しの E2E が Workers Edge Runtime 上で動作 | smoke スイート (実機) / unit (既存 sheets-auth) | `apps/api/src/jobs/sheets-fetcher.ts` (GoogleSheetsFetcher 再利用) または `apps/api/src/jobs/sheets-fetcher.ts`, `apps/api/src/routes/admin/smoke-sheets.ts` | #11 (CRYPTO_IMPORT_FAILED), #12 (CRYPTO_SIGN_FAILED) | manual-smoke-log の `latencyMs` / `tokenFetchesDuringSmoke` |
| AC-3 | 対象 Sheets (formId 119ec... 連携シート) から値取得、シート名・行数・サンプル行を証跡記録 | smoke スイート (success) / unit (format-result マスキング) | `apps/api/src/lib/smoke/format-result.ts`, `apps/api/src/routes/admin/smoke-sheets.ts` | #6 (spreadsheetId 取り違え) | manual-smoke-log の `sheetTitle` / `rowCount` / `sampleRowsRedacted` |
| AC-4 | アクセストークンキャッシュが動作し、2 回目以降で OAuth fetch 省略 | smoke スイート (cache hit) / unit (cache TTL) | sheets-auth (既存) + smoke route が `cacheHit` 伝搬 | #15 (cache miss が続く) | manual-smoke-log の連続 2 回呼び出し `tokenFetchesDuringSmoke=false→true` |
| AC-5 | 401 / 403 / 429 の各ケースで期待エラー分類とログ | unit (classifySheetsError) / contract / authorization 4 ケース | `apps/api/src/routes/admin/smoke-sheets.ts` (classifySheetsError + structured log) | #1, #2 (401) / #3, #4, #5 (403) / #8 (429) | manual-smoke-log の 401/403 観測 + troubleshooting-runbook.md Step A〜D |
| AC-6 | ローカル `.dev.vars` + `wrangler dev` で同等疎通成功 | smoke スイート (wrangler dev remote) | runbook Step 3 (`bash scripts/cf.sh dev --remote`) | #10 (wrangler dev --local 制約) | manual-smoke-log の wrangler dev 200 行 |
| AC-7 | 疎通結果 (成功日時・環境・サマリー・トラブルシュート手順) が verification-report として記録 | Phase 11 出力規約 / unit (format-result スキーマ) | `apps/api/src/lib/smoke/format-result.ts` | 全件 (共通ログスキーマ) | `outputs/phase-11/manual-smoke-log.md` + `outputs/phase-11/troubleshooting-runbook.md` |
| AC-8 | SA JSON が Cloudflare Secrets / 1Password 経由のみで注入され平文残存 0 | grep 検証 (`rg 'BEGIN PRIVATE KEY\|access_token=' --hidden`) / unit (マスキング) | `.dev.vars` (op 参照のみ), `apps/api/src/lib/smoke/format-result.ts` (マスキング) | #1, #5 (改行コード), #11 (PEM 不正) | PR 作成前の grep 0 ヒット記録 (Phase 13) |
| AC-9 | 403 真因切り分け runbook (SA 共有 / 改行 / API 有効化 / id 取り違え) が runbook 化 | 該当なし (spec レベル) | runbook Step 3〜5 + troubleshooting-runbook | #3, #4, #5, #6 (4 真因) | `outputs/phase-11/troubleshooting-runbook.md` Step A〜D |
| AC-10 | UT-09 が本番 Sheets API に安全アクセスできる前提が満たされたとマーク | Phase 10 go-no-go の判定 | 本タスク全体 (AC-1〜AC-9 集約) | 全件 (MAJOR 残存有無確認) | `outputs/phase-10/go-no-go.md` の GO 判定 + Phase 11 staging 200 |
| AC-11 | 4 条件 (価値性 / 実現性 / 整合性 / 運用性) 最終判定 PASS | Phase 10 go-no-go.md | 本 Phase の AC マトリクス自体 | 全件 (MAJOR 残存有無確認) | `outputs/phase-10/go-no-go.md` の 4 条件 PASS 行 |

> 空セルなし (11 行 × 5 列)。AC-7 / AC-10 / AC-11 は「全件」を Phase 6 異常系列に許容。

## 3. coverage 目標と allowlist (draft)

### 目標
- line coverage: 80% 以上
- branch coverage: 70% 以上
- 対象は変更ファイル限定。既存 `apps/api/src/jobs/sheets-fetcher.ts` および `apps/api/src/jobs/sheets-fetcher.ts` は UT-03 owner のため対象外。

### allowlist (`apps/api/vitest.config.ts` の `coverage.include`)

```ts
coverage: {
  include: [
    "src/routes/admin/smoke/sheets.ts",
    "src/routes/admin/smoke/index.ts",
    "src/lib/smoke/format-result.ts",
  ],
  // include を指定した時点で他は計測対象外
}
```

### 禁止パターン (広域指定)

```ts
// 既存ファイルの coverage 落ちで red になるため禁止
include: ["src/**/*"]
include: ["**/*.ts"]
include: ["src/**/*.{ts,tsx}"]
// UT-03 のスコープを侵食するため禁止
include: ["packages/integrations/**"]
// UT-09 のスコープを侵食するため禁止
include: ["src/jobs/**"]
```

## 4. coverage 実測の証跡記録

```bash
mise exec -- pnpm --filter ./apps/api vitest run --coverage \
  apps/api/test/routes/admin/smoke/sheets.test.ts \
  apps/api/test/lib/smoke/format-result.test.ts

# 結果出力先
# - apps/api/coverage/coverage-summary.json (CI 解析 / Phase 9 入力)
# - apps/api/coverage/lcov.info             (Codecov 等)
# - apps/api/coverage/index.html            (ローカル目視)
```

Phase 9 で `coverage-summary.json` から allowlist 各ファイルの line/branch を抽出。証跡として `outputs/phase-09/coverage-summary.json` を保存予約。

## 5. Phase 9 / Phase 10 引き継ぎ項目

- Phase 9: allowlist 3 ファイルの実測値取得 (line 80%+ / branch 70%+) と gap 分析
- Phase 9: AC-8 secret hygiene grep の自動化候補 (`rg 'BEGIN PRIVATE KEY' --hidden`) を CI に組み込む可否
- Phase 10: AC マトリクス空セル無しを GO 判定の根拠に使用
- Phase 10: 条件付き PASS の AC (AC-1 / AC-3 / AC-6 / AC-7 / AC-10) を Phase 11 入力として送出
- Phase 13: PR 説明文の AC チェックリストとして本マトリクスを引用 (各 AC の証跡パスをリンク)

## 6. 完了条件チェック

- [x] AC マトリクス 11 行 × 5 列に空セル無し
- [x] allowlist が変更ファイル 3 件に限定 (既存 sheets-auth / sheets-fetcher は除外)
- [x] 広域指定の禁止パターンを例示
- [x] coverage 実測コマンド + 出力先を記述
- [x] Phase 9 / 10 引き継ぎ項目を箇条書き
- [x] 全 AC が Phase 6 異常系列で 1 件以上の case# を参照 (AC-7/AC-10/AC-11 は「全件」)

---

next: phase-08 (DRY 化) へ引き渡し — AC マトリクスの行が崩れない命名・path で DRY 化を実施。allowlist 3 ファイルが Phase 5 新規ファイル一覧と一致することを Phase 8 で再確認。AC-9 (403 切り分け runbook) は Phase 11 troubleshooting-runbook.md の Step A〜D 必須。
