# Phase 13: PR 作成

## 前提

- Phase 11 evidence 全揃い・Phase 12 7 ファイル揃い後にユーザー明示承認を受けて実行する。
- 本仕様書作成プロセスでは PR 作成しない（CONST_002）。実装実行サイクルで実施。

## PR 作成コマンド（参考）

```bash
gh pr create \
  --base main \
  --title "feat(api): tag queue retry tick + DLQ audit (Refs #377)" \
  --body "$(cat <<'EOF'
## Summary
- Add scheduled retry tick workflow for tag_assignment_queue
- Emit admin.tag.queue_dlq_moved audit on DLQ transition
- Refs #377 (do not close)

## Test plan
- [x] pnpm typecheck
- [x] pnpm lint
- [x] focused Vitest (7 Miniflare D1 fixture tests)
- [x] wrangler triggers production cron count <= 3
EOF
)"
```

## 注意

- `Closes #377` は使わない。Issue #377 は 2026-05-05 時点 CLOSED のため再オープン/再クローズせず、`Refs #377` のみ。
- `--no-verify` 禁止。pre-push hook の coverage-guard / staged-task-dir-guard を尊重。

## 完了条件

- [ ] PR URL が `outputs/phase-13/main.md` に記録される。
- [ ] CI 全 gate green を確認したうえで merge は別判断。

## 出力

- outputs/phase-13/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

PR 作成承認 gate を維持する。

## 実行タスク

- ユーザー明示承認まで commit / push / PR / deploy を実行しない。

## 参照資料

- `outputs/phase-13/main.md`

## 成果物/実行手順

- `outputs/phase-13/main.md`

## 統合テスト連携

- CI / runtime evidence は PR 後に確認
