# Phase 13: PR 作成

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> base ブランチ: `dev`（CLAUDE.md 既定）

---

## 1. PR タイトル

```
feat(issue-266): shared sync 契約型 (SyncLogStatus/SyncTriggerType/SyncLogRecord) の Zod schema 化
```

70 文字以内（半角換算 / 全角 2 文字計算）に収まる。GitHub UI 表示崩れなし。

---

## 2. base / branch

| 項目 | 値 |
|------|------|
| base | `dev` |
| head | `feat/issue-266-shared-sync-zod-contract`（または既存作業ブランチ） |
| draft | no |

---

## 3. PR 本文ソース

`outputs/phase-13/pr-body.md` を即 `gh pr create --body-file` で渡せる形で配置する。本ファイルではテンプレートを示す。

```markdown
## Summary

- `packages/shared/src/zod/sync-log.ts` を新設し、`SyncLogStatusZ` / `SyncTriggerTypeZ` / `SyncLogRecordZ` を Zod schema + `z.infer` 型として一意定義
- `apps/api/src/sync/types.ts` の `SyncTrigger` / `AuditStatus` を shared 由来 re-export に置換し、`apps/api/src/sync/audit.ts` の `lockTriggerOf` 変換関数を削除
- canonical 値は物理 DDL（`apps/api/migrations/0002_sync_logs_locks.sql`）に揃え、TS = shared = DB の 3 者一致を実現

## Canonical 値（物理 DDL 一致）

- `SyncLogStatus`: `running` / `success` / `failed` / `skipped`
- `SyncTriggerType`: `cron` / `admin` / `backfill`

## Test plan

- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared test` で `sync-log.spec.ts` 20+ 件 green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync/` 既存 contract spec + 拡張 it green
- [ ] grep gate（`outputs/phase-11/grep-gate.sh`）全 4 種 0 件
- [ ] staging D1 `SELECT DISTINCT trigger_type FROM sync_job_logs` が `cron|admin|backfill` の 3 値以内（`outputs/phase-11/d1-distinct.log`）

## Out of scope（明示）

- `sync_jobs`（issue #195）テーブル契約 → 別 task
- 物理テーブル名 `sync_job_logs` → `sync_log` rename（U-7）→ 別 task
- `apps/web` admin/audit 画面の `safeParse` 適用 → 別 task
- ESLint custom rule 追加 → 別 task（後続 lint 強化）
- staging D1 旧 trigger 値 cleanup（Phase 11 で残存検出時のみ起票）

## Refs / Closes

- Refs #266
- Refs U-UT01-08（物理 canonical 採用により実質吸収）
- Refs U-UT01-10（本 PR で formalize）
```

---

## 4. PR 作成コマンド

```bash
gh pr create \
  --base dev \
  --title "feat(issue-266): shared sync 契約型 (SyncLogStatus/SyncTriggerType/SyncLogRecord) の Zod schema 化" \
  --body-file docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-13/pr-body.md
```

---

## 5. PR 作成前チェック

| # | 項目 | コマンド |
|---|------|---------|
| C1 | `git status --porcelain` が空 | `git status --porcelain` |
| C2 | `git diff dev...HEAD --name-only` が許可リスト内 | Phase 10 §2.1 |
| C3 | `implementation-guide.md` が存在 | `ls outputs/phase-12/implementation-guide.md` |
| C4 | `outputs/phase-11/` 配下にスクショ画像なし（NON_VISUAL） | `ls outputs/phase-11/*.{png,jpg,jpeg,gif,webp} 2>/dev/null \| wc -l` が 0 |
| C5 | PR 本文にスクショセクションを残さない | `outputs/phase-13/pr-body.md` 内に `スクリーンショット` 見出しが無い |

---

## 6. PR 作成後

- [ ] CI status check 全件 green を確認
- [ ] reviewer 不要（solo 開発 / `required_pull_request_reviews=null`）
- [ ] CI green 後、`gh pr merge --squash` または通常 merge（CLAUDE.md branch 戦略に従い squash）
- [ ] merge 後、本 workflow を `completed-tasks/` へ移動（Phase 12 §7 参照）

---

## 7. Phase 13 DoD

- [ ] `gh pr create` が成功し PR URL を取得
- [ ] §5 PR 作成前チェック C1-C5 全件 OK
- [ ] §3 PR 本文がテンプレに沿って `outputs/phase-13/pr-body.md` に配置済み
- [ ] PR URL が最終レポートに含まれる
