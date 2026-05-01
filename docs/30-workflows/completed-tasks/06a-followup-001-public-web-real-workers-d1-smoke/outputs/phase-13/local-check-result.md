# local-check-result（spec 段階の placeholder）

## ステータス

- 状態: **placeholder**（本 PR は Markdown 仕様書のみのため、コード系チェックは原則 no-op）
- 実行は `mise exec --` 経路で行う（CLAUDE.md 規定）

## チェック計画

| チェック | コマンド | 期待結果 | 段階 |
| --- | --- | --- | _pending_ |
| typecheck | `mise exec -- pnpm typecheck` | pass（差分なし／影響なし） | _pending_ |
| lint | `mise exec -- pnpm lint` | pass | _pending_ |
| vitest（関連） | `mise exec -- pnpm --filter @repo/shared test`（spec 影響なしなら skip 可） | pass / skip | _pending_ |
| build（参考） | `mise exec -- pnpm build` | 必要時のみ実行 | _pending_ |
| markdown 整合 | `ls -1 docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/outputs/phase-12/ \| wc -l` が 7 | 7 | _pending_ |

## 実行ガイドライン

- 仕様書のみ変更の PR でも CI 側の必須 status check は走るため、push 前に上記 4 種を local で 1 周通すことを推奨。
- vitest は本 PR で test ファイルを変更していない限り **skip 可**。spec_created 段階では強制ではない。
- build は Cloudflare Workers ビルドが重い (`@opennextjs/cloudflare`) ため、push 前必須ではなく必要時のみ。

## 既知の注意点

- `pnpm install` を ワークツリーで未実行の場合、`mise exec -- pnpm install` を最初に通す（CLAUDE.md「ワークツリーごとに node_modules が独立する」記述に従う）。
- lefthook の pre-commit / pre-push が `--no-verify` 不要で通ることを確認する。

## 結果記録（実行後に追記）

| チェック | 実行日時 | 結果 | 備考 |
| --- | --- | --- | --- |
| typecheck | _pending_ | _pending_ | _pending_ |
| lint | _pending_ | _pending_ | _pending_ |
| vitest | _pending_ | _pending_ | _pending_ |
| build | _pending_ | _pending_ | 任意 |
