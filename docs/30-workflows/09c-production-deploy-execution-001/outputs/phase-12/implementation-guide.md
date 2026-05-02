# Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

本番公開は、学校の時間割を新しくする作業に似ている。新しい時間割を配るだけでは足りない。先生、生徒、教室、チャイムが同じ時間割で動けるかを確認しないと、授業が混乱する。

このタスクでは、アプリの新しい版を本番の場所へ出し、ちゃんと動くかを見守る。いきなり進めると危ないので、途中で何度も「進めてよいか」を確認する。

### 何をするか

1. 本番へ出す前に、準備ができているか確認する。
2. データの入れ物を必要な形にそろえる。
3. API と Web を本番へ出す。
4. 画面やログインまわりが動くか確認する。
5. 24 時間見守り、急な失敗や使いすぎがないか見る。

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| production deploy | 本番の場所へ新しい版を出すこと |
| migration | データの入れ物を新しい形にそろえる作業 |
| rollback | 問題が出たときに前の版へ戻すこと |
| release tag | 「この版を出した」という目印 |
| runbook | 手順を順番に書いた作業メモ |
| incident | すぐ対応が必要な問題 |
| Worker | Cloudflare 上で動くアプリの係 |
| D1 | Cloudflare 上のデータ置き場 |

## Part 2: 技術者向け

### Execution Constants

| Name | Value / Format |
| --- | --- |
| `PRODUCTION_API_CONFIG` | `apps/api/wrangler.toml --env production` |
| `PRODUCTION_WEB_CONFIG` | `apps/web/wrangler.toml --env production` |
| `PRODUCTION_D1` | Phase 5 で `apps/api/wrangler.toml` から再確認 |
| `RELEASE_TAG` | `vYYYYMMDD-HHMM` in JST |
| Cloudflare CLI wrapper | `bash scripts/cf.sh` only |

### API / Command Signatures

```bash
git fetch origin main
git rev-parse origin/main
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 migrations list <PRODUCTION_D1> --remote --env production --config apps/api/wrangler.toml
bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml
bash scripts/cf.sh d1 migrations apply <PRODUCTION_D1> --remote --env production --config apps/api/wrangler.toml
pnpm --filter @ubm/api deploy:production
pnpm --filter @ubm/web deploy:production
git tag vYYYYMMDD-HHMM
git push --tags
bash scripts/cf.sh tail --env production --config apps/api/wrangler.toml
```

### Error Handling

| Failure Point | Action | Evidence |
| --- | --- | --- |
| Preflight mismatch | Stop before mutation | `outputs/phase-05/preflight-evidence.md` |
| D1 migration failure | Restore from Phase 5 backup | `outputs/phase-06/rollback-evidence.md` |
| API/Web deploy failure | Roll back Worker version | `outputs/phase-07/rollback-evidence.md` |
| Smoke failure | GO/NO-GO = NO-GO and rollback or incident | `outputs/phase-10/go-no-go.md` |
| 24h anomaly | Start 09b incident runbook | `outputs/phase-11/incident-or-no-incident.md` |

### Edge Cases

- Secret values must never be written to evidence files; only key presence is recorded.
- D1 backup SQL is git-ignored evidence; the tracked file records path and timestamp only.
- `wrangler` direct invocation is invalid. Evidence must prove wrapper-only usage.
- Phase 9 and Phase 11 screenshots are required only after actual production execution.

### Visual Evidence References

This close-out does not include runtime screenshots because production execution is blocked on explicit user approval. The approved execution wave must fill these reserved paths:

| Phase | Required visual evidence |
| --- | --- |
| Phase 9 | `outputs/phase-09/screenshots/*.png` for the 10-page x 3-role smoke matrix |
| Phase 11 | `outputs/phase-11/screenshots/analytics-workers-api.png`, `analytics-workers-web.png`, `analytics-d1.png` |

Until those files exist, this workflow is a specification and runbook, not runtime PASS evidence.
