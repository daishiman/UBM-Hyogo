# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（トレーサビリティ） |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク分類 | specification-design（traceability） |

## 目的

index.md で定義された AC-1〜AC-11 に対し、Phase 4（検証手段）/ Phase 5（実装箇所）/ Phase 6（異常系）/ Phase 11（手動 smoke 証跡）の成果物を縦串で結び、トレーサビリティ表として Phase 8 以降に引き継ぐ。同時に、変更ファイル限定の coverage 計測方針（line 80%+ / branch 70%+）を確定し、広域指定を排除した allowlist を最終化する。

## 真の論点

- AC-1〜AC-11 は「実機疎通成立」「キャッシュ動作」「異常系分類」「Secret 衛生」「runbook 化」「4 条件最終判定」と多面に渡る。Phase 4/5/6/11 のどれか一つでも欠落すると AC が証拠不足になる。
- 本タスクは production 書き込み禁止のため、AC-10 / AC-11 は Phase 11 の staging 証跡 + Phase 10 go-no-go の判定に依拠する。

## 実行タスク

1. AC × 5 列（AC 内容 / Phase 4 検証手段 / Phase 5 実装箇所 / Phase 6 異常系 / Phase 11 証跡）の 11 行マトリクスを完成する（完了条件: 空セル無し）。
2. coverage 目標（line 80%+ / branch 70%+）と allowlist を vitest 設定 draft として確定する（完了条件: 変更ファイルのみがリストアップ）。
3. 広域指定（`src/**/*` 等）を採用しないルールを文書化する（完了条件: 禁止パターン例示あり）。
4. coverage 実測の証跡記録方法を定義する（完了条件: `vitest run --coverage` のオプション + 出力先パスが指定）。
5. Phase 9 / Phase 10 への引き継ぎ項目（実測値・gap 分析・GO/NO-GO 入力）を予約する（完了条件: 箇条書きで明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/index.md | AC-1〜AC-11 原典 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-04.md | 検証ファイルパス |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-05.md | 実装ファイルパス |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-06.md | failure case ID |
| 参考 | https://vitest.dev/config/#coverage-include | coverage 設定 |

## AC マトリクス（5 列 × 11 行）

| AC# | AC 内容 | Phase 4 検証手段 | Phase 5 実装箇所 | Phase 6 異常系 | Phase 11 証跡 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | staging Workers から `spreadsheets.values.get` が HTTP 200 で成功 | smoke スイート（success path）/ contract テスト | `apps/api/src/routes/admin/smoke-sheets.ts`、`apps/api/src/index.ts`（ルート登録） | #9（5xx）/ #10（network） | `outputs/phase-11/manual-smoke-log.md` の staging 200 ログ |
| AC-2 | JWT 生成 → token 取得 → API 呼び出しの E2E が Workers Edge Runtime 上で動作 | smoke スイート（実機）/ unit（既存 sheets-auth） | `apps/api/src/jobs/sheets-fetcher.ts`（再利用）、`apps/api/src/routes/admin/smoke-sheets.ts` | #11（CRYPTO_IMPORT_FAILED）/ #12（CRYPTO_SIGN_FAILED） | manual-smoke-log の `latencyMs` / `tokenFetchesDuringSmoke` フィールド |
| AC-3 | 対象 Sheets（formId 119ec... 連携シート）から値が取得でき、シート名・行数・サンプル行が証跡記録 | smoke スイート（success）/ unit（format-result マスキング） | `apps/api/src/lib/smoke/format-result.ts`、`apps/api/src/routes/admin/smoke-sheets.ts` | #6（spreadsheetId 取り違え） | manual-smoke-log の sheetTitle / rowCount / sampleRowsRedacted |
| AC-4 | アクセストークンキャッシュが動作し、2 回目以降で OAuth fetch 省略 | smoke スイート（cache hit ケース）/ unit（cache TTL） | `apps/api/src/jobs/sheets-fetcher.ts`（既存）、smoke route が `cacheHit` を伝搬 | #15（cache miss が続く） | manual-smoke-log の連続呼び出し 2 件で `tokenFetchesDuringSmoke=false→true` |
| AC-5 | 401 / 403 / 429 の各ケースで期待エラー分類とログが出力 | unit（classifySheetsError）/ contract / authorization 4 ケース | `apps/api/src/routes/admin/smoke-sheets.ts`（classifySheetsError + structured log） | #1, #2（401）/ #3, #4, #5（403）/ #8（429） | manual-smoke-log の 401/403 観測 + troubleshooting-runbook.md の Step A〜D |
| AC-6 | ローカル `.dev.vars` + `wrangler dev` で同等の疎通成功 | smoke スイート（wrangler dev remote ケース） | runbook Step 3（`bash scripts/cf.sh dev --remote`） | #10（wrangler dev --local の network 制限） | manual-smoke-log の wrangler dev 200 行 |
| AC-7 | 疎通結果（成功日時・環境・取得データサマリー・トラブルシュート手順）が verification-report として記録 | Phase 11 出力規約 / unit（format-result の出力スキーマ） | `apps/api/src/lib/smoke/format-result.ts` | 全件（ログ共通スキーマ） | `outputs/phase-11/manual-smoke-log.md` + `outputs/phase-11/troubleshooting-runbook.md` |
| AC-8 | SA JSON が Cloudflare Secrets / 1Password 経由のみで注入され、リポジトリ・ログ・PR に平文を残さない | grep ベース検証（`rg 'BEGIN PRIVATE KEY\|access_token=' --hidden`）/ unit（マスキング） | `.dev.vars`（op 参照のみ）、`apps/api/src/lib/smoke/format-result.ts`（マスキング） | #1, #5（改行コード）/ #11（PEM 不正） | PR 作成前の grep 0 ヒット記録（Phase 13） |
| AC-9 | 403 真因切り分け runbook（SA 共有 / 改行 / API 有効化 / id 取り違え）が runbook 化 | 該当なし（spec レベル） | runbook Step 3〜5 + troubleshooting-runbook | #3, #4, #5, #6（4 真因） | `outputs/phase-11/troubleshooting-runbook.md` の Step A〜D |
| AC-10 | UT-09 が本番 Sheets API に安全アクセスできる前提が満たされたとマーク | Phase 10 go-no-go の判定 | 本タスク全体（AC-1〜AC-9 の集約） | 全件（MAJOR 残存有無を確認） | `outputs/phase-10/go-no-go.md` の GO 判定 + Phase 11 staging 200 |
| AC-11 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定 PASS | Phase 10 go-no-go.md | 本 Phase の AC マトリクス自体を入力 | 全件（MAJOR 残存有無を確認） | `outputs/phase-10/go-no-go.md` の 4 条件 PASS 行 |

## coverage 目標と allowlist

### 目標

- line coverage: 80% 以上
- branch coverage: 70% 以上
- 対象は変更ファイル限定（既存 `apps/api/src/jobs/sheets-fetcher.ts` は UT-03 のスコープのため対象外）

### allowlist（`apps/api/vitest.config.ts` の `coverage.include`）

```ts
coverage: {
  include: [
    "src/routes/admin/smoke/sheets.ts",
    "src/routes/admin/smoke/index.ts",
    "src/lib/smoke/format-result.ts",
  ],
  // exclude は include がある時点で他は計測対象外
}
```

### 禁止パターン（広域指定）

```ts
// 以下は禁止: 既存ファイルの coverage 落ちで red になる
include: ["src/**/*"]
include: ["**/*.ts"]
include: ["src/**/*.{ts,tsx}"]
// UT-03 のスコープを侵食するため禁止
include: ["packages/integrations/**"]
```

## coverage 実測の証跡記録

```bash
mise exec -- pnpm --filter ./apps/api vitest run --coverage \
  apps/api/test/routes/admin/smoke/sheets.test.ts \
  apps/api/test/lib/smoke/format-result.test.ts

# 結果は apps/api/coverage/ に出力
# - apps/api/coverage/coverage-summary.json （CI 解析 / Phase 9 入力）
# - apps/api/coverage/lcov.info             （Codecov 等連携用）
# - apps/api/coverage/index.html            （ローカル目視）
```

- Phase 9 で `coverage-summary.json` から allowlist 各ファイルの line/branch を抽出し、目標未達があれば test 追記して Green。
- 証跡として `outputs/phase-09/coverage-summary.json` を保存する（Phase 7 では allowlist の draft のみ確定）。

## 実行手順

1. 11 行 × 5 列の AC マトリクスを `outputs/phase-07/ac-matrix.md` に転記。
2. allowlist を vitest 設定 draft として記録（実コミットは Phase 5 実装フェーズで反映）。
3. 広域指定の禁止パターンを Phase 8 DRY 化 / Phase 9 coverage 計測の入力として固定。
4. Phase 9 / Phase 10 への引き継ぎ項目を箇条書きで明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 重複コード検出時、AC マトリクスの行が崩れないことを確認 |
| Phase 9 | coverage 実測 → allowlist 各ファイルの line/branch を計測 |
| Phase 10 | go-no-go の根拠として AC マトリクスの空セル無しを参照 |
| Phase 11 | AC-1 / AC-3 / AC-6 / AC-9 を staging 手動 smoke で再確認 |
| Phase 13 | PR 説明文の AC チェックリストとして使用（証跡パスを引用） |

## 多角的チェック観点

- 価値性: 11 件 AC が抜け漏れ無く検証 → 実装 → 異常系 → 証跡にトレースされているか。
- 実現性: allowlist が変更ファイルに限定され、既存 `packages/integrations` を侵食していないか。
- 整合性: Phase 4 / 5 / 6 / 11 のファイル名と差分ゼロ。
- 運用性: coverage 実測コマンドが PR 上で再現可能か。
- 認可境界: AC-5 が authorization スイートの 4 ケース（success / no header / mismatch / production 拒否）すべてに対応しているか。
- セキュリティ: AC-8 の grep 検証が PR 作成前に必須であることが明記されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 11 行 × 5 列 | spec_created |
| 2 | coverage allowlist 確定 | spec_created |
| 3 | 広域指定禁止ルール文書化 | spec_created |
| 4 | 証跡記録手順確定 | spec_created |
| 5 | Phase 9 / 10 引き継ぎ項目予約 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 × 異常系 × 証跡のトレース表 + coverage allowlist |
| メタ | artifacts.json | Phase 7 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] AC マトリクス 11 行 × 5 列に空セル無し
- [ ] allowlist が変更ファイル 3 件に限定（既存 sheets-auth は除外）
- [ ] 広域指定の禁止パターンが例示
- [ ] coverage 実測コマンド + 出力先が記述
- [ ] Phase 9 / 10 への引き継ぎ項目が箇条書き
- [ ] 全 AC の Phase 6 異常系列が 1 件以上の case# を参照（AC-7/AC-10/AC-11 は「全件」可）

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- AC-1〜AC-11 の 11 行が全て埋まる
- Phase 6 の case# が AC マトリクスから 1 件以上参照される
- coverage allowlist と Phase 5 の新規ファイル一覧が一致（3 ファイル）
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 go-no-go の根拠として再利用、Phase 13 PR 説明文の AC チェックリストとして使用
  - coverage allowlist → Phase 9 で実測値取得
  - 広域指定禁止ルール → Phase 8 / Phase 9 で逸脱を防ぐ
  - AC-9（403 切り分け runbook）の Phase 11 証跡 → troubleshooting-runbook.md に Step A〜D 必須
- ブロック条件:
  - AC マトリクス空セル残存
  - allowlist が広域指定に変質
  - AC-8（Secret 衛生）の grep 検証手順が PR 作成前 chechlist に組み込まれていない
