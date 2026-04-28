# Phase 13 — PR 作成 (approval_required)

ユーザー指示で明示的に PR 作成が許可されるまで本フェーズは保留。

## 想定 PR タイトル / 本文

- title: `feat(api): UT-09 Sheets→D1 cron sync job`
- summary:
  - apps/api 内に scheduled() + /admin/sync を実装
  - WAL 非前提の retry/backoff・queue 直列化・batch 100 上限・TTL ロックを内包
  - migration 0002 で sync_locks / sync_job_logs を追加
  - 22 件の vitest テスト + 全 workspace typecheck PASS

## 事前チェック

- [x] typecheck PASS
- [x] vitest 22/22 PASS
- [ ] secrets 登録 (人手・別作業)
- [ ] staging deploy / smoke (人手・UT-26 連携)
- [ ] ユーザーの PR 作成承認

## 実行コマンド (ユーザー承認後)

```bash
git add apps/api docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job
git commit -m "feat(api): UT-09 Sheets→D1 cron sync job"
gh pr create --base main --head feat/wt-11 --title ... --body ...
```
