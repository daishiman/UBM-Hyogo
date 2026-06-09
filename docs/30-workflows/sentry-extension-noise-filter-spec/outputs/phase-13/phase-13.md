# Phase 13 — PR 作成（user-gated）

> 本 wave ではローカル実装と検証まで完了。**commit / push / PR はすべて user の明示承認後にのみ実行する**。
> git commit / push / PR は未実行。

## 実行境界

| 操作 | 本 wave | 実行条件 |
|------|---------|----------|
| コード実装 | 実施済み | local evidence captured |
| focused vitest / web typecheck / web lint | 実施済み | PASS |
| `git add` / `git commit` | 実施しない | user の明示承認後 |
| `git push` | 実施しない | user の明示承認後 |
| `gh pr create` | 実施しない | user の明示承認後 |

## 想定 PR 設定

| 項目 | 値 |
|------|----|
| PR base ブランチ | `dev` |
| 想定作業ブランチ | `docs/sentry-extension-noise-filter-spec` |
| 想定 PR タイトル例 | `docs(sentry): ブラウザ拡張由来エラーを Sentry 監視から除外するノイズフィルタ実装仕様書` |

> 実装着地後に実コードを含めて PR 化する場合のタイトル例:
> `feat(web): Sentry に拡張由来エラーのノイズフィルタを追加（fail-open）`

## PR 本文に含める要点

1. **調査結論**: ユーザー観測のコンソールノイズはすべて第三者ブラウザ拡張起因であり、
   アプリコード起因ではない。
2. **対策**: クライアント側 Sentry に拡張由来 event のノイズフィルタを追加する
   （新規 pure module `apps/web/src/lib/sentry/extension-noise-filter.ts` を
   `instrumentation-client.ts` の `Sentry.init` に `ignoreErrors` / `denyUrls` / `beforeSend` で配線）。
3. **fail-open 不変条件**: アプリの実エラーは絶対に握り潰さない。判断不能・例外時は event を残す。
   拡張 frame とアプリ frame 混在 event も残す。
4. **到達不能ノイズの正直な境界**: `service-worker-loader.js` / `Unchecked runtime.lastError` /
   他拡張自身の Sentry 警告などは私たちの SDK に到達せずフィルタ不能であることを明記する
   （「できないこと」を誇張しない）。
5. **テスト**: `apps/web/src/lib/sentry/extension-noise-filter.spec.ts`（拡張のみ除外 / アプリエラー保持 /
   混在保持 / 例外時 fail-open / null・undefined URL の各ケース）。
6. **検証コマンド**:
   - `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts`
   - `pnpm --filter @ubm-hyogo/web typecheck`
   - `pnpm --filter @ubm-hyogo/web lint`

## スクリーンショット

- UI / UX 変更なし（NON_VISUAL）のため PR 本文にスクリーンショットセクションは設けない。
  代替証跡は `outputs/phase-10/phase-10.md` と `outputs/phase-11/manual-test-result.md` を参照。

## 完了報告（user 承認後に実行する内容）

PR 作成完了後は、PR URL / 採用ブランチ / 実行した自動修復 / 解消したコンフリクト / 残課題の有無を
1 回だけ報告する。commit / push / PR は本 wave では未実行。
