# Phase 9: 品質保証

## 0. 品質ゲートの筆頭原則

> **アプリの実エラー監視を一切劣化させないこと**を品質ゲートの最上位に置く。
> 拡張ノイズを 1 件削るために本物のアプリエラーを 1 件でも落とすことは、本タスクでは即不合格とする。fail-open（判定不能・例外時は event を残す）が回帰なく維持されていることを、他のどの項目よりも優先して確認する。

## 1. fail-open 最終確認（最優先）

| 項目 | 確認方法 | 合格基準 |
|------|----------|----------|
| アプリ実エラーが drop されない | `extension-noise-filter.spec.ts` の「非拡張 event は event を返す」ケース | 緑。アプリ由来 stack frame の event が `filterExtensionNoise` を素通り（戻り値が同一 event） |
| 判定不能時に残す | 不正形 event / null event のケース | 緑。`filterExtensionNoise` が null（drop）ではなく event を返す |
| 例外時に残す（fail-open） | try/catch 回帰ケース | 緑。判定中に例外が発生しても event を返し throw しない（AC-5 / AC-6） |

> 上記 3 件が緑であることをもって「監視を劣化させていない」回帰の証跡とする。

## 2. 一括品質判定

| 項目 | コマンド / 確認方法 | 合格基準 |
|------|---------------------|----------|
| 型チェック | `pnpm --filter @ubm-hyogo/web typecheck` | エラー 0 |
| lint | `pnpm --filter @ubm-hyogo/web lint` | 違反 0 |
| focused vitest | `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts` | 全ケース pass |
| HEX 直書きなし | UI 非接触の目視 + 変更ファイル grep | 本タスクは UI 非接触。`tokens.css` / `bg-[#...]` 等を一切編集・追加しない（`verify-design-tokens` 対象外の変更範囲） |
| `*.spec.ts` 命名（不変条件 #8） | ファイル名確認 | 新規テストは `extension-noise-filter.spec.ts` のみ。`*.test.ts` を作らない |
| D1 直接アクセスなし（不変条件 #5） | 変更ファイル grep | `apps/web` の本変更に D1 binding 参照なし。Sentry filter は D1 と無関係 |
| 新規依存追加なし | `package.json` 差分確認 | 既存 `@sentry/core` の型と `@sentry/nextjs` のAPIのみ使用。`pnpm-lock.yaml` 変更なし |
| env アクセス規約（task-02） | 変更ファイル確認 | `instrumentation-client.ts` の既存 env 参照形式を維持。新規の `process.env.*` 直参照を増やさない |

## 3. mirror parity 等

- **N/A**。本タスクは `docs/30-workflows/` 配下の docs workflow であり、`.agents` mirror（AIWorkflowOrchestrator 固有）の同期対象外。mirror parity / `diff -qr` 確認は本リポジトリの本タスクでは適用しない。

## 4. ゲート結論（合格条件まとめ）

以下をすべて満たした時点で Phase 9 を合格とする。

1. §1 の fail-open 3 件が緑（最優先）。
2. §2 の typecheck / lint / focused vitest がすべて緑。
3. §2 のスコープ系チェック（HEX なし / `*.spec.ts` / D1 なし / 新規依存なし）がすべて満たされている。
4. Phase 7 のカバレッジ目標（pure module line 100% / 主要 branch 網羅）が実測で達成されている。

> 1 が不合格の場合、他がすべて緑でも本フェーズは不合格とする（監視劣化の即時 blocker）。
