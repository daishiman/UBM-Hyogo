# Playwright HTML report 出力先

> 本ディレクトリは Phase 11 実行時に Playwright HTML reporter が成果物を書き出す配置先。
> 本タスク（08b spec_created）では空状態。

## 出力構造（実行後）

```
playwright-report/
├── README.md          ← 本ファイル
├── index.html         ← entry point（後続実装 task が生成）
├── data/
│   ├── *.json         ← test 結果 JSON
│   └── *.png          ← embedded screenshot
└── trace/
    └── *.zip          ← trace（failure 時のみ）
```

## 取得方法

```bash
EVIDENCE_DIR=docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence

# playwright.config.ts 側で reporter 設定
#   reporter: [['html', { outputFolder: '<EVIDENCE_DIR>/playwright-report', open: 'never' }]]
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --reporter=html

# 生成後、HTML を browser 表示
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright show-report \
  "$EVIDENCE_DIR/playwright-report"
```

## artifact upload 規約（CI）

`.github/workflows/e2e-tests.yml` で以下を実施:

```yaml
- name: Upload Playwright report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report-${{ github.run_id }}
    path: docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence/playwright-report
    retention-days: 14
    if-no-files-found: error
```

## サイズ上限

- 単一 artifact: 10 MB 以内（無料枠）
- 超過時は `playwright.config.ts` の `use.screenshot: 'only-on-failure'` / `use.video: 'off'` を確認

## secret hygiene

- HTML 内に email / token / cookie 値が embed されないか目視確認
- trace.zip は failure 時のみ生成（success 時は削除）
- request/response body の logging は `use.trace: 'retain-on-failure'` で最小化
