# Phase 10: 監視・観測

[実装区分: 実装仕様書]

## 1. 観測項目
- Cloudflare Workers logs / Logpush 上の `code:"UBM-ADMIN-MEMBERS-500"` 出現件数
- backend-ci `runtime smoke staging / smoke` job の連続成功回数

## 2. アラート閾値（暫定）
- staging で 24h あたり `UBM-ADMIN-MEMBERS-500` が 5 件超 → Slack 通知（既存 alert-relay 経路があれば再利用、なければ別タスクで追加）

## 3. 観測コマンド
```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format json \
  | rg 'UBM-ADMIN-MEMBERS-500'
```

## 4. Phase 10 DoD
- error code を新設したので grep / alert で観測可能
- 必要に応じて別タスクで Logpush + alert IaC を立てる旨を明記
