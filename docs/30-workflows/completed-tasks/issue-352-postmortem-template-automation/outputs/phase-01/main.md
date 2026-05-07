# Phase 01 — 要件定義

## 目的
incident / rollback 後に blame 表現を構造的に排除した postmortem を、production 担当者が一定品質・一定時間で生成できる自動化基盤を整備する。

## 入力
- 09c Phase 11 evidence path（必須・実在チェック）
- release tag (`v\d+\.\d+\.\d+`)
- commit sha (`[0-9a-f]{7,40}`)
- rollback evidence path
- ISO8601 timestamps（occurred / detected / resolved）
- severity（任意）

## 出力
- `docs/30-workflows/runbooks/postmortem/template.md`（固定見出し）
- `docs/30-workflows/runbooks/postmortem/README.md`（運用手順）
- `scripts/postmortem/generate-postmortem.ts`（CLI + pure function）
- `package.json#scripts.postmortem:generate`

## 不変条件
- blame 列・人名 placeholder を生成しない
- `--evidence` 欠落／不在で exit code 非 0
- 入力が同一なら出力が同一（冪等性）
- pure 関数 `generatePostmortem(input, template)` は副作用なし

## 受入条件
AC-1〜AC-10（index.md 参照）

## 非対象
- incident response runbook 本文の置換
- Slack 通知連携（task-09c-incident-runbook-slack-delivery-001）
- GitHub Releases 自動生成（task-09c-github-release-tag-automation-001）
- AI による root cause 自動推論
