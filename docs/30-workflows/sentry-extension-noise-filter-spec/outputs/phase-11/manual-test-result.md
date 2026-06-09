# Phase 11: 手動テスト結果（NON_VISUAL）

## NON_VISUAL 宣言

- **タスク種別**: implementation / NON_VISUAL
- **workflow_state**: `implemented_local_evidence_captured`
- **非視覚的である理由**: クライアント observability instrumentation（Sentry 送信前フィルタ）のみを変更し、UI / UX / DOM / 画面遷移には触れていない。
- **代替証跡**: pure module の focused unit test、client instrumentation wiring test、web typecheck、web lint。

## 実行結果

| 検証 | コマンド | 結果 |
|------|----------|------|
| focused behavior + wiring | `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts apps/web/src/__tests__/instrumentation-client.runtime.spec.ts` | PASS: 2 files / 14 tests |
| web typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| web lint | `pnpm --filter @ubm-hyogo/web lint` | PASS |

## 主証跡: 自動単体テスト

| テスト観点 | 期待結果 | status |
|------------|----------|--------|
| `chrome-extension://` / `moz-extension://` / `safari-web-extension://` / `safari-extension://` URL | 拡張URLとして検出 | PASS |
| 拡張frameのみのevent | drop（`null`） | PASS |
| 拡張frameが最終frame以外にあるevent | drop（`null`） | PASS |
| アプリ自身のerror | eventを返す（fail-open） | PASS |
| 拡張frameとアプリframeの混在event | eventを返す（fail-open） | PASS |
| `exception.values` / `stacktrace` / `frames` 欠損 | throwせずeventを返す | PASS |
| frameなしで `request.url` が拡張URL | drop（`null`） | PASS |
| `abs_path` / `culprit` が拡張URL | drop（`null`） | PASS |
| 判定中の例外 | eventを返す（fail-open） | PASS |
| `EXTENSION_*` 定数 | 既知protocol / denyUrls / ignoreErrorsを公開 | PASS |
| アプリ message / URL | `ignoreErrors` / `denyUrls` に誤爆しない | PASS |
| pure module import | Sentry SDK初期化の副作用なし | PASS |
| client `Sentry.init` wiring | `beforeSend` / `denyUrls` / `ignoreErrors` が渡る | PASS |

## 到達不能ノイズ境界

`service-worker-loader.js` connection error、`Unchecked runtime.lastError`、他拡張自身の `[Sentry] You cannot use Sentry.init()` 警告は、拡張隔離コンテキスト・Chrome本体・別SDKから出るため、私たちのSDKに到達しない場合がある。今回の実装が除外できるのは、main worldに漏れて私たちのSentry eventになった拡張由来サブセットのみ。

## 結論

NON_VISUAL代替証跡はPASS。commit / push / PR と外部Sentry dashboardでの実受信確認は user-gated。
