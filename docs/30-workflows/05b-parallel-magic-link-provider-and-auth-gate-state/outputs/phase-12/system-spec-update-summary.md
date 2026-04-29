# spec 改訂サマリ

Phase 12 再検証で、実装済み API・環境変数・運用知見は正本仕様へ同期すべきと判断した。`docs/00-getting-started-manual/specs/` 旧参照の直接編集ではなく、現行正本である `.claude/skills/aiworkflow-requirements/references/` と `indexes/` へ同期した。

| 正本ファイル | 反映内容 | 根拠 / 理由 |
|---|---|---|
| `references/api-endpoints.md` | `/auth/gate-state` / `/auth/magic-link` / `/auth/magic-link/verify` / `/auth/resolve-session` を 05b API として追記 | apps/api に実装済み |
| `references/environment-variables.md` | `AUTH_URL` / `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` を Cloudflare auth/mail 設定へ追記 | magic link URL と Resend sender で必要 |
| `references/lessons-learned-05b-magic-link-auth-gate-2026-04.md` | 05b 固有教訓 L-05B-001〜005 を新規作成 | Phase 12 skill feedback と再発防止を正本化 |
| `references/lessons-learned.md` | 05b lessons child を hub に登録 | Progressive Disclosure の入口維持 |
| `references/task-workflow-active.md` | 05b を completed_without_pr として current task 一覧に登録 | Phase 13 はユーザー承認待ち |
| `indexes/resource-map.md` / `indexes/quick-reference.md` | 05b の参照導線を追加 | aiworkflow-requirements の検索入口同期 |

## 反映方針

- 本タスクの正本同期は同一 wave で完了。
- `docs/00-getting-started-manual/specs/` 旧参照は今回の編集対象外。必要になった場合のみ別途互換レイヤとして整理する。
