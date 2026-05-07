# Scheduled Reminder Issue Pattern

> **読み込み条件**: GitHub Actions の `schedule` / `workflow_dispatch` から `gh` CLI で
> 定期的に reminder Issue を起票したい場合（post-release 長期観測など）。
> **更新タイミング**: 雛形・idempotency key 戦略を変更した際、新規適用例を追加した際。

---

## 概要

GitHub Actions `schedule` + `workflow_dispatch` から `gh` CLI を使い、release tag を
idempotency key とした reminder Issue を自動起票するパターン。Cloudflare Workers cron 無料枠が
埋まっている場合や、副作用が GitHub 側で完結する観測系で採用する。

## 構成要素

| 役割 | 正本 |
| --- | --- |
| reminder workflow | `.github/workflows/post-release-observation-reminder.yml` |
| issue template | `scripts/observation/reminder-issue-template.md` |
| helper script | `scripts/observation/create-reminder-issue.sh` |
| manual checklist | `scripts/observation/check-thresholds.md` |

## Idempotency 設計

- release tag (`gh api repos/:owner/:repo/releases/latest --jq .tag_name`) を
  idempotency key として `gh issue list --search` で既存 issue を検索する。
- 既存ヒットがあれば create をスキップ。なければ
  `gh issue create --title ... --body-file ... --label observation,d7|d30` を実行。
- `schedule` と手動 `workflow_dispatch` のどちらから起動されても結果は同じになる。

## 関連

- 適用例: Issue #350 long-term production observation
- 上位 reference: `aiworkflow-requirements/references/post-release-long-term-observation.md`
