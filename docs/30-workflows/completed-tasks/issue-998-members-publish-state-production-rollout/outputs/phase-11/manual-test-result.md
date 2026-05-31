# Phase 11 — Manual Test Result

`[実装区分: 実装仕様書 / VISUAL_ON_EXECUTION]`

## 証跡の主ソースと方針（FB-4 / WEEKGRD-03）

- **タスク種別**: 実装タスク（production rollout）。VISUAL_ON_EXECUTION。
- **証跡の主ソース（present 予定）**: ローカル回帰（`apps/api` typecheck / build / 4 focused spec）+ runtime evidence（staging/production の diagnose JSON・backfill JSON・`/members` screenshot）。
- **スクリーンショットを runtime 実行時に取得する理由**: コード成果物は `wrangler.toml` flag 1 行変更で UI 描画は変わらないが、根本問題の証明には実 staging/production の `/members` 表示復旧が必要。これは Cloudflare deploy + D1 mutation を伴う user-gated runtime ops のため、local 実装検証段階では未取得（pending）。

## ローカル検証（present になる予定の項目 / Phase 10 と対応）

| 検証 | コマンド | 期待 | 状態 |
|------|---------|------|------|
| flag 変更 | `git diff apps/api/wrangler.toml` | production flag = `"true"` | present（1 hunk: flag/comment only） |
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 | present |
| build | `mise exec -- pnpm --filter @ubm-hyogo/api build` | exit 0 | present |
| API regression suite | 4 focused spec を unit / D1 contract config に分けて実行 | green | present（unit: 2 files / 23 tests PASS、D1 contract: 2 files / 22 tests PASS） |
| flag 一致 | `rg -n 'MEMBERS_AUTO_PUBLISH_ON_CONSENT' apps/api/wrangler.toml` | staging/production とも `"true"` | present（line 72 / 162） |
| ops script syntax | `bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh` | exit 0 | present |

## Gate-B result

Gate-B is passed at `2026-05-30T11:52:00+09:00`. Task A is locally implemented and locally verified. Gate-C remains pending because deploy, D1 backfill apply, and `/members` browser smoke are user-gated runtime operations.

## runtime 検証（user-gated / Gate-C）

| evidence | 状態 |
|----------|------|
| staging-diagnose-pre/post.json | pending |
| staging-backfill-dry-run/apply.json | pending |
| staging-members-before/after.png | pending |
| prod-diagnose-pre/post.json | pending |
| prod-backfill-dry-run/apply.json | pending |
| prod-members-before/after.png | pending |

## 既知の制限

- runtime ops の実行は本サイクルの範囲外。実行はユーザー明示承認後。
- backfill `candidates=0` の場合は別原因（H1/H2/H4）を疑い follow-up 化する（unassigned-task-detection 参照）。
