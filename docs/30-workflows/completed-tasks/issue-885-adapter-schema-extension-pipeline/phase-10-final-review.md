# Phase 10: 最終レビュー

## 1. 最終チェック観点

| 観点 | 確認内容 |
|---|---|
| 要件カバレッジ | Phase 1 AC-1..AC-8 が全て満たされているか |
| 不変条件 | visibility filter / unknown kind silent skip / pure function / sanitize literal 除外 が README で明示されているか |
| スコープ規律 | `member-detail.ts` 本体 / primitive / API / schema 本体に手が入っていないか |
| docs hygiene | unassigned-task one-pager 削除済 / stale 参照 0 件 |
| Phase 12 整合 | system spec への影響なし（adapter 内部の運用ドキュメント整備のみ） |

## 2. 最終 gate コマンド

```bash
pnpm install --force
pnpm typecheck
pnpm lint
pnpm --filter @ubm-hyogo/web test -- member-detail.spec.ts
bash scripts/verify-pr-ready.sh
git diff --name-only dev...HEAD
```

`git diff --name-only` の出力に以下のみ含まれることを確認:

- `apps/web/src/lib/adapters/README.md`（new）
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`（modified）
- `docs/30-workflows/completed-tasks/issue-885-adapter-schema-extension-pipeline/**`（new）
- `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md`（deleted）
- stale 参照補修があれば追加で 1〜数ファイル

それ以外のファイルが含まれている場合は、混入を疑う。

## 3. レビュー観点 (self review)

- [x] README の 5 ステップ順序が「zod → fixture → spec → adapter → primitive」になっているか
- [x] 責務 mapping 表が 8 ケース全てを含むか
- [x] EXTENSION TEMPLATE のサンプルコードがコメントアウトされており、実行されないことが明白か
- [x] PR 文言が `Refs #885` のみで `Fixes` / `Closes` を使っていないか

すべて ✓ なら Phase 11 に進む。
