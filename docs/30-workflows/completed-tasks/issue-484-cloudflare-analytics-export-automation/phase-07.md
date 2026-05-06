# Phase 7: 統合テスト

## 目的
fetch script + redaction-check shell + retention rotation を一気通しで動かす integration scenario を確立する。実 Cloudflare API は使わず、mock fetch 経由で end-to-end を検証する。

## 統合テストシナリオ

`scripts/__tests__/integration-cloudflare-analytics.test.ts`（新規、optional / 既存 unit test ファイルに同居でも可）

### S-1: 月次正常パス
1. mock fetch に正常 GraphQL レスポンスを返させる
2. `main()` を temp dir 環境で実行
3. temp dir に 1 ファイル作成されることを確認
4. ファイル内容が ALLOWED_METRIC_FIELDS のみで構成されることを確認
5. `bash scripts/redaction-check-analytics.sh <生成ファイル>` を実行 → exit 0

### S-2: 13 件目以降の archive rotation
1. temp dir に 12 件のダミー export を mtime 階段配置
2. `main()` 実行
3. 最古 1 件が `archive/YYYY-MM/` へ移動されている
4. 残 12 件が temp dir 直下に残っている

### S-3: GraphQL エラーで partial output 残らず
1. mock fetch が GraphQL `errors` 配列を返す
2. `main()` が exit 1
3. temp dir に新ファイルが作成されていない（partial output 防止）
4. tmp file（`*.tmp-*`）も残っていない

### S-4: redaction check 違反検出
1. dummy JSON を作成し email アドレスを混入
2. `bash scripts/redaction-check-analytics.sh <dummy>` → exit 1
3. stderr に `REDACTION VIOLATION` を含む

### S-5: env 不足
1. `CLOUDFLARE_ANALYTICS_API_TOKEN` を unset で `main()` 実行
2. exit 1、stderr にキー名のみ出力
3. token 値が log に漏れない（assertion）

## 実行コマンド

```bash
mise exec -- pnpm test scripts/__tests__/integration-cloudflare-analytics.test.ts
```

## 統合テスト連携メモ
- 実 Cloudflare GraphQL は呼ばない（CI コスト・rate limit 防止）
- mock fetch / fs は inject 可能なシグネチャを Phase 3 で確保済み

## 成果物
- 本ファイル
- `outputs/phase-7/phase-7.md`

## 完了条件
- S-1〜S-5 すべて pass
- 実 Cloudflare API を呼ばずに完結

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` long-term evidence path / retention
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` CI execution boundary
