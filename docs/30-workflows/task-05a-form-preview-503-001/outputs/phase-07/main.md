# Phase 7 outputs: カバレッジ確認 — task-05a-form-preview-503-001

## 1. 計測対象（変更ファイル限定）

| 絶対パス | 種別 |
| --- | --- |
| `apps/api/src/use-cases/public/get-form-preview.ts` | 主対象（必達 100%） |

> Feedback **BEFORE-QUIT-002** に従い、計測対象は変更ファイルのみ。`apps/api` 全体のリポジトリ閾値（Statements >=85% 等）は本タスクでは適用しない。

## 2. 目標

| 指標 | 目標値 | 根拠 |
| --- | --- | --- |
| Line | 100% | 95 行の小規模 use-case のため到達容易 |
| Branch | 100% | 主要分岐は `manifest` null / `parseChoiceLabels` try-catch / `Array.isArray` / env fallback の 4 系統 |
| Function | 100% | exported `getFormPreviewUseCase` + 内部 `parseChoiceLabels` |
| Statement | 100% | 同上 |

## 3. 実行コマンド

```bash
# 変更ファイル限定 coverage（推奨）
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage \
  --coverage.include='src/use-cases/public/get-form-preview.ts' \
  get-form-preview

# 出力 evidence
# - text-summary: 標準出力にテーブル
# - lcov: apps/api/coverage/lcov.info
# - html: apps/api/coverage/index.html
```

代替（`vitest.config.ts` の coverage.include を一時上書きしないパターン）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage get-form-preview
# 後処理で apps/api/coverage/coverage-summary.json から get-form-preview.ts 行のみ抽出
```

## 4. 100% 担保のためのテスト 1:1 マッピング

| 行 / 分岐 | カバーするテスト |
| --- | --- |
| `formId = env.GOOGLE_FORM_ID ?? ...` の 3 分岐 | TC-RED-02 (A/B) + 既存 happy（GOOGLE_FORM_ID あり） |
| `manifest === null` 分岐 | 既存「schema_versions が無い場合」+ TC-REG-01-A |
| `manifest` 正常分岐 | 既存 happy + TC-RED-01 + TC-REG-01-B |
| `listFieldsByVersion` 失敗 | 既存「schema_questions の query 失敗」 |
| `parseChoiceLabels` JSON.parse 成功・配列 | 既存 happy |
| `parseChoiceLabels` JSON.parse 成功・非配列 | TC-FAIL-03 |
| `parseChoiceLabels` JSON.parse 失敗 (catch) | TC-FAIL-02 |
| `responderUrl = env.GOOGLE_FORM_RESPONDER_URL ?? FALLBACK` | 既存 happy（env 設定）+ TC-RED-02-B（fallback） |

→ 上記マッピングが揃えば line / branch / function / statement すべて 100% に到達する想定。

## 5. 100% 未達時の対応フロー

1. `apps/api/coverage/coverage-summary.json` から `get-form-preview.ts` の `lines.pct` / `branches.pct` / `functions.pct` を抽出する。
2. 100% 未達の行・分岐を `apps/api/coverage/index.html` で特定する。
3. 該当箇所の入出力を mock で再現する追加ケースを Phase 6 outputs に backfill 要件として記録する（テスト ID 命名: `TC-COV-NN`）。
4. backfill 後に再計測し 100% を確認する。

## 6. DoD（Phase 7）

- [x] `get-form-preview.ts` が 4 指標すべて **100%**（実測: Stmts 100 / Branches 100 / Funcs 100 / Lines 100）。
- [x] evidence: coverage command output（`apps/api/coverage-form-preview/` は一時生成先のため review 後に削除済み）。
- [x] 100% 未達は無し。1 周目に検出された Branch 92.85%（line 56 `usedFallback` の `&&` 第二オペランド未到達）は `TC-COV-01` を Phase 6 に backfill して解消。
- [x] `pnpm --filter @ubm-hyogo/api typecheck` green。root `pnpm lint` は本 review では未実行。

## 7. ローカル実行コマンド（実測）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --passWithNoTests --root=../.. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/api/src/use-cases/public/get-form-preview.ts' \
  --coverage.reportsDirectory=apps/api/coverage-form-preview \
  --coverage.reporter=text --coverage.reporter=json-summary \
  apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts \
  apps/api/src/routes/public/index.test.ts
```

実測結果（変更ファイル限定）:

```
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
get-form-preview.ts|    100  |   100    |   100   |   100   |
```

合計 17 PASS / 17 件、所要 ~5.1s。

`apps/api/coverage-form-preview/` は一時生成先。証跡は本ファイルの summary に固定し、coverage directory は repository artifact として残さない。
