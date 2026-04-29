# Phase 12 System Spec Update Summary

## 更新済み

| 対象 | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 04c 管理バックオフィス API 一覧、不在 endpoint、不変条件、attendance error mapping を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 04c 早見表を追加し、実装 root / 認可境界 / NON_VISUAL 判定を同期 |

## 判定

`aiworkflow-requirements` の正本仕様へ 04c 実装内容を反映済み。`docs/00-getting-started-manual/specs/*` は参照仕様であり、本ワークツリーの正本更新は `.claude/skills/aiworkflow-requirements/references/` に集約する。

## 仕様上の境界

- 04c 認可は `SYNC_ADMIN_TOKEN` Bearer gate。05a で Auth.js + `admin_users` active 判定へ差し替える。
- `PATCH /admin/members/:memberId/profile` は作らない。
- `PATCH /admin/members/:memberId/tags` は作らない。
- tag 書き込みは queue resolve 経由のみ。
- schema 変更は `/admin/schema/*` のみに閉じる。
- admin notes は admin detail のみで扱い、public/member view へ混ぜない。
