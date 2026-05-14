# Implementation Guide

## Part 1: 中学生レベル

今回の問題は、同じ道具の本体と替え刃の番号がずれていて、作業を始められない状態でした。`esbuild` というビルド用の道具について、使う番号を `0.25.4` にそろえました。

番号がそろったので、Cloudflare 用のビルドが最後まで通るようになりました。画面部品のスクリーンショットと axe チェックも同じ実行サイクルで取れました。

## Part 2: 技術詳細

- Root `package.json` に `pnpm.overrides.esbuild = "0.25.4"` を追加。
- `pnpm-lock.yaml` を再生成し、Vite / tsx / Wrangler 経由の effective esbuild を `0.25.4` に収束。
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` は exit 0。
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` は exit 0。
- `scripts/cf.sh` の実 fallback は不要。再発手順をヘッダと `docs/00-getting-started-manual/cloudflare-cli-troubleshooting.md` に追記し、`CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh --version` で wrapper 起動を確認。
- Runtime visual evidence: `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/evidence/screenshots/task10-ui-primitives-runtime.png`
- Axe evidence: `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/evidence/axe-report.json`
