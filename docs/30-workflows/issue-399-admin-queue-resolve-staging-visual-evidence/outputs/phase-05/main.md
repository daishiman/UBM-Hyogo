# Phase 05 — 実装ランブック (実装結果)

## 実装サマリ

Phase 02 設計に基づき、staging visual evidence 取得に必要な fixture / script / runbook /
test を実コードベースに実装した。

| 種別 | パス | 概要 |
|------|------|------|
| seed SQL | `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` | `member_status` × 5 + `admin_member_notes` × 5 (visibility×3 + delete×2) |
| cleanup SQL | `apps/api/migrations/seed/issue-399-admin-queue-staging-cleanup.sql` | `ISSUE399-` prefix の seed 行 + runtime byproduct DELETE + verify count |
| seed script | `scripts/staging/seed-issue-399.sh` | `CLOUDFLARE_ENV=staging` ガード + `scripts/cf.sh d1 execute` ラップ |
| cleanup script | `scripts/staging/cleanup-issue-399.sh` | env ガード + cleanup + count=0 verify |
| runbook | `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/runbook.md` | 7 状態取得手順 / redaction / metadata |
| 環境ガード test | `scripts/staging/__tests__/seed-issue-399.test.ts` | `CLOUDFLARE_ENV` unset / production で exit 1 |
| 環境ガード test | `scripts/staging/__tests__/cleanup-issue-399.test.ts` | 同上 |
| seed 構文/冪等性 test | `apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts` | Miniflare D1 で seed → counts → cleanup 2 回 |
| vitest 設定 | `vitest.config.ts` | `apps/**/migrations/**/*.test.ts` を include に追加 |

## schema discovery 結果

正本テーブルは仕様書記載の `member_requests` ではなく **`admin_member_notes`**
（`note_type IN ('visibility_request','delete_request')` + `request_status='pending'`）。
`apps/api/src/routes/admin/requests.ts` および `0006_admin_member_notes_type.sql` /
`0007_admin_member_notes_request_status.sql` で確認。

合わせて `member_status` (publish_state / is_deleted) を seed する必要がある（list 出力で参照されるため）。

## ローカル検証結果

```bash
mise exec -- pnpm exec vitest run \
  scripts/staging/__tests__/ \
  apps/api/migrations/seed/__tests__/
# => Test Files: 3 passed | Tests: 9 passed
```

- env guard 4 件: PASS
- seed insert / count / 冪等性 / runtime byproduct cleanup 5 件: PASS

## 後続 (Phase 11) で実施

- staging への seed 投入実行
- 7 状態の screenshot 取得
- redaction 適用 + metadata 出力
- cleanup + count=0 verify

これらは VISUAL_ON_EXECUTION のため本サイクルでは未実施（runbook に手順を確定）。
