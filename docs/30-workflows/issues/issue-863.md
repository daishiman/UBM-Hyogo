# [#863] [fix-admin-scr-err-stg-FU-002] admin scope error.boundary.caught Sentry/Cloudflare alert policy IaC 化

## メタ情報

```yaml
issue_number: 863
title: [fix-admin-scr-err-stg-FU-002] admin scope error.boundary.caught Sentry/Cloudflare alert policy IaC 化
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/863
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

admin scope (`/admin/**`) の `error.boundary.caught` イベント閾値検知を Cloudflare alert / Sentry alert で IaC 化し、Server Components render error 同型 regression を deploy 直後に自動検知する。

## 親タスク / PR

- 親 task: `TASK-FIX-ADMIN-SCR-ERR-STG-001`
- 親 PR: #849 (branch `fix/admin-server-components-render-error`)
- 親 workflow: `docs/30-workflows/fix-admin-server-components-render-error-stg/`

## 背景

親タスクの digest=167275886 事故は手動操作で初めて検知された。本来は alert で能動検知すべきだが、admin scope 専用 policy が未定義で public/member shell の noise に埋もれる構造。手動コンソール設定では drift し governance 外。

## スコープ

- admin scope に絞った `error.boundary.caught` 閾値 alert 設計
- alert policy の IaC 化 (Terraform / wrangler analytics_engine / Sentry rule JSON 等)
- digest 単位頻度集計 + `scope=admin` ラベルフィルタ
- 通知先 (Slack / メール / Issue 自動起票) 選定と疎通テスト
- runbook 追記、CODEOWNERS に IaC ファイル追加

## 受け入れ条件 (DoD 抜粋)

- AC-1: admin scope alert policy IaC コミット済み
- AC-2: digest 頻度 + `scope=admin` で閾値発火
- AC-3: staging で通知到達 evidence 1 件
- AC-4: 初動 runbook が `docs/30-workflows/` 配下に存在
- AC-5: CODEOWNERS に owner 明示

## 仕様書

`docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-002-admin-runtime-sentry-alert-policy.md`

## 関連

- CLAUDE.md「Cloudflare 系 CLI 実行ルール」「Governance / CODEOWNERS」
- production build では Next.js が `error.message` を omit するため digest hash が唯一の手掛かり
