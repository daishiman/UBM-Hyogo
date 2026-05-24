# [#84] [UT-32] Worker SESSION_KV helper 実装

## メタ情報

```yaml
issue_number: 84
title: [UT-32] Worker SESSION_KV helper 実装
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/84
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

Worker 側に `SESSION_KV` helper を実装し、セッションブラックリスト・設定キャッシュ・レートリミット用途を UT-13 の禁止パターンに従って扱えるようにする。

## 実装内容

- `apps/api/src/lib/kv/` 配下への helper 実装
  - `isSessionBlacklisted(env, jti)` — セッション jti がブラックリストに存在するかを確認
  - `blacklistSession(env, jti, ttlSec)` — jti をブラックリストに登録（ログアウト時）
  - `getCachedConfig(env, key)` / `setCachedConfig(env, key, value, ttlSec)` — 設定キャッシュ
- D1 `revoked_at` との多層防御実装
- `put` 直後 `get` パターンとセッション本体 KV 保存禁止のユニットテスト
- `Env` インターフェースへの `SESSION_KV: KVNamespace` 追加

## 依存タスク

- 上流: UT-36 wrangler.toml SESSION_KV バインディング適用（UT-13 Phase 12 完了済み）
- 上流: UT-13 Cloudflare KV セッションキャッシュ設定（Phase 12 完了済み）

## 参照ドキュメント

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-12/implementation-guide.md`（Part 2 技術詳細）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-07/handoff.md`（実装指針）

## タスク仕様書

`docs/30-workflows/unassigned-task/UT-32-worker-session-kv-helper-implementation.md`
