# Phase 6: 単体テスト

## 目的
fetch script の各関数について、契約と不変条件を unit test で固定する。

## テストファイル

`scripts/__tests__/fetch-cloudflare-analytics.test.ts`（新規）

## テストケース

### `formatOutputFilename`
- TC-FN-01: `new Date('2026-05-01T02:30:00Z')` → `analytics-export-20260501-0230-UTC.json`
- TC-FN-02: 1 桁月日時分が zero-pad される
- TC-FN-03: ローカルタイムゾーンに依存しない（UTC で固定）

### `whitelistFields`
- TC-WL-01: ALLOWED_METRIC_FIELDS のみ抽出（余剰 field は drop）
- TC-WL-02: 必須 field 欠落で throw
- TC-WL-03: schemaVersion が `"1.0.0"` 以外で throw
- TC-WL-04: metrics 内に email や IP らしき文字列があっても number でないため type check ではじかれる（型レベル不変条件）

### `fetchAnalytics`
- TC-FT-01: 正常 GraphQL レスポンスを inject、AnalyticsExport が返る
- TC-FT-02: HTTP 5xx で throw、tmp 書き込みなし
- TC-FT-03: GraphQL `errors` 配列ありで throw（rate limit 模擬）
- TC-FT-04: Authorization header に `Bearer ${token}` が付与される
- TC-FT-05: 余剰 field（例えば `clientIP`）がレスポンスに含まれていても、最終出力に含まれない

### `atomicWriteJson`
- TC-AW-01: tmp file → rename の順で書かれる（fs mock で順序検証）
- TC-AW-02: 出力ディレクトリが存在しない場合 `mkdir -p` 相当が動く
- TC-AW-03: writeFile が throw した場合、本体ファイルは存在しない

### `rotateArchive`
- TC-RA-01: 12 件以下なら moved=[]
- TC-RA-02: 13 件目から `archive/YYYY-MM/` に移動
- TC-RA-03: archive subdir は移動対象ファイルの YYYY-MM ベース
- TC-RA-04: 不正な拡張子は無視される

### redaction（unit レベル）
- TC-RD-01: `whitelistFields` の出力には email-like / IP-like 文字列が含まれないことを assertion 経由で検査（生成済み JSON に対する grep）

## カバレッジ目標
- `scripts/fetch-cloudflare-analytics.ts` の関数行 90% 以上
- 例外パスを必ず網羅

## 実行コマンド

```bash
mise exec -- pnpm test scripts/__tests__/fetch-cloudflare-analytics.test.ts
mise exec -- pnpm test:coverage scripts/__tests__/fetch-cloudflare-analytics.test.ts
```

## 成果物
- 本ファイル
- `outputs/phase-6/phase-6.md`

## 完了条件
- 18 ケース以上が pass
- ライン coverage 90% 以上

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` aggregate-only / PII boundary
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` secret value non-disclosure
