# [#164] [UT-A2-CI-001] skill log_usage writer の LOGS.md 直書き混入防止 CI guard 追加

## メタ情報

```yaml
issue_number: 164
title: [UT-A2-CI-001] skill log_usage writer の LOGS.md 直書き混入防止 CI guard 追加
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/164
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

A-2 fragment 化により全 skill の `log_usage.js` writer は fragment 経路に切替済み。しかし回帰 guard（`LOGS.md` 直書き再混入の検出）が CI step として未登録。本タスクは `.github/workflows/*.yml` に grep step を追加し、`appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md` の `.claude/skills` `scripts/**` 配下スコープでヒットしたら fail させる。

## スコープ

- 含む: GitHub Actions workflow への grep step 追加（既存 lint job への追加 or 新規 step）
- 含まない: skill 本体の writer 改修（UT-A2-FOLLOW-001 で完了済）

## 完了条件

- `rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills --glob "scripts/**"` を CI が実行し 0 件で pass
- 違反コードを意図的に入れたケースで CI が fail することを確認

## 仕様書

- [docs/30-workflows/unassigned-task/ut-a2-ci-001-writer-grep-ci-guard.md](docs/30-workflows/unassigned-task/ut-a2-ci-001-writer-grep-ci-guard.md)

## 参照

- task-skill-ledger-a2-fragment Phase 12 outputs/phase-12/implementation-guide.md
- task-skill-ledger-a2-fragment Phase 12 outputs/phase-12/unassigned-task-detection.md
