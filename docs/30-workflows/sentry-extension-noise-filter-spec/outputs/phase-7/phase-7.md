# Phase 7: カバレッジ確認

## 1. カバレッジ対象範囲（明示限定）

> FB Feedback BEFORE-QUIT-002 / Feedback 5 に従い、カバレッジ計測対象を明示的に限定する。

| 対象ファイル | カバレッジ計測 | 理由 |
|--------------|----------------|------|
| `apps/web/src/lib/sentry/extension-noise-filter.ts` | **対象（計測する）** | pure module。純粋判定ロジックのみで副作用なし。line/branch を厳密に網羅可能 |
| `apps/web/src/instrumentation-client.ts` | **対象外** | `Sentry.init()` を呼ぶ副作用 import であり、単体テストで import すると SDK が起動する。配線の正しさは `typecheck`（型整合）+ Phase 11 手動確認（実ブラウザでの初期化）で代替担保する |
| `apps/web/src/lib/sentry/extension-noise-filter.spec.ts` | n/a（テストコード自体） | 計測対象ではない |

`instrumentation-client.ts` を単体カバレッジ対象に含めない判断は、本タスクの「SDK 起動なしでテスト可能（AC-5）」と「pure module へ判定責務を分離（Phase 2 §1）」の設計に直結する。配線ファイルを無理に import してカバレッジに含めると、テスト時に Sentry SDK が起動し、AC-5 に反する。

## 2. カバレッジ目標（pure module）

対象は `extension-noise-filter.ts` の変更関数 3 つ。実測値は実装完了時に下表へ記録する。

| 関数 | line 目標 | branch 目標 | 主要分岐 |
|------|-----------|-------------|----------|
| `isExtensionUrl(url)` | 100% | 全分岐網羅 | 各拡張 prefix ヒット / 非拡張 / undefined・null・"" の早期 return / 大文字混在の小文字化経路 |
| `eventHasExtensionFrame(event)` | 100% | 主要分岐網羅 | exception.values 走査ヒット / frames 非配列・空 / filename・abs_path 有無 / request.url 有無 / culprit 有無 / いずれもヒットせず false |
| `filterExtensionNoise(event, hint?)` | 100% | 主要分岐網羅 | 拡張由来→null（drop） / 非拡張→event 返却（fail-open） / event null・undefined→event 側へ倒す / try/catch 例外発生→fail-open で event 返却 |

### 実測値記録欄（実装時に記録）

| 指標 | 目標 | 実測値 |
|------|------|--------|
| Statements | 100% | （実装時に記録） |
| Branches | 主要分岐網羅 | （実装時に記録） |
| Functions | 100% | （実装時に記録） |
| Lines | 100% | （実装時に記録） |

## 3. カバレッジ取得コマンド

```bash
pnpm exec vitest run --coverage --config=vitest.config.ts \
  apps/web/src/lib/sentry/extension-noise-filter.spec.ts
```

- root `vitest.config.ts` 経由（colocated spec）。
- `--coverage` で対象 pure module の statements/branches/functions/lines を取得する。
- 計測結果のうち `extension-noise-filter.ts` の行を読み、§2 表の「実測値」欄を埋める。

## 4. 網羅すべき branch（チェックリスト）

| # | branch | 関数 | テストで踏む経路 |
|---|--------|------|------------------|
| 1 | 各拡張 prefix（`chrome-extension://` / `moz-extension://` / `safari-web-extension://` / `safari-extension://`） | `isExtensionUrl` | prefix ごとに true を確認 |
| 2 | `undefined` / `null` / `""` の早期 return | `isExtensionUrl` | 3 入力すべて false |
| 3 | 大文字混在 → 小文字化して prefix 比較 | `isExtensionUrl` | `"Chrome-Extension://..."` で true |
| 4 | 非拡張 URL（http/https）| `isExtensionUrl` | アプリ URL で false |
| 5 | frames 非配列 / frames 空 | `eventHasExtensionFrame` | frames 欠落・空配列で false（throw しない） |
| 6 | frame.filename 有無 / abs_path 有無 | `eventHasExtensionFrame` | filename のみ・abs_path のみ・両欠落 |
| 7 | request.url 有無（拡張 / 非拡張 / 欠落） | `eventHasExtensionFrame` | 各経路を踏む |
| 8 | culprit 有無（拡張 prefix を含む / 含まない / 欠落） | `eventHasExtensionFrame` | 各経路を踏む |
| 9 | 例外 catch 経路（fail-open） | `filterExtensionNoise` | 不正形 event を渡し try/catch で握って event 返却を確認 |
| 10 | event null/undefined → 残す | `filterExtensionNoise` | drop しないことを確認 |

> 上記 10 経路を Phase 4 / Phase 6 のテストケースが踏むことで、§2 の branch 目標を満たす。
