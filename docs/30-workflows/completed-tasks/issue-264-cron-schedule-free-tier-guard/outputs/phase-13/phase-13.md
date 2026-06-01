# Phase 13 — PR 作成手順（phase-13）

> 本サイクルで docs と guard test は実装済み。commit / push / PR 作成はすべて **user-gated**（本サイクル未実行）。
> 以下は PR を作成する際の詳細手順。base = `dev`。

## 1. 前提（PR 作成可能になる条件）

- 本サイクルで `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` を作成済みであること。
- 以下が green であること:
  - `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts`
  - `mise exec -- pnpm typecheck`
  - `mise exec -- pnpm lint`
- issue #264 は **CLOSED のまま**（再オープン / 状態変更しない）。PR 本文では `Refs #264` で参照・back-link 同期済み。

## 2. ブランチ / 同期手順

```bash
# 作業ブランチ（未作成なら）
feat/issue-264-cron-schedule-free-tier-guard
# dev 同期
git fetch origin dev
# ローカル dev を origin/dev に fast-forward 後、作業ブランチへ merge
git merge dev
```

- コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従い自律解消。

## 3. 品質検証（PR 前）

```bash
pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts
bash scripts/verify-pr-ready.sh
```

## 4. PR 作成

```bash
gh pr create --base dev \
  --title "test(api): wrangler cron free-tier guard (Refs #264)" \
  --body-file <(...)
```

### PR タイトル

```
test(api): wrangler cron free-tier guard (Refs #264)
```

### PR 本文骨子

- **背景**: issue #264（CLOSED）の原タスク「Sheets→D1 cron を 6h/1h/5min で 24h staging 実測」を、
  Sheets→Forms 移行・free-plan 3-cron 確定により **obsolete** と判定し、現行コードへ再スコープ。
  「デプロイ済み 3-cron スケジュールの free-tier 回帰ガード（新規 spec test）＋ ADR / 無料枠予算」へ再定義。
- **成果物**:
  - 仕様書: `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/`（index / artifacts / phase-01..13 / outputs strict 7）
  - コード: `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts`（依存追加 0 / `*.spec.ts` のみ）
  - ADR-264-01（3-cron を free-plan 上限として固定）/ 無料枠予算表（解析的・24h 実測不要）
- **DoD**: 4 assertion（canonical 一致 / ≤3 本 / legacy 不在 / 3 セクション parity）green、typecheck / lint green、
  wrangler.toml の cron 無変更。
- **影響範囲**: `apps/api` に spec test 1 本追加。CI test で cron drift を PR 時点で検知。runtime / deploy への影響なし。
- **Refs**: `Refs #264`（CLOSED のまま） / 親 #50 / supersedes `U-UT01-02`。

## 5. 影響範囲

| 対象 | 影響 |
| --- | --- |
| `apps/api` | spec test 1 本追加（依存追加 0） |
| CI | 既存 vitest ジョブで guard test 自動実行（新規配線不要） |
| runtime / deploy | なし（本 PR で Cloudflare deploy しない） |
| D1 / secret | なし |

## 6. user-gated 境界

commit / push / PR 作成 / issue 状態変更 / Cloudflare deploy / D1 apply / secret injection は
すべてユーザー承認後にのみ実行する。
