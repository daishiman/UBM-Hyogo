# Phase 9: パフォーマンス・セキュリティ検証

## 目的
本 automation 固有のセキュリティ・無料枠運用上の懸念を点検する。

## セキュリティ点検項目

| ID | 観点 | 検証方法 |
| --- | --- | --- |
| SEC-1 | API token scope が read-only analytics に限定 | Cloudflare dashboard で token permission を目視確認 / `gh secret list` で別名 secret として配置 |
| SEC-2 | token 値が workflow logs に出ない | E-1 dry-run の logs を `***` でマスクされているか目視 |
| SEC-3 | `.env` に実値が書かれていない | `grep -nE '^[A-Z_]+=' .env \| grep -v '^[A-Z_]+="?op://'` が空 |
| SEC-4 | 出力 JSON に PII が含まれない | unit / integration テストの redaction-check + 実 export 後の手動 grep |
| SEC-5 | workflow の `permissions:` が最小 | `permissions: { contents: write, pull-requests: write }` のみ。他は `none` |
| SEC-6 | PR target は dev または別 branch（main 直 push 禁止） | workflow YAML で base branch を確認 |
| SEC-7 | unauthorized actor からの workflow_dispatch 抑制 | repo は private、collaborator のみ trigger 可能 |

## パフォーマンス点検項目

| ID | 観点 | 検証方法 |
| --- | --- | --- |
| PERF-1 | Cloudflare GraphQL の月次 query が無料枠内 | dashboard の API usage を月初に確認 |
| PERF-2 | workflow 実行時間が 5 分以内 | GitHub Actions の `Run time` を確認 |
| PERF-3 | retention 増加で repo size が膨張しない | active 12 + archive で年間 12 MB 未満想定（1 ファイル < 1KB × 12） |

## 障害時挙動

| シナリオ | 期待挙動 |
| --- | --- |
| Cloudflare 側 5xx | exit 1、PR 作らない、再実行は手動 |
| token 失効 | exit 1、stderr に「authentication failed」相当 |
| GitHub Actions 一時障害 | 翌月分は手動 workflow_dispatch でリカバリ |

## 成果物
- 本ファイル
- `outputs/phase-9/phase-9.md`

## 完了条件
- SEC-1〜SEC-7 すべて pass
- PERF-1〜PERF-3 すべて閾値内

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Free plan / Logpush rejection / GraphQL export
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 1Password canonical / GitHub Secrets copy
