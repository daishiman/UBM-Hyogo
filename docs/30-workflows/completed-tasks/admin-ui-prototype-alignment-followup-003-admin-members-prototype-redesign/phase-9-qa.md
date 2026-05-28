# Phase 9 — 品質保証

[実装区分: 実装仕様書]

## 1. 必須コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web test --run
mise exec -- pnpm --filter @ubm-hyogo/api test --run
mise exec -- pnpm verify:design-tokens
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance
bash scripts/verify-pr-ready.sh
```

すべて exit code 0 で完了すること。

## 2. PR pre-flight

```bash
bash scripts/verify-pr-ready.sh
```

失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い切り分け。

## 3. ローカル動作確認

```bash
# web dev (mock API or staging proxy)
mise exec -- pnpm --filter @ubm-hyogo/web dev
# ブラウザで /admin/members を確認:
#   - page-head の eyebrow + h1 + description が prototype と一致
#   - PillNav 切替で URL に filter 同期
#   - 行クリックで drawer が開く
#   - 公開 Switch トグルで toast 表示
```

## 4. 録画 / log

`outputs/phase-11/local-qa.md` に上記コマンドの実行結果サマリ + dev server 起動ログを保存。
