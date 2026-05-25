# [#87] [UT-35] Cloudflare KV Namespace 実 ID 発行・1Password 登録

## メタ情報

```yaml
issue_number: 87
title: [UT-35] Cloudflare KV Namespace 実 ID 発行・1Password 登録
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/87
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-13 で確定した Namespace 名に従い、Cloudflare 上で production / staging / staging preview の KV Namespace を実作成し、出力された ID を 1Password Environments に登録する。

## 実装内容

- `wrangler kv:namespace create ubm-hyogo-kv-prod` 実行
- `wrangler kv:namespace create ubm-hyogo-kv-staging` 実行
- `wrangler kv:namespace create ubm-hyogo-kv-staging --preview` 実行
- 発行された Namespace ID の 1Password Environments（`UBM-Hyogo / Cloudflare / KV / prod / staging / staging-preview`）への登録
- 実 ID をリポジトリに記載しないことの確認

## 依存タスク

- 上流: UT-13 Cloudflare KV セッションキャッシュ設定（Phase 12 完了済み）
- 下流: UT-36 wrangler.toml バインディング適用

## 参照ドキュメント

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md`（実行手順の正本）

## タスク仕様書

`docs/30-workflows/unassigned-task/UT-35-kv-namespace-id-registration.md`

---
> ※UT-30/UT-31 は既存 Issue（#76/#77）で別タスクが使用しているため UT-35/UT-36 に採番
