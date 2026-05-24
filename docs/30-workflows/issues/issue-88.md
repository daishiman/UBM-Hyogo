# [#88] [UT-36] apps/api/wrangler.toml SESSION_KV バインディング適用

## メタ情報

```yaml
issue_number: 88
title: [UT-36] apps/api/wrangler.toml SESSION_KV バインディング適用
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/88
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-13 の設計に従い `apps/api/wrangler.toml` に `SESSION_KV` バインディングを適用し、staging / production 環境で KV が利用可能な状態にする。DRY 化方針（`[vars]` での TTL 集中管理）を適用する。

## 実装内容

- `[[kv_namespaces]]` セクション（local preview 用）への `SESSION_KV` binding 追加
- `[[env.staging.kv_namespaces]]` / `[[env.production.kv_namespaces]]` への `SESSION_KV` binding 追加
- `[vars]` への TTL 設定追加（`SESSION_BLACKLIST_TTL_SECONDS` / `CONFIG_CACHE_TTL_SECONDS` / `RATE_LIMIT_WINDOW_SECONDS`）
- 実 Namespace ID は `<placeholder>` 形式で 1Password 参照手順をコメントに記載

## 依存タスク

- 上流: UT-35 KV Namespace 実 ID 発行
- 上流: UT-13 Cloudflare KV セッションキャッシュ設定（Phase 12 完了済み）
- 下流: UT-32 Worker SESSION_KV helper 実装

## 参照ドキュメント

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-08/dry-config-policy.md`（DRY 化 Before/After）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md`（Step 3 バインディング追記手順）

## タスク仕様書

`docs/30-workflows/unassigned-task/UT-36-api-wrangler-session-kv-binding.md`

---
> ※UT-30/UT-31 は既存 Issue（#76/#77）で別タスクが使用しているため UT-35/UT-36 に採番
